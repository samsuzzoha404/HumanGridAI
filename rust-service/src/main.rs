use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod blockchain;
mod circle;
mod config;
mod error;
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

    // Initialize blockchain connection
    let blockchain = blockchain::BlockchainClient::new(&config).await?;
    tracing::info!("✅ Connected to blockchain");

    // Initialize Circle client
    let circle_client = circle::CircleClient::new(std::sync::Arc::new(config.clone()))?;
    tracing::info!("✅ Connected to Circle API");

    // Build application state
    let app_state = Arc::new(api::AppState::new(config.clone(), blockchain, circle_client));

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/", get(api::health::health_check))
        .route("/health", get(api::health::health_check))
        .route("/api/verify-task", post(api::verify::verify_task))
        .route("/api/task-status/:task_id", get(api::verify::get_task_status))
        .route("/api/calculate-reputation", post(api::reputation::calculate_reputation))
        .route("/api/report-fraud", post(api::fraud::report_fraud))
        .route("/api/worker-stats/:address", get(api::reputation::get_worker_stats))
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
