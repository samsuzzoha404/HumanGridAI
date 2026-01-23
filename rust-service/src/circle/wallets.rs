use super::{CircleClient, CreateWalletRequest, WalletMetadata, WalletResponse, BalanceResponse};
use anyhow::{Context, Result};
use tracing::{info, warn};
use uuid::Uuid;

impl CircleClient {
    /// Create a new Circle wallet for a user
    /// CRITICAL: Enforces Smart Contract Account (SCA) creation with ERC-4337
    pub async fn create_wallet(&self, user_id: &str, blockchain: &str) -> Result<WalletResponse> {
        let url = format!("{}/v1/w3s/developer/wallets", self.api_url());
        
        // Generate deterministic idempotency key to prevent duplicate wallets on retry
        // Format: user_wallet_{user_id}_{blockchain}
        let idempotency_key = format!("user_wallet_{}_{}", user_id, blockchain);
        
        let payload = serde_json::json!({
            "idempotencyKey": idempotency_key,
            "entitySecretCiphertext": self.config.circle_entity_secret,
            "accountType": "SCA",  // ← CRITICAL: Enforce Smart Contract Account
            "blockchains": [blockchain],
            "walletSetId": self.config.circle_user_wallet_set_id,  // Use dedicated user wallet set
            "metadata": [
                {
                    "key": "user_id",
                    "value": user_id
                },
                {
                    "key": "wallet_type",
                    "value": "user_worker"
                },
                {
                    "key": "description",
                    "value": format!("HumanGridAI worker wallet for user {}", user_id)
                }
            ]
        });

        let request_json = payload.to_string();
        info!("Creating Circle wallet payload: {}", request_json);

        let response = self
            .http_client()
            .post(&url)
            .body(request_json)
            .send()
            .await
            .context("Failed to send wallet creation request")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            warn!("Circle wallet creation failed: {} - {}", status, error_text);
            anyhow::bail!("Circle API error: {} - {}", status, error_text);
        }

        let wallet_response: WalletResponse = response
            .json()
            .await
            .context("Failed to parse wallet response")?;

        info!(
            "✅ Created wallet {} for user {}",
            wallet_response.data.id, user_id
        );

        Ok(wallet_response)
    }

    /// Get wallet details by wallet ID
    pub async fn get_wallet(&self, wallet_id: &str) -> Result<WalletResponse> {
        let url = format!("{}/v1/w3s/wallets/{}", self.api_url(), wallet_id);

        let response = self
            .http_client()
            .get(&url)
            .send()
            .await
            .context("Failed to get wallet details")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Circle API error: {} - {}", status, error_text);
        }

        response
            .json()
            .await
            .context("Failed to parse wallet response")
    }

    /// Get wallet balance (USDC)
    pub async fn get_wallet_balance(&self, wallet_id: &str) -> Result<BalanceResponse> {
        let url = format!("{}/v1/w3s/wallets/{}/balances", self.api_url(), wallet_id);

        let response = self
            .http_client()
            .get(&url)
            .send()
            .await
            .context("Failed to get wallet balance")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Circle API error: {} - {}", status, error_text);
        }

        response
            .json()
            .await
            .context("Failed to parse balance response")
    }

    /// Get USDC balance as float (for display)
    pub async fn get_usdc_balance(&self, wallet_id: &str) -> Result<f64> {
        let balance_response = self.get_wallet_balance(wallet_id).await?;

        for token in balance_response.data.token_balances {
            if token.token.symbol == "USDC" {
                return token
                    .amount
                    .parse::<f64>()
                    .context("Failed to parse USDC amount");
            }
        }

        Ok(0.0)
    }
}
