use axum::{extract::State, Json};
use std::sync::Arc;
use validator::Validate;
use crate::{
    api::AppState,
    error::AppError,
    models::{ReportFraudRequest, ReportFraudResponse},
    fraud::FraudDetector,
};

/// Report fraudulent activity
pub async fn report_fraud(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ReportFraudRequest>,
) -> Result<Json<ReportFraudResponse>, AppError> {
    request.validate()?;

    if !state.config.enable_fraud_detection {
        return Err(AppError::ValidationError(
            "Fraud detection is currently disabled".to_string()
        ));
    }

    tracing::warn!(
        "Fraud report received for task {} by worker {}",
        request.task_id,
        request.worker
    );

    let report_id = FraudDetector::process_fraud_report(&request).await?;

    // In production:
    // 1. Store report in database
    // 2. Analyze submission data
    // 3. Flag worker account
    // 4. Notify administrators
    // 5. Potentially freeze pending payments

    let fraud_risk = FraudDetector::analyze_submission(
        &request.worker,
        &request.task_id,
        0.5, // Default confidence
        5000, // Default time
    ).await?;

    let action = FraudDetector::determine_action(&fraud_risk);

    Ok(Json(ReportFraudResponse {
        fraud_report_id: report_id,
        status: "received".to_string(),
        action_taken: action,
    }))
}
