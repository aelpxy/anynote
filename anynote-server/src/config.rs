use std::env;

pub struct Config {
    pub database_url: String,
    pub addr: String,
    pub opaque_server_setup: String,
    pub storage_dir: String,
    pub s3: Option<S3Config>,
    pub max_attachment_size: u64,
}

pub struct S3Config {
    pub bucket: String,
    pub region: Option<String>,
    pub endpoint: Option<String>,
    pub access_key_id: Option<String>,
    pub secret_access_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let required = |name: &str| env::var(name).map_err(|_| format!("{name} must be set"));
        let optional = |name: &str| env::var(name).ok().filter(|value| !value.is_empty());

        Ok(Self {
            database_url: required("DATABASE_URL")?,
            addr: env::var("ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            opaque_server_setup: required("OPAQUE_SERVER_SETUP")?,
            storage_dir: env::var("STORAGE_DIR").unwrap_or_else(|_| "./data/attachments".into()),
            s3: optional("S3_BUCKET").map(|bucket| S3Config {
                bucket,
                region: optional("S3_REGION"),
                endpoint: optional("S3_ENDPOINT"),
                access_key_id: optional("S3_ACCESS_KEY_ID"),
                secret_access_key: optional("S3_SECRET_ACCESS_KEY"),
            }),
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
