mod handlers;
pub mod model;
pub mod repo;

use axum::{Router, routing::get};

pub use model::{Entity, Operation};
pub use repo::record;

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/workspaces/{workspace_id}/changes", get(handlers::list))
        .route(
            "/workspaces/{workspace_id}/changes/cursor",
            get(handlers::cursor),
        )
}
