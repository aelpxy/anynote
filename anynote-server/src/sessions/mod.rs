mod handlers;
pub mod model;

use axum::{
    Router,
    routing::{delete, get},
};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/sessions", get(handlers::list))
        .route("/sessions/{session_id}", delete(handlers::revoke))
}
