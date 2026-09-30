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

    pub async fn delete(&self, workspace_id: Uuid, id: Uuid) -> Result<(), AppError> {
        match self {
            Self::Local(storage) => storage.delete(workspace_id, id).await,
            Self::S3(storage) => storage.delete(workspace_id, id).await,
        }
    }

    pub async fn delete_workspace(&self, workspace_id: Uuid) -> Result<(), AppError> {
        match self {
            Self::Local(storage) => storage.delete_workspace(workspace_id).await,
            Self::S3(storage) => storage.delete_workspace(workspace_id).await,
        }
    }
}
