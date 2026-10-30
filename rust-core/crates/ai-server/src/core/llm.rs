use super::registry::{ModelModality, ModelRegistry, RegistryError};

pub async fn generate_completion(
    registry: &ModelRegistry,
    model_name: Option<&str>,
    prompt: &str,
) -> Result<String, RegistryError> {
    let target = model_name.unwrap_or("ghost-llm-mini");
    let model = registry.get_model(target).await?;
    if !matches!(model.modality, ModelModality::Llm) {
        return Err(RegistryError::NotFound(target.to_string()));
    }
    Ok(format!(
        "Model `{}` generated a stub response to prompt: \"{}\"",
        model.name, prompt
    ))
}
