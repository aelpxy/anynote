use axum::extract::State;
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::{
        model::{ChangesCursor, ChangesQuery, ChangesResponse},
        repo,
    },
    error::AppError,
    http::extract::{Json, Path, Query},
    state::AppState,
    workspaces::access::{Access, authorize},
};

pub async fn list(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
    Query(query): Query<ChangesQuery>,
) -> Result<Json<ChangesResponse>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;
    let limit = query.limit.unwrap_or(500).clamp(1, 1000);

    let mut changes = repo::list_after(&state.db, workspace_id, query.after, limit + 1).await?;

    let has_more = changes.len() as i64 > limit;
    changes.truncate(limit as usize);
    let cursor = changes.last().map_or(query.after, |change| change.id);

    Ok(Json(ChangesResponse {
        changes,
        cursor,
        has_more,
    }))
}

pub async fn cursor(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(workspace_id): Path<Uuid>,
) -> Result<Json<ChangesCursor>, AppError> {
    authorize(&state.db, workspace_id, auth.user_id, Access::Read).await?;

    let cursor = repo::latest_cursor(&state.db, workspace_id).await?;

    Ok(Json(ChangesCursor { cursor }))
}
