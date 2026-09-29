use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::{self, Entity, Operation},
    crypto::envelope,
    error::AppError,
    http::extract::{Json, Path},
    state::AppState,
    workspaces::{
        access::{Access, authorize},
        model::{CreateWorkspace, RenameWorkspace},
        repo,
    },
};

pub async fn create(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(request): Json<CreateWorkspace>,
) -> Result<StatusCode, AppError> {
    envelope::validate("encryptedName", &request.encrypted_name)?;

    let mut tx = state.db.begin().await?;
    repo::insert_with_owner(
        &mut tx,
        request.id,
        &request.encrypted_name,
        auth.user_id,
        &request.encrypted_workspace_key,
    )
    .await
    .map_err(AppError::conflict_on_unique("workspace already exists"))?;
    changes::record(
        &mut tx,
        request.id,
        Entity::Workspace,
        request.id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::CREATED)
}

pub async fn rename(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Json(request): Json<RenameWorkspace>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Write).await?;
    envelope::validate("encryptedName", &request.encrypted_name)?;

    let mut tx = state.db.begin().await?;
    repo::rename(&mut *tx, workspace_id, &request.encrypted_name).await?;
    changes::record(
        &mut tx,
        workspace_id,
        Entity::Workspace,
        workspace_id,
        Operation::Upsert,
    )
    .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Own).await?;

    if repo::membership_count(&state.db, auth.user_id).await? <= 1 {
        return Err(AppError::bad_request(
            "you can't delete your only workspace",
        ));
    }

    repo::delete(&state.db, workspace_id).await?;
    state.storage.delete_workspace(workspace_id).await?;

    Ok(StatusCode::NO_CONTENT)
}
