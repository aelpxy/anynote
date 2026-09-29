use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Copy)]
pub enum Entity {
    Workspace,
    Note,
    Collection,
    Attachment,
}

#[derive(Clone, Copy)]
pub enum Operation {
    Upsert,
    Delete,
}

impl Entity {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Workspace => "workspace",
            Self::Note => "note",
            Self::Collection => "collection",
            Self::Attachment => "attachment",
        }
    }
}

impl Operation {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Upsert => "upsert",
            Self::Delete => "delete",
        }
    }
}

#[derive(Deserialize)]
pub struct ChangesQuery {
    #[serde(default)]
    pub after: i64,
    pub limit: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Change {
    pub id: i64,
    pub entity: String,
    pub entity_id: Uuid,
    pub operation: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangesResponse {
    pub changes: Vec<Change>,
    pub cursor: i64,
    pub has_more: bool,
}

#[derive(Serialize)]
pub struct ChangesCursor {
    pub cursor: i64,
}
