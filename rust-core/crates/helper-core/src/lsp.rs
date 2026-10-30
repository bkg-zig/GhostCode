use anyhow::Result;
use serde::{Deserialize, Serialize};

/// Minimal position type for LSP interactions.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Position {
    pub line: u32,
    pub character: u32,
}

/// Minimal text document identifier representation.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TextDocumentIdentifier {
    pub uri: String,
}

/// Simplified completion item for downstream consumers.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CompletionItem {
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

/// Stubbed completion engine returning a single canned suggestion.
pub async fn complete(
    _document: &TextDocumentIdentifier,
    _position: &Position,
) -> Result<Vec<CompletionItem>> {
    Ok(vec![CompletionItem {
        label: "fn new_function()".to_string(),
        detail: Some("helper-core synthetic completion".to_string()),
    }])
}
