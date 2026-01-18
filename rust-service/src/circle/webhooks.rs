use super::{CircleClient, PublicKeyResponse, WebhookNotification};
use anyhow::{Context, Result};
use base64::{Engine as _, engine::general_purpose};
use p256::{
    ecdsa::{Signature, VerifyingKey, signature::Verifier},
};
use tracing::{debug, warn};

impl CircleClient {
    /// Fetch Circle's public key for webhook verification
    pub async fn get_public_key(&self, key_id: &str) -> Result<PublicKeyResponse> {
        let url = format!(
            "{}/v2/notifications/publicKey/{}",
            self.api_url(),
            key_id
        );

        let response = self
            .http_client()
            .get(&url)
            .send()
            .await
            .context("Failed to fetch public key")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Circle API error: {} - {}", status, error_text);
        }

        response
            .json()
            .await
            .context("Failed to parse public key response")
    }

    /// Verify webhook signature using Circle's public key
    pub async fn verify_webhook_signature(
        &self,
        payload: &str,
        signature_base64: &str,
        key_id: &str,
    ) -> Result<bool> {
        debug!("Verifying webhook signature with key ID: {}", key_id);

        // Fetch the public key
        let public_key_response = self.get_public_key(key_id).await?;

        // Decode the public key from base64
        let public_key_bytes = general_purpose::STANDARD
            .decode(&public_key_response.data.public_key)
            .context("Failed to decode public key")?;

        // Parse the verifying key
        let verifying_key = VerifyingKey::from_sec1_bytes(&public_key_bytes)
            .context("Failed to parse public key")?;

        // Decode the signature from base64
        let signature_bytes = general_purpose::STANDARD
            .decode(signature_base64)
            .context("Failed to decode signature")?;

        let signature = Signature::from_der(&signature_bytes)
            .context("Failed to parse signature")?;

        // Verify the signature
        match verifying_key.verify(payload.as_bytes(), &signature) {
            Ok(_) => {
                debug!("✅ Webhook signature verified successfully");
                Ok(true)
            }
            Err(e) => {
                warn!("❌ Webhook signature verification failed: {}", e);
                Ok(false)
            }
        }
    }
}

/// Parse webhook notification from JSON
pub fn parse_webhook_notification(payload: &str) -> Result<WebhookNotification> {
    serde_json::from_str(payload).context("Failed to parse webhook notification")
}
