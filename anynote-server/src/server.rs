use std::{error::Error, net::SocketAddr, sync::Arc};

use sqlx::postgres::PgPoolOptions;
use tokio::{net::TcpListener, signal};
use tokio_util::sync::CancellationToken;

use crate::{
    app, auth,
    config::Config,
    http::rate_limit,
    jobs, link_preview, realtime,
    state::AppState,
    storage::{LocalStorage, S3Storage, Storage},
    web,
};

const MAX_DB_CONNECTIONS: u32 = 10;

pub async fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let opaque = auth::opaque::load_server_setup(&config.opaque_server_setup)?;

    let db = PgPoolOptions::new()
        .max_connections(MAX_DB_CONNECTIONS)
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

    let storage = match &config.s3 {
        Some(s3) => Storage::S3(S3Storage::new(s3)?),
        None => Storage::Local(LocalStorage::new(config.storage_dir)),
    };

    let storage = Arc::new(storage);
    tokio::spawn({
        let storage = storage.clone();
        async move { storage.check().await }
    });

    let shutdown = CancellationToken::new();
    let state = AppState {
        db,
        opaque: Arc::new(opaque),
        login_limiter,
        storage,
        max_attachment_size: config.max_attachment_size,
        preview_client: link_preview::fetch::client(),
        preview_cache: link_preview::cache(),
        preview_limiter,
        changes,
        shutdown: shutdown.clone(),
    };
    let app = app::router(state, ip_config);

    tokio::task::spawn_blocking(web::warm_compression_cache);

    let listener = TcpListener::bind(&config.addr).await?;
    tracing::info!("listening on {}", config.addr);

    // the rate limiter falls back to the peer address when no proxy header is present
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(async move {
        shutdown_signal().await;
        shutdown.cancel();
    })
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
