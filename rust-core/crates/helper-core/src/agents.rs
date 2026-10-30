use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Debug, Deserialize)]
pub struct AgentEvent {
    pub kind: String,
    #[serde(default)]
    pub payload: Value,
}

#[derive(Clone, Debug, Serialize)]
pub struct AgentAdvice {
    pub content: String,
    pub level: AdviceLevel,
    pub timestamp: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AdviceLevel {
    Info,
    Warning,
    Error,
}

pub struct LiveAdvisor {
    observations: Vec<String>,
}

impl LiveAdvisor {
    pub fn new() -> Self {
        Self {
            observations: Vec::new(),
        }
    }

    pub async fn handle_event(&mut self, event: AgentEvent) -> Result<Option<AgentAdvice>> {
        if event.kind.trim().is_empty() {
            return Err(anyhow!("agent event kind must not be empty"));
        }

        self.observations.push(event.kind.clone());
        let content = match event.kind.as_str() {
            "log" => format!("Captured log event: {}", summarize_payload(&event.payload)),
            "diagnostic" => format!("Diagnostic received: {}", summarize_payload(&event.payload)),
            other => format!("Unhandled event `{other}` recorded."),
        };

        Ok(Some(AgentAdvice {
            content,
            level: AdviceLevel::Info,
            timestamp: Utc::now(),
        }))
    }

    pub fn observations(&self) -> &[String] {
        &self.observations
    }
}

impl Default for LiveAdvisor {
    fn default() -> Self {
        Self::new()
    }
}

fn summarize_payload(value: &Value) -> String {
    match value {
        Value::Null => "no payload".to_string(),
        Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}
