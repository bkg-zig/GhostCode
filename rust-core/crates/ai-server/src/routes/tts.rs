use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{core::tts, state::AppState};

#[derive(Deserialize)]
pub struct TtsRequest {
    pub text: String,
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Serialize)]
pub struct TtsResponse {
    pub audio_base64: String,
    pub sample_rate_hz: u32,
    pub model: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/tts/synthesize", post(handle_tts))
}

async fn handle_tts(
    State(state): State<AppState>,
    Json(payload): Json<TtsRequest>,
) -> Result<Json<TtsResponse>, Json<serde_json::Value>> {
    if payload.text.trim().is_empty() {
        return Err(Json(serde_json::json!({
            "error": "text must not be empty"
        })));
    }

    let requested = payload.model.as_deref();
    match tts::synthesize(&state.registry, requested, &payload.text).await {
        Ok(audio) => Ok(Json(TtsResponse {
            audio_base64: audio.audio_base64,
            sample_rate_hz: audio.sample_rate_hz,
            model: requested.unwrap_or("ghost-tts-lite").to_string(),
        })),
        Err(err) => Err(Json(serde_json::json!({
            "error": err.to_string()
        }))),
    }
}
