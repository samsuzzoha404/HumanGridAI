// Phase 2: Idempotency Protection
// Prevents double-spend, race conditions, and replay attacks

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

/// Idempotency key entry with timestamp
#[derive(Clone, Debug)]
struct IdempotencyEntry {
    result: String,
    created_at: SystemTime,
}

/// In-memory idempotency store (production: use Redis/database)
pub struct IdempotencyStore {
    store: Arc<Mutex<HashMap<String, IdempotencyEntry>>>,
    ttl: Duration,
}

impl IdempotencyStore {
    /// Create new idempotency store with TTL
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            store: Arc::new(Mutex::new(HashMap::new())),
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    /// Check if key exists and is still valid
    pub fn check(&self, key: &str) -> Option<String> {
        let mut store = self.store.lock().unwrap();
        
        // Clean up expired entries
        let now = SystemTime::now();
        store.retain(|_, entry| {
            now.duration_since(entry.created_at)
                .map(|d| d < self.ttl)
                .unwrap_or(false)
        });

        // Check if key exists
        if let Some(entry) = store.get(key) {
            tracing::info!("🔄 Idempotency key found: {} (returning cached result)", key);
            return Some(entry.result.clone());
        }

        None
    }

    /// Store result for idempotency key
    pub fn store(&self, key: &str, result: &str) {
        let mut store = self.store.lock().unwrap();
        store.insert(
            key.to_string(),
            IdempotencyEntry {
                result: result.to_string(),
                created_at: SystemTime::now(),
            },
        );
        tracing::info!("💾 Stored idempotency key: {}", key);
    }

    /// Clear all entries (for testing)
    #[cfg(test)]
    pub fn clear(&self) {
        let mut store = self.store.lock().unwrap();
        store.clear();
    }
}

/// Generate idempotency key from request data
pub fn generate_key(prefix: &str, data: &[&str]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(prefix.as_bytes());
    for item in data {
        hasher.update(item.as_bytes());
    }
    let hash = hasher.finalize();
    format!("{}_{}", prefix, hex::encode(hash))
}

/// Webhook idempotency: Track webhook IDs to prevent replay
#[derive(Clone)]
pub struct WebhookDeduplicator {
    store: Arc<Mutex<HashMap<String, SystemTime>>>,
    ttl: Duration,
}

impl WebhookDeduplicator {
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            store: Arc::new(Mutex::new(HashMap::new())),
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    /// Check if webhook was already processed
    pub fn is_duplicate(&self, webhook_id: &str) -> bool {
        let mut store = self.store.lock().unwrap();
        
        // Clean up old entries
        let now = SystemTime::now();
        store.retain(|_, timestamp| {
            now.duration_since(*timestamp)
                .map(|d| d < self.ttl)
                .unwrap_or(false)
        });

        if store.contains_key(webhook_id) {
            tracing::warn!("🚫 Duplicate webhook detected: {}", webhook_id);
            return true;
        }

        store.insert(webhook_id.to_string(), now);
        tracing::debug!("✅ New webhook: {}", webhook_id);
        false
    }

    #[cfg(test)]
    pub fn clear(&self) {
        let mut store = self.store.lock().unwrap();
        store.clear();
    }
}

/// Task completion state to prevent double-completion
#[derive(Clone, Debug, PartialEq)]
pub enum TaskState {
    Pending,
    InProgress,
    Completed,
    Cancelled,
}

/// Atomic task state manager
pub struct TaskStateManager {
    states: Arc<Mutex<HashMap<String, TaskState>>>,
}

impl TaskStateManager {
    pub fn new() -> Self {
        Self {
            states: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Atomically try to transition task to completed state
    /// Returns true if transition succeeded, false if already completed
    pub fn try_complete(&self, task_id: &str) -> bool {
        let mut states = self.states.lock().unwrap();
        
        match states.get(task_id) {
            Some(TaskState::Completed) => {
                tracing::warn!("🚫 Task {} already completed", task_id);
                false
            }
            Some(TaskState::Cancelled) => {
                tracing::warn!("🚫 Task {} is cancelled", task_id);
                false
            }
            _ => {
                states.insert(task_id.to_string(), TaskState::Completed);
                tracing::info!("✅ Task {} marked as completed", task_id);
                true
            }
        }
    }

    /// Get current task state
    pub fn get_state(&self, task_id: &str) -> TaskState {
        let states = self.states.lock().unwrap();
        states.get(task_id).cloned().unwrap_or(TaskState::Pending)
    }

    #[cfg(test)]
    pub fn clear(&self) {
        let mut states = self.states.lock().unwrap();
        states.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_idempotency_store() {
        let store = IdempotencyStore::new(60);
        let key = "test_key";
        
        // First check should return None
        assert!(store.check(key).is_none());
        
        // Store a result
        store.store(key, "success");
        
        // Second check should return cached result
        assert_eq!(store.check(key), Some("success".to_string()));
    }

    #[test]
    fn test_webhook_deduplicator() {
        let dedup = WebhookDeduplicator::new(60);
        let webhook_id = "webhook_123";
        
        // First webhook should not be duplicate
        assert!(!dedup.is_duplicate(webhook_id));
        
        // Same webhook ID should be duplicate
        assert!(dedup.is_duplicate(webhook_id));
    }

    #[test]
    fn test_task_state_manager() {
        let manager = TaskStateManager::new();
        let task_id = "task_123";
        
        // Should start in Pending state
        assert_eq!(manager.get_state(task_id), TaskState::Pending);
        
        // First completion should succeed
        assert!(manager.try_complete(task_id));
        assert_eq!(manager.get_state(task_id), TaskState::Completed);
        
        // Second completion should fail
        assert!(!manager.try_complete(task_id));
    }

    #[test]
    fn test_generate_key() {
        let key1 = generate_key("payment", &["user123", "100usdc"]);
        let key2 = generate_key("payment", &["user123", "100usdc"]);
        let key3 = generate_key("payment", &["user123", "200usdc"]);
        
        // Same data should generate same key
        assert_eq!(key1, key2);
        
        // Different data should generate different key
        assert_ne!(key1, key3);
    }
}
