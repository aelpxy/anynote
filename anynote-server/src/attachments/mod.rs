mod handlers;
pub mod model;

use axum::{
    Router,
    routing::{post, put},
};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/workspaces/{workspace_id}/attachments/sweep",
            post(handlers::sweep),
        )
        .route(
            "/workspaces/{workspace_id}/attachments/{attachment_id}",
            put(handlers::upload)
                .get(handlers::download)
                .delete(handlers::delete),
        )
}
