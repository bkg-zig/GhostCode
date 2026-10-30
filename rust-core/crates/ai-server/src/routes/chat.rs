use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{core::llm, state::AppState};

#[derive(Deserialize)]
pub struct ChatRequest {
    pub prompt: String,
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub response: String,
    pub model: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/chat/completions", post(handle_chat))
}

async fn handle_chat(
    State(state): State<AppState>,
    Json(payload): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, Json<serde_json::Value>> {
    if payload.prompt.trim().is_empty() {
        return Err(Json(serde_json::json!({
            "error": "prompt must not be empty"
        })));
    }

    let requested = payload.model.as_deref();
    match llm::generate_completion(&state.registry, requested, &payload.prompt).await {
        Ok(text) => Ok(Json(ChatResponse {
            response: text,
            model: requested.unwrap_or("ghost-llm-mini").to_string(),
        })),
        Err(err) => Err(Json(serde_json::json!({
            "error": err.to_string()
        }))),
    }
}
