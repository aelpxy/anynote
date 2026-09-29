mod assets;
mod csp;

use axum::{
    http::{HeaderMap, StatusCode, Uri, header},
    response::{IntoResponse, Response},
};

pub use assets::warm_compression_cache;

use crate::{
    error::AppError,
    web::{assets::file_response, csp::CONTENT_SECURITY_POLICY},
};

pub async fn serve(uri: Uri, request: HeaderMap) -> Response {
    let path = uri.path().trim_start_matches('/');
    if path == "api" || path.starts_with("api/") {
        return AppError::NotFound.into_response();
    }

    let cache_control = if path.starts_with("assets/") {
        "public, max-age=31536000, immutable"
    } else {
        "no-cache"
    };
    if !path.is_empty()
        && let Some(response) = file_response(path, cache_control, &request)
    {
        return response;
    }

    file_response("index.html", "no-cache", &request)
        .map(|mut response| {
            response.headers_mut().insert(
                header::CONTENT_SECURITY_POLICY,
                CONTENT_SECURITY_POLICY.clone(),
            );
            response
        })
        .unwrap_or_else(|| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                "The web app isn't built yet. Run `pnpm build` in the repository root.",
            )
                .into_response()
        })
}
