mod handlers;
pub mod listener;

use axum::{Router, routing::get};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/workspaces/{workspace_id}/events", get(handlers::events))
}
