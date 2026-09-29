use sqlx::PgExecutor;
use uuid::Uuid;

pub async fn exists(db: impl PgExecutor<'_>, attachment_id: Uuid) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar!(
        r#"select exists(select 1 from attachments where id = $1) as "exists!""#,
        attachment_id,
    )
    .fetch_one(db)
    .await
}

pub async fn insert(
    db: impl PgExecutor<'_>,
    attachment_id: Uuid,
    workspace_id: Uuid,
    size: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "insert into attachments (id, workspace_id, size) values ($1, $2, $3)",
        attachment_id,
        workspace_id,
        size,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn size(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    attachment_id: Uuid,
) -> Result<Option<i64>, sqlx::Error> {
    sqlx::query_scalar!(
        "select size from attachments where workspace_id = $1 and id = $2",
        workspace_id,
        attachment_id,
    )
    .fetch_optional(db)
    .await
}

pub async fn delete(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    attachment_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let deleted = sqlx::query!(
        "delete from attachments where workspace_id = $1 and id = $2",
        workspace_id,
        attachment_id,
    )
    .execute(db)
    .await?;
    Ok(deleted.rows_affected() > 0)
}

pub async fn delete_unreferenced(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    keep: &[Uuid],
) -> Result<Vec<Uuid>, sqlx::Error> {
    // a grace period keeps uploads that aren't saved into a note yet
    sqlx::query_scalar!(
        "delete from attachments
         where workspace_id = $1 and id <> all($2) and created_at < now() - interval '1 day'
         returning id",
        workspace_id,
        keep,
    )
    .fetch_all(db)
    .await
}
