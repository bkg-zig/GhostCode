mod config;
mod core;
mod routes;
mod state;

use axum::{routing::get, Router};
use config::ServerConfig;
use routes::{chat, health, images, train, tts, videos};
use state::AppState;
use std::net::SocketAddr;
use tokio::signal;
use tracing::{info, warn};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = ServerConfig::from_env();
    init_tracing(&config);

    let state = AppState::try_new(&config).await?;
    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;

    let app = Router::new()
        .route("/health", get(health::health))
        .merge(chat::router())
        .merge(tts::router())
        .merge(images::router())
        .merge(videos::router())
        .merge(train::router())
        .with_state(state);

    info!("🚀 ai-server listening on http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await?, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("👋 ai-server shutdown complete");
    Ok(())
}

fn init_tracing(config: &ServerConfig) {
    let env_filter = std::env::var("RUST_LOG")
        .unwrap_or_else(|_| format!("ai_server={},axum=info", config.log_level));
    let _ = tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .compact()
        .try_init();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => warn!("received Ctrl+C"),
        _ = terminate => warn!("received termination signal"),
    }
}
