use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{core::vid, state::AppState};

#[derive(Deserialize)]
pub struct VideoRequest {
    pub prompt: String,
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Serialize)]
pub struct VideoResponse {
    pub video_base64: String,
    pub mime_type: String,
    pub model: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/videos/generate", post(handle_video))
}

async fn handle_video(
    State(state): State<AppState>,
    Json(payload): Json<VideoRequest>,
) -> Result<Json<VideoResponse>, Json<serde_json::Value>> {
    if payload.prompt.trim().is_empty() {
        return Err(Json(serde_json::json!({
            "error": "prompt must not be empty"
        })));
    }

    let requested = payload.model.as_deref();
    match vid::generate(&state.registry, requested, &payload.prompt).await {
        Ok(video) => Ok(Json(VideoResponse {
            video_base64: video.video_base64,
            mime_type: video.mime_type.to_string(),
            model: requested.unwrap_or("ghost-video-diffusion").to_string(),
        })),
        Err(err) => Err(Json(serde_json::json!({
            "error": err.to_string()
        }))),
    }
}
