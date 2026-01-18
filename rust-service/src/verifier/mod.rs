use crate::error::AppError;
use crate::models::{TaskSubmission, TaskType};
use sha2::{Sha256, Digest};

/// Core verification logic - this is where intelligence lives
pub struct Verifier;

#[derive(Debug)]
pub struct VerificationResult {
    pub verified: bool,
    pub confidence_score: f64,
    pub proof_hash: String,
    pub reason: Option<String>,
}

impl Verifier {
    /// Verify a task submission based on task type
    pub async fn verify_submission(
        task_type: &TaskType,
        submission: &TaskSubmission,
    ) -> Result<VerificationResult, AppError> {
        match (task_type, submission) {
            (TaskType::Captcha, TaskSubmission::Captcha { solution, time_taken_ms }) => {
                Self::verify_captcha(solution, *time_taken_ms).await
            }
            (TaskType::ImageLabeling, TaskSubmission::ImageLabeling { labels, confidence }) => {
                Self::verify_image_labeling(labels, *confidence).await
            }
            (TaskType::TextValidation, TaskSubmission::TextValidation { is_valid, issues }) => {
                Self::verify_text_validation(*is_valid, issues).await
            }
            (TaskType::Custom, TaskSubmission::Custom { data }) => {
                Self::verify_custom(data).await
            }
            _ => Err(AppError::InvalidSubmission(
                "Task type and submission type mismatch".to_string()
            )),
        }
    }

    /// Verify CAPTCHA submission
    async fn verify_captcha(
        solution: &str,
        time_taken_ms: u64,
    ) -> Result<VerificationResult, AppError> {
        // CAPTCHA verification logic
        // In production, this would:
        // 1. Check against stored challenge
        // 2. Validate timing (too fast = bot, too slow = timeout)
        // 3. Apply ML-based bot detection
        
        const MIN_TIME_MS: u64 = 500;  // Too fast = likely bot
        const MAX_TIME_MS: u64 = 300_000; // 5 minutes timeout
        
        if solution.is_empty() {
            return Err(AppError::InvalidSubmission("Empty solution".to_string()));
        }

        if time_taken_ms < MIN_TIME_MS {
            return Ok(VerificationResult {
                verified: false,
                confidence_score: 0.0,
                proof_hash: Self::generate_proof_hash(solution),
                reason: Some("Completion time too fast - possible bot".to_string()),
            });
        }

        if time_taken_ms > MAX_TIME_MS {
            return Ok(VerificationResult {
                verified: false,
                confidence_score: 0.0,
                proof_hash: Self::generate_proof_hash(solution),
                reason: Some("Timeout exceeded".to_string()),
            });
        }

        // Simulate validation logic
        // In production: check against stored expected solution
        let is_correct = solution.len() >= 4; // Placeholder logic
        
        let confidence_score = if is_correct {
            Self::calculate_captcha_confidence(time_taken_ms)
        } else {
            0.0
        };

        Ok(VerificationResult {
            verified: is_correct && confidence_score >= 0.75,
            confidence_score,
            proof_hash: Self::generate_proof_hash(solution),
            reason: if !is_correct {
                Some("Incorrect solution".to_string())
            } else if confidence_score < 0.75 {
                Some("Low confidence score".to_string())
            } else {
                None
            },
        })
    }

