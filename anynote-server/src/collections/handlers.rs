use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::{self, Entity, Operation},
    collections::{
        model::{Collection, CreateCollection, Order, UpdateCollection},
        repo::{self, CollectionChanges},
    },
    crypto::envelope,
    error::{AppError, is_foreign_key_violation, is_unique_violation},
    http::extract::{Json, Path},
    state::AppState,
    workspaces::access::{Access, authorize},
};

const MAX_ORDER_LEN: usize = 10_000;

fn validate_order(order: &Order) -> Result<(), AppError> {
    if order.ids.len() > MAX_ORDER_LEN {
        return Err(AppError::bad_request("too many ids"));
    }
    Ok(())
}

fn parent_not_found(error: sqlx::Error) -> AppError {
    if is_foreign_key_violation(&error) {
        AppError::bad_request("parent collection not found")
    } else {
        error.into()
    }
}

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Json<Vec<Collection>>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;
    Ok(Json(repo::list(&state.db, workspace_id).await?))
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
    repo::insert(
        &mut *tx,
        request.id,
        workspace_id,
        request.parent_id,
        &request.encrypted_name,
        request.position,
    )
    .await
    .map_err(|error| {
        if is_unique_violation(&error) {
            AppError::Conflict("collection already exists".into())
        } else {
            parent_not_found(error)
        }
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
        let subtree = repo::subtree_ids(&mut tx, workspace_id, collection_id).await?;
        if subtree.contains(&parent_id) {
            return Err(AppError::bad_request(
                "a collection can't be moved into itself",
            ));
        }
    }

    let changes = CollectionChanges {
        encrypted_name: request.encrypted_name.as_deref(),
        parent_id: request.parent_id,
        position: request.position,
    };
    let updated = repo::update(&mut *tx, workspace_id, collection_id, changes)
        .await
        .map_err(parent_not_found)?;
    if !updated {
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
    let removed = repo::subtree_ids(&mut tx, workspace_id, collection_id).await?;
    if removed.is_empty() {
        return Err(AppError::NotFound);
    }
    repo::delete(&mut *tx, workspace_id, collection_id).await?;
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
    repo::add_note(&mut *tx, workspace_id, collection_id, note_id)
        .await
        .map_err(|error| {
            if is_foreign_key_violation(&error) {
                AppError::NotFound
            } else {
                error.into()
            }
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
    repo::remove_note(&mut *tx, workspace_id, collection_id, note_id).await?;
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

pub async fn reorder(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(request): Json<Order>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    validate_order(&request)?;

    let mut tx = state.db.begin().await?;
    for collection_id in repo::reorder(&mut *tx, workspace_id, &request.ids).await? {
        changes::record(
            &mut tx,
            workspace_id,
            Entity::Collection,
            collection_id,
            Operation::Upsert,
        )
        .await?;
    }
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn reorder_notes(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, collection_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<Order>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    validate_order(&request)?;

    let mut tx = state.db.begin().await?;
    repo::reorder_notes(&mut *tx, workspace_id, collection_id, &request.ids).await?;
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
