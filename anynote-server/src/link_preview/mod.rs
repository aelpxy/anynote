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
        .max_capacity(2_000)
        .time_to_live(Duration::from_secs(60 * 60))
        .build()
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/link-preview", post(handlers::preview))
}
