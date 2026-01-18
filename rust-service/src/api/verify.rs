use axum::{
    extract::{Path, State},
    Json,
};
use std::sync::Arc;
use validator::Validate;
use crate::{
    api::AppState,
    error::AppError,
    models::{
        TaskType, VerifyTaskRequest, VerifyTaskResponse, TaskStatusResponse, TaskStatus,
    },
    verifier::Verifier,
    fraud::FraudDetector,
    blockchain::escrow::{task_id_to_bytes32, proof_to_bytes32, EscrowContract},
};
use ethers::prelude::*;

/// Verify a task submission and release payment if valid
pub async fn verify_task(
    State(state): State<Arc<AppState>>,
    Json(request): Json<VerifyTaskRequest>,
) -> Result<Json<VerifyTaskResponse>, AppError> {
    // Validate request
    request.validate()?;

    tracing::info!("Verifying task: {} for worker: {}", request.task_id, request.worker);

    // Convert task ID to bytes32
    let task_id_bytes = task_id_to_bytes32(&request.task_id)?;

    // Connect to escrow contract
    let escrow_address: Address = state.config.escrow_contract_address.parse()
        .map_err(|e| AppError::ConfigError(format!("Invalid escrow address: {}", e)))?;
    
    let escrow = EscrowContract::new(escrow_address, state.blockchain.signer());

    // Check if task exists and is active
    let is_active = escrow.is_task_active(task_id_bytes).await?;
    if !is_active {
        return Err(AppError::TaskNotFound(format!("Task {} not found or already completed", request.task_id)));
    }

    // Get task details to determine task type
    // For now, we'll assume Captcha type - in production, store this mapping
    let task_type = TaskType::Captcha;

    // Verify the submission
    let verification_result = Verifier::verify_submission(&task_type, &request.submission).await?;

    tracing::info!(
        "Verification result for task {}: verified={}, confidence={}",
        request.task_id,
        verification_result.verified,
        verification_result.confidence_score
    );

    // Check if confidence meets threshold
    if verification_result.confidence_score < state.config.min_confidence_score {
        return Ok(Json(VerifyTaskResponse {
            task_id: request.task_id.clone(),
            verified: false,
            confidence_score: verification_result.confidence_score,
            proof_hash: verification_result.proof_hash,
            payment_initiated: false,
            message: format!(
                "Confidence score {} below threshold {}",
                verification_result.confidence_score,
                state.config.min_confidence_score
            ),
        }));
    }

    // Fraud detection
    if state.config.enable_fraud_detection {
        let time_taken = match &request.submission {
            crate::models::TaskSubmission::Captcha { time_taken_ms, .. } => *time_taken_ms,
            _ => 5000, // Default
        };

        let fraud_risk = FraudDetector::analyze_submission(
            &request.worker,
            &request.task_id,
            verification_result.confidence_score,
            time_taken,
        ).await?;

        match fraud_risk {
            crate::fraud::FraudRisk::High | crate::fraud::FraudRisk::Critical => {
                tracing::warn!(
                    "High fraud risk detected for task {} by worker {}",
                    request.task_id,
                    request.worker
                );
                
                return Ok(Json(VerifyTaskResponse {
                    task_id: request.task_id.clone(),
                    verified: false,
                    confidence_score: verification_result.confidence_score,
                    proof_hash: verification_result.proof_hash,
                    payment_initiated: false,
                    message: "Submission flagged for potential fraud".to_string(),
                }));
            }
            _ => {}
        }
    }

    // If verification passed, complete task on blockchain
    let mut payment_initiated = false;
    let mut message = "Verification successful".to_string();

    if verification_result.verified {
        let proof_bytes = proof_to_bytes32(&verification_result.proof_hash)?;
        
        match escrow.complete_task(task_id_bytes, proof_bytes).await {
            Ok(receipt) => {
                payment_initiated = true;
                message = format!(
                    "Payment released. Transaction: 0x{}",
                    hex::encode(receipt.transaction_hash.as_bytes())
                );
                tracing::info!("Task {} completed. Payment released to {}", request.task_id, request.worker);
            }
            Err(e) => {
                tracing::error!("Failed to complete task on blockchain: {}", e);
                message = format!("Verification passed but payment failed: {}", e);
            }
        }
    }

    Ok(Json(VerifyTaskResponse {
        task_id: request.task_id,
        verified: verification_result.verified,
        confidence_score: verification_result.confidence_score,
        proof_hash: verification_result.proof_hash,
        payment_initiated,
        message,
    }))
}

/// Get task verification status
pub async fn get_task_status(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
) -> Result<Json<TaskStatusResponse>, AppError> {
    tracing::info!("Getting status for task: {}", task_id);

    let task_id_bytes = task_id_to_bytes32(&task_id)?;

    let escrow_address: Address = state.config.escrow_contract_address.parse()
        .map_err(|e| AppError::ConfigError(format!("Invalid escrow address: {}", e)))?;
    
    let escrow = EscrowContract::new(escrow_address, state.blockchain.signer());

    // Get task details from blockchain
    let (_, _, _, _, completed, cancelled) = escrow.get_task(task_id_bytes).await?;

    let status = if completed {
        TaskStatus::Paid
    } else if cancelled {
        TaskStatus::Cancelled
    } else {
        TaskStatus::Pending
    };

    Ok(Json(TaskStatusResponse {
        task_id,
        status,
        confidence_score: None, // Would be stored in database in production
        verified_at: None,
    }))
}
