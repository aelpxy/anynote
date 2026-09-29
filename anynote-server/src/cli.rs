use std::error::Error;

use tracing_subscriber::EnvFilter;

use crate::{auth, config::Config, server};

pub async fn run() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    match std::env::args().nth(1).as_deref() {
        None | Some("serve") => {
            tracing_subscriber::fmt()
                .with_env_filter(
                    EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
                )
                .init();
            server::run(Config::from_env()?).await
        }
        Some("generate-opaque-setup") => {
            println!("{}", auth::opaque::generate_server_setup());
            Ok(())
        }
        Some(command) => Err(format!(
            "unknown command `{command}`, expected `serve` or `generate-opaque-setup`"
        )
        .into()),
    }
}
