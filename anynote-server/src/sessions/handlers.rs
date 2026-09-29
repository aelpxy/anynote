use axum::{extract::State, http::StatusCode};
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    error::AppError,
    http::extract::{Json, Path},
    sessions::model::SessionSummary,
    state::AppState,
};

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<SessionSummary>>, AppError> {
    let sessions = sqlx::query_as!(
        SessionSummary,
        r#"select id, created_at, last_used_at, expires_at, id = $2 as "is_current!"
           from sessions
           where user_id = $1 and expires_at > now()
           order by last_used_at desc"#,
        auth.user_id,
        auth.session_id,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sessions))
}

pub async fn revoke(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(session_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let revoked = sqlx::query!(
        "delete from sessions where id = $1 and user_id = $2",
        session_id,
        auth.user_id,
    )
    .execute(&state.db)
    .await?;

    if revoked.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(StatusCode::NO_CONTENT)
}