    /// Verify image labeling submission
    async fn verify_image_labeling(
        labels: &[String],
        confidence: f64,
    ) -> Result<VerificationResult, AppError> {
        // Image labeling verification
        // In production:
        // 1. Compare with ground truth or consensus
        // 2. Check label quality and specificity
        // 3. Apply ML validation models
        
        if labels.is_empty() {
            return Err(AppError::InvalidSubmission("No labels provided".to_string()));
        }

        if confidence < 0.0 || confidence > 1.0 {
            return Err(AppError::InvalidSubmission("Invalid confidence score".to_string()));
        }

        // Placeholder: verify labels are reasonable
        let valid_labels = labels.iter().all(|l| !l.is_empty() && l.len() <= 100);
        
        if !valid_labels {
            return Ok(VerificationResult {
                verified: false,
                confidence_score: 0.0,
                proof_hash: Self::generate_proof_hash(&labels.join(",")),
                reason: Some("Invalid label format".to_string()),
            });
        }

        Ok(VerificationResult {
            verified: confidence >= 0.75,
            confidence_score: confidence,
            proof_hash: Self::generate_proof_hash(&labels.join(",")),
            reason: if confidence < 0.75 {
                Some("Confidence below threshold".to_string())
            } else {
                None
            },
        })
    }

    /// Verify text validation submission
    async fn verify_text_validation(
        is_valid: bool,
        issues: &[String],
    ) -> Result<VerificationResult, AppError> {
        // Text validation verification
        // In production:
        // 1. Check consistency between is_valid and issues
        // 2. Validate issue descriptions
        // 3. Apply NLP quality checks
        
        let has_issues = !issues.is_empty();
        let consistent = (is_valid && !has_issues) || (!is_valid && has_issues);
        
        if !consistent {
            return Ok(VerificationResult {
                verified: false,
                confidence_score: 0.5,
                proof_hash: Self::generate_proof_hash(&format!("{:?}", issues)),
                reason: Some("Inconsistent validation result".to_string()),
            });
        }

        let confidence_score = if has_issues {
            // More detailed issues = higher confidence
            0.75 + (issues.len().min(5) as f64 * 0.05)
        } else {
            0.85 // Valid with no issues
        };

        Ok(VerificationResult {
            verified: true,
            confidence_score: confidence_score.min(1.0),
            proof_hash: Self::generate_proof_hash(&format!("{:?}", issues)),
            reason: None,
        })
    }

    /// Verify custom task submission
    async fn verify_custom(
        data: &serde_json::Value,
    ) -> Result<VerificationResult, AppError> {
        // Custom task verification
        // In production: implement task-specific logic
        
        if data.is_null() {
            return Err(AppError::InvalidSubmission("No data provided".to_string()));
        }

        Ok(VerificationResult {
            verified: true,
            confidence_score: 0.8,
            proof_hash: Self::generate_proof_hash(&data.to_string()),
            reason: None,
        })
    }

    /// Calculate confidence score based on CAPTCHA completion time
    fn calculate_captcha_confidence(time_taken_ms: u64) -> f64 {
        // Ideal time: 3-30 seconds
        // Too fast or too slow reduces confidence
        const IDEAL_MIN: u64 = 3000;
        const IDEAL_MAX: u64 = 30000;
        
        if time_taken_ms >= IDEAL_MIN && time_taken_ms <= IDEAL_MAX {
            0.95 // High confidence for normal timing
        } else if time_taken_ms < IDEAL_MIN {
            // Faster than ideal = lower confidence
            0.75 + (time_taken_ms as f64 / IDEAL_MIN as f64) * 0.2
        } else {
            // Slower than ideal = lower confidence
            0.75 + ((60000 - time_taken_ms).max(0) as f64 / 30000.0) * 0.2
        }
    }

    /// Generate cryptographic proof hash of submission
    fn generate_proof_hash(data: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_string().as_bytes());
        format!("0x{}", hex::encode(hasher.finalize()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_captcha_verification_valid() {
        let result = Verifier::verify_captcha("test123", 5000).await.unwrap();
        assert!(result.verified);
        assert!(result.confidence_score >= 0.75);
    }

    #[tokio::test]
    async fn test_captcha_verification_too_fast() {
        let result = Verifier::verify_captcha("test123", 100).await.unwrap();
        assert!(!result.verified);
    }

    #[tokio::test]
    async fn test_captcha_verification_timeout() {
        let result = Verifier::verify_captcha("test123", 400_000).await.unwrap();
        assert!(!result.verified);
    }
}
