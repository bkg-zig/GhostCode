//! Semantic analysis adapter used by the Ghost Coding Cave rust-core.
//!
//! This adapter wraps the upstream `helper` semantic primitives and
//! exposes a lightweight, synchronous API that can be consumed by the
//! Axum gateway without pulling in the full Helper runtime.

use anyhow::Result;
use helper_core::analysis::{self, AnalysisReport};
use helper_core::HealthReport;
use serde::{Deserialize, Serialize};

pub use helper_core::analysis::{Reference, Symbol};

#[derive(Clone, Debug, Deserialize)]
pub struct SemanticRequest {
    pub language: String,
    pub content: String,
    #[serde(default)]
    pub file_path: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct SemanticSummary {
    pub language: String,
    pub line_count: usize,
    pub char_count: usize,
    pub todo_markers: usize,
    pub import_statements: Vec<String>,
    pub symbols: Vec<Symbol>,
    pub references: Vec<Reference>,
    pub health: HealthReport,
}

#[derive(Clone, Default)]
pub struct SemanticAdapter;

impl SemanticAdapter {
    pub fn new() -> Self {
        Self
    }

    pub async fn analyze(&self, request: SemanticRequest) -> Result<SemanticSummary> {
        self.analyze_full(request).await
    }

    pub async fn analyze_full(&self, request: SemanticRequest) -> Result<SemanticSummary> {
        let report = analysis::analyze_full(&request.content, &request.language).await?;
        Ok(Self::from_report(report))
    }

    pub fn symbols(&self, language: &str, content: &str) -> Result<Vec<Symbol>> {
        analysis::symbols(language, content)
    }

    pub fn references(&self, symbol_name: &str, content: &str) -> Result<Vec<Reference>> {
        analysis::references(symbol_name, content)
    }
}

impl SemanticAdapter {
    fn from_report(report: AnalysisReport) -> SemanticSummary {
        SemanticSummary {
            language: report.language,
            line_count: report.line_count,
            char_count: report.char_count,
            todo_markers: report.todo_markers,
            import_statements: report.imports,
            symbols: report.symbols,
            references: report.references,
            health: report.health,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn analyzes_rust_source() -> Result<()> {
        let adapter = SemanticAdapter::new();
        let request = SemanticRequest {
            language: "rust".to_string(),
            content: "use std::collections::HashMap;\n// TODO: implement logic\nfn main() {}"
                .to_string(),
            file_path: None,
        };
        let summary = adapter.analyze(request).await?;
        assert_eq!(summary.line_count, 3);
        assert_eq!(summary.todo_markers, 1);
        assert!(!summary.import_statements.is_empty());
        assert!(!summary.symbols.is_empty()); // Expect at least main fn symbol
        assert!(!summary.health.components.is_empty());
        Ok(())
    }

    #[test]
    fn finds_symbols_in_typescript() -> Result<()> {
        let adapter = SemanticAdapter::new();
        let content =
            "function greet(name: string): string { return `Hello ${name}`; }".to_string();
        let symbols = adapter.symbols("typescript", &content)?;
        assert!(!symbols.is_empty());
        assert_eq!(symbols[0].name, "greet");
        Ok(())
    }

    #[test]
    fn finds_references_in_python() -> Result<()> {
        let adapter = SemanticAdapter::new();
        let content = "def func(): pass\nfunc()\nfunc(arg)\nother_func()\nfunc\nfunc2".to_string();
        let refs = adapter.references("func", &content)?;
        assert_eq!(refs.len(), 5); // Five references to func
        Ok(())
    }
}
