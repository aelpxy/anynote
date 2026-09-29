use sqlx::{PgConnection, PgExecutor};
use uuid::Uuid;

pub async fn member_role(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    user_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar!(
        "select role from workspace_members where workspace_id = $1 and user_id = $2",
        workspace_id,
        user_id,
    )
    .fetch_optional(db)
    .await
}

pub async fn insert_with_owner(
    db: &mut PgConnection,
    workspace_id: Uuid,
    encrypted_name: &[u8],
    owner_id: Uuid,
    encrypted_workspace_key: &[u8],
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "insert into workspaces (id, encrypted_name) values ($1, $2)",
        workspace_id,
        encrypted_name,
    )
    .execute(&mut *db)
    .await?;
    sqlx::query!(
        "insert into workspace_members (workspace_id, user_id, role, encrypted_workspace_key)
         values ($1, $2, 'owner', $3)",
        workspace_id,
        owner_id,
        encrypted_workspace_key,
    )
    .execute(&mut *db)
    .await?;
    Ok(())
}

pub async fn rename(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    encrypted_name: &[u8],
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "update workspaces set encrypted_name = $2 where id = $1",
        workspace_id,
        encrypted_name,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn membership_count(db: impl PgExecutor<'_>, user_id: Uuid) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar!(
        r#"select count(*) as "count!" from workspace_members where user_id = $1"#,
        user_id,
    )
    .fetch_one(db)
    .await
}

pub async fn delete(db: impl PgExecutor<'_>, workspace_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!("delete from workspaces where id = $1", workspace_id)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn delete_owned_by(
    db: impl PgExecutor<'_>,
    user_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    sqlx::query_scalar!(
        "delete from workspaces where id in (
           select workspace_id from workspace_members where user_id = $1 and role = 'owner'
         )
         returning id",
        user_id,
    )
    .fetch_all(db)
    .await
}
