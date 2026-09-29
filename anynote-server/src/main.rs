mod account;
mod app;
mod attachments;
mod auth;
mod changes;
mod collections;
mod config;
mod crypto;
mod error;
mod http;
mod jobs;
mod link_preview;
mod notes;
mod realtime;
mod sessions;
mod state;
mod storage;
mod web;
mod workspaces;

use std::{net::SocketAddr, sync::Arc};

use sqlx::postgres::PgPoolOptions;
use tokio::{net::TcpListener, signal};
use tracing_subscriber::EnvFilter;

use crate::{config::Config, http::rate_limit, state::AppState, storage::LocalStorage};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    if std::env::args().nth(1).as_deref() == Some("generate-opaque-setup") {
        println!("{}", auth::opaque::generate_server_setup());
        return Ok(());
    }

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let config = Config::from_env()?;
    let opaque = auth::opaque::load_server_setup(&config.opaque_server_setup)?;

    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!().run(&db).await?;

    jobs::spawn(db.clone());
    let changes = realtime::listener::spawn(db.clone());

    let login_limiter = rate_limit::login_limiter();
    let preview_limiter = rate_limit::preview_limiter();
    let ip_config = rate_limit::ip_config();
    rate_limit::spawn_cleanup(
        login_limiter.clone(),
        preview_limiter.clone(),
        ip_config.clone(),
    );

    let state = AppState {
        db,
        opaque: Arc::new(opaque),
        login_limiter,
        storage: Arc::new(LocalStorage::new(config.storage_dir)),
        max_attachment_size: config.max_attachment_size,
        preview_client: link_preview::fetch::client(),
        preview_cache: link_preview::cache(),
        preview_limiter,
        changes,
    };
    let app = app::router(state, ip_config);

    let listener = TcpListener::bind(&config.addr).await?;
    tracing::info!("listening on {}", config.addr);

    // the rate limiter falls back to the peer address when no proxy header is present
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.ok();
    };
    let terminate = async {
        if let Ok(mut signal) = signal::unix::signal(signal::unix::SignalKind::terminate()) {
            signal.recv().await;
        }
    };

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }
}
