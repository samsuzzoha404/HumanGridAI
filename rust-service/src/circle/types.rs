use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Circle wallet creation request (API v2)
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWalletRequest {
    pub idempotency_key: String,
    pub entity_secret_ciphertext: String,
    pub blockchains: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wallet_set_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Vec<WalletMetadata>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletMetadata {
    pub key: String,
    pub value: String,
}

/// Circle wallet response
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletResponse {
    pub data: WalletData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletData {
    pub id: String,
    pub state: String,
    pub wallet_set_id: String,
    pub custodial_type: String,
    pub address: Option<String>,
    pub blockchain: String,
    pub account_type: String,
    pub create_date: String,
    pub update_date: String,
}

/// Circle balance response
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceResponse {
    pub data: BalanceData,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceData {
    pub token_balances: Vec<TokenBalance>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBalance {
    pub token: TokenInfo,
    pub amount: String,
    pub update_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenInfo {
    pub id: String,
    pub blockchain: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub token_address: Option<String>,
}

/// Circle transfer request
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferRequest {
    pub source: TransferEndpoint,
    pub destination: TransferEndpoint,
    pub amounts: Vec<String>,
    pub token_id: String,
    pub fee_level: Option<String>,
    pub idempotency_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferEndpoint {
    #[serde(rename = "type")]
    pub endpoint_type: String,
    pub id: Option<String>,
    pub address: Option<String>,
}

/// Circle transfer response
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferResponse {
    pub data: TransferData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferData {
    pub id: String,
    pub state: String,
    pub amounts: Vec<String>,
    pub source: TransferEndpointInfo,
    pub destination: TransferEndpointInfo,
    pub transaction_type: String,
    pub blockchain: String,
    pub token_id: String,
    pub create_date: String,
    pub update_date: String,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferEndpointInfo {
    #[serde(rename = "type")]
    pub endpoint_type: String,
    pub id: Option<String>,
    pub address: Option<String>,
}

/// Circle webhook notification
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookNotification {
    pub subscription_id: String,
    pub notification_id: String,
    pub notification_type: String,
    pub notification: serde_json::Value,
    pub timestamp: String,
    pub version: u8,
}

/// Public key response for webhook verification
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicKeyResponse {
    pub data: PublicKeyData,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicKeyData {
    pub id: String,
    pub algorithm: String,
    pub public_key: String,
    pub create_date: String,
}

/// Transaction event from webhook
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionEvent {
    pub id: String,
    pub state: String,
    pub tx_hash: Option<String>,
    pub amounts: Option<Vec<String>>,
}
