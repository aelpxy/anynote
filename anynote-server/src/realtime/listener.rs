use std::time::Duration;

use sqlx::{PgPool, postgres::PgListener};
use tokio::sync::broadcast;
use uuid::Uuid;

#[derive(Clone, Copy, Debug)]
pub struct WorkspaceChange {
    pub workspace_id: Uuid,
    pub cursor: i64,
}

pub type ChangeSender = broadcast::Sender<WorkspaceChange>;

const CHANNEL: &str = "workspace_changes";

fn parse(payload: &str) -> Option<WorkspaceChange> {
    let (workspace_id, cursor) = payload.split_once(':')?;
    Some(WorkspaceChange {
        workspace_id: workspace_id.parse().ok()?,
        cursor: cursor.parse().ok()?,
    })
}

pub fn spawn(db: PgPool) -> ChangeSender {
    let (sender, _) = broadcast::channel(1024);
    let publisher = sender.clone();

    tokio::spawn(async move {
        loop {
            let mut listener = match PgListener::connect_with(&db).await {
                Ok(listener) => listener,
                Err(error) => {
                    tracing::error!(%error, "realtime listener couldn't connect");
                    tokio::time::sleep(Duration::from_secs(2)).await;
                    continue;
                }
            };
            if let Err(error) = listener.listen(CHANNEL).await {
                tracing::error!(%error, "realtime listener couldn't subscribe");
                tokio::time::sleep(Duration::from_secs(2)).await;
                continue;
            }

            while let Ok(notification) = listener.recv().await {
                if let Some(change) = parse(notification.payload()) {
                    // no open streams is fine
                    let _ = publisher.send(change);
                }
            }
            tracing::warn!("realtime listener disconnected, reconnecting");
        }
    });

    sender
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_payloads() {
        let id = Uuid::new_v4();
        let change = parse(&format!("{id}:42")).unwrap();
        assert_eq!((change.workspace_id, change.cursor), (id, 42));
        assert!(parse("garbage").is_none());
        assert!(parse(&format!("{id}:not-a-number")).is_none());
    }
}
