//! Local helper-core implementation providing analysis, planner, agents, and health primitives.

pub mod agents;
pub mod analysis;
pub mod health;
pub mod lsp;
pub mod planner;

pub use crate::health::{HealthComponent, HealthReport, HealthState};
