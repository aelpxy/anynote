use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize};
use uuid::Uuid;

use crate::http::b64;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: Uuid,
    pub parent_id: Option<Uuid>,
    #[serde(with = "b64")]
    pub encrypted_name: Vec<u8>,
    pub position: i32,
    pub note_ids: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCollection {
    pub id: Uuid,
    pub parent_id: Option<Uuid>,
    #[serde(with = "b64")]
    pub encrypted_name: Vec<u8>,
    #[serde(default)]
    pub position: i32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCollection {
    #[serde(default, with = "b64::optional")]
    pub encrypted_name: Option<Vec<u8>>,
    // absent leaves the parent alone, null moves the collection to the top level
    #[serde(default, deserialize_with = "present")]
    pub parent_id: Option<Option<Uuid>>,
    pub position: Option<i32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    pub ids: Vec<Uuid>,
}

pub fn present<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<Option<Option<Uuid>>, D::Error> {
    Option::<Uuid>::deserialize(deserializer).map(Some)
}
