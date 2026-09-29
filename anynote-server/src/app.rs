use std::sync::Arc;

use axum::{Router, extract::State, http::StatusCode, routing::get};

use crate::{
    account, attachments, auth, changes, collections,
    http::{layers, rate_limit::IpGovernorConfig},
    link_preview, notes, realtime, sessions,
    state::AppState,
    web, workspaces,
};

pub fn router(state: AppState, ip_config: Arc<IpGovernorConfig>) -> Router {
    let api = Router::new()
        .merge(auth::routes(ip_config))
        .merge(account::routes())
        .merge(workspaces::routes())
        .merge(notes::routes())
        .merge(collections::routes())
        .merge(attachments::routes())
        .merge(changes::routes())
        .merge(sessions::routes())
        .merge(link_preview::routes())
        .merge(realtime::routes());

    let app = Router::new()
        .route("/api/health", get(health))
        .nest("/api/v1", layers::api(api))
        .fallback(web::serve);

    layers::app(app).with_state(state)
}

async fn health(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("select 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}
