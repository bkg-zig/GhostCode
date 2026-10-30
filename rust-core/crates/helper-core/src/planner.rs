use anyhow::{anyhow, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize)]
pub struct ChatContext {
    pub prompt: String,
    pub context: Option<String>,
}

impl ChatContext {
    pub fn new(prompt: impl Into<String>, context: Option<String>) -> Self {
        Self {
            prompt: prompt.into(),
            context,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PlanResponse {
    pub summary: String,
    pub suggestions: Vec<String>,
    pub generated_at: String,
}

/// Lightweight planner that extracts actionable steps from a prompt.
pub async fn plan_action(context: &ChatContext) -> Result<PlanResponse> {
    let prompt = context.prompt.trim();
    if prompt.is_empty() {
        return Err(anyhow!("prompt must not be empty"));
    }

    let summary = format!(
        "Planning steps for a prompt containing {} characters.",
        prompt.chars().count()
    );

    let mut suggestions = Vec::new();
    suggestions.push("Clarify the desired outcome and success criteria.".to_string());
    suggestions.push("Identify the key files or modules that will be touched.".to_string());
    suggestions.push("Draft the next 2-3 concrete actions to progress the task.".to_string());
    if let Some(extra) = context
        .context
        .as_ref()
        .map(|c| c.trim())
        .filter(|c| !c.is_empty())
    {
        suggestions.push(format!("Incorporate provided context: {}", extra));
    }

    Ok(PlanResponse {
        summary,
        suggestions,
        generated_at: Utc::now().to_rfc3339(),
    })
}
