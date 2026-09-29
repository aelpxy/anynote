use serde::Serialize;
use uuid::Uuid;

use crate::http::b64;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub user: AccountUser,
    pub workspaces: Vec<AccountWorkspace>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountUser {
    pub id: Uuid,
    pub username: String,
    #[serde(with = "b64")]
    pub public_key: Vec<u8>,
    #[serde(with = "b64")]
    pub encrypted_private_key: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountWorkspace {
    pub id: Uuid,
    pub role: String,
    #[serde(with = "b64")]
    pub encrypted_name: Vec<u8>,
    #[serde(with = "b64")]
    pub encrypted_workspace_key: Vec<u8>,
}
