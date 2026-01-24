use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info};

use super::AppState;
use crate::auth::AuthUser;

/// Request to register worker wallet (from frontend after Circle UCW creation)
#[derive(Debug, Deserialize)]
pub struct RegisterWalletRequest {
    pub wallet_id: String,
    pub wallet_address: String,
}

/// Response after wallet registration
#[derive(Debug, Serialize)]
pub struct RegisterWalletResponse {
    pub success: bool,
    pub user_id: String,
    pub wallet_id: String,
    pub wallet_address: String,
}

/// Register worker wallet
/// 
/// CRITICAL: This endpoint ONLY binds an existing Circle UCW to a user.
/// It NEVER creates wallets (that's done in frontend with Circle SDK).
/// 
/// Flow:
/// 1. Frontend creates UCW with Circle SDK
/// 2. Frontend calls this endpoint with wallet_id + address
/// 3. Backend binds wallet to authenticated user
/// 4. Enforces 1 wallet per user
pub async fn register_wallet(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<RegisterWalletRequest>,
) -> Result<Json<RegisterWalletResponse>, StatusCode> {
    info!(
        "🔗 Wallet registration request: user_id={}, wallet_address={}",
        auth_user.id, payload.wallet_address
    );

    // Validate wallet address format (0x + 40 hex chars)
    if !payload.wallet_address.starts_with("0x") || payload.wallet_address.len() != 42 {
        error!("❌ Invalid wallet address format: {}", payload.wallet_address);
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check if user already has a wallet
    let existing_wallet = sqlx::query!(
        r#"
        SELECT wallet_id, wallet_address
        FROM worker_wallets
        WHERE user_id = $1
        "#,
        auth_user.id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Database error checking existing wallet: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if let Some(wallet) = existing_wallet {
        if wallet.wallet_id.is_some() {
            error!(
                "❌ User {} already has wallet: {}",
                auth_user.id,
                wallet.wallet_id.unwrap()
            );
            return Err(StatusCode::CONFLICT);
        }
    }

    // Check if wallet address is already used
    let address_exists = sqlx::query!(
        r#"
        SELECT id FROM worker_wallets WHERE wallet_address = $1
        "#,
        payload.wallet_address
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Database error checking wallet address: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if address_exists.is_some() {
        error!(
            "❌ Wallet address {} already registered to another user",
            payload.wallet_address
        );
        return Err(StatusCode::CONFLICT);
    }

    // Bind wallet to user
    sqlx::query!(
        r#"
        INSERT INTO worker_wallets (user_id, wallet_id, wallet_address, wallet_blockchain)
        VALUES ($1, $2, $3, 'ETH-ARC-TESTNET')
        ON CONFLICT (user_id) DO UPDATE
        SET wallet_id = $2,
            wallet_address = $3
        "#,
        auth_user.id,
        payload.wallet_id,
        payload.wallet_address
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to update user wallet: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    info!(
        "✅ Wallet registered successfully: user={}, wallet_id={}",
        auth_user.id, payload.wallet_id
    );

    Ok(Json(RegisterWalletResponse {
        success: true,
        user_id: auth_user.id.to_string(),
        wallet_id: payload.wallet_id,
        wallet_address: payload.wallet_address,
    }))
}

/// Get worker wallet info
#[derive(Debug, Serialize)]
pub struct WalletInfoResponse {
    pub wallet_id: Option<String>,
    pub wallet_address: Option<String>,
    pub blockchain: Option<String>,
    pub created_at: Option<String>,
}

pub async fn get_wallet_info(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Result<Json<WalletInfoResponse>, StatusCode> {
    let wallet = sqlx::query!(
        r#"
        SELECT wallet_id, wallet_address, wallet_blockchain, wallet_created_at
        FROM worker_wallets
        WHERE user_id = $1
        "#,
        auth_user.id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        error!("❌ Failed to fetch wallet info: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match wallet {
        Some(w) => Ok(Json(WalletInfoResponse {
            wallet_id: w.wallet_id,
            wallet_address: w.wallet_address,
            blockchain: w.wallet_blockchain,
            created_at: w.wallet_created_at.map(|dt| dt.to_string()),
        })),
        None => Err(StatusCode::NOT_FOUND),
    }
}
