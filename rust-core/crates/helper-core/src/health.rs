use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Represents core service health states.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum HealthState {
    Operational,
    Degraded,
    Unavailable,
}

/// A single component participating in the platform health score.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HealthComponent {
    pub name: String,
    pub state: HealthState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

impl HealthComponent {
    pub fn operational(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            state: HealthState::Operational,
            details: None,
        }
    }

    pub fn degraded(name: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            state: HealthState::Degraded,
            details: Some(details.into()),
        }
    }
}

/// Aggregated health representation for external consumers.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HealthReport {
    pub service: String,
    pub state: HealthState,
    pub generated_at: DateTime<Utc>,
    pub components: Vec<HealthComponent>,
}

impl HealthReport {
    /// Returns a healthy status for the helper-core service.
    pub fn healthy() -> Self {
        Self {
            service: "helper-core".to_string(),
            state: HealthState::Operational,
            generated_at: Utc::now(),
            components: vec![HealthComponent::operational("core")],
        }
    }
}

impl Default for HealthReport {
    fn default() -> Self {
        Self::healthy()
    }
}
