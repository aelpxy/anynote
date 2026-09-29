use axum::extract::State;
use url::Url;

use crate::{
    auth::session::AuthUser,
    error::AppError,
    http::extract::Json,
    link_preview::{
        fetch::fetch_preview,
        guard::is_allowed_url,
        model::{LinkPreview, PreviewRequest},
    },
    state::AppState,
};

const MAX_URL_LENGTH: usize = 2048;

// the url travels in the body so it stays out of access logs
pub async fn preview(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(request): Json<PreviewRequest>,
) -> Result<Json<LinkPreview>, AppError> {
    state
        .preview_limiter
        .check_key(&auth.user_id)
        .map_err(|_| AppError::RateLimited)?;

    let url = Url::parse(request.url.trim())
        .ok()
        .filter(|url| request.url.len() <= MAX_URL_LENGTH && is_allowed_url(url))
        .ok_or_else(|| AppError::bad_request("url can't be previewed"))?;

    if let Some(cached) = state.preview_cache.get(url.as_str()).await {
        return Ok(Json(cached));
    }

    let preview = fetch_preview(&state.preview_client, &url)
        .await
        .map_err(|_| AppError::UpstreamFailed)?;
    state
        .preview_cache
        .insert(url.to_string(), preview.clone())
        .await;

    Ok(Json(preview))
}
