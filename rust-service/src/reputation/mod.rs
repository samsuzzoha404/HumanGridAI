use crate::error::AppError;
use crate::models::WorkerStats;
use std::collections::HashMap;

pub struct ReputationCalculator;

impl ReputationCalculator {
    /// Calculate reputation tier based on task count
    pub fn calculate_tier(
        total_tasks: u32,
        bronze_threshold: u32,
        silver_threshold: u32,
        gold_threshold: u32,
        platinum_threshold: u32,
    ) -> u8 {
        if total_tasks >= platinum_threshold {
            4 // Platinum
        } else if total_tasks >= gold_threshold {
            3 // Gold
        } else if total_tasks >= silver_threshold {
            2 // Silver
        } else if total_tasks >= bronze_threshold {
            1 // Bronze
        } else {
            0 // New
        }
    }

    /// Get tier name from tier number
    pub fn tier_name(tier: u8) -> String {
        match tier {
            0 => "New".to_string(),
            1 => "Bronze".to_string(),
            2 => "Silver".to_string(),
            3 => "Gold".to_string(),
            4 => "Platinum".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    /// Calculate next tier threshold
    pub fn next_tier_threshold(
        current_tier: u8,
        bronze_threshold: u32,
        silver_threshold: u32,
        gold_threshold: u32,
        platinum_threshold: u32,
    ) -> Option<u32> {
        match current_tier {
            0 => Some(bronze_threshold),
            1 => Some(silver_threshold),
            2 => Some(gold_threshold),
            3 => Some(platinum_threshold),
            4 => None, // Already at max tier
            _ => None,
        }
    }

    /// Calculate accuracy rate
    pub fn calculate_accuracy(successful_tasks: u32, total_tasks: u32) -> f64 {
        if total_tasks == 0 {
            return 0.0;
        }
        (successful_tasks as f64 / total_tasks as f64) * 100.0
    }

    /// Build mock worker stats (in production, query from database)
    pub async fn get_worker_stats(worker_address: &str) -> Result<WorkerStats, AppError> {
        // In production, this would:
        // 1. Query database for worker's task history
        // 2. Aggregate statistics
        // 3. Calculate current reputation tier
        // 4. Sum total earnings
        
        // Mock data for demonstration
        let mock_stats = Self::mock_stats();
        
        mock_stats
            .get(worker_address)
            .cloned()
            .ok_or_else(|| AppError::TaskNotFound("Worker not found".to_string()))
    }

    /// Mock worker statistics (placeholder)
    fn mock_stats() -> HashMap<String, WorkerStats> {
        let mut stats = HashMap::new();
        
        // Example worker 1
        stats.insert(
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".to_lowercase(),
            WorkerStats {
                address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".to_string(),
                total_tasks: 150,
                completed_tasks: 145,
                failed_tasks: 5,
                average_confidence: 0.89,
                reputation_tier: 3,
                tier_name: "Gold".to_string(),
                earnings_total: "1500000000".to_string(), // 1500 USDC (6 decimals)
                fraud_reports: 0,
            },
        );

        stats
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_tier() {
        assert_eq!(ReputationCalculator::calculate_tier(5, 10, 50, 200, 1000), 0);
        assert_eq!(ReputationCalculator::calculate_tier(15, 10, 50, 200, 1000), 1);
        assert_eq!(ReputationCalculator::calculate_tier(75, 10, 50, 200, 1000), 2);
        assert_eq!(ReputationCalculator::calculate_tier(250, 10, 50, 200, 1000), 3);
        assert_eq!(ReputationCalculator::calculate_tier(1500, 10, 50, 200, 1000), 4);
    }

    #[test]
    fn test_tier_name() {
        assert_eq!(ReputationCalculator::tier_name(0), "New");
        assert_eq!(ReputationCalculator::tier_name(1), "Bronze");
        assert_eq!(ReputationCalculator::tier_name(4), "Platinum");
    }

    #[test]
    fn test_calculate_accuracy() {
        assert_eq!(ReputationCalculator::calculate_accuracy(90, 100), 90.0);
        assert_eq!(ReputationCalculator::calculate_accuracy(0, 100), 0.0);
        assert_eq!(ReputationCalculator::calculate_accuracy(0, 0), 0.0);
    }
}
