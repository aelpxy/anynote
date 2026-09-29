use axum::extract::State;
use uuid::Uuid;

use crate::{
    auth::session::AuthUser,
    changes::model::{Change, ChangesCursor, ChangesQuery, ChangesResponse},
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

    let mut changes = sqlx::query_as!(
        Change,
        "select id, entity, entity_id, operation, created_at from changes
         where workspace_id = $1 and id > $2
         order by id
         limit $3",
        workspace_id,
        query.after,
        limit + 1,
    )
    .fetch_all(&state.db)
    .await?;

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

    let cursor = sqlx::query_scalar!(
        r#"select coalesce(max(id), 0) as "cursor!" from changes where workspace_id = $1"#,
        workspace_id,
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(ChangesCursor { cursor }))
}
