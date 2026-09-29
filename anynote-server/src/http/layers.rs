use axum::{
    Router,
    http::{HeaderName, HeaderValue},
};
use tower_http::{
    compression::{
        CompressionLayer, CompressionLevel,
        predicate::{DefaultPredicate, NotForContentType, Predicate},
    },
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};

use crate::state::AppState;

fn header(name: &'static str, value: &'static str) -> SetResponseHeaderLayer<HeaderValue> {
    SetResponseHeaderLayer::if_not_present(
        HeaderName::from_static(name),
        HeaderValue::from_static(value),
    )
}

// responses carry session tokens and ciphertext, so nothing in between should keep a copy
pub fn api(router: Router<AppState>) -> Router<AppState> {
    router
        .layer(
            CompressionLayer::new()
                .quality(CompressionLevel::Precise(5))
                .compress_when(
                    DefaultPredicate::new()
                        .and(NotForContentType::const_new("application/octet-stream")),
                ),
        )
        .layer(header("cache-control", "no-store"))
        .layer(header(
            "content-security-policy",
            "default-src 'none'; frame-ancestors 'none'",
        ))
}

pub fn app(router: Router<AppState>) -> Router<AppState> {
    router
        .layer(header("x-content-type-options", "nosniff"))
        .layer(header("x-frame-options", "DENY"))
        .layer(header("referrer-policy", "no-referrer"))
        // no includeSubDomains, so other services on the same domain keep working over http
        .layer(header("strict-transport-security", "max-age=31536000"))
        .layer(header("cross-origin-opener-policy", "same-origin"))
        .layer(header("cross-origin-resource-policy", "same-origin"))
        .layer(header(
            "permissions-policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
        ))
        .layer(TraceLayer::new_for_http())
}
