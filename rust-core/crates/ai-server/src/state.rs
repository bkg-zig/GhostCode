use crate::config::ServerConfig;
use crate::core::registry::{ModelRegistry, RegistryError};
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<ServerConfig>,
    pub registry: Arc<ModelRegistry>,
}

impl AppState {
    pub async fn try_new(config: &ServerConfig) -> Result<Self, RegistryError> {
        info!(
            mode = %config.helper_mode,
            threads = config.analysis_threads,
            db_path = %config.helper_db_path,
            "initializing model registry"
        );
        let registry = ModelRegistry::load_from_path(&config.helper_db_path).await?;
        Ok(Self {
            config: Arc::new(config.clone()),
            registry: Arc::new(registry),
        })
    }
}
