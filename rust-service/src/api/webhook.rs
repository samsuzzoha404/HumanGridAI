use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};

use super::AppState;
use crate::idempotency::generate_key;

/// Request to verify Circle webhook signature
#[derive(Debug, Deserialize)]
pub struct VerifyWebhookRequest {
    pub payload: String,
    pub signature: String,
    pub key_id: String,
    /// Unique webhook notification ID from Circle
    pub notification_id: Option<String>,
}

/// Webhook verification response
#[derive(Debug, Serialize)]
pub struct VerifyWebhookResponse {
    pub valid: bool,
    pub key_id: String,
    pub duplicate: bool,
}

/// Verify Circle webhook signature
/// CRITICAL: This prevents forged webhooks from attackers
pub async fn verify_webhook(
    State(state): State<Arc<AppState>>,
    Json(request): Json<VerifyWebhookRequest>,
) -> Result<Json<VerifyWebhookResponse>, (StatusCode, String)> {
    info!("Verifying webhook signature with key ID: {}", request.key_id);

    // Check for duplicate webhook delivery (replay attack prevention)
    let webhook_id = if let Some(ref notification_id) = request.notification_id {
        notification_id.clone()
    } else {
        // Fallback: generate ID from payload hash
        generate_key("webhook", &[&request.payload])
    };

    let is_duplicate = state.webhook_deduplicator.is_duplicate(&webhook_id);

    if is_duplicate {
        warn!("🚫 Duplicate webhook detected: {} - REJECTING", webhook_id);
        return Ok(Json(VerifyWebhookResponse {
            valid: false,
            key_id: request.key_id,
            duplicate: true,
        }));
    }

    let is_valid = state
        .circle_client
        .verify_webhook_signature(&request.payload, &request.signature, &request.key_id)
        .await
        .map_err(|e| {
            error!("Failed to verify webhook signature: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Signature verification failed: {}", e),
            )
        })?;

    if is_valid {
        info!("✅ Webhook signature verified successfully: {}", webhook_id);
    } else {
        error!("❌ Invalid webhook signature - possible attack attempt");
    }

    Ok(Json(VerifyWebhookResponse {
        valid: is_valid,
        key_id: request.key_id,
        duplicate: false,
    }))
}
