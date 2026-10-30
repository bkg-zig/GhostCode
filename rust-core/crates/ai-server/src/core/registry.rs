use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use thiserror::Error;
use tokio::fs;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum RegistryError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("model `{0}` not found")]
    NotFound(String),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelMetadata {
    pub id: Uuid,
    pub name: String,
    pub modality: ModelModality,
    pub description: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelModality {
    Llm,
    Tts,
    Image,
    Video,
}

#[derive(Clone)]
pub struct ModelRegistry {
    models: ArcRegistry,
}

type ArcRegistry = Arc<RwLock<HashMap<String, ModelMetadata>>>;

impl ModelRegistry {
    pub async fn load_from_path(path: &str) -> Result<Self, RegistryError> {
        let exists = Path::new(path).exists();
        if !exists {
            if let Some(parent) = Path::new(path).parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).await?;
                }
            }
            fs::write(path, b"{}").await?;
        }

        let registry = Self {
            models: new_registry_store(),
        };
        registry.seed_defaults().await;
        Ok(registry)
    }

    pub async fn get_model(&self, name: &str) -> Result<ModelMetadata, RegistryError> {
        let models = self.models.read().await;
        models
            .get(name)
            .cloned()
            .ok_or_else(|| RegistryError::NotFound(name.to_string()))
    }

    pub async fn list_models(&self) -> Vec<ModelMetadata> {
        let models = self.models.read().await;
        models.values().cloned().collect()
    }

    async fn seed_defaults(&self) {
        let mut models = self.models.write().await;
        if !models.is_empty() {
            return;
        }

        let defaults = vec![
            ModelMetadata {
                id: Uuid::new_v4(),
                name: "ghost-llm-mini".into(),
                modality: ModelModality::Llm,
                description: "Placeholder conversational model.".into(),
            },
            ModelMetadata {
                id: Uuid::new_v4(),
                name: "ghost-tts-lite".into(),
                modality: ModelModality::Tts,
                description: "Placeholder text-to-speech voice.".into(),
            },
            ModelMetadata {
                id: Uuid::new_v4(),
                name: "ghost-diffusion".into(),
                modality: ModelModality::Image,
                description: "Placeholder text-to-image diffusion model.".into(),
            },
            ModelMetadata {
                id: Uuid::new_v4(),
                name: "ghost-video-diffusion".into(),
                modality: ModelModality::Video,
                description: "Placeholder text-to-video diffusion model.".into(),
            },
        ];

        for model in defaults {
            models.insert(model.name.clone(), model);
        }
    }
}

fn new_registry_store() -> ArcRegistry {
    Arc::new(RwLock::new(HashMap::new()))
}
