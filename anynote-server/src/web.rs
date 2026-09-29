use std::sync::LazyLock;

use axum::{
    body::Body,
    http::{HeaderValue, StatusCode, Uri, header},
    response::{IntoResponse, Response},
};
use base64::{Engine, engine::general_purpose::STANDARD};
use rust_embed::RustEmbed;
use sha2::{Digest, Sha256};

use crate::error::AppError;

#[derive(RustEmbed)]
#[folder = "../build/client/"]
#[allow_missing = true]
struct Assets;

// the build inlines a few scripts into index.html, so only those exact scripts are allowed to run
fn inline_script_hashes(html: &str) -> Vec<String> {
    let mut hashes = Vec::new();
    let mut rest = html;
    while let Some(start) = rest.find("<script") {
        rest = &rest[start..];
        let Some(tag_end) = rest.find('>') else { break };
        let Some(close) = rest.find("</script>") else {
            break;
        };
        if !rest[..tag_end].contains(" src=") {
            let body = &rest[tag_end + 1..close];
            hashes.push(format!(
                "'sha256-{}'",
                STANDARD.encode(Sha256::digest(body))
            ));
        }
        rest = &rest[close + "</script>".len()..];
    }
    hashes
}

static CONTENT_SECURITY_POLICY: LazyLock<HeaderValue> = LazyLock::new(|| {
    let html = Assets::get("index.html")
        .map(|file| String::from_utf8_lossy(&file.data).into_owned())
        .unwrap_or_default();
    let policy = [
        "default-src 'self'".to_string(),
        // the crypto libraries run as webassembly, which needs wasm-unsafe-eval but not eval
        format!(
            "script-src 'self' 'wasm-unsafe-eval' {}",
            inline_script_hashes(&html).join(" ")
        ),
        // editor, toolbars and animations set inline styles at runtime
        "style-src 'self' 'unsafe-inline'".to_string(),
        // decrypted images are shown from blob urls
        "img-src 'self' blob: data:".to_string(),
        "media-src 'self' blob:".to_string(),
        "font-src 'self'".to_string(),
        "connect-src 'self'".to_string(),
        "worker-src 'self' blob:".to_string(),
        "manifest-src 'self'".to_string(),
        "object-src 'none'".to_string(),
        "base-uri 'none'".to_string(),
        "form-action 'self'".to_string(),
        "frame-ancestors 'none'".to_string(),
    ]
    .join("; ");
    HeaderValue::from_str(&policy).expect("content security policy is a valid header value")
});

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

    file_response("index.html", "no-cache")
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
