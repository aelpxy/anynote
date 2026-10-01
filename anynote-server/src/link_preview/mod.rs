pub mod fetch;
pub mod guard;
mod handlers;
pub mod model;

use std::time::Duration;

use axum::{Router, routing::post};
use moka::future::Cache;

use crate::{link_preview::model::LinkPreview, state::AppState};

pub type PreviewCache = Cache<String, LinkPreview>;

pub fn cache() -> PreviewCache {
    Cache::builder()
        // weighed in bytes since inlined icons make entries uneven
        .weigher(|url: &String, preview: &LinkPreview| {
            (url.len() + preview.icon.as_ref().map_or(0, String::len) + 512) as u32
        })
        .max_capacity(32 * 1024 * 1024)
        .time_to_live(Duration::from_secs(60 * 60))
        .build()
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/link-preview", post(handlers::preview))
}
