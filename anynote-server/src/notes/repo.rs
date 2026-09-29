use sqlx::PgExecutor;
use uuid::Uuid;

use crate::notes::model::Note;

pub async fn list(db: impl PgExecutor<'_>, workspace_id: Uuid) -> Result<Vec<Note>, sqlx::Error> {
    sqlx::query_as!(
        Note,
        "select id, encrypted_data, version, trashed_at, created_at, updated_at
         from notes where workspace_id = $1 order by created_at",
        workspace_id,
    )
    .fetch_all(db)
    .await
}

pub async fn find(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    note_id: Uuid,
) -> Result<Option<Note>, sqlx::Error> {
    sqlx::query_as!(
        Note,
        "select id, encrypted_data, version, trashed_at, created_at, updated_at
         from notes where workspace_id = $1 and id = $2",
        workspace_id,
        note_id,
    )
    .fetch_optional(db)
    .await
}

pub async fn insert(
    db: impl PgExecutor<'_>,
    note_id: Uuid,
    workspace_id: Uuid,
    encrypted_data: &[u8],
) -> Result<Note, sqlx::Error> {
    sqlx::query_as!(
        Note,
        "insert into notes (id, workspace_id, encrypted_data) values ($1, $2, $3)
         returning id, encrypted_data, version, trashed_at, created_at, updated_at",
        note_id,
        workspace_id,
        encrypted_data,
    )
    .fetch_one(db)
    .await
}

pub async fn update(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    note_id: Uuid,
    base_version: i32,
    encrypted_data: Option<&[u8]>,
    trashed: Option<bool>,
) -> Result<Option<Note>, sqlx::Error> {
    sqlx::query_as!(
        Note,
        "update notes set
           encrypted_data = coalesce($4, encrypted_data),
           trashed_at = case
             when $5::boolean is null then trashed_at
             when $5 then coalesce(trashed_at, now())
             else null
           end,
           version = version + 1
         where workspace_id = $1 and id = $2 and version = $3
         returning id, encrypted_data, version, trashed_at, created_at, updated_at",
        workspace_id,
        note_id,
        base_version,
        encrypted_data,
        trashed,
    )
    .fetch_optional(db)
    .await
}

pub async fn exists(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    note_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar!(
        r#"select exists(select 1 from notes where workspace_id = $1 and id = $2) as "exists!""#,
        workspace_id,
        note_id,
    )
    .fetch_one(db)
    .await
}

pub async fn delete(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    note_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let deleted = sqlx::query!(
        "delete from notes where workspace_id = $1 and id = $2",
        workspace_id,
        note_id,
    )
    .execute(db)
    .await?;
    Ok(deleted.rows_affected() > 0)
}

pub async fn delete_trashed(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    sqlx::query_scalar!(
        "delete from notes where workspace_id = $1 and trashed_at is not null returning id",
        workspace_id,
    )
    .fetch_all(db)
    .await
}

pub struct ExpiredNote {
    pub id: Uuid,
    pub workspace_id: Uuid,
}

pub async fn delete_expired_trash(
    db: impl PgExecutor<'_>,
) -> Result<Vec<ExpiredNote>, sqlx::Error> {
    sqlx::query_as!(
        ExpiredNote,
        "delete from notes where trashed_at < now() - interval '30 days'
         returning id, workspace_id"
    )
    .fetch_all(db)
    .await
}
