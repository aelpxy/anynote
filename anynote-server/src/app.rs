use std::sync::Arc;

use axum::{
    Router,
    extract::State,
    http::{HeaderName, HeaderValue, StatusCode},
    routing::get,
};
use tower_http::{set_header::SetResponseHeaderLayer, trace::TraceLayer};

use crate::{
    account, attachments, auth, changes, collections, http::rate_limit::IpGovernorConfig,
    link_preview, notes, realtime, sessions, state::AppState, web, workspaces,
};

fn security_header(name: &'static str, value: &'static str) -> SetResponseHeaderLayer<HeaderValue> {
    SetResponseHeaderLayer::if_not_present(
        HeaderName::from_static(name),
        HeaderValue::from_static(value),
    )
}

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

    Router::new()
        .route("/api/health", get(health))
        .nest("/api/v1", api)
        .fallback(web::serve)
        .layer(security_header("x-content-type-options", "nosniff"))
        .layer(security_header("x-frame-options", "DENY"))
        .layer(security_header("referrer-policy", "no-referrer"))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("select 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}
