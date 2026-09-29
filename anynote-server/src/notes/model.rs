use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::http::b64;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: Uuid,
    #[serde(with = "b64")]
    pub encrypted_data: Vec<u8>,
    pub version: i32,
    pub trashed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNote {
    pub id: Uuid,
    #[serde(with = "b64")]
    pub encrypted_data: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNote {
    pub base_version: i32,
    #[serde(default, with = "b64::optional")]
    pub encrypted_data: Option<Vec<u8>>,
    pub trashed: Option<bool>,
}
