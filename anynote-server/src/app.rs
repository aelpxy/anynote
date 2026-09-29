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

    // responses carry session tokens and ciphertext, so nothing in between should keep a copy
    let api = api
        .layer(security_header("cache-control", "no-store"))
        .layer(security_header(
            "content-security-policy",
            "default-src 'none'; frame-ancestors 'none'",
        ));

    Router::new()
        .route("/api/health", get(health))
        .nest("/api/v1", api)
        .fallback(web::serve)
        .layer(security_header("x-content-type-options", "nosniff"))
        .layer(security_header("x-frame-options", "DENY"))
        .layer(security_header("referrer-policy", "no-referrer"))
        // no includeSubDomains, so other services on the same domain keep working over http
        .layer(security_header(
            "strict-transport-security",
            "max-age=31536000",
        ))
        .layer(security_header("cross-origin-opener-policy", "same-origin"))
        .layer(security_header(
            "cross-origin-resource-policy",
            "same-origin",
        ))
        .layer(security_header(
            "permissions-policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
        ))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("select 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}
