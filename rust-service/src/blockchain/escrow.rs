use ethers::prelude::*;
use std::sync::Arc;
use crate::error::AppError;

// HumanGridEscrow ABI (simplified)
abigen!(
    HumanGridEscrow,
    r#"[
        function completeTask(bytes32 taskId, bytes32 proof) external
        function cancelTask(bytes32 taskId) external
        function getTask(bytes32 taskId) external view returns (address requester, address worker, uint256 amount, uint256 createdAt, bool completed, bool cancelled)
        function isTaskActive(bytes32 taskId) external view returns (bool)
        event TaskCompleted(bytes32 indexed taskId, address indexed worker, uint256 amount, uint256 completedAt)
        event TaskCancelled(bytes32 indexed taskId, address indexed requester, uint256 refundAmount, uint256 cancelledAt)
    ]"#
);

// ReputationSBT ABI (simplified)
abigen!(
    ReputationSBT,
    r#"[
        function mint(address worker, uint8 tier) external
        function getTier(address worker) external view returns (uint8)
        function hasReputation(address worker) external view returns (bool)
        event ReputationMinted(address indexed worker, uint8 tier, uint256 timestamp)
        event ReputationUpgraded(address indexed worker, uint8 oldTier, uint8 newTier)
    ]"#
);

pub struct EscrowContract {
    contract: HumanGridEscrow<SignerMiddleware<Arc<Provider<Http>>, LocalWallet>>,
}

impl EscrowContract {
    pub fn new(
        address: Address,
        signer: SignerMiddleware<Arc<Provider<Http>>, LocalWallet>,
    ) -> Self {
        let contract = HumanGridEscrow::new(address, Arc::new(signer));
        Self { contract }
    }

    /// Complete a task and release payment to worker
    pub async fn complete_task(
        &self,
        task_id: [u8; 32],
        proof: [u8; 32],
    ) -> Result<TransactionReceipt, AppError> {
        let call = self.contract.complete_task(task_id, proof);
        let tx = call
            .send()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to send transaction: {}", e)))?;

        let receipt = tx
            .await
            .map_err(|e| AppError::BlockchainError(format!("Transaction failed: {}", e)))?
            .ok_or_else(|| AppError::BlockchainError("No receipt returned".to_string()))?;

        Ok(receipt)
    }

    /// Cancel a task and refund requester
    pub async fn cancel_task(&self, task_id: [u8; 32]) -> Result<TransactionReceipt, AppError> {
        let call = self.contract.cancel_task(task_id);
        let tx = call
            .send()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to send transaction: {}", e)))?;

        let receipt = tx
            .await
            .map_err(|e| AppError::BlockchainError(format!("Transaction failed: {}", e)))?
            .ok_or_else(|| AppError::BlockchainError("No receipt returned".to_string()))?;

        Ok(receipt)
    }

    /// Check if a task is active
    pub async fn is_task_active(&self, task_id: [u8; 32]) -> Result<bool, AppError> {
        self.contract
            .is_task_active(task_id)
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to check task status: {}", e)))
    }

    /// Get task details
    pub async fn get_task(
        &self,
        task_id: [u8; 32],
    ) -> Result<(Address, Address, U256, U256, bool, bool), AppError> {
        self.contract
            .get_task(task_id)
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to get task: {}", e)))
    }
}

pub struct ReputationContract {
    contract: ReputationSBT<SignerMiddleware<Arc<Provider<Http>>, LocalWallet>>,
}

impl ReputationContract {
    pub fn new(
        address: Address,
        signer: SignerMiddleware<Arc<Provider<Http>>, LocalWallet>,
    ) -> Self {
        let contract = ReputationSBT::new(address, Arc::new(signer));
        Self { contract }
    }

    /// Mint or upgrade reputation badge
    pub async fn mint(
        &self,
        worker: Address,
        tier: u8,
    ) -> Result<TransactionReceipt, AppError> {
        let call = self.contract.mint(worker, tier);
        let tx = call
            .send()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to send transaction: {}", e)))?;

        let receipt = tx
            .await
            .map_err(|e| AppError::BlockchainError(format!("Transaction failed: {}", e)))?
            .ok_or_else(|| AppError::BlockchainError("No receipt returned".to_string()))?;

        Ok(receipt)
    }

    /// Get worker's reputation tier
    pub async fn get_tier(&self, worker: Address) -> Result<u8, AppError> {
        self.contract
            .get_tier(worker)
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to get tier: {}", e)))
    }

    /// Check if worker has reputation
    pub async fn has_reputation(&self, worker: Address) -> Result<bool, AppError> {
        self.contract
            .has_reputation(worker)
            .call()
            .await
            .map_err(|e| AppError::BlockchainError(format!("Failed to check reputation: {}", e)))
    }
}

/// Helper to convert task ID string to bytes32
pub fn task_id_to_bytes32(task_id: &str) -> Result<[u8; 32], AppError> {
    // Remove 0x prefix if present
    let task_id = task_id.strip_prefix("0x").unwrap_or(task_id);
    
    let mut bytes = [0u8; 32];
    hex::decode_to_slice(task_id, &mut bytes)
        .map_err(|e| AppError::ValidationError(format!("Invalid task ID: {}", e)))?;
    
    Ok(bytes)
}

/// Helper to convert proof hash to bytes32
pub fn proof_to_bytes32(proof: &str) -> Result<[u8; 32], AppError> {
    let proof = proof.strip_prefix("0x").unwrap_or(proof);
    
    let mut bytes = [0u8; 32];
    hex::decode_to_slice(proof, &mut bytes)
        .map_err(|e| AppError::ValidationError(format!("Invalid proof: {}", e)))?;
    
    Ok(bytes)
}
