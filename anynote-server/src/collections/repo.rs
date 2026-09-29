use sqlx::{PgConnection, PgExecutor};
use uuid::Uuid;

use crate::collections::model::Collection;

pub async fn subtree_ids(
    db: &mut PgConnection,
    workspace_id: Uuid,
    collection_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    sqlx::query_scalar!(
        r#"with recursive subtree as (
             select id from collections where workspace_id = $1 and id = $2
             union all
             select c.id from collections c join subtree s on c.parent_id = s.id
           )
           select id as "id!" from subtree"#,
        workspace_id,
        collection_id,
    )
    .fetch_all(db)
    .await
}

pub async fn list(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
) -> Result<Vec<Collection>, sqlx::Error> {
    sqlx::query_as!(
        Collection,
        r#"select c.id, c.parent_id, c.encrypted_name, c.position, c.created_at, c.updated_at,
             coalesce(array_agg(cn.note_id order by cn.position, cn.note_id)
               filter (where cn.note_id is not null), '{}') as "note_ids!"
           from collections c
           left join collection_notes cn on cn.collection_id = c.id
           where c.workspace_id = $1
           group by c.id
           order by c.position, c.created_at"#,
        workspace_id,
    )
    .fetch_all(db)
    .await
}

pub async fn insert(
    db: impl PgExecutor<'_>,
    collection_id: Uuid,
    workspace_id: Uuid,
    parent_id: Option<Uuid>,
    encrypted_name: &[u8],
    position: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "insert into collections (id, workspace_id, parent_id, encrypted_name, position)
         values ($1, $2, $3, $4, $5)",
        collection_id,
        workspace_id,
        parent_id,
        encrypted_name,
        position,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub struct CollectionChanges<'a> {
    pub encrypted_name: Option<&'a [u8]>,
    pub parent_id: Option<Option<Uuid>>,
    pub position: Option<i32>,
}

pub async fn update(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    collection_id: Uuid,
    changes: CollectionChanges<'_>,
) -> Result<bool, sqlx::Error> {
    let updated = sqlx::query!(
        "update collections set
           encrypted_name = coalesce($3, encrypted_name),
           parent_id = case when $4 then $5 else parent_id end,
           position = coalesce($6, position)
         where workspace_id = $1 and id = $2",
        workspace_id,
        collection_id,
        changes.encrypted_name,
        changes.parent_id.is_some(),
        changes.parent_id.flatten(),
        changes.position,
    )
    .execute(db)
    .await?;
    Ok(updated.rows_affected() > 0)
}

pub async fn delete(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    collection_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "delete from collections where workspace_id = $1 and id = $2",
        workspace_id,
        collection_id,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn reorder(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    ids: &[Uuid],
) -> Result<Vec<Uuid>, sqlx::Error> {
    sqlx::query_scalar!(
        "update collections c set position = (o.position - 1)::integer
         from unnest($2::uuid[]) with ordinality as o(id, position)
         where c.workspace_id = $1 and c.id = o.id
         returning c.id",
        workspace_id,
        ids,
    )
    .fetch_all(db)
    .await
}

pub async fn add_note(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    collection_id: Uuid,
    note_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "insert into collection_notes (workspace_id, collection_id, note_id, position)
         values ($1, $2, $3,
           (select coalesce(max(position) + 1, 0) from collection_notes where collection_id = $2))
         on conflict (collection_id, note_id) do nothing",
        workspace_id,
        collection_id,
        note_id,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn remove_note(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    collection_id: Uuid,
    note_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "delete from collection_notes where workspace_id = $1 and collection_id = $2 and note_id = $3",
        workspace_id,
        collection_id,
        note_id,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn reorder_notes(
    db: impl PgExecutor<'_>,
    workspace_id: Uuid,
    collection_id: Uuid,
    note_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "update collection_notes cn set position = (o.position - 1)::integer
         from unnest($3::uuid[]) with ordinality as o(note_id, position)
         where cn.workspace_id = $1 and cn.collection_id = $2 and cn.note_id = o.note_id",
        workspace_id,
        collection_id,
        note_ids,
    )
    .execute(db)
    .await?;
    Ok(())
}
