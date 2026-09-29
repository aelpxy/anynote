mod handlers;
pub mod model;
pub mod repo;

use axum::{Router, routing::get};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/me", get(handlers::me).delete(handlers::delete_account))
}
