mod local;
mod s3;

use axum::body::{Body, Bytes};
use futures_util::Stream;
use uuid::Uuid;

use crate::error::AppError;

pub use local::LocalStorage;
pub use s3::S3Storage;

pub enum Storage {
    Local(LocalStorage),
    S3(S3Storage),
}

impl Storage {
    pub async fn write<S, E>(
        &self,
        workspace_id: Uuid,
        id: Uuid,
        body: S,
        max_size: u64,
    ) -> Result<u64, AppError>
    where
        S: Stream<Item = Result<Bytes, E>> + Unpin,
        E: std::fmt::Display,
    {
        match self {
            Self::Local(storage) => storage.write(workspace_id, id, body, max_size).await,
            Self::S3(storage) => storage.write(workspace_id, id, body, max_size).await,
        }
    }

    pub async fn read(&self, workspace_id: Uuid, id: Uuid) -> Result<Body, AppError> {
        match self {
            Self::Local(storage) => storage.read(workspace_id, id).await,
            Self::S3(storage) => storage.read(workspace_id, id).await,
        }
    }

    // files are removed after the database commit, so a failure is logged instead of failing the request
    pub async fn delete(&self, workspace_id: Uuid, ids: &[Uuid]) {
        if ids.is_empty() {
            return;
        }
        let result = match self {
            Self::Local(storage) => storage.delete_many(workspace_id, ids).await,
            Self::S3(storage) => storage.delete_many(workspace_id, ids).await,
        };
        if let Err(error) = result {
            tracing::warn!(%error, %workspace_id, count = ids.len(), "couldn't delete attachment files");
        }
    }

    pub async fn delete_workspace(&self, workspace_id: Uuid) {
        let result = match self {
            Self::Local(storage) => storage.delete_workspace(workspace_id).await,
            Self::S3(storage) => storage.delete_workspace(workspace_id).await,
        };
        if let Err(error) = result {
            tracing::warn!(%error, %workspace_id, "couldn't delete workspace files");
        }
    }

    pub async fn check(&self) {
        if let Self::S3(storage) = self {
            match storage.check().await {
                Ok(()) => tracing::info!("s3 bucket is reachable"),
                Err(error) => {
                    tracing::error!(%error, "s3 bucket check failed, uploads and downloads will fail")
                }
            }
        }
    }
}
