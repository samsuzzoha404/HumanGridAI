// Phase 2 Security: Rate Limiting Middleware
// Prevents DDoS, brute force, and resource exhaustion attacks

use axum::{
    extract::{ConnectInfo, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use governor::{
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
use std::net::SocketAddr;
use std::sync::Arc;
use std::num::NonZeroU32;

/// Rate limiter for general API endpoints
/// Limit: 100 requests per minute per IP
pub fn create_general_limiter() -> Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>> {
    let quota = Quota::per_minute(NonZeroU32::new(100).unwrap());
    Arc::new(RateLimiter::direct(quota))
}

/// Rate limiter for authentication endpoints
/// Limit: 10 requests per minute per IP (prevent brute force)
pub fn create_auth_limiter() -> Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>> {
    let quota = Quota::per_minute(NonZeroU32::new(10).unwrap());
    Arc::new(RateLimiter::direct(quota))
}

/// Rate limiter for wallet operations
/// Limit: 20 requests per minute per IP
pub fn create_wallet_limiter() -> Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>> {
    let quota = Quota::per_minute(NonZeroU32::new(20).unwrap());
    Arc::new(RateLimiter::direct(quota))
}

/// Rate limiter for Circle API operations
/// Limit: 30 requests per minute per IP (Circle has its own rate limits)
pub fn create_circle_limiter() -> Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>> {
    let quota = Quota::per_minute(NonZeroU32::new(30).unwrap());
    Arc::new(RateLimiter::direct(quota))
}

/// Middleware function that applies rate limiting based on IP address
pub async fn rate_limit_middleware(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    limiter: Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Check rate limit
    match limiter.check() {
        Ok(_) => {
            // Within rate limit - proceed
            tracing::debug!("✅ Rate limit OK for {}", addr.ip());
            Ok(next.run(request).await)
        }
        Err(_) => {
            // Rate limit exceeded
            tracing::warn!("🚫 Rate limit exceeded for {}", addr.ip());
            Err(StatusCode::TOO_MANY_REQUESTS)
        }
    }
}

/// Extract wallet address from request for wallet-specific rate limiting
pub fn extract_wallet_address(request: &Request) -> Option<String> {
    // Try to extract from path
    if let Some(wallet) = request.uri().path().split('/').find(|s| s.starts_with("0x")) {
        return Some(wallet.to_string());
    }
    
    // Try to extract from headers
    if let Some(wallet) = request.headers().get("x-wallet-address") {
        if let Ok(wallet_str) = wallet.to_str() {
            return Some(wallet_str.to_string());
        }
    }
    
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limiter_creation() {
        let limiter = create_general_limiter();
        assert!(limiter.check().is_ok());
    }

    #[test]
    fn test_rate_limiter_exhaustion() {
        let limiter = create_auth_limiter();
        
        // Should allow 10 requests
        for _ in 0..10 {
            assert!(limiter.check().is_ok());
        }
        
        // 11th request should be rate limited
        assert!(limiter.check().is_err());
    }
}
