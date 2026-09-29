use std::time::Duration;

use sqlx::PgPool;

use crate::{
    auth::repo as auth,
    changes::{self, Entity, Operation},
    error::AppError,
    notes::repo as notes,
    sessions::repo as sessions,
};

async fn empty_old_trash(db: &PgPool) -> Result<u64, AppError> {
    let mut tx = db.begin().await?;
    let removed = notes::delete_expired_trash(&mut *tx).await?;
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
    let sessions = sessions::delete_expired(db).await?;
    let attempts = auth::delete_expired_login_attempts(db).await?;
    Ok(sessions + attempts)
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
