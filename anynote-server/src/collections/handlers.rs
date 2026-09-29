use axum::{extract::State, http::StatusCode};
use sqlx::PgConnection;
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::{self, Entity, Operation},
    collections::model::{Collection, CreateCollection, UpdateCollection},
    crypto::envelope,
    error::AppError,
    http::extract::{Json, Path},
    state::AppState,
    workspaces::access::{Access, authorize},
};

pub async fn subtree_ids(
    db: &mut PgConnection,
    workspace_id: Uuid,
    collection_id: Uuid,
) -> Result<Vec<Uuid>, AppError> {
    Ok(sqlx::query_scalar!(
        r#"with recursive subtree as (
             select id from collections where workspace_id = $1 and id = $2
             union all
             select c.id from collections c join subtree s on c.parent_id = s.id
           )
           select id as "id!" from subtree"#,
        workspace_id,
        collection_id,
    )
    .fetch_all(db)
    .await?)
}

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Json<Vec<Collection>>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;

    let collections = sqlx::query_as!(
        Collection,
        r#"select c.id, c.parent_id, c.encrypted_name, c.position, c.created_at, c.updated_at,
             coalesce(array_agg(cn.note_id order by cn.position, cn.note_id)
               filter (where cn.note_id is not null), '{}') as "note_ids!"
           from collections c
           left join collection_notes cn on cn.collection_id = c.id
           where c.workspace_id = $1
           group by c.id
           order by c.position, c.created_at"#,
        workspace_id,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(collections))
}

pub async fn create(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(request): Json<CreateCollection>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    envelope::validate("encryptedName", &request.encrypted_name)?;

    let mut tx = state.db.begin().await?;
    sqlx::query!(
        "insert into collections (id, workspace_id, parent_id, encrypted_name, position)
         values ($1, $2, $3, $4, $5)",
        request.id,
        workspace_id,
        request.parent_id,
        request.encrypted_name,
        request.position,
    )
    .execute(&mut *tx)
    .await
    .map_err(|error| match &error {
        sqlx::Error::Database(db_error) if db_error.is_unique_violation() => {
            AppError::Conflict("collection already exists".into())
        }
        sqlx::Error::Database(db_error) if db_error.is_foreign_key_violation() => {
            AppError::bad_request("parent collection not found")
        }
        _ => error.into(),
    })?;
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Collection,
        request.id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::CREATED)
}

pub async fn update(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, collection_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<UpdateCollection>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    if let Some(encrypted_name) = &request.encrypted_name {
        envelope::validate("encryptedName", encrypted_name)?;
    }

    let mut tx = state.db.begin().await?;
    if let Some(Some(parent_id)) = request.parent_id {
        let subtree = subtree_ids(&mut tx, workspace_id, collection_id).await?;
        if subtree.contains(&parent_id) {
            return Err(AppError::bad_request(
                "a collection can't be moved into itself",
            ));
        }
    }

    let updated = sqlx::query!(
        "update collections set
           encrypted_name = coalesce($3, encrypted_name),
           parent_id = case when $4 then $5 else parent_id end,
           position = coalesce($6, position)
         where workspace_id = $1 and id = $2",
        workspace_id,
        collection_id,
        request.encrypted_name,
        request.parent_id.is_some(),
        request.parent_id.flatten(),
        request.position,
    )
    .execute(&mut *tx)
    .await
    .map_err(|error| match &error {
        sqlx::Error::Database(db_error) if db_error.is_foreign_key_violation() => {
            AppError::bad_request("parent collection not found")
        }
        _ => error.into(),
    })?;
    if updated.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Collection,
        collection_id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, collection_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    let removed = subtree_ids(&mut tx, workspace_id, collection_id).await?;
    if removed.is_empty() {
        return Err(AppError::NotFound);
    }
    sqlx::query!(
        "delete from collections where workspace_id = $1 and id = $2",
        workspace_id,
        collection_id,
    )
    .execute(&mut *tx)
    .await?;
    for id in removed {
        changes::record(
            &mut tx,
            workspace_id,
            Entity::Collection,
            id,
            Operation::Delete,
        )
        .await?;
    }
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn add_note(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, collection_id, note_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    sqlx::query!(
        "insert into collection_notes (workspace_id, collection_id, note_id, position)
         values ($1, $2, $3,
           (select coalesce(max(position) + 1, 0) from collection_notes where collection_id = $2))
         on conflict (collection_id, note_id) do nothing",
        workspace_id,
        collection_id,
        note_id,
    )
    .execute(&mut *tx)
    .await
    .map_err(|error| match &error {
        sqlx::Error::Database(db_error) if db_error.is_foreign_key_violation() => {
            AppError::NotFound
        }
        _ => error.into(),
    })?;
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Collection,
        collection_id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_note(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, collection_id, note_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    sqlx::query!(
        "delete from collection_notes where workspace_id = $1 and collection_id = $2 and note_id = $3",
        workspace_id,
        collection_id,
        note_id,
    )
    .execute(&mut *tx)
    .await?;
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Collection,
        collection_id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}
