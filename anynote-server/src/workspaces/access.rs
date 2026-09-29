use sqlx::PgPool;
use uuid::Uuid;

use crate::{error::AppError, workspaces::repo};

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Access {
    Read,
    Write,
    Own,
}

// non-members get 404 so they can't tell whether a workspace exists
pub async fn authorize(
    db: &PgPool,
    workspace_id: Uuid,
    user_id: Uuid,
    access: Access,
) -> Result<(), AppError> {
    let role = repo::member_role(db, workspace_id, user_id)
        .await?
        .ok_or(AppError::NotFound)?;

    let allowed = match access {
        Access::Read => true,
        Access::Write => role != "viewer",
        Access::Own => role == "owner",
    };
    if allowed {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}
