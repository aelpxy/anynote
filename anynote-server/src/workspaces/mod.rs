pub mod access;
mod handlers;
pub mod model;
pub mod repo;

use axum::{
    Router,
    routing::{patch, post},
};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/workspaces", post(handlers::create))
        .route(
            "/workspaces/{workspace_id}",
            patch(handlers::rename).delete(handlers::delete),
        )
}
