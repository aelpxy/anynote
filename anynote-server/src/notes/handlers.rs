use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::{self, Entity, Operation},
    crypto::envelope,
    error::AppError,
    http::extract::{Json, Path},
    notes::model::{CreateNote, Note, UpdateNote},
    state::AppState,
    workspaces::access::{Access, authorize},
};

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Json<Vec<Note>>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;

    let notes = sqlx::query_as!(
        Note,
        "select id, encrypted_data, version, trashed_at, created_at, updated_at
         from notes where workspace_id = $1 order by created_at",
        workspace_id,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(notes))
}

pub async fn get_one(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, note_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Note>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;

    let note = sqlx::query_as!(
        Note,
        "select id, encrypted_data, version, trashed_at, created_at, updated_at
         from notes where workspace_id = $1 and id = $2",
        workspace_id,
        note_id,
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(note))
}

pub async fn create(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(request): Json<CreateNote>,
) -> Result<(StatusCode, Json<Note>), AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    envelope::validate("encryptedData", &request.encrypted_data)?;

    let mut tx = state.db.begin().await?;
    let note = sqlx::query_as!(
        Note,
        "insert into notes (id, workspace_id, encrypted_data) values ($1, $2, $3)
         returning id, encrypted_data, version, trashed_at, created_at, updated_at",
        request.id,
        workspace_id,
        request.encrypted_data,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|error| match &error {
        sqlx::Error::Database(db_error) if db_error.is_unique_violation() => {
            AppError::Conflict("note already exists".into())
        }
        _ => error.into(),
    })?;
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Note,
        note.id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok((StatusCode::CREATED, Json(note)))
}

pub async fn update(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, note_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<UpdateNote>,
) -> Result<Json<Note>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    if let Some(encrypted_data) = &request.encrypted_data {
        envelope::validate("encryptedData", encrypted_data)?;
    }

    let mut tx = state.db.begin().await?;
    let note = sqlx::query_as!(
        Note,
        "update notes set
           encrypted_data = coalesce($4, encrypted_data),
           trashed_at = case
             when $5::boolean is null then trashed_at
             when $5 then coalesce(trashed_at, now())
             else null
           end,
           version = version + 1
         where workspace_id = $1 and id = $2 and version = $3
         returning id, encrypted_data, version, trashed_at, created_at, updated_at",
        workspace_id,
        note_id,
        request.base_version,
        request.encrypted_data,
        request.trashed,
    )
    .fetch_optional(&mut *tx)
    .await?;

    let Some(note) = note else {
        let exists = sqlx::query_scalar!(
            r#"select exists(select 1 from notes where workspace_id = $1 and id = $2) as "exists!""#,
            workspace_id,
            note_id,
        )
        .fetch_one(&mut *tx)
        .await?;
        return Err(if exists {
            AppError::Conflict("note was changed elsewhere, fetch it and try again".into())
        } else {
            AppError::NotFound
        });
    };

    changes::record(
        &mut tx,
        workspace_id,
        Entity::Note,
        note.id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(Json(note))
}

pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, note_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    let deleted = sqlx::query!(
        "delete from notes where workspace_id = $1 and id = $2",
        workspace_id,
        note_id,
    )
    .execute(&mut *tx)
    .await?;
    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Note,
        note_id,
        Operation::Delete,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}
