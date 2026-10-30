use anyhow::Result;
use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::health::{HealthComponent, HealthReport};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Symbol {
    pub name: String,
    pub kind: String,
    pub line: usize,
    pub column: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Reference {
    pub symbol_name: String,
    pub line: usize,
    pub column: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AnalysisReport {
    pub language: String,
    pub line_count: usize,
    pub char_count: usize,
    pub todo_markers: usize,
    pub imports: Vec<String>,
    pub symbols: Vec<Symbol>,
    pub references: Vec<Reference>,
    pub health: HealthReport,
}

/// Perform a lightweight analysis pass over the supplied content.
pub async fn analyze_full(content: &str, language: &str) -> Result<AnalysisReport> {
    let symbols = symbols(language, content)?;
    let mut reference_hits = Vec::new();
    for symbol in &symbols {
        reference_hits.extend(references(&symbol.name, content)?);
    }

    Ok(AnalysisReport {
        language: language.to_string(),
        line_count: content.lines().count(),
        char_count: content.chars().count(),
        todo_markers: count_todo_markers(content),
        imports: collect_imports(language, content),
        symbols,
        references: reference_hits,
        health: compose_health_report(),
    })
}

/// Detect symbols for the supported language families using simple heuristics.
pub fn symbols(language: &str, content: &str) -> Result<Vec<Symbol>> {
    let mut symbols = Vec::new();
    match language.to_lowercase().as_str() {
        "typescript" | "javascript" | "ts" | "js" => {
            push_regex_symbols(&mut symbols, content, r"function\s+(\w+)", "function")?;
            push_regex_symbols(&mut symbols, content, r"class\s+(\w+)", "class")?;
        }
        "rust" | "rs" => {
            push_regex_symbols(&mut symbols, content, r"fn\s+(\w+)", "function")?;
            push_regex_symbols(&mut symbols, content, r"struct\s+(\w+)", "struct")?;
            push_regex_symbols(&mut symbols, content, r"enum\s+(\w+)", "enum")?;
        }
        "python" | "py" => {
            push_regex_symbols(&mut symbols, content, r"def\s+(\w+)", "function")?;
            push_regex_symbols(&mut symbols, content, r"class\s+(\w+)", "class")?;
        }
        _ => {
            if !content.trim().is_empty() {
                symbols.push(Symbol {
                    name: "default".to_string(),
                    kind: "module".to_string(),
                    line: 1,
                    column: 1,
                });
            }
        }
    }
    Ok(symbols)
}

/// Locate lightweight references for a given symbol.
pub fn references(symbol_name: &str, content: &str) -> Result<Vec<Reference>> {
    let mut references = Vec::new();
    if symbol_name.trim().is_empty() {
        return Ok(references);
    }
    let regex = Regex::new(&regex::escape(symbol_name))?;
    for (line_idx, line) in content.lines().enumerate() {
        let mut start = 0;
        while let Some(found) = regex.find_at(line, start) {
            let before = if found.start() > 0 {
                &line[found.start() - 1..found.start()]
            } else {
                ""
            };
            let after = if found.end() < line.len() {
                &line[found.end()..found.end() + 1]
            } else {
                ""
            };

            if is_boundary(before, after) {
                references.push(Reference {
                    symbol_name: symbol_name.to_string(),
                    line: line_idx + 1,
                    column: found.start() + 1,
                });
            }
            start = found.end();
        }
    }
    Ok(references)
}

fn push_regex_symbols(
    symbols: &mut Vec<Symbol>,
    content: &str,
    pattern: &str,
    kind: &str,
) -> Result<()> {
    let regex = Regex::new(pattern)?;
    for (line_idx, line) in content.lines().enumerate() {
        for capture in regex.captures_iter(line) {
            if let Some(name) = capture.get(1) {
                let column = line.find(name.as_str()).unwrap_or(0) + 1;
                symbols.push(Symbol {
                    name: name.as_str().to_string(),
                    kind: kind.to_string(),
                    line: line_idx + 1,
                    column,
                });
            }
        }
    }
    Ok(())
}

pub fn collect_imports(language: &str, content: &str) -> Vec<String> {
    let language = language.to_lowercase();
    content
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return None;
            }
            let matches = match language.as_str() {
                "rust" | "rs" => {
                    trimmed.starts_with("use ")
                        || trimmed.starts_with("extern crate ")
                        || trimmed.starts_with("mod ")
                }
                "typescript" | "javascript" | "ts" | "js" => {
                    trimmed.starts_with("import ") || trimmed.starts_with("export ")
                }
                "python" | "py" => trimmed.starts_with("import ") || trimmed.starts_with("from "),
                _ => trimmed.contains("import "),
            };
            matches.then(|| trimmed.to_string())
        })
        .collect()
}

pub fn count_todo_markers(content: &str) -> usize {
    content
        .lines()
        .filter(|line| {
            let upper = line.to_uppercase();
            upper.contains("TODO") || upper.contains("FIXME")
        })
        .count()
}

fn compose_health_report() -> HealthReport {
    HealthReport {
        components: vec![
            HealthComponent::operational("parser"),
            HealthComponent::operational("references"),
        ],
        ..HealthReport::healthy()
    }
}

fn is_boundary(before: &str, after: &str) -> bool {
    let left_ok = before.is_empty() || !before.chars().last().unwrap_or(' ').is_alphanumeric();
    let right_ok = after.is_empty() || !after.chars().next().unwrap_or(' ').is_alphanumeric();
    left_ok && right_ok
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn analyzes_rust_snippet() {
        let report = analyze_full("use std::fmt::Debug;\nfn run() {}", "rust")
            .await
            .expect("analysis");
        assert_eq!(report.imports.len(), 1);
        assert!(!report.symbols.is_empty());
        assert!(report.references.iter().any(|r| r.symbol_name == "run"));
    }

    #[test]
    fn detects_python_symbols() {
        let symbols = symbols(
            "python",
            "class Runner:\n    def execute(self):\n        pass",
        )
        .expect("python symbols");
        assert_eq!(symbols.len(), 2);
    }
}
