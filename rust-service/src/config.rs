use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    // Server
    #[serde(default = "default_host")]
    pub host: String,
    
    #[serde(default = "default_port")]
    pub port: u16,

    // Blockchain
    pub chain_id: u64,
    pub rpc_url: String,
    pub rpc_ws_url: String,
    pub escrow_contract_address: String,
    pub reputation_contract_address: String,
    pub verifier_private_key: String,

    // Circle API
    pub circle_api_key: String,
    pub circle_api_url: String,
    
    // SECURITY: Entity secret handling
    // This should be RSA-OAEP encrypted ciphertext from Circle
    // Production: Encrypt using Circle's public key before storing
    #[serde(default)]
    pub circle_entity_secret: String,
    
    // If true, entity_secret is encrypted and needs decryption
    #[serde(default)]
    pub circle_entity_secret_encrypted: bool,
    
    // Path to Circle's public key for encryption (optional)
    #[serde(default)]
    pub circle_public_key_path: Option<String>,
    
    // Wallet Set IDs - Separate sets for security and management
    pub circle_user_wallet_set_id: String,     // For user/worker wallets
    pub circle_treasury_wallet_set_id: String, // For treasury operations
    pub circle_agent_wallet_set_id: Option<String>, // For AI agents (future)
    
    // Treasury configuration
    pub circle_treasury_wallet_id: Option<String>,
    pub circle_treasury_address: Option<String>,

    // Mode Configuration
    #[serde(default = "default_demo_mode")]
    pub demo_mode: bool,
    
    #[serde(default = "default_use_circle_custody")]
    pub use_circle_custody: bool,

    // Database
    pub database_url: String,

    // Security
    pub api_key_salt: String,
    pub max_requests_per_minute: u32,

    // Task Configuration
    pub captcha_timeout_seconds: u64,
    pub min_confidence_score: f64,
    pub max_retry_attempts: u32,

    // Reputation Thresholds
    pub reputation_bronze_tasks: u32,
    pub reputation_silver_tasks: u32,
    pub reputation_gold_tasks: u32,
    pub reputation_platinum_tasks: u32,

    // Feature Flags
    pub enable_fraud_detection: bool,
    pub enable_multi_human_consensus: bool,
    pub enable_reputation_minting: bool,
}

fn default_host() -> String {
    "0.0.0.0".to_string()
}

fn default_port() -> u16 {
    8080
}

fn default_demo_mode() -> bool {
    true
}

fn default_use_circle_custody() -> bool {
    true
}

impl Config {
    pub fn from_env() -> Result<Self, envy::Error> {
        envy::from_env::<Config>()
    }

    pub fn get_reputation_tier(&self, task_count: u32) -> u8 {
        if task_count >= self.reputation_platinum_tasks {
            4 // Platinum
        } else if task_count >= self.reputation_gold_tasks {
            3 // Gold
        } else if task_count >= self.reputation_silver_tasks {
            2 // Silver
        } else if task_count >= self.reputation_bronze_tasks {
            1 // Bronze
        } else {
            0 // New
        }
    }

    /// Get entity secret (decrypt if encrypted)
    /// SECURITY: Never log the returned value
    pub fn get_entity_secret(&self) -> Result<String, String> {
        if self.circle_entity_secret_encrypted {
            // TODO: Implement RSA-OAEP decryption
            // For now, return error to prevent plaintext usage
            Err("Entity secret decryption not yet implemented".to_string())
        } else {
            // Warn about plaintext usage
            if !self.circle_entity_secret.is_empty() {
                tracing::warn!(
                    "⚠️  Using plaintext entity secret - encrypt before production!"
                );
            }
            Ok(self.circle_entity_secret.clone())
        }
    }

    /// Validate that security settings are production-ready
    pub fn validate_security(&self) -> Result<(), String> {
        let mut errors = Vec::new();

        // Check entity secret encryption
        if !self.circle_entity_secret.is_empty() && !self.circle_entity_secret_encrypted {
            errors.push("Entity secret is not encrypted (BLOCKER for production)");
        }

        // Check wallet set separation
        if self.circle_user_wallet_set_id == self.circle_treasury_wallet_set_id {
            errors.push("User and treasury wallet sets must be separate");
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors.join("; "))
        }
    }
}
