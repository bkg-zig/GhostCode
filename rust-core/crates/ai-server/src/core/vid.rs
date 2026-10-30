use super::registry::{ModelModality, ModelRegistry, RegistryError};
use base64::{engine::general_purpose, Engine as _};

pub struct GeneratedVideo {
    pub video_base64: String,
    pub mime_type: &'static str,
}

pub async fn generate(
    registry: &ModelRegistry,
    model_name: Option<&str>,
    prompt: &str,
) -> Result<GeneratedVideo, RegistryError> {
    let target = model_name.unwrap_or("ghost-video-diffusion");
    let model = registry.get_model(target).await?;
    if !matches!(model.modality, ModelModality::Video) {
        return Err(RegistryError::NotFound(target.to_string()));
    }

    let fake_frames = build_placeholder_frames(prompt);
    Ok(GeneratedVideo {
        video_base64: general_purpose::STANDARD.encode(fake_frames),
        mime_type: "video/mp4",
    })
}

fn build_placeholder_frames(prompt: &str) -> Vec<u8> {
    let mut seed = prompt.bytes().fold(1_048_573u32, |acc, b| acc ^ (b as u32));
    let mut bytes = vec![0u8; 120 * 4];
    for chunk in bytes.chunks_mut(4) {
        seed = seed.rotate_left(5).wrapping_add(0x9E_37_79_B9);
        chunk[0] = (seed & 0xFF) as u8;
        chunk[1] = ((seed >> 8) & 0xFF) as u8;
        chunk[2] = ((seed >> 16) & 0xFF) as u8;
        chunk[3] = 255;
    }
    bytes
}
