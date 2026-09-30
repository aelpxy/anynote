use sqlx::{PgConnection, PgExecutor};
use uuid::Uuid;

use crate::{
    changes::model::{Change, Entity, Operation},
    error::AppError,
};

pub async fn record(
    db: &mut PgConnection,
    workspace_id: Uuid,
    entity: Entity,
    entity_id: Uuid,
    operation: Operation,
) -> Result<(), AppError> {
    sqlx::query!(
        "insert into changes (workspace_id, entity, entity_id, operation) values ($1, $2, $3, $4)",
        workspace_id,
        entity.as_str(),
        entity_id,
        operation.as_str(),
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn record_many(
    db: &mut PgConnection,
    workspace_id: Uuid,
    entity: Entity,
    entity_ids: &[Uuid],
    operation: Operation,
) -> Result<(), AppError> {
    if entity_ids.is_empty() {
        return Ok(());
    }
    sqlx::query!(
        "insert into changes (workspace_id, entity, entity_id, operation)
         select $1, $2, entity_id, $4 from unnest($3::uuid[]) with ordinality as t(entity_id, n)
         order by n",
        workspace_id,
        entity.as_str(),
        entity_ids,
        operation.as_str(),
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn list_after(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    after: i64,
    limit: i64,
) -> Result<Vec<Change>, sqlx::Error> {
    sqlx::query_as!(
        Change,
        "select id, entity, entity_id, operation, created_at from changes
         where workspace_id = $1 and id > $2
         order by id
         limit $3",
        workspace_id,
        after,
        limit,
    )
    .fetch_all(db)
    .await
}

pub async fn latest_cursor(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar!(
        r#"select coalesce(max(id), 0) as "cursor!" from changes where workspace_id = $1"#,
        workspace_id,
    )
    .fetch_one(db)
    .await
}
