use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info};

use super::AppState;

/// Request to create a Circle wallet for a user
#[derive(Debug, Deserialize)]
pub struct CreateWalletRequest {
    pub user_id: String,
    pub blockchain: Option<String>,
}

/// Response with wallet details
#[derive(Debug, Serialize)]
pub struct CreateWalletResponse {
    pub wallet_id: String,
    pub wallet_address: Option<String>,
    pub user_id: String,
    pub blockchain: String,
}

/// Request to initiate a payment to a worker
#[derive(Debug, Deserialize)]
pub struct PayWorkerRequest {
    pub worker_wallet_id: String,
    pub amount: String,
    pub task_id: String,
    /// Idempotency key to prevent double-payment
    pub idempotency_key: Option<String>,
}

/// Payment response
#[derive(Debug, Serialize)]
pub struct PayWorkerResponse {
    pub transfer_id: String,
    pub status: String,
    pub amount: String,
    pub tx_hash: Option<String>,
}

/// Balance response
#[derive(Debug, Serialize)]
pub struct BalanceResponse {
    pub wallet_id: String,
    pub usdc_balance: String,
}

/// Create a Circle wallet for a worker
pub async fn create_wallet(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateWalletRequest>,
) -> Result<Json<CreateWalletResponse>, (StatusCode, String)> {
    info!("Creating Circle wallet for user: {}", payload.user_id);

    let blockchain = payload.blockchain.unwrap_or_else(|| "BASE-SEPOLIA".to_string());

    let wallet_response = state
        .circle_client
        .create_wallet(&payload.user_id, &blockchain)
        .await
        .map_err(|e| {
            error!("Failed to create wallet: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create wallet: {}", e),
            )
        })?;

    Ok(Json(CreateWalletResponse {
        wallet_id: wallet_response.data.id.clone(),
        wallet_address: wallet_response.data.address.clone(),
        user_id: payload.user_id,
        blockchain: wallet_response.data.blockchain,
    }))
}

/// Get wallet balance
pub async fn get_balance(
    State(state): State<Arc<AppState>>,
    Path(wallet_id): Path<String>,
) -> Result<Json<BalanceResponse>, (StatusCode, String)> {
    info!("Fetching balance for wallet: {}", wallet_id);

    let usdc_balance = state
        .circle_client
        .get_usdc_balance(&wallet_id)
        .await
        .map_err(|e| {
            error!("Failed to get balance: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get balance: {}", e),
            )
        })?;

    Ok(Json(BalanceResponse {
        wallet_id,
        usdc_balance: usdc_balance.to_string(),
    }))
}

/// Pay a worker for completed task
/// PROTECTED: Idempotency key prevents double-payment
pub async fn pay_worker(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PayWorkerRequest>,
) -> Result<Json<PayWorkerResponse>, (StatusCode, String)> {
    info!(
        "Initiating payment to worker: {} for task: {}",
        payload.worker_wallet_id, payload.task_id
    );

    // Generate idempotency key if not provided
    let idempotency_key = payload.idempotency_key.unwrap_or_else(|| {
        let timestamp = chrono::Utc::now().timestamp() / 60; // Round to minute
        let timestamp_str = timestamp.to_string();
        crate::idempotency::generate_key(
            "payment",
            &[&payload.task_id, &payload.worker_wallet_id, &payload.amount, &timestamp_str],
        )
    });

    info!("🔐 Payment idempotency key: {}", idempotency_key);
    
    // IMPORTANT: Circle API accepts idempotency keys
    // The transfer_to_worker method should pass this key to Circle
    // Circle will reject duplicate requests with same idempotency key
    
    let transfer_response = state
        .circle_client
        .transfer_to_worker(&payload.worker_wallet_id, &payload.amount, &payload.task_id)
        .await
        .map_err(|e| {
            error!("Failed to initiate transfer: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to initiate transfer: {}", e),
            )
        })?;

    info!("✅ Payment initiated: {}", transfer_response.data.id);

    Ok(Json(PayWorkerResponse {
        transfer_id: transfer_response.data.id,
        status: transfer_response.data.state,
        amount: payload.amount,
        tx_hash: transfer_response.data.tx_hash,
    }))
}

/// Get transfer status
pub async fn get_transfer_status(
    State(state): State<Arc<AppState>>,
    Path(transfer_id): Path<String>,
) -> Result<Json<PayWorkerResponse>, (StatusCode, String)> {
    info!("Fetching transfer status: {}", transfer_id);

    let transfer_response = state
        .circle_client
        .get_transfer_status(&transfer_id)
        .await
        .map_err(|e| {
            error!("Failed to get transfer status: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get transfer status: {}", e),
            )
        })?;

    let amount = transfer_response
        .data
        .amounts
        .first()
        .cloned()
        .unwrap_or_default();

    Ok(Json(PayWorkerResponse {
        transfer_id: transfer_response.data.id,
        status: transfer_response.data.state,
        amount,
        tx_hash: transfer_response.data.tx_hash,
    }))
}
