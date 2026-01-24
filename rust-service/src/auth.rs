use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, warn};
use uuid::Uuid;

use crate::api::AppState;

/// Supabase JWT claims
#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub sub: String, // user ID
    pub email: Option<String>,
    pub role: Option<String>,
    pub aud: String,
    pub exp: usize,
    pub iat: usize,
}

/// Authenticated user extracted from JWT
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: Option<String>,
    pub role: Option<String>,
}

/// Extract authenticated user from Authorization header
///
/// Usage in handlers:
/// ```
/// async fn protected_route(auth_user: AuthUser) -> String {
///     format!("Hello user {}!", auth_user.id)
/// }
/// ```
#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| {
                warn!("❌ Missing Authorization header");
                AuthError::MissingToken
            })?;

        // Check Bearer format
        if !auth_header.starts_with("Bearer ") {
            warn!("❌ Invalid Authorization header format");
            return Err(AuthError::InvalidToken);
        }

        let token = auth_header.trim_start_matches("Bearer ");

        // Get Supabase JWT secret from env
        let jwt_secret = std::env::var("SUPABASE_JWT_SECRET").map_err(|_| {
            error!("❌ SUPABASE_JWT_SECRET not configured");
            AuthError::ConfigError
        })?;

        // Decode and validate JWT
        let mut validation = Validation::new(Algorithm::HS256);
        validation.set_audience(&["authenticated"]);
        
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret.as_bytes()),
            &validation,
        )
        .map_err(|e| {
            warn!("❌ JWT validation failed: {}", e);
            AuthError::InvalidToken
        })?;

        let claims = token_data.claims;

        // Parse user ID
        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| {
            error!("❌ Invalid user ID format: {}", claims.sub);
            AuthError::InvalidToken
        })?;

        Ok(AuthUser {
            id: user_id,
            email: claims.email,
            role: claims.role,
        })
    }
}

/// Auth error types
#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidToken,
    ConfigError,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid or expired token"),
            AuthError::ConfigError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Authentication configuration error",
            ),
        };

        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

/// Optional auth - doesn't fail if no token provided
#[derive(Debug, Clone)]
pub struct OptionalAuthUser(pub Option<AuthUser>);

#[async_trait]
impl<S> FromRequestParts<S> for OptionalAuthUser
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match AuthUser::from_request_parts(parts, state).await {
            Ok(user) => Ok(OptionalAuthUser(Some(user))),
            Err(_) => Ok(OptionalAuthUser(None)),
        }
    }
}
