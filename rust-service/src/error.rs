use thiserror::Error;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Task not found: {0}")]
    TaskNotFound(String),

    #[error("Invalid task submission: {0}")]
    InvalidSubmission(String),

    #[error("Verification failed: {0}")]
    VerificationFailed(String),

    #[error("Blockchain error: {0}")]
    BlockchainError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Internal server error: {0}")]
    InternalError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::TaskNotFound(_) => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::InvalidSubmission(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::VerificationFailed(_) => (StatusCode::UNPROCESSABLE_ENTITY, self.to_string()),
            AppError::ValidationError(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::Unauthorized(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::RateLimitExceeded => (StatusCode::TOO_MANY_REQUESTS, self.to_string()),
            AppError::BlockchainError(_) => (StatusCode::BAD_GATEWAY, self.to_string()),
            AppError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string()),
            AppError::ConfigError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error".to_string()),
            AppError::InternalError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string()),
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16(),
        }));

        (status, body).into_response()
    }
}

impl From<ethers::contract::ContractError<ethers::providers::Provider<ethers::providers::Http>>> for AppError {
    fn from(err: ethers::contract::ContractError<ethers::providers::Provider<ethers::providers::Http>>) -> Self {
        AppError::BlockchainError(err.to_string())
    }
}

impl From<envy::Error> for AppError {
    fn from(err: envy::Error) -> Self {
        AppError::ConfigError(err.to_string())
    }
}

impl From<validator::ValidationErrors> for AppError {
    fn from(err: validator::ValidationErrors) -> Self {
        AppError::ValidationError(err.to_string())
    }
}
