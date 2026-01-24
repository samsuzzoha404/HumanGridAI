use ethers::prelude::*;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use crate::config::Config;

/// Smart contract event listener
///
/// Listens to HumanGridEscrow contract events:
/// - TaskCreated
/// - TaskCompleted
/// - TaskCancelled
///
/// When TaskCompleted fires:
/// 1. Extract worker address
/// 2. Lookup worker wallet_id in database
/// 3. Trigger Circle payment via payment API
///
/// This bridges on-chain enforcement with off-chain payments.
pub struct EventListener {
    provider: Arc<Provider<Http>>,
    escrow_address: Address,
    event_tx: mpsc::Sender<ContractEvent>,
}

#[derive(Debug, Clone)]
pub enum ContractEvent {
    TaskCreated {
        task_id: String,
        requester: Address,
        worker: Address,
        amount: U256,
    },
    TaskCompleted {
        task_id: String,
        worker: Address,
        amount: U256,
    },
    TaskCancelled {
        task_id: String,
        refund_to: Address,
    },
}

impl EventListener {
    pub fn new(config: &Config, event_tx: mpsc::Sender<ContractEvent>) -> Self {
        let provider = Provider::<Http>::try_from(&config.rpc_url)
            .expect("Failed to create provider");

        let escrow_address: Address = config
            .escrow_contract_address
            .parse()
            .expect("Invalid escrow contract address");

        Self {
            provider: Arc::new(provider),
            escrow_address,
            event_tx,
        }
    }

    /// Start listening to events
    pub async fn start(self) {
        info!("🎧 Starting event listener for escrow contract: {}", self.escrow_address);

        // Get current block
        let latest_block = match self.provider.get_block_number().await {
            Ok(block) => block,
            Err(e) => {
                error!("❌ Failed to get latest block: {}", e);
                return;
            }
        };

        info!("📍 Starting from block: {}", latest_block);

        // Subscribe to new blocks and process events
        let mut stream = match self.provider.watch_blocks().await {
            Ok(stream) => stream,
            Err(e) => {
                error!("❌ Failed to watch blocks: {}", e);
                return;
            }
        };

        info!("✅ Event listener started successfully");

        while let Some(block_hash) = stream.next().await {
            if let Err(e) = self.process_block(block_hash).await {
                error!("❌ Error processing block: {}", e);
            }
        }

        warn!("⚠️ Event listener stream ended");
    }

    async fn process_block(&self, block_hash: H256) -> Result<(), Box<dyn std::error::Error>> {
        // Get block details
        let block = self
            .provider
            .get_block_with_txs(block_hash)
            .await?
            .ok_or("Block not found")?;

        info!("📦 Processing block: {} (#{:?})", block_hash, block.number);

        // TODO: Parse contract logs and emit events
        // For now, this is a placeholder structure

        // Example event parsing (you'll need to use abigen! for actual implementation):
        // let filter = Filter::new()
        //     .address(self.escrow_address)
        //     .topic0(TaskCompleted::signature())
        //     .from_block(block.number.unwrap())
        //     .to_block(block.number.unwrap());
        //
        // let logs = self.provider.get_logs(&filter).await?;
        //
        // for log in logs {
        //     let event = parse_task_completed_event(log)?;
        //     self.event_tx.send(event).await?;
        // }

        Ok(())
    }
}

/// Event processor - handles events from listener
pub struct EventProcessor {
    event_rx: mpsc::Receiver<ContractEvent>,
}

impl EventProcessor {
    pub fn new(event_rx: mpsc::Receiver<ContractEvent>) -> Self {
        Self { event_rx }
    }

    /// Start processing events
    pub async fn start(mut self) {
        info!("🔄 Starting event processor");

        while let Some(event) = self.event_rx.recv().await {
            if let Err(e) = self.handle_event(event).await {
                error!("❌ Error handling event: {}", e);
            }
        }

        warn!("⚠️ Event processor stopped");
    }

    async fn handle_event(&self, event: ContractEvent) -> Result<(), Box<dyn std::error::Error>> {
        match event {
            ContractEvent::TaskCreated {
                task_id,
                requester,
                worker,
                amount,
            } => {
                info!(
                    "📝 Task created: id={}, requester={:?}, worker={:?}, amount={}",
                    task_id, requester, worker, amount
                );
                // TODO: Update database
            }
            ContractEvent::TaskCompleted {
                task_id,
                worker,
                amount,
            } => {
                info!(
                    "✅ Task completed: id={}, worker={:?}, amount={}",
                    task_id, worker, amount
                );
                // TODO: Trigger Circle payment
                // 1. Lookup worker wallet_id from address
                // 2. Call POST /api/payments/submit
                // 3. Log result
            }
            ContractEvent::TaskCancelled { task_id, refund_to } => {
                info!(
                    "❌ Task cancelled: id={}, refund_to={:?}",
                    task_id, refund_to
                );
                // TODO: Handle refund
            }
        }

        Ok(())
    }
}

// TODO: Add contract ABI and use abigen! macro
// abigen!(
//     HumanGridEscrow,
//     "./abi/HumanGridEscrow.json"
// );
