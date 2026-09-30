use std::{io::ErrorKind, path::PathBuf};

use axum::body::Bytes;
use futures_util::{Stream, StreamExt};
use tokio::{
    fs,
    io::{AsyncWriteExt, BufWriter},
};
use uuid::Uuid;

use crate::error::AppError;

const WRITE_BUFFER_SIZE: usize = 256 * 1024;

pub struct LocalStorage {
    root: PathBuf,
}

impl LocalStorage {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    fn workspace_dir(&self, workspace_id: Uuid) -> PathBuf {
        self.root.join(workspace_id.to_string())
    }

    fn path(&self, workspace_id: Uuid, id: Uuid) -> PathBuf {
        let id = id.to_string();
        self.workspace_dir(workspace_id).join(&id[..2]).join(id)
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
        let temp_dir = self.root.join(".tmp");
        fs::create_dir_all(&temp_dir).await?;
        let temp_path = temp_dir.join(Uuid::new_v4().to_string());

        let written = async {
            let mut file =
                BufWriter::with_capacity(WRITE_BUFFER_SIZE, fs::File::create(&temp_path).await?);
            let mut size = 0u64;
            while let Some(chunk) = body.next().await {
                let chunk = chunk.map_err(|error| AppError::bad_request(error.to_string()))?;
                size += chunk.len() as u64;
                if size > max_size {
                    return Err(AppError::PayloadTooLarge);
                }
                file.write_all(&chunk).await?;
            }
            file.flush().await?;
            file.get_ref().sync_all().await?;
            Ok(size)
        }
        .await;

        let result = match written {
            Ok(0) => Err(AppError::bad_request("file is empty")),
            Ok(size) => {
                let path = self.path(workspace_id, id);
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent).await?;
                }
                fs::rename(&temp_path, &path).await?;
                return Ok(size);
            }
            Err(error) => Err(error),
        };

        fs::remove_file(&temp_path).await.ok();
        result
    }

    pub async fn open(&self, workspace_id: Uuid, id: Uuid) -> Result<fs::File, AppError> {
        fs::File::open(self.path(workspace_id, id))
            .await
            .map_err(|error| match error.kind() {
                ErrorKind::NotFound => AppError::NotFound,
                _ => error.into(),
            })
    }

    pub async fn delete(&self, workspace_id: Uuid, id: Uuid) -> Result<(), AppError> {
        match fs::remove_file(self.path(workspace_id, id)).await {
            Err(error) if error.kind() != ErrorKind::NotFound => Err(error.into()),
            _ => Ok(()),
        }
    }

    pub async fn delete_workspace(&self, workspace_id: Uuid) -> Result<(), AppError> {
        match fs::remove_dir_all(self.workspace_dir(workspace_id)).await {
            Err(error) if error.kind() != ErrorKind::NotFound => Err(error.into()),
            _ => Ok(()),
        }
    }
}
