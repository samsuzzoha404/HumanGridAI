pub mod health;
pub mod verify;
pub mod reputation;
pub mod fraud;
pub mod circle;
pub mod tasks;
pub mod wallet;
pub mod webhook;

use crate::blockchain::BlockchainClient;
use crate::circle::CircleClient;
use crate::config::Config;
use crate::fraud::FraudDetector;
use crate::idempotency::{IdempotencyStore, TaskStateManager, WebhookDeduplicator};
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub blockchain: Arc<BlockchainClient>,
    pub circle_client: Arc<CircleClient>,
    pub fraud_detector: Arc<FraudDetector>,
    pub idempotency_store: Arc<IdempotencyStore>,
    pub task_state_manager: Arc<TaskStateManager>,
    pub webhook_deduplicator: Arc<WebhookDeduplicator>,
}

impl AppState {
    pub fn new(config: Config, blockchain: BlockchainClient, circle_client: CircleClient) -> Self {
        Self {
            config,
            blockchain: Arc::new(blockchain),
            circle_client: Arc::new(circle_client),
            fraud_detector: Arc::new(FraudDetector::new()),
            idempotency_store: Arc::new(IdempotencyStore::new(60)), // 60 second TTL
            task_state_manager: Arc::new(TaskStateManager::new()),
            webhook_deduplicator: Arc::new(WebhookDeduplicator::new(300)), // 5 minute TTL
        }
    }
}
