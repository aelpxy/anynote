use std::env;

pub struct Config {
    pub database_url: String,
    pub addr: String,
    pub opaque_server_setup: String,
    pub storage_dir: String,
    pub max_attachment_size: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let required = |name: &str| env::var(name).map_err(|_| format!("{name} must be set"));

        Ok(Self {
            database_url: required("DATABASE_URL")?,
            addr: env::var("ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            opaque_server_setup: required("OPAQUE_SERVER_SETUP")?,
            storage_dir: env::var("STORAGE_DIR").unwrap_or_else(|_| "./data/attachments".into()),
            max_attachment_size: env::var("MAX_ATTACHMENT_SIZE")
                .ok()
                .map(|value| {
                    value
                        .parse()
                        .map_err(|_| "MAX_ATTACHMENT_SIZE must be a number of bytes")
                })
                .transpose()?
                .unwrap_or(10 * 1024 * 1024),
        })
    }
}
