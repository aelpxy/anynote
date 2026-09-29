use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::{self, Entity, Operation},
    crypto::envelope,
    error::AppError,
    http::extract::{Json, Path},
    notes::{
        model::{CreateNote, Note, UpdateNote},
        repo,
    },
    state::AppState,
    workspaces::access::{Access, authorize},
};

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Json<Vec<Note>>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;
    Ok(Json(repo::list(&state.db, workspace_id).await?))
}

pub async fn get_one(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((workspace_id, note_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Note>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;
    let note = repo::find(&state.db, workspace_id, note_id)
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
    let note = repo::insert(&mut *tx, request.id, workspace_id, &request.encrypted_data)
        .await
        .map_err(AppError::conflict_on_unique("note already exists"))?;
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
    let note = repo::update(
        &mut *tx,
        workspace_id,
        note_id,
        request.base_version,
        request.encrypted_data.as_deref(),
        request.trashed,
    )
    .await?;

    let Some(note) = note else {
        return Err(if repo::exists(&mut *tx, workspace_id, note_id).await? {
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
    if !repo::delete(&mut *tx, workspace_id, note_id).await? {
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

pub async fn empty_trash(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;

    let mut tx = state.db.begin().await?;
    for note_id in repo::delete_trashed(&mut *tx, workspace_id).await? {
        changes::record(
            &mut tx,
            workspace_id,
            Entity::Note,
            note_id,
            Operation::Delete,
        )
        .await?;
    }
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}
