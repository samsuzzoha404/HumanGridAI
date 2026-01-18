use axum::{extract::State, Json};
use serde_json::{json, Value};
use std::sync::Arc;
use crate::api::AppState;

pub async fn health_check(State(state): State<Arc<AppState>>) -> Json<Value> {
    // Check blockchain connection
    let block_number = state.blockchain.get_block_number().await;
    
    let blockchain_status = match block_number {
        Ok(num) => json!({
            "status": "healthy",
            "block_number": num.as_u64(),
        }),
        Err(e) => json!({
            "status": "unhealthy",
            "error": e.to_string(),
        }),
    };

    Json(json!({
        "status": "ok",
        "service": "HumanGrid Protocol Service",
        "version": env!("CARGO_PKG_VERSION"),
        "chain_id": state.config.chain_id,
        "blockchain": blockchain_status,
        "features": {
            "fraud_detection": state.config.enable_fraud_detection,
            "multi_human_consensus": state.config.enable_multi_human_consensus,
            "reputation_minting": state.config.enable_reputation_minting,
        }
    }))
}
