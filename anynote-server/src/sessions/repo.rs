use chrono::{DateTime, Utc};
use sqlx::PgExecutor;
use uuid::Uuid;

use crate::sessions::model::SessionSummary;

pub struct SessionRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

pub async fn insert(
    db: impl PgExecutor<'_>,
    user_id: Uuid,
    token_hash: &[u8],
    expires_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "insert into sessions (user_id, token_hash, expires_at) values ($1, $2, $3)",
        user_id,
        token_hash,
        expires_at,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn touch(
    db: impl PgExecutor<'_>,
    token_hash: &[u8],
) -> Result<Option<SessionRecord>, sqlx::Error> {
    sqlx::query_as!(
        SessionRecord,
        "update sessions set last_used_at = now()
             where token_hash = $1 and expires_at > now()
             returning id, user_id, created_at",
        token_hash,
    )
    .fetch_optional(db)
    .await
}

pub async fn list_active(
    db: impl PgExecutor<'_>,
    user_id: Uuid,
    current_session_id: Uuid,
) -> Result<Vec<SessionSummary>, sqlx::Error> {
    sqlx::query_as!(
        SessionSummary,
        r#"select id, created_at, last_used_at, expires_at, id = $2 as "is_current!"
           from sessions
           where user_id = $1 and expires_at > now()
           order by last_used_at desc"#,
        user_id,
        current_session_id,
    )
    .fetch_all(db)
    .await
}

pub async fn delete_for_user(
    db: impl PgExecutor<'_>,
    session_id: Uuid,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let deleted = sqlx::query!(
        "delete from sessions where id = $1 and user_id = $2",
        session_id,
        user_id,
    )
    .execute(db)
    .await?;
    Ok(deleted.rows_affected() > 0)
}

pub async fn delete(db: impl PgExecutor<'_>, session_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!("delete from sessions where id = $1", session_id)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn delete_others(
    db: impl PgExecutor<'_>,
    user_id: Uuid,
    keep_session_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "delete from sessions where user_id = $1 and id <> $2",
        user_id,
        keep_session_id,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn delete_expired(db: impl PgExecutor<'_>) -> Result<u64, sqlx::Error> {
    let deleted = sqlx::query!("delete from sessions where expires_at < now()")
        .execute(db)
        .await?;
    Ok(deleted.rows_affected())
}
