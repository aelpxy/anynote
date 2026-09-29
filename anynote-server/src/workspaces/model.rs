use serde::Deserialize;
use uuid::Uuid;

use crate::http::b64;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkspace {
    pub id: Uuid,
    #[serde(with = "b64")]
    pub encrypted_name: Vec<u8>,
    #[serde(with = "b64")]
    pub encrypted_workspace_key: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameWorkspace {
    #[serde(with = "b64")]
    pub encrypted_name: Vec<u8>,
}
