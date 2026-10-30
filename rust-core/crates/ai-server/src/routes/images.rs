use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

use crate::{core::img, state::AppState};

#[derive(Deserialize)]
pub struct ImageRequest {
    pub prompt: String,
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Serialize)]
pub struct ImageResponse {
    pub image_base64: String,
    pub mime_type: String,
    pub model: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/api/images/generate", post(handle_image))
}

async fn handle_image(
    State(state): State<AppState>,
    Json(payload): Json<ImageRequest>,
) -> Result<Json<ImageResponse>, Json<serde_json::Value>> {
    if payload.prompt.trim().is_empty() {
        return Err(Json(serde_json::json!({
            "error": "prompt must not be empty"
        })));
    }

    let requested = payload.model.as_deref();
    match img::generate(&state.registry, requested, &payload.prompt).await {
        Ok(image) => Ok(Json(ImageResponse {
            image_base64: image.image_base64,
            mime_type: image.mime_type.to_string(),
            model: requested.unwrap_or("ghost-diffusion").to_string(),
        })),
        Err(err) => Err(Json(serde_json::json!({
            "error": err.to_string()
        }))),
    }
}
