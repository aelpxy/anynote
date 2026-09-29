use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    error::AppError,
    http::extract::{Json, Path},
    sessions::{model::SessionSummary, repo},
    state::AppState,
};

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<SessionSummary>>, AppError> {
    Ok(Json(
        repo::list_active(&state.db, auth.user_id, auth.session_id).await?,
    ))
}

pub async fn revoke(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(session_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    if !repo::delete_for_user(&state.db, session_id, auth.user_id).await? {
        return Err(AppError::NotFound);
    }
    Ok(StatusCode::NO_CONTENT)
}
