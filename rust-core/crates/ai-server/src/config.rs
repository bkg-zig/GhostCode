use std::env;

#[derive(Clone, Debug)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub helper_db_path: String,
    pub helper_mode: String,
    pub analysis_threads: usize,
    pub log_level: String,
}

impl ServerConfig {
    pub fn from_env() -> Self {
        Self {
            host: env::var("AI_SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port: env::var("AI_SERVER_PORT")
                .ok()
                .and_then(|value| value.parse().ok())
                .unwrap_or(5001),
            helper_db_path: env::var("HELPER_DB_PATH").unwrap_or_else(|_| "/data/helper.db".into()),
            helper_mode: env::var("HELPER_MODE").unwrap_or_else(|_| "development".into()),
            analysis_threads: env::var("HELPER_ANALYSIS_THREADS")
                .ok()
                .and_then(|value| value.parse().ok())
                .unwrap_or(2),
            log_level: env::var("AI_SERVER_LOG_LEVEL").unwrap_or_else(|_| "info".into()),
        }
    }
}
