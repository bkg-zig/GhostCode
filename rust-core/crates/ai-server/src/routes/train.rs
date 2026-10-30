use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;

#[derive(Deserialize)]
pub struct TrainRequest {
    pub model: String,
    pub dataset_uri: String,
    #[serde(default)]
    pub epochs: Option<u32>,
}

#[derive(Serialize)]
pub struct TrainResponse {
    pub job_id: Uuid,
    pub message: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/train/lora", post(handle_train))
}

async fn handle_train(
    State(state): State<AppState>,
    Json(payload): Json<TrainRequest>,
) -> Result<Json<TrainResponse>, Json<serde_json::Value>> {
    if payload.model.trim().is_empty() {
        return Err(Json(serde_json::json!({
            "error": "model must not be empty"
        })));
    }
    if payload.dataset_uri.trim().is_empty() {
        return Err(Json(serde_json::json!({
            "error": "dataset_uri must not be empty"
        })));
    }

    // Ensure the model exists.
    if let Err(err) = state.registry.get_model(&payload.model).await {
        return Err(Json(serde_json::json!({
            "error": err.to_string()
        })));
    }

    let job_id = Uuid::new_v4();
    let message = format!(
        "Scheduled LoRA training for model `{}` with dataset `{}` for {} epochs (stub).",
        payload.model,
        payload.dataset_uri,
        payload.epochs.unwrap_or(3)
    );

    Ok(Json(TrainResponse { job_id, message }))
}
