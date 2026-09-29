use std::{num::NonZeroU32, sync::Arc, time::Duration};

use axum::{body::Body, response::IntoResponse};
use governor::{
    DefaultKeyedRateLimiter, Quota, RateLimiter, clock::QuantaInstant, middleware::NoOpMiddleware,
};
use tower_governor::{
    GovernorLayer,
    governor::{GovernorConfig, GovernorConfigBuilder},
    key_extractor::SmartIpKeyExtractor,
};

use crate::error::AppError;

pub type LoginLimiter = DefaultKeyedRateLimiter<String>;
pub type PreviewLimiter = DefaultKeyedRateLimiter<uuid::Uuid>;

pub type IpGovernorConfig = GovernorConfig<SmartIpKeyExtractor, NoOpMiddleware<QuantaInstant>>;

const fn non_zero(value: u32) -> NonZeroU32 {
    match NonZeroU32::new(value) {
        Some(value) => value,
        None => panic!("rate limit values must be non-zero"),
    }
}

// caps guessing against a single account no matter how many ips an attacker uses
pub fn login_limiter() -> Arc<LoginLimiter> {
    Arc::new(RateLimiter::keyed(
        Quota::per_hour(non_zero(30)).allow_burst(non_zero(10)),
    ))
}

// hovering links triggers previews, so allow bursts but cap sustained fetching per user
pub fn preview_limiter() -> Arc<PreviewLimiter> {
    Arc::new(RateLimiter::keyed(
        Quota::per_minute(non_zero(60)).allow_burst(non_zero(20)),
    ))
}

// the ip comes from X-Forwarded-For, so the api must sit behind a proxy that overwrites that header
pub fn ip_config() -> Arc<IpGovernorConfig> {
    Arc::new(
        GovernorConfigBuilder::default()
            .per_second(3)
            .burst_size(20)
            .key_extractor(SmartIpKeyExtractor)
            .finish()
            .expect("rate limit config is valid"),
    )
}

pub fn ip_layer(
    config: Arc<IpGovernorConfig>,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware<QuantaInstant>, Body> {
    GovernorLayer::new(config).error_handler(|_| AppError::RateLimited.into_response())
}

pub fn spawn_cleanup(
    login_limiter: Arc<LoginLimiter>,
    preview_limiter: Arc<PreviewLimiter>,
    ip_config: Arc<IpGovernorConfig>,
) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            login_limiter.retain_recent();
            preview_limiter.retain_recent();
            ip_config.limiter().retain_recent();
        }
    });
}
