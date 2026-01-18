use axum::{
    extract::{Path, State},
    Json,
};
use std::sync::Arc;
use validator::Validate;
use crate::{
    api::AppState,
    error::AppError,
    models::{CalculateReputationRequest, CalculateReputationResponse, WorkerStats},
    reputation::ReputationCalculator,
    blockchain::escrow::ReputationContract,
};
use ethers::prelude::*;

/// Calculate worker reputation and potentially mint badge
pub async fn calculate_reputation(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CalculateReputationRequest>,
) -> Result<Json<CalculateReputationResponse>, AppError> {
    request.validate()?;

    tracing::info!("Calculating reputation for worker: {}", request.worker_address);

    // Get worker stats (in production, query from database)
    let stats = ReputationCalculator::get_worker_stats(&request.worker_address.to_lowercase()).await?;

    // Calculate current tier based on completed tasks
    let current_tier = ReputationCalculator::calculate_tier(
        stats.completed_tasks,
        state.config.reputation_bronze_tasks,
        state.config.reputation_silver_tasks,
        state.config.reputation_gold_tasks,
        state.config.reputation_platinum_tasks,
    );

    let tier_name = ReputationCalculator::tier_name(current_tier);
    let accuracy_rate = ReputationCalculator::calculate_accuracy(
        stats.completed_tasks,
        stats.total_tasks,
    );

    let next_tier_at = ReputationCalculator::next_tier_threshold(
        current_tier,
        state.config.reputation_bronze_tasks,
        state.config.reputation_silver_tasks,
        state.config.reputation_gold_tasks,
        state.config.reputation_platinum_tasks,
    );

    // Mint reputation badge on blockchain if enabled and tier increased
    if state.config.enable_reputation_minting && current_tier > 0 {
        let worker_address: Address = request.worker_address.parse()
            .map_err(|e| AppError::ValidationError(format!("Invalid address: {}", e)))?;

        let reputation_address: Address = state.config.reputation_contract_address.parse()
            .map_err(|e| AppError::ConfigError(format!("Invalid reputation address: {}", e)))?;

        let reputation = ReputationContract::new(reputation_address, state.blockchain.signer());

        // Get current on-chain tier
        let onchain_tier = reputation.get_tier(worker_address).await?;

        // Mint if new tier is higher
        if current_tier > onchain_tier {
            match reputation.mint(worker_address, current_tier).await {
                Ok(receipt) => {
                    tracing::info!(
                        "Minted reputation tier {} for worker {}. Tx: 0x{}",
                        current_tier,
                        request.worker_address,
                        hex::encode(receipt.transaction_hash.as_bytes())
                    );
                }
                Err(e) => {
                    tracing::error!("Failed to mint reputation: {}", e);
                }
            }
        }
    }

    Ok(Json(CalculateReputationResponse {
        worker_address: request.worker_address,
        total_tasks: stats.total_tasks,
        successful_tasks: stats.completed_tasks,
        accuracy_rate,
        current_tier,
        tier_name,
        next_tier_at,
    }))
}

/// Get worker statistics
pub async fn get_worker_stats(
    State(_state): State<Arc<AppState>>,
    Path(address): Path<String>,
) -> Result<Json<WorkerStats>, AppError> {
    tracing::info!("Getting stats for worker: {}", address);

    let stats = ReputationCalculator::get_worker_stats(&address.to_lowercase()).await?;

    Ok(Json(stats))
}
