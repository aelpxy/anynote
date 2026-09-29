mod handlers;
pub mod model;

use axum::{Router, routing::get};
use sqlx::PgConnection;
use uuid::Uuid;

pub use model::{Entity, Operation};

use crate::{error::AppError, state::AppState};

pub async fn record(
    db: &mut PgConnection,
    workspace_id: Uuid,
    entity: Entity,
    entity_id: Uuid,
    operation: Operation,
) -> Result<(), AppError> {
    sqlx::query!(
        "insert into changes (workspace_id, entity, entity_id, operation) values ($1, $2, $3, $4)",
        workspace_id,
        entity.as_str(),
        entity_id,
        operation.as_str(),
    )
    .execute(db)
    .await?;
    Ok(())
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/workspaces/{workspace_id}/changes", get(handlers::list))
        .route(
            "/workspaces/{workspace_id}/changes/cursor",
            get(handlers::cursor),
        )
}
