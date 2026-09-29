use axum::{
    body::Body,
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
};
use rust_embed::RustEmbed;

use crate::error::AppError;

#[derive(RustEmbed)]
#[folder = "../build/client/"]
#[allow_missing = true]
struct Assets;

fn file_response(path: &str, cache_control: &'static str) -> Option<Response> {
    let file = Assets::get(path)?;
    Some(
        (
            [
                (header::CONTENT_TYPE, file.metadata.mimetype().to_string()),
                (header::CACHE_CONTROL, cache_control.to_string()),
            ],
            Body::from(file.data),
        )
            .into_response(),
    )
}

pub async fn serve(uri: Uri) -> Response {
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
        && let Some(response) = file_response(path, cache_control)
    {
        return response;
    }

    file_response("index.html", "no-cache").unwrap_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            "The web app isn't built yet. Run `pnpm build` in the repository root.",
        )
            .into_response()
    })
}
