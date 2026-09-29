use axum::{extract::FromRequestParts, http::request::Parts};
use chrono::{DateTime, Duration, Utc};
use rand::{RngCore, rngs::OsRng};
use serde::Serialize;
use sha2::{Digest, Sha256};
use sqlx::PgExecutor;
use uuid::Uuid;

use crate::{error::AppError, http::b64, sessions::repo as sessions, state::AppState};

const SESSION_TTL_DAYS: i64 = 30;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewSession {
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

const RECENT_LOGIN_MINUTES: i64 = 10;

pub struct AuthUser {
    pub user_id: Uuid,
    pub session_id: Uuid,
    pub session_created_at: DateTime<Utc>,
}

impl AuthUser {
    // sensitive changes need proof the password was just entered, not only a live token
    pub fn require_recent_login(&self) -> Result<(), AppError> {
        if Utc::now() - self.session_created_at <= Duration::minutes(RECENT_LOGIN_MINUTES) {
            Ok(())
        } else {
            Err(AppError::Forbidden)
        }
    }
}

fn hash_token(token: &[u8]) -> Vec<u8> {
    Sha256::digest(token).to_vec()
}

pub async fn create_session(
    db: impl PgExecutor<'_>,
    user_id: Uuid,
) -> Result<NewSession, AppError> {
    let mut token = [0u8; 32];
    OsRng.fill_bytes(&mut token);
    let expires_at = Utc::now() + Duration::days(SESSION_TTL_DAYS);
    sessions::insert(db, user_id, &hash_token(&token), expires_at).await?;

    Ok(NewSession {
        token: b64::encode(token),
        expires_at,
    })
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .and_then(|value| b64::decode(value).ok())
            .ok_or(AppError::Unauthorized)?;

        let session = sessions::touch(&state.db, &hash_token(&token))
            .await?
            .ok_or(AppError::Unauthorized)?;

        Ok(Self {
            user_id: session.user_id,
            session_id: session.id,
            session_created_at: session.created_at,
        })
    }
}
