mod handlers;
pub mod key_stretching;
pub mod model;
pub mod opaque;
pub mod repo;
pub mod session;
pub mod username;

use std::sync::Arc;

use axum::{Router, routing::post};

use crate::{http::rate_limit, state::AppState};

pub fn routes(ip_config: Arc<rate_limit::IpGovernorConfig>) -> Router<AppState> {
    Router::new()
        .route("/auth/register/start", post(handlers::register_start))
        .route("/auth/register/finish", post(handlers::register_finish))
        .route("/auth/login/start", post(handlers::login_start))
        .route("/auth/login/finish", post(handlers::login_finish))
        .route("/auth/logout", post(handlers::logout))
        .route("/auth/password/start", post(handlers::password_start))
        .route("/auth/password/finish", post(handlers::password_finish))
        .layer(rate_limit::ip_layer(ip_config))
}
