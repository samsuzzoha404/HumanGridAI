use axum::{
    extract::{Json, State},
    http::{HeaderMap, StatusCode},
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};
use uuid::Uuid;

use super::AppState;

/// Circle webhook events
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CircleWebhookPayload {
    pub client_id: String,
    pub notification_type: String,
    pub notification: CircleNotification,
    pub timestamp: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CircleNotification {
    pub id: String,
    pub state: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub amounts: Option<Vec<String>>,
    pub transaction_hash: Option<String>,
    pub source_wallet_id: Option<String>,
    pub destination_wallet_id: Option<String>,
}

/// Webhook response
#[derive(Debug, Serialize)]
pub struct WebhookResponse {
    pub received: bool,
    pub message: String,
}

/// Handle Circle webhooks
///
/// Events:
/// - TRANSFER_PENDING: Payment initiated
/// - TRANSFER_COMPLETE: Payment confirmed on-chain
/// - TRANSFER_FAILED: Payment failed
///
/// CRITICAL:
/// - Must be idempotent (Circle may retry)
/// - Must return 200 quickly (< 5 seconds)
/// - Never throw errors (log and return 200)
/// - Validate webhook signature (TODO)
pub async fn handle_circle_webhook(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<CircleWebhookPayload>,
) -> Result<Json<WebhookResponse>, StatusCode> {
    info!(
        "🔔 Circle webhook received: type={}, id={}",
        payload.notification_type, payload.notification.id
    );

    // TODO: Validate webhook signature
    // let signature = headers.get("circle-signature").ok_or(StatusCode::UNAUTHORIZED)?;
    // if !verify_circle_signature(signature, &payload) {
    //     error!("❌ Invalid webhook signature");
    //     return Err(StatusCode::UNAUTHORIZED);
    // }

    match payload.notification_type.as_str() {
        "transfer.completed" => handle_transfer_completed(state, payload).await,
        "transfer.pending" => handle_transfer_pending(state, payload).await,
        "transfer.failed" => handle_transfer_failed(state, payload).await,
        _ => {
            warn!("⚠️ Unknown webhook type: {}", payload.notification_type);
            Ok(Json(WebhookResponse {
                received: true,
                message: format!("Unknown event type: {}", payload.notification_type),
            }))
        }
    }
}

async fn handle_transfer_completed(
    state: Arc<AppState>,
    payload: CircleWebhookPayload,
) -> Result<Json<WebhookResponse>, StatusCode> {
    let transfer_id = &payload.notification.id;
    let tx_hash = payload.notification.transaction_hash.clone();

    info!("✅ Transfer completed: id={}, hash={:?}", transfer_id, tx_hash);

    // Update transaction status
    let result = sqlx::query!(
        r#"
        UPDATE wallet_transactions
        SET status = 'confirmed',
            transaction_hash = $1,
            confirmed_at = NOW(),
            updated_at = NOW()
        WHERE transfer_id = $2
        RETURNING id, user_id, task_id
        "#,
        tx_hash,
        transfer_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to update transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match result {
        Some(tx) => {
            info!(
                "✅ Transaction confirmed: tx_id={}, user_id={}, task_id={:?}",
                tx.id, tx.user_id, tx.task_id
            );

            // Update task status if applicable
            if let Some(task_id) = tx.task_id {
                sqlx::query!(
                    r#"
                    UPDATE tasks
                    SET status = 'paid',
                        updated_at = NOW()
                    WHERE id = $1
                    "#,
                    task_id
                )
                .execute(&state.db)
                .await
                .map_err(|e| {
                    error!("❌ Failed to update task status: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            }

            // TODO: Mint reputation token
            // TODO: Send notification to worker
            // TODO: Trigger any post-payment hooks

            Ok(Json(WebhookResponse {
                received: true,
                message: "Transfer completed successfully".to_string(),
            }))
        }
        None => {
            warn!("⚠️ Transfer not found in database: {}", transfer_id);
            Ok(Json(WebhookResponse {
                received: true,
                message: "Transfer not found".to_string(),
            }))
        }
    }
}

async fn handle_transfer_pending(
    state: Arc<AppState>,
    payload: CircleWebhookPayload,
) -> Result<Json<WebhookResponse>, StatusCode> {
    let transfer_id = &payload.notification.id;

    info!("⏳ Transfer pending: id={}", transfer_id);

    // Update status if it exists
    sqlx::query!(
        r#"
        UPDATE wallet_transactions
        SET status = 'pending',
            updated_at = NOW()
        WHERE transfer_id = $1
        "#,
        transfer_id
    )
    .execute(&state.db)
    .await
    .ok(); // Ignore errors - record may not exist yet

    Ok(Json(WebhookResponse {
        received: true,
        message: "Transfer pending acknowledged".to_string(),
    }))
}

async fn handle_transfer_failed(
    state: Arc<AppState>,
    payload: CircleWebhookPayload,
) -> Result<Json<WebhookResponse>, StatusCode> {
    let transfer_id = &payload.notification.id;

    error!("❌ Transfer failed: id={}", transfer_id);

    // Update transaction status
    let result = sqlx::query!(
        r#"
        UPDATE wallet_transactions
        SET status = 'failed',
            updated_at = NOW()
        WHERE transfer_id = $1
        RETURNING id, user_id, task_id
        "#,
        transfer_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to update transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if let Some(tx) = result {
        error!(
            "❌ Transaction failed: tx_id={}, user_id={}, task_id={:?}",
            tx.id, tx.user_id, tx.task_id
        );

        // TODO: Alert admin
        // TODO: Notify worker
        // TODO: Refund to treasury if applicable
    }

    Ok(Json(WebhookResponse {
        received: true,
        message: "Transfer failure recorded".to_string(),
    }))
}

// TODO: Implement webhook signature verification
// fn verify_circle_signature(signature: &str, payload: &CircleWebhookPayload) -> bool {
//     // Use Circle webhook secret from env
//     let secret = std::env::var("CIRCLE_WEBHOOK_SECRET").unwrap();
//     // Implement HMAC SHA256 verification
//     true
// }
