use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};
use uuid::Uuid;

use super::AppState;
use crate::auth::AuthUser;

/// Payment submission request
#[derive(Debug, Deserialize)]
pub struct SubmitPaymentRequest {
    pub task_id: String,
    pub worker_user_id: String,
    pub amount_usdc: String,
    /// Optional idempotency key - if not provided, one will be generated
    pub idempotency_key: Option<String>,
}

/// Payment submission response
#[derive(Debug, Serialize)]
pub struct SubmitPaymentResponse {
    pub transaction_id: String,
    pub status: String,
    pub amount_usdc: String,
    pub idempotency_key: String,
    pub message: String,
}

/// Submit payment to worker
///
/// Flow:
/// 1. Validate task completion
/// 2. Lookup worker wallet_id
/// 3. Create Circle transfer (Treasury DCW → Worker UCW)
/// 4. Store transaction record
/// 5. Return immediately (webhook handles confirmation)
///
/// CRITICAL:
/// - Uses idempotency keys to prevent double-payment
/// - NEVER waits for blockchain confirmation
/// - Webhook updates status later
pub async fn submit_payment(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<SubmitPaymentRequest>,
) -> Result<Json<SubmitPaymentResponse>, StatusCode> {
    info!(
        "💰 Payment submission: task={}, worker={}, amount={}",
        payload.task_id, payload.worker_user_id, payload.amount_usdc
    );

    // Generate or use provided idempotency key
    let idempotency_key = payload
        .idempotency_key
        .unwrap_or_else(|| format!("payment-{}-{}", payload.task_id, Uuid::new_v4()));

    // Check if payment already processed (idempotency)
    let existing_tx = sqlx::query!(
        r#"
        SELECT id, status
        FROM wallet_transactions
        WHERE transfer_id = $1
        "#,
        idempotency_key
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Database error checking idempotency: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if let Some(tx) = existing_tx {
        warn!(
            "⚠️ Payment already processed with key: {} (status: {:?})",
            idempotency_key, tx.status
        );
        return Ok(Json(SubmitPaymentResponse {
            transaction_id: tx.id.to_string(),
            status: tx.status.unwrap_or_else(|| "unknown".to_string()),
            amount_usdc: payload.amount_usdc,
            idempotency_key: idempotency_key.clone(),
            message: "Payment already processed".to_string(),
        }));
    }

    // Validate task exists and is in valid state
    let task_id: i64 = payload.task_id.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    let task = sqlx::query!(
        r#"
        SELECT id, status, amount_usdc
        FROM tasks
        WHERE id = $1
        "#,
        task_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to fetch task: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or_else(|| {
        error!("❌ Task not found: {}", payload.task_id);
        StatusCode::NOT_FOUND
    })?;

    if task.status.as_deref() != Some("completed") {
        error!("❌ Task {} not in completed state: {:?}", payload.task_id, task.status);
        return Err(StatusCode::BAD_REQUEST);
    }

    // Get worker wallet
    let worker = sqlx::query!(
        r#"
        SELECT wallet_id, wallet_address
        FROM worker_wallets
        WHERE user_id = $1
        "#,
        Uuid::parse_str(&payload.worker_user_id).map_err(|_| StatusCode::BAD_REQUEST)?
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to fetch worker: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or_else(|| {
        error!("❌ Worker not found: {}", payload.worker_user_id);
        StatusCode::NOT_FOUND
    })?;

    let worker_wallet_id = worker.wallet_id.ok_or_else(|| {
        error!("❌ Worker has no wallet registered");
        StatusCode::BAD_REQUEST
    })?;

    // Get treasury wallet ID from env
    let treasury_wallet_id = std::env::var("TREASURY_WALLET_ID").map_err(|_| {
        error!("❌ TREASURY_WALLET_ID not configured");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Create Circle transfer
    // TODO: Actual Circle API call goes here
    // For now, we'll create the transaction record
    
    let transaction_id = Uuid::new_v4();
    
    // Store transaction record (pending state)
    use sqlx::types::BigDecimal;
    use std::str::FromStr;
    
    let amount = BigDecimal::from_str(&payload.amount_usdc).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    sqlx::query!(
        r#"
        INSERT INTO wallet_transactions (
            id, user_id, wallet_id, transaction_type, amount_usdc,
            transfer_id, status, task_id, from_wallet, to_wallet,
            description, initiated_at
        ) VALUES (
            $1, $2, $3, 'payment_received', $4,
            $5, 'pending', $6, $7, $8,
            $9, NOW()
        )
        "#,
        transaction_id,
        Uuid::parse_str(&payload.worker_user_id).unwrap(),
        worker_wallet_id,
        amount,
        idempotency_key.clone(),
        task_id,
        treasury_wallet_id,
        worker.wallet_address,
        format!("Payment for task {}", payload.task_id)
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to create transaction record: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        "✅ Payment submitted: tx_id={}, idempotency_key={}",
        transaction_id, idempotency_key
    );

    // TODO: Make actual Circle API call here
    // let circle_response = state.circle_client.create_transfer(
    //     source_wallet_id: treasury_wallet_id,
    //     destination_wallet_id: worker_wallet_id,
    //     amount: payload.amount_usdc,
    //     idempotency_key: idempotency_key,
    // ).await?;

    Ok(Json(SubmitPaymentResponse {
        transaction_id: transaction_id.to_string(),
        status: "pending".to_string(),
        amount_usdc: payload.amount_usdc,
        idempotency_key,
        message: "Payment submitted successfully. Confirmation pending.".to_string(),
    }))
}

/// Get payment status
#[derive(Debug, Serialize)]
pub struct PaymentStatusResponse {
    pub transaction_id: String,
    pub status: String,
    pub amount_usdc: String,
    pub transaction_hash: Option<String>,
    pub initiated_at: String,
    pub confirmed_at: Option<String>,
}

pub async fn get_payment_status(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    transaction_id: String,
) -> Result<Json<PaymentStatusResponse>, StatusCode> {
    let tx = sqlx::query!(
        r#"
        SELECT id, status, amount_usdc, transaction_hash, initiated_at, confirmed_at
        FROM wallet_transactions
        WHERE id = $1 AND user_id = $2
        "#,
        Uuid::parse_str(&transaction_id).map_err(|_| StatusCode::BAD_REQUEST)?,
        auth_user.id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to fetch transaction: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(PaymentStatusResponse {
        transaction_id: tx.id.to_string(),
        status: tx.status.unwrap_or_else(|| "unknown".to_string()),
        amount_usdc: tx.amount_usdc.to_string(),
        transaction_hash: tx.transaction_hash,
        initiated_at: tx.initiated_at.map(|dt| dt.to_string()).unwrap_or_else(|| "unknown".to_string()),
        confirmed_at: tx.confirmed_at.map(|dt| dt.to_string()),
    }))
}
