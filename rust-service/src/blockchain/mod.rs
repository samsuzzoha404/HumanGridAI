use ethers::prelude::*;
use std::sync::Arc;
use crate::config::Config;
use crate::error::AppError;

pub mod escrow;
pub mod event_listener;

#[derive(Clone)]
pub struct BlockchainClient {
    provider: Arc<Provider<Http>>,
    wallet: LocalWallet,
    chain_id: u64,
}

impl BlockchainClient {
    pub async fn new(config: &Config) -> Result<Self, AppError> {
        // Connect to RPC
        let provider = Provider::<Http>::try_from(&config.rpc_url)
            .map_err(|e| AppError::BlockchainError(format!("Failed to connect to RPC: {}", e)))?;

        // Load verifier wallet
        let wallet = config
            .verifier_private_key
            .parse::<LocalWallet>()
            .map_err(|e| AppError::ConfigError(format!("Invalid private key: {}", e)))?
            .with_chain_id(config.chain_id);

        Ok(Self {
            provider: Arc::new(provider),
            wallet,
            chain_id: config.chain_id,
        })
    }

    pub fn provider(&self) -> Arc<Provider<Http>> {
        self.provider.clone()
    }

    pub fn wallet(&self) -> &LocalWallet {
        &self.wallet
    }

    pub fn signer(&self) -> SignerMiddleware<Arc<Provider<Http>>, LocalWallet> {
        SignerMiddleware::new(self.provider.clone(), self.wallet.clone())
    }

    pub async fn get_block_number(&self) -> Result<U64, AppError> {
        self.provider
            .get_block_number()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to get block number: {}", e)))
    }

    pub async fn verify_address(&self, address: &str) -> Result<Address, AppError> {
        address
            .parse::<Address>()
            .map_err(|e| AppError::ValidationError(format!("Invalid address: {}", e)))
    }
}
