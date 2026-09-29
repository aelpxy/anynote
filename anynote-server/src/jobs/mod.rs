use std::time::Duration;

use sqlx::PgPool;

use crate::{
    changes::{self, Entity, Operation},
    error::AppError,
};

async fn empty_old_trash(db: &PgPool) -> Result<u64, AppError> {
    let mut tx = db.begin().await?;
    let removed = sqlx::query!(
        "delete from notes where trashed_at < now() - interval '30 days'
         returning id, workspace_id"
    )
    .fetch_all(&mut *tx)
    .await?;
    for note in &removed {
        changes::record(
            &mut tx,
            note.workspace_id,
            Entity::Note,
            note.id,
            Operation::Delete,
        )
        .await?;
    }
    tx.commit().await?;
    Ok(removed.len() as u64)
}

async fn clear_expired_sessions(db: &PgPool) -> Result<u64, AppError> {
    let sessions = sqlx::query!("delete from sessions where expires_at < now()")
        .execute(db)
        .await?;
    let attempts = sqlx::query!("delete from login_attempts where expires_at < now()")
        .execute(db)
        .await?;
    Ok(sessions.rows_affected() + attempts.rows_affected())
}

async fn run_once(db: &PgPool) {
    match empty_old_trash(db).await {
        Ok(0) => {}
        Ok(count) => tracing::info!(count, "emptied old trash"),
        Err(error) => tracing::error!(%error, "emptying old trash failed"),
    }
    match clear_expired_sessions(db).await {
        Ok(0) => {}
        Ok(count) => tracing::info!(count, "cleared expired sessions and login attempts"),
        Err(error) => tracing::error!(%error, "clearing expired sessions failed"),
    }
}

pub fn spawn(db: PgPool) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60 * 60));
        loop {
            interval.tick().await;
            run_once(&db).await;
        }
    });
}
