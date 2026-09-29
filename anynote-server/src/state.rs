use std::sync::Arc;

use sqlx::PgPool;
use tokio_util::sync::CancellationToken;

use crate::{
    auth::opaque::OpaqueServerSetup,
    http::rate_limit::{LoginLimiter, PreviewLimiter},
    link_preview::PreviewCache,
    realtime::listener::ChangeSender,
    storage::LocalStorage,
};

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub opaque: Arc<OpaqueServerSetup>,
    pub login_limiter: Arc<LoginLimiter>,
    pub storage: Arc<LocalStorage>,
    pub max_attachment_size: u64,
    pub preview_client: reqwest::Client,
    pub preview_cache: PreviewCache,
    pub preview_limiter: Arc<PreviewLimiter>,
    pub changes: ChangeSender,
    pub shutdown: CancellationToken,
}
