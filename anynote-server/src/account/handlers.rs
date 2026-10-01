use axum::{extract::State, http::StatusCode};

use crate::{
    account::{model::Account, repo},
    auth::session::AuthUser,
    error::AppError,
    http::extract::Json,
    state::AppState,
    workspaces::repo as workspaces,
};

pub async fn me(State(state): State<AppState>, auth: AuthUser) -> Result<Json<Account>, AppError> {
    let mut db = state.db.acquire().await?;
    Ok(Json(repo::load_account(&mut db, auth.user_id).await?))
}

pub async fn delete_account(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<StatusCode, AppError> {
    auth.require_recent_login()?;

    let mut tx = state.db.begin().await?;
    let owned_workspaces = workspaces::delete_owned_by(&mut *tx, auth.user_id).await?;
    repo::delete_user(&mut *tx, auth.user_id).await?;
    tx.commit().await?;

    for workspace_id in owned_workspaces {
        state.storage.delete_workspace(workspace_id).await;
    }
    Ok(StatusCode::NO_CONTENT)
}
