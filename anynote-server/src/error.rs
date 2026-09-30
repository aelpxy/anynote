use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),
    #[error("invalid credentials")]
    Unauthorized,
    #[error("you don't have permission to do that")]
    Forbidden,
    #[error("{0}")]
    Conflict(String),
    #[error("not found")]
    NotFound,
    #[error("too many attempts, try again later")]
    RateLimited,
    #[error("file is too large")]
    PayloadTooLarge,
    #[error("the page couldn't be fetched")]
    UpstreamFailed,
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error("{0}")]
    Internal(String),
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Internal(error.to_string())
    }
}

impl From<object_store::Error> for AppError {
    fn from(error: object_store::Error) -> Self {
        match error {
            object_store::Error::NotFound { .. } => Self::NotFound,
            error => Self::Internal(error.to_string()),
        }
    }
}

impl AppError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }

    pub fn conflict_on_unique(message: &'static str) -> impl FnOnce(sqlx::Error) -> Self {
        move |error| {
            if is_unique_violation(&error) {
                Self::Conflict(message.into())
            } else {
                error.into()
            }
        }
    }
}

pub fn is_unique_violation(error: &sqlx::Error) -> bool {
    matches!(error, sqlx::Error::Database(db_error) if db_error.is_unique_violation())
}

pub fn is_foreign_key_violation(error: &sqlx::Error) -> bool {
    matches!(error, sqlx::Error::Database(db_error) if db_error.is_foreign_key_violation())
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code) = match &self {
            Self::BadRequest(_) => (StatusCode::BAD_REQUEST, "bad_request"),
            Self::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized"),
            Self::Forbidden => (StatusCode::FORBIDDEN, "forbidden"),
            Self::Conflict(_) => (StatusCode::CONFLICT, "conflict"),
            Self::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            Self::RateLimited => (StatusCode::TOO_MANY_REQUESTS, "rate_limited"),
            Self::PayloadTooLarge => (StatusCode::PAYLOAD_TOO_LARGE, "payload_too_large"),
            Self::UpstreamFailed => (StatusCode::BAD_GATEWAY, "upstream_failed"),
            Self::Database(_) | Self::Internal(_) => {
                tracing::error!(error = %self, "request failed");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal")
            }
        };
        let message = match status {
            StatusCode::INTERNAL_SERVER_ERROR => "something went wrong".to_string(),
            _ => self.to_string(),
        };

        (
            status,
            Json(json!({ "error": { "code": code, "message": message } })),
        )
            .into_response()
    }
}
