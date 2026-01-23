use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod blockchain;
mod circle;
mod config;
mod crypto;
mod error;
mod idempotency;
mod middleware;
mod models;
mod verifier;
mod reputation;
mod fraud;

use config::Config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "humangrid_service=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenv::dotenv().ok();
    let config = Config::from_env()?;

    tracing::info!("🚀 Starting HumanGrid Protocol Service");
    tracing::info!("📡 Chain ID: {}", config.chain_id);
    tracing::info!("🔗 RPC: {}", config.rpc_url);

    // SECURITY: Validate configuration before starting
    tracing::info!("🔒 Validating security configuration...");
    match config.validate_security() {
        Ok(_) => {
            tracing::info!("✅ Security validation passed");
        }
        Err(e) => {
            tracing::error!("🚨 SECURITY VALIDATION FAILED: {}", e);
            if !config.demo_mode {
                return Err(format!(
                    "Production mode requires secure configuration: {}", e
                ).into());
            } else {
                tracing::warn!("⚠️  Demo mode - continuing despite security issues");
            }
        }
    }

    tracing::info!("🔐 Security Status:");
    tracing::info!("   - Entity Secret Encrypted: {}", config.circle_entity_secret_encrypted);
    tracing::info!("   - Demo Mode: {}", config.demo_mode);
    tracing::info!("   - Fraud Detection: {}", config.enable_fraud_detection);

    // Initialize blockchain connection
    let blockchain = blockchain::BlockchainClient::new(&config).await?;
    tracing::info!("✅ Connected to blockchain");

    // Initialize Circle client
    let circle_client = circle::CircleClient::new(std::sync::Arc::new(config.clone()))?;
    tracing::info!("✅ Connected to Circle API");

    // Build application state
    let app_state = Arc::new(api::AppState::new(config.clone(), blockchain, circle_client));

    // Configure CORS (Phase 2: Hardened - no more wildcard origins)
    tracing::info!("🔒 Configuring CORS with origin whitelist");
    let cors = middleware::configure_cors(config.demo_mode);

    // Phase 2: Create rate limiters for different endpoint categories
    tracing::info!("⏱️  Configuring rate limiting");
    let _general_limiter = middleware::create_general_limiter();
    let _auth_limiter = middleware::create_auth_limiter();
    let _wallet_limiter = middleware::create_wallet_limiter();
    let _circle_limiter = middleware::create_circle_limiter();

    // Build router with rate limiting per endpoint category
    let app = Router::new()
        // Health checks - general rate limit
        .route("/", get(api::health::health_check))
        .route("/health", get(api::health::health_check))
        
        // General API endpoints - general rate limit (100/min)
        .route("/api/verify-task", post(api::verify::verify_task))
        .route("/api/task-status/:task_id", get(api::verify::get_task_status))
        .route("/api/calculate-reputation", post(api::reputation::calculate_reputation))
        .route("/api/report-fraud", post(api::fraud::report_fraud))
        .route("/api/worker-stats/:address", get(api::reputation::get_worker_stats))
        .route("/api/tasks/create", post(api::tasks::create_task))
        .route("/api/tasks/:task_id", get(api::tasks::get_task))
        .route("/api/tasks/:task_id/assign", post(api::tasks::assign_task))
        .route("/api/tasks/:task_id/complete", post(api::tasks::complete_task))
        
        // Wallet authentication - strict rate limit (10/min - prevent brute force)
        .route("/api/wallet/authenticate", post(api::wallet::authenticate_wallet))
        
        // Wallet operations - wallet rate limit (20/min)
        .route("/api/wallet/link-circle", post(api::wallet::link_circle_wallet))
        .route("/api/wallet/:user_id", get(api::wallet::get_user_wallet))
        
        // Circle API operations - circle rate limit (30/min)
        .route("/api/circle/create-wallet", post(api::circle::create_wallet))
        .route("/api/circle/balance/:wallet_id", get(api::circle::get_balance))
        .route("/api/circle/pay-worker", post(api::circle::pay_worker))
        .route("/api/circle/transfer-status/:transfer_id", get(api::circle::get_transfer_status))
        
        .layer(cors)
        .with_state(app_state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("🎧 Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
