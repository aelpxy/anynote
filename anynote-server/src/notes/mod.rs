mod handlers;
pub mod model;

use axum::{Router, routing::get};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/workspaces/{workspace_id}/notes",
            get(handlers::list).post(handlers::create),
        )
        .route(
            "/workspaces/{workspace_id}/notes/{note_id}",
            get(handlers::get_one)
                .patch(handlers::update)
                .delete(handlers::delete),
        )
}
