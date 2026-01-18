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
    pub circle_entity_secret: String,
    pub circle_wallet_set_id: String,
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
}
