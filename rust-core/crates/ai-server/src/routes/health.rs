use axum::{extract::State, Json};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    service: &'static str,
    status: &'static str,
    models_loaded: usize,
    mode: String,
}

pub async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    let models_loaded = state.registry.list_models().await.len();
    Json(HealthResponse {
        service: "ai-server",
        status: "ok",
        models_loaded,
        mode: state.config.helper_mode.clone(),
    })
}
