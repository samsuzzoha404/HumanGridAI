use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub task_id: String,
    pub requester: String,
    pub worker: String,
    pub amount: String,
    pub task_type: TaskType,
    pub status: TaskStatus,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    Captcha,
    ImageLabeling,
    TextValidation,
    DataVerification,
    Custom,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    InProgress,
    Submitted,
    Verified,
    Rejected,
    Paid,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct VerifyTaskRequest {
    #[validate(length(min = 1))]
    pub task_id: String,
    
    #[validate(length(min = 42, max = 42))]
    pub worker: String,
    
    pub submission: TaskSubmission,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TaskSubmission {
    #[serde(rename = "captcha")]
    Captcha {
        solution: String,
        time_taken_ms: u64,
    },
    #[serde(rename = "image_labeling")]
    ImageLabeling {
        labels: Vec<String>,
        confidence: f64,
    },
    #[serde(rename = "text_validation")]
    TextValidation {
        is_valid: bool,
        issues: Vec<String>,
    },
    #[serde(rename = "custom")]
    Custom {
        data: serde_json::Value,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyTaskResponse {
    pub task_id: String,
    pub verified: bool,
    pub confidence_score: f64,
    pub proof_hash: String,
    pub payment_initiated: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskStatusResponse {
    pub task_id: String,
    pub status: TaskStatus,
    pub confidence_score: Option<f64>,
    pub verified_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CalculateReputationRequest {
    #[validate(length(min = 42, max = 42))]
    pub worker_address: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalculateReputationResponse {
    pub worker_address: String,
    pub total_tasks: u32,
    pub successful_tasks: u32,
    pub accuracy_rate: f64,
    pub current_tier: u8,
    pub tier_name: String,
    pub next_tier_at: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct ReportFraudRequest {
    #[validate(length(min = 1))]
    pub task_id: String,
    
    #[validate(length(min = 42, max = 42))]
    pub worker: String,
    
    pub reason: String,
    pub evidence: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReportFraudResponse {
    pub fraud_report_id: String,
    pub status: String,
    pub action_taken: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkerStats {
    pub address: String,
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub failed_tasks: u32,
    pub average_confidence: f64,
    pub reputation_tier: u8,
    pub tier_name: String,
    pub earnings_total: String,
    pub fraud_reports: u32,
}
