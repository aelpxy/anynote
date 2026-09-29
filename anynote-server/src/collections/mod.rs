mod handlers;
pub mod model;
pub mod repo;

use axum::{
    Router,
    routing::{get, patch, put},
};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/workspaces/{workspace_id}/collections",
            get(handlers::list).post(handlers::create),
        )
        .route(
            "/workspaces/{workspace_id}/collections/{collection_id}",
            patch(handlers::update).delete(handlers::delete),
        )
        .route(
            "/workspaces/{workspace_id}/collections/order",
            put(handlers::reorder),
        )
        .route(
            "/workspaces/{workspace_id}/collections/{collection_id}/notes",
            put(handlers::reorder_notes),
        )
        .route(
            "/workspaces/{workspace_id}/collections/{collection_id}/notes/{note_id}",
            put(handlers::add_note).delete(handlers::remove_note),
        )
}
