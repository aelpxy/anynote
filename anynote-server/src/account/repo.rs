use sqlx::{PgConnection, PgExecutor};
use uuid::Uuid;

use crate::{
    account::model::{Account, AccountUser, AccountWorkspace},
    error::AppError,
};

pub async fn load_account(db: &mut PgConnection, user_id: Uuid) -> Result<Account, AppError> {
    let user = sqlx::query_as!(
        AccountUser,
        "select id, username, public_key, encrypted_private_key from users where id = $1",
        user_id,
    )
    .fetch_optional(&mut *db)
    .await?
    .ok_or(AppError::NotFound)?;

    let workspaces = sqlx::query_as!(
        AccountWorkspace,
        "select w.id, m.role, w.encrypted_name, m.encrypted_workspace_key
         from workspace_members m
         join workspaces w on w.id = m.workspace_id
         where m.user_id = $1
         order by w.created_at",
        user_id,
    )
    .fetch_all(&mut *db)
    .await?;

    Ok(Account { user, workspaces })
}

pub async fn delete_user(db: impl PgExecutor<'_>, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!("delete from users where id = $1", user_id)
        .execute(db)
        .await?;
    Ok(())
}
