use super::registry::{ModelModality, ModelRegistry, RegistryError};
use base64::{engine::general_purpose, Engine as _};

pub struct GeneratedImage {
    pub image_base64: String,
    pub mime_type: &'static str,
}

pub async fn generate(
    registry: &ModelRegistry,
    model_name: Option<&str>,
    prompt: &str,
) -> Result<GeneratedImage, RegistryError> {
    let target = model_name.unwrap_or("ghost-diffusion");
    let model = registry.get_model(target).await?;
    if !matches!(model.modality, ModelModality::Image) {
        return Err(RegistryError::NotFound(target.to_string()));
    }

    let pixels = render_placeholder_pixels(prompt);
    Ok(GeneratedImage {
        image_base64: general_purpose::STANDARD.encode(pixels),
        mime_type: "image/png",
    })
}

fn render_placeholder_pixels(prompt: &str) -> Vec<u8> {
    let mut seed = prompt
        .bytes()
        .fold(0u32, |acc, b| acc.wrapping_add(b as u32));
    let mut pixels = vec![0u8; 64 * 64 * 4];
    for chunk in pixels.chunks_mut(4) {
        seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904);
        chunk[0] = (seed & 0xFF) as u8;
        chunk[1] = ((seed >> 8) & 0xFF) as u8;
        chunk[2] = ((seed >> 16) & 0xFF) as u8;
        chunk[3] = 255;
    }
    pixels
}
