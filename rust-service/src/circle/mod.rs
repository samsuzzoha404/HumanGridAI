pub mod types;
pub mod wallets;
pub mod transfers;
pub mod webhooks;

pub use types::*;
pub use wallets::*;
pub use transfers::*;
pub use webhooks::*;

use crate::config::Config;
use reqwest::{Client, header};
use std::sync::Arc;

/// Circle API client for managing programmable wallets
#[derive(Clone)]
pub struct CircleClient {
    http_client: Client,
    config: Arc<Config>,
}

impl CircleClient {
    pub fn new(config: Arc<Config>) -> anyhow::Result<Self> {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", config.circle_api_key))?,
        );
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );
        headers.insert(
            header::ACCEPT,
            header::HeaderValue::from_static("application/json"),
        );

        let http_client = Client::builder()
            .default_headers(headers)
            .build()?;

        Ok(Self {
            http_client,
            config,
        })
    }

    pub fn http_client(&self) -> &Client {
        &self.http_client
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub fn api_url(&self) -> &str {
        &self.config.circle_api_url
    }
}
