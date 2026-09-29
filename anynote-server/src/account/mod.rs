mod handlers;
pub mod model;

use axum::{Router, routing::get};

pub use handlers::load_account;

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/me", get(handlers::me).delete(handlers::delete_account))
}
