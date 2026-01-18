use crate::error::AppError;
use crate::models::ReportFraudRequest;
use sha2::{Sha256, Digest};

pub struct FraudDetector;

#[derive(Debug)]
pub enum FraudRisk {
    Low,
    Medium,
    High,
    Critical,
}

impl FraudDetector {
    /// Analyze task submission for fraud indicators
    pub async fn analyze_submission(
        worker: &str,
        task_id: &str,
        confidence_score: f64,
        time_taken_ms: u64,
    ) -> Result<FraudRisk, AppError> {
        // In production, this would:
        // 1. Check worker's historical accuracy
        // 2. Detect pattern anomalies
        // 3. Cross-reference with known fraud cases
        // 4. Apply ML-based fraud detection
        // 5. Check timing patterns (too fast/consistent = bot)
        
        let mut risk_score = 0;

        // Check confidence score
        if confidence_score < 0.5 {
            risk_score += 2;
        } else if confidence_score < 0.75 {
            risk_score += 1;
        }

        // Check timing (suspiciously fast or exact patterns)
        if time_taken_ms < 1000 {
            risk_score += 3; // Very fast = likely bot
        }

        // In production: check historical patterns
        // if worker_has_consistent_timing(worker) {
        //     risk_score += 2;
        // }

        let risk = match risk_score {
            0..=1 => FraudRisk::Low,
            2..=3 => FraudRisk::Medium,
            4..=5 => FraudRisk::High,
            _ => FraudRisk::Critical,
        };

        Ok(risk)
    }

    /// Process fraud report
    pub async fn process_fraud_report(
        report: &ReportFraudRequest,
    ) -> Result<String, AppError> {
        // In production:
        // 1. Store report in database
        // 2. Flag worker for review
        // 3. Potentially freeze worker's account
        // 4. Notify administrators
        // 5. Trigger automated investigation
        
        let report_id = Self::generate_report_id(&report.task_id, &report.worker);
        
        tracing::warn!(
            "Fraud report filed: {} for worker {} on task {}",
            report_id,
            report.worker,
            report.task_id
        );

        Ok(report_id)
    }

    /// Determine action based on fraud risk
    pub fn determine_action(risk: &FraudRisk) -> String {
        match risk {
            FraudRisk::Low => "None - monitoring".to_string(),
            FraudRisk::Medium => "Increased scrutiny on future submissions".to_string(),
            FraudRisk::High => "Manual review required".to_string(),
            FraudRisk::Critical => "Account flagged - immediate investigation".to_string(),
        }
    }

    /// Generate unique fraud report ID
    fn generate_report_id(task_id: &str, worker: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(task_id.as_bytes());
        hasher.update(worker.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_string().as_bytes());
        format!("FR-{}", hex::encode(&hasher.finalize()[0..8]))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fraud_analysis_low_risk() {
        let risk = FraudDetector::analyze_submission(
            "0x123",
            "task1",
            0.9,
            5000,
        ).await.unwrap();
        
        matches!(risk, FraudRisk::Low);
    }

    #[tokio::test]
    async fn test_fraud_analysis_high_risk() {
        let risk = FraudDetector::analyze_submission(
            "0x123",
            "task1",
            0.3,
            500,
        ).await.unwrap();
        
        matches!(risk, FraudRisk::High | FraudRisk::Critical);
    }
}
