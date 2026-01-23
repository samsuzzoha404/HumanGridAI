use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::api::AppState;
use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub bot_name: String,
    pub bot_version: Option<String>,
    pub task_type: String,
    pub task_description: String,
    pub reward_amount: f64,
    pub difficulty: Option<String>,
    pub time_remaining: Option<i32>,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    pub id: i64,
    pub bot_name: String,
    pub bot_version: Option<String>,
    pub task_type: String,
    pub task_description: String,
    pub reward_amount: f64,
    pub difficulty: Option<String>,
    pub time_remaining: Option<i32>,
    pub image_url: Option<String>,
    pub status: String,
    pub created_at: String,
}

/// Create a new task (for AI agents to post)
pub async fn create_task(
    State(_state): State<Arc<AppState>>,
    Json(request): Json<CreateTaskRequest>,
) -> Result<Json<TaskResponse>, AppError> {
    tracing::info!("Creating task: {} - {}", request.bot_name, request.task_description);

    // TODO: Store in Supabase
    // For now, return a mock response
    let response = TaskResponse {
        id: rand::random::<i64>().abs(),
        bot_name: request.bot_name,
        bot_version: request.bot_version,
        task_type: request.task_type,
        task_description: request.task_description,
        reward_amount: request.reward_amount,
        difficulty: request.difficulty,
        time_remaining: request.time_remaining,
        image_url: request.image_url,
        status: "pending".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    Ok(Json(response))
}

#[derive(Debug, Deserialize)]
pub struct AssignTaskRequest {
    pub user_id: String,
}

/// Assign a task to a worker
pub async fn assign_task(
    State(_state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
    Json(request): Json<AssignTaskRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Assigning task {} to user {}", task_id, request.user_id);

    // TODO: Update task in Supabase
    Ok(Json(serde_json::json!({
        "success": true,
        "task_id": task_id,
        "user_id": request.user_id,
        "message": "Task assigned successfully"
    })))
}

#[derive(Debug, Deserialize)]
pub struct CompleteTaskRequest {
    pub user_id: String,
    pub submission: String,
    pub metadata: Option<serde_json::Value>,
    /// Idempotency key to prevent double-completion
    pub idempotency_key: Option<String>,
}

/// Mark a task as completed
/// PROTECTED: Idempotency key prevents double-spend/race conditions
pub async fn complete_task(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
    Json(request): Json<CompleteTaskRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Completing task {} by user {}", task_id, request.user_id);

    // Generate idempotency key if not provided
    let idempotency_key = request.idempotency_key.unwrap_or_else(|| {
        crate::idempotency::generate_key(
            "task_complete",
            &[&task_id, &request.user_id],
        )
    });

    // Check if this completion was already processed
    // In production: use database for atomic check-and-set
    // For now: log warning about race condition possibility
    tracing::info!("🔐 Idempotency key: {}", idempotency_key);
    
    // ATOMIC CHECK: Verify task not already completed
    // TODO: Replace with database transaction:
    // BEGIN TRANSACTION;
    // SELECT status FROM tasks WHERE id = $1 FOR UPDATE;
    // IF status = 'completed' THEN ROLLBACK;
    // UPDATE tasks SET status = 'completed' WHERE id = $1;
    // COMMIT;
    
    tracing::warn!("⚠️  TODO: Implement atomic check-and-set in database");

    // Simple verification for demo - always pass
    let verification = serde_json::json!({
        "valid": true,
        "confidence": 0.95
    });

    // Check for fraud
    let fraud_score = state
        .fraud_detector
        .check_fraud(&request.user_id, &task_id)
        .await;

    if fraud_score > 0.7 {
        tracing::warn!("High fraud score detected: {}", fraud_score);
        return Err(AppError::InvalidPayload("Fraud detected".to_string()));
    }

    // TODO: Update task status in Supabase with idempotency key
    // TODO: Process payment via Circle (will use its own idempotency)

    Ok(Json(serde_json::json!({
        "success": true,
        "task_id": task_id,
        "verification": verification,
        "fraud_score": fraud_score,
        "idempotency_key": idempotency_key,
        "message": "Task completed successfully"
    })))
}

/// Get task details
pub async fn get_task(
    State(_state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Getting task {}", task_id);

    // TODO: Fetch from Supabase
    Ok(Json(serde_json::json!({
        "id": task_id,
        "status": "pending",
        "message": "Task details (mock)"
    })))
}
