use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use ethers::types::{Signature, Address, H160};
use ethers::utils::hash_message;
use chrono::Utc;

use crate::api::AppState;
use crate::error::AppError;

/// Maximum age of a signature in seconds (5 minutes)
const MAX_SIGNATURE_AGE_SECS: i64 = 300;

#[derive(Debug, Deserialize)]
pub struct WalletAuthRequest {
    pub wallet_address: String,
    pub signature: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WalletAuthResponse {
    pub success: bool,
    pub user_id: String,
    pub wallet_address: String,
    pub circle_wallet_id: Option<String>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserWalletRequest {
    pub user_id: String,
    pub wallet_address: String,
}

/// Authenticate user with wallet signature
/// SECURITY: Implements ECDSA signature verification + replay protection
pub async fn authenticate_wallet(
    State(_state): State<Arc<AppState>>,
    Json(request): Json<WalletAuthRequest>,
) -> Result<Json<WalletAuthResponse>, AppError> {
    tracing::info!("🔐 Authenticating wallet: {}", request.wallet_address);

    // CRITICAL: Require signature and message
    let signature_str = request.signature
        .ok_or_else(|| AppError::Unauthorized("Missing signature".to_string()))?;
    let message = request.message
        .ok_or_else(|| AppError::Unauthorized("Missing message".to_string()))?;

    // Validate wallet address format
    let claimed_address: Address = request.wallet_address.parse()
        .map_err(|_| AppError::Unauthorized("Invalid wallet address format".to_string()))?;

    // Parse signature
    let signature: Signature = signature_str.parse()
        .map_err(|e| AppError::Unauthorized(format!("Invalid signature format: {}", e)))?;

    // Verify signature matches claimed address
    let msg_hash = hash_message(message.as_bytes());
    let recovered_address = signature.recover(msg_hash)
        .map_err(|e| AppError::Unauthorized(format!("Signature recovery failed: {}", e)))?;

    if recovered_address != claimed_address {
        tracing::error!(
            "❌ Signature verification failed: claimed={}, recovered={}",
            claimed_address, recovered_address
        );
        return Err(AppError::Unauthorized(
            "Signature does not match wallet address".to_string()
        ));
    }

    // Verify timestamp to prevent replay attacks
    let timestamp = extract_timestamp_from_message(&message)?;
    let now = Utc::now().timestamp();
    let age = (now - timestamp).abs();

    if age > MAX_SIGNATURE_AGE_SECS {
        tracing::warn!(
            "⏰ Signature expired: age={}s, max={}s",
            age, MAX_SIGNATURE_AGE_SECS
        );
        return Err(AppError::Unauthorized(
            format!("Signature expired (age: {}s)", age)
        ));
    }

    // Success - signature verified
    let user_id = format!("wallet_{}", &request.wallet_address[2..12]);
    
    tracing::info!(
        "✅ Wallet authenticated: address={}, user_id={}",
        request.wallet_address, user_id
    );

    Ok(Json(WalletAuthResponse {
        success: true,
        user_id,
        wallet_address: request.wallet_address,
        circle_wallet_id: None,
        message: "Wallet authenticated successfully".to_string(),
    }))
}

/// Extract timestamp from signed message
/// Expected format: "Login to HumanGrid\nTimestamp: 1234567890\nNonce: abc123"
fn extract_timestamp_from_message(message: &str) -> Result<i64, AppError> {
    for line in message.lines() {
        if let Some(timestamp_str) = line.strip_prefix("Timestamp: ") {
            return timestamp_str.parse::<i64>()
                .map_err(|_| AppError::Unauthorized(
                    "Invalid timestamp format in message".to_string()
                ));
        }
    }
    Err(AppError::Unauthorized(
        "Message missing timestamp (required for replay protection)".to_string()
    ))
}

/// Link Circle wallet to user
pub async fn link_circle_wallet(
    State(_state): State<Arc<AppState>>,
    Json(request): Json<CreateUserWalletRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!(
        "Linking Circle wallet for user: {} with address: {}",
        request.user_id,
        request.wallet_address
    );

    // TODO: Store in Supabase circle_wallets table
    
    Ok(Json(serde_json::json!({
        "success": true,
        "user_id": request.user_id,
        "wallet_address": request.wallet_address,
        "message": "Circle wallet linked successfully"
    })))
}

/// Get user wallet info
pub async fn get_user_wallet(
    State(_state): State<Arc<AppState>>,
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Getting wallet info for user: {}", user_id);

    // TODO: Fetch from Supabase
    
    Ok(Json(serde_json::json!({
        "user_id": user_id,
        "wallet_address": null,
        "circle_wallet_id": null,
        "message": "User wallet info (mock data)"
    })))
}
