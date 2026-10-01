use axum::body::{Body, Bytes};
use futures_util::{Stream, StreamExt, TryStreamExt};
use std::time::Duration;

use object_store::{
    ClientOptions, ObjectStore, ObjectStoreExt, PutPayload, RetryConfig,
    aws::{AmazonS3, AmazonS3Builder},
    path::Path,
};
use uuid::Uuid;

use crate::{config::S3Config, error::AppError};

const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);
const MAX_RETRIES: usize = 3;
const RETRY_TIMEOUT: Duration = Duration::from_secs(60);

pub struct S3Storage {
    store: AmazonS3,
}

impl S3Storage {
    pub fn new(config: &S3Config) -> Result<Self, object_store::Error> {
        let mut builder = AmazonS3Builder::from_env()
            .with_bucket_name(&config.bucket)
            // the timeout is split across every address the endpoint resolves to, and some may be unreachable
            .with_client_options(ClientOptions::new().with_connect_timeout(CONNECT_TIMEOUT))
            .with_retry(RetryConfig {
                max_retries: MAX_RETRIES,
                retry_timeout: RETRY_TIMEOUT,
                ..Default::default()
            });
        if let Some(region) = &config.region {
            builder = builder.with_region(region);
        }
        if let Some(endpoint) = &config.endpoint {
            builder = builder
                .with_allow_http(endpoint.starts_with("http://"))
                .with_endpoint(endpoint);
        }
        if let Some(access_key_id) = &config.access_key_id {
            builder = builder.with_access_key_id(access_key_id);
        }
        if let Some(secret_access_key) = &config.secret_access_key {
            builder = builder.with_secret_access_key(secret_access_key);
        }
        Ok(Self {
            store: builder.build()?,
        })
    }

    fn workspace_prefix(workspace_id: Uuid) -> Path {
        Path::from(workspace_id.to_string())
    }

    fn path(workspace_id: Uuid, id: Uuid) -> Path {
        Path::from(format!("{workspace_id}/{id}"))
    }

    pub async fn write<S, E>(
        &self,
        workspace_id: Uuid,
        id: Uuid,
        mut body: S,
        max_size: u64,
    ) -> Result<u64, AppError>
    where
        S: Stream<Item = Result<Bytes, E>> + Unpin,
        E: std::fmt::Display,
    {
        let mut chunks = Vec::new();
        let mut size = 0u64;
        while let Some(chunk) = body.next().await {
            let chunk = chunk.map_err(|error| AppError::bad_request(error.to_string()))?;
            size += chunk.len() as u64;
            if size > max_size {
                return Err(AppError::PayloadTooLarge);
            }
            chunks.push(chunk);
        }
        if size == 0 {
            return Err(AppError::bad_request("file is empty"));
        }

        self.store
            .put(
                &Self::path(workspace_id, id),
                chunks.into_iter().collect::<PutPayload>(),
            )
            .await?;
        Ok(size)
    }

    pub async fn read(&self, workspace_id: Uuid, id: Uuid) -> Result<Body, AppError> {
        let object = self.store.get(&Self::path(workspace_id, id)).await?;
        Ok(Body::from_stream(object.into_stream()))
    }

    pub async fn delete(&self, workspace_id: Uuid, id: Uuid) -> Result<(), AppError> {
        match self.store.delete(&Self::path(workspace_id, id)).await {
            Err(error) if !matches!(error, object_store::Error::NotFound { .. }) => {
                Err(error.into())
            }
            _ => Ok(()),
        }
    }

    pub async fn delete_workspace(&self, workspace_id: Uuid) -> Result<(), AppError> {
        let paths = self
            .store
            .list(Some(&Self::workspace_prefix(workspace_id)))
            .map_ok(|meta| meta.location)
            .boxed();
        self.store
            .delete_stream(paths)
            .try_collect::<Vec<_>>()
            .await?;
        Ok(())
    }
}
