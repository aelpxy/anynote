use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    account::model::Account,
    auth::{key_stretching::KeyStretching, session::NewSession},
    http::b64,
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterStartRequest {
    pub username: String,
    #[serde(with = "b64")]
    pub registration_request: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterStartResponse {
    #[serde(with = "b64")]
    pub registration_response: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterFinishRequest {
    pub username: String,
    #[serde(with = "b64")]
    pub registration_record: Vec<u8>,
    pub key_stretching: KeyStretching,
    #[serde(with = "b64")]
    pub public_key: Vec<u8>,
    #[serde(with = "b64")]
    pub encrypted_private_key: Vec<u8>,
    pub workspace: NewWorkspace,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewWorkspace {
    pub id: Uuid,
    #[serde(with = "b64")]
    pub encrypted_name: Vec<u8>,
    #[serde(with = "b64")]
    pub encrypted_workspace_key: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterFinishResponse {
    pub user_id: Uuid,
    pub workspace_id: Uuid,
    pub session: NewSession,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginStartRequest {
    pub username: String,
    #[serde(with = "b64")]
    pub credential_request: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginStartResponse {
    pub login_id: Uuid,
    #[serde(with = "b64")]
    pub credential_response: Vec<u8>,
    pub key_stretching: KeyStretching,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginFinishRequest {
    pub login_id: Uuid,
    #[serde(with = "b64")]
    pub credential_finalization: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginFinishResponse {
    pub session: NewSession,
    pub account: Account,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasswordStartRequest {
    #[serde(with = "b64")]
    pub registration_request: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasswordFinishRequest {
    #[serde(with = "b64")]
    pub registration_record: Vec<u8>,
    pub key_stretching: KeyStretching,
    #[serde(with = "b64")]
    pub encrypted_private_key: Vec<u8>,
}
