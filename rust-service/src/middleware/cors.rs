// Phase 2 Security: CORS Hardening
// Removes wildcard origins, whitelists specific domains

use tower_http::cors::{CorsLayer, AllowOrigin};
use axum::http::{
    header::{AUTHORIZATION, CONTENT_TYPE, ACCEPT},
    Method,
    HeaderValue,
};

/// Configure CORS with strict origin whitelisting
/// 
/// Security improvements:
/// - No more allow_origin(Any) - prevents CSRF from arbitrary domains
/// - Whitelisted origins only - development + production domains
/// - Restricted methods - only what's needed
/// - Restricted headers - no arbitrary headers
pub fn configure_cors(demo_mode: bool) -> CorsLayer {
    let allowed_origins: Vec<HeaderValue> = if demo_mode {
        // Development mode: Allow localhost variants
        vec![
            "http://localhost:3000".parse().unwrap(),
            "http://127.0.0.1:3000".parse().unwrap(),
            "http://localhost:3001".parse().unwrap(),
        ]
    } else {
        // Production mode: Only allow production domains
        vec![
            // Add your production domains here
            "https://humangrid.ai".parse().unwrap(),
            "https://app.humangrid.ai".parse().unwrap(),
        ]
    };

    CorsLayer::new()
        .allow_origin(AllowOrigin::list(allowed_origins))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::OPTIONS,
        ])
        .allow_headers([
            AUTHORIZATION,
            CONTENT_TYPE,
            ACCEPT,
        ])
        .allow_credentials(true)
}
