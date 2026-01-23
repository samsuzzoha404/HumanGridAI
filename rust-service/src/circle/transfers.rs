use super::{CircleClient, TransferRequest, TransferEndpoint, TransferResponse};
use anyhow::{Context, Result};
use tracing::{info, warn};
use uuid::Uuid;

impl CircleClient {
    /// Transfer USDC from treasury to worker wallet
    pub async fn transfer_to_worker(
        &self,
        worker_wallet_id: &str,
        amount: &str,
        task_id: &str,
    ) -> Result<TransferResponse> {
        let treasury_wallet_id = self
            .config()
            .circle_treasury_wallet_id
            .as_ref()
            .context("Treasury wallet ID not configured")?;

        // Deterministic idempotency key: prevents duplicate transfers on retry
        // Format: payment_task_{task_id}
        let idempotency_key = format!("payment_task_{}", task_id);

        let request = TransferRequest {
            source: TransferEndpoint {
                endpoint_type: "wallet".to_string(),
                id: Some(treasury_wallet_id.clone()),
                address: None,
            },
            destination: TransferEndpoint {
                endpoint_type: "wallet".to_string(),
                id: Some(worker_wallet_id.to_string()),
                address: None,
            },
            amounts: vec![amount.to_string()],
            token_id: self.get_usdc_token_id(),
            fee_level: Some("MEDIUM".to_string()),
            idempotency_key,
        };

        info!(
            "Initiating USDC transfer: {} USDC from treasury to worker {}",
            amount, worker_wallet_id
        );

        let url = format!("{}/v1/w3s/developer/transactions/transfer", self.api_url());

        let response = self
            .http_client()
            .post(&url)
            .json(&request)
            .send()
            .await
            .context("Failed to send transfer request")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            warn!("Circle transfer failed: {} - {}", status, error_text);
            anyhow::bail!("Circle transfer error: {} - {}", status, error_text);
        }

        let transfer_response: TransferResponse = response
            .json()
            .await
            .context("Failed to parse transfer response")?;

        info!(
            "✅ Transfer initiated: ID {}, State: {}",
            transfer_response.data.id, transfer_response.data.state
        );

        Ok(transfer_response)
    }

    /// Get transfer status
    pub async fn get_transfer_status(&self, transfer_id: &str) -> Result<TransferResponse> {
        let url = format!("{}/v1/w3s/transactions/{}", self.api_url(), transfer_id);

        let response = self
            .http_client()
            .get(&url)
            .send()
            .await
            .context("Failed to get transfer status")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Circle API error: {} - {}", status, error_text);
        }

        response
            .json()
            .await
            .context("Failed to parse transfer response")
    }

    /// Get USDC token ID for the current blockchain
    fn get_usdc_token_id(&self) -> String {
        // Base Sepolia USDC token ID
        // TODO: Make this configurable based on chain_id
        "36b1737e-a993-4a32-8dc2-9db7e87e82ea".to_string()
    }
}
