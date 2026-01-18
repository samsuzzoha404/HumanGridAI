pub mod health;
pub mod verify;
pub mod reputation;
pub mod fraud;
pub mod circle;

use crate::blockchain::BlockchainClient;
use crate::circle::CircleClient;
use crate::config::Config;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub blockchain: Arc<BlockchainClient>,
    pub circle_client: Arc<CircleClient>,
}

impl AppState {
    pub fn new(config: Config, blockchain: BlockchainClient, circle_client: CircleClient) -> Self {
        Self {
            config,
            blockchain: Arc::new(blockchain),
            circle_client: Arc::new(circle_client),
        }
    }
}
