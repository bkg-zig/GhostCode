use super::registry::{ModelModality, ModelRegistry, RegistryError};
use base64::{engine::general_purpose, Engine as _};

pub struct SynthesizedAudio {
    pub audio_base64: String,
    pub sample_rate_hz: u32,
}

pub async fn synthesize(
    registry: &ModelRegistry,
    model_name: Option<&str>,
    text: &str,
) -> Result<SynthesizedAudio, RegistryError> {
    let target = model_name.unwrap_or("ghost-tts-lite");
    let model = registry.get_model(target).await?;
    if !matches!(model.modality, ModelModality::Tts) {
        return Err(RegistryError::NotFound(target.to_string()));
    }

    let pcm: Vec<u8> = text
        .as_bytes()
        .iter()
        .copied()
        .flat_map(|byte| [byte, 255 - byte])
        .collect();

    Ok(SynthesizedAudio {
        audio_base64: general_purpose::STANDARD.encode(pcm),
        sample_rate_hz: 22_050,
    })
}
