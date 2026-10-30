mod agents;

use std::{
    net::SocketAddr,
    path::{Path, PathBuf},
    time::Duration,
};

use anyhow::{Context, Result};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use dotenvy::dotenv;
use futures::{SinkExt, StreamExt};
use semantic_adapter::{Reference, SemanticAdapter, SemanticRequest, SemanticSummary, Symbol};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use storage_adapter::{
    EmbeddingRecord, EmbeddingSearchResult, FileRecord, FileSummary, StorageAdapter,
};
use tokio::signal;
use tower_http::trace::TraceLayer;
use tracing::{error, info, warn};

#[derive(Clone)]
pub struct AppState {
    pub service_name: &'static str,
    pub version: &'static str,
    pub storage: StorageAdapter,
    pub semantic: SemanticAdapter,
}

#[derive(Clone)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub storage_dir: PathBuf,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let host = std::env::var("GHOST_GATEWAY_HOST").unwrap_or_else(|_| "0.0.0.0".into());
        let port = match std::env::var("GHOST_GATEWAY_PORT") {
            Ok(value) => value
                .parse::<u16>()
                .context("invalid GHOST_GATEWAY_PORT value")?,
            Err(_) => 8080,
        };
        let storage_dir =
            std::env::var("GHOST_STORAGE_DIR").unwrap_or_else(|_| ".ghost-storage".into());
        Ok(Self {
            host,
            port,
            storage_dir: PathBuf::from(storage_dir),
        })
    }

    pub fn storage_dir(&self) -> &Path {
        &self.storage_dir
    }

    pub fn socket_addr(&self) -> SocketAddr {
        SocketAddr::new(
            self.host
                .parse()
                .unwrap_or_else(|_| "0.0.0.0".parse().expect("valid default host")),
            self.port,
        )
    }
}

#[derive(Serialize)]
pub struct HealthResponse {
    service: &'static str,
    version: &'static str,
    status: &'static str,
}

pub async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        service: state.service_name,
        version: state.version,
        status: "ok",
    })
}

#[derive(Deserialize)]
pub struct ListFilesQuery {
    prefix: Option<String>,
}

#[derive(Serialize)]
pub struct ListFilesResponse {
    files: Vec<FileSummary>,
}

#[derive(Deserialize)]
pub struct FilePathQuery {
    path: String,
}

#[derive(Deserialize)]
pub struct FileWriteRequest {
    path: String,
    content: String,
}

#[derive(Serialize)]
pub struct FileWriteResponse {
    file: FileRecord,
}

#[derive(Deserialize)]
pub struct EmbeddingUpsertRequest {
    vector: Vec<f32>,
    #[serde(default)]
    metadata: Value,
}

#[derive(Deserialize)]
pub struct EmbeddingSearchRequest {
    vector: Vec<f32>,
    #[serde(default = "default_top_k")]
    top_k: usize,
}

#[derive(Serialize)]
pub struct EmbeddingUpsertResponse {
    embedding: EmbeddingRecord,
}

#[derive(Serialize)]
pub struct EmbeddingSearchResponse {
    results: Vec<EmbeddingSearchResult>,
}

pub async fn list_files(
    State(state): State<AppState>,
    Query(query): Query<ListFilesQuery>,
) -> AppResult<Json<ListFilesResponse>> {
    let files = state
        .storage
        .list_files(query.prefix.as_deref())
        .await
        .map_err(AppError::internal)?;
    Ok(Json(ListFilesResponse { files }))
}

pub async fn get_file(
    State(state): State<AppState>,
    Query(query): Query<FilePathQuery>,
) -> AppResult<Json<FileRecord>> {
    let path = normalize_path(&query.path)?;
    match state
        .storage
        .get_file(&path)
        .await
        .map_err(AppError::internal)?
    {
        Some(file) => Ok(Json(file)),
        None => Err(AppError::not_found(format!("file not found: {}", path))),
    }
}

pub async fn put_file(
    State(state): State<AppState>,
    Json(payload): Json<FileWriteRequest>,
) -> AppResult<Json<FileWriteResponse>> {
    let path = normalize_path(&payload.path)?;
    let file = state
        .storage
        .upsert_file(&path, &payload.content)
        .await
        .map_err(AppError::internal)?;
    Ok(Json(FileWriteResponse { file }))
}

pub async fn delete_file(
    State(state): State<AppState>,
    Query(query): Query<FilePathQuery>,
) -> AppResult<Response> {
    let path = normalize_path(&query.path)?;
    if state
        .storage
        .delete_file(&path)
        .await
        .map_err(AppError::internal)?
    {
        Ok(StatusCode::NO_CONTENT.into_response())
    } else {
        Err(AppError::not_found(format!("file not found: {}", path)))
    }
}

#[derive(Deserialize)]
pub struct FileRenameRequest {
    from: String,
    to: String,
}

pub async fn rename_file(
    State(state): State<AppState>,
    Json(payload): Json<FileRenameRequest>,
) -> AppResult<Json<FileWriteResponse>> {
    let from = normalize_path(&payload.from)?;
    let to = normalize_path(&payload.to)?;
    let record = state
        .storage
        .rename_file(&from, &to)
        .await
        .map_err(AppError::internal)?
        .ok_or_else(|| AppError::not_found(format!("file not found: {}", from)))?;
    Ok(Json(FileWriteResponse { file: record }))
}

pub async fn upsert_embedding(
    State(state): State<AppState>,
    Json(payload): Json<EmbeddingUpsertRequest>,
) -> AppResult<Json<EmbeddingUpsertResponse>> {
    if payload.vector.is_empty() {
        return Err(AppError::bad_request("vector must not be empty"));
    }
    let embedding = state
        .storage
        .upsert_embedding(payload.vector, payload.metadata)
        .await
        .map_err(AppError::internal)?;
    Ok(Json(EmbeddingUpsertResponse { embedding }))
}

pub async fn search_embeddings(
    State(state): State<AppState>,
    Json(payload): Json<EmbeddingSearchRequest>,
) -> AppResult<Json<EmbeddingSearchResponse>> {
    if payload.vector.is_empty() {
        return Err(AppError::bad_request("vector must not be empty"));
    }
    let top_k = payload.top_k.clamp(1, 32);
    let results = state
        .storage
        .search_embeddings(&payload.vector, top_k)
        .await
        .map_err(AppError::internal)?;
    Ok(Json(EmbeddingSearchResponse { results }))
}

pub async fn analyze_code(
    State(state): State<AppState>,
    Json(payload): Json<SemanticRequest>,
) -> AppResult<Json<SemanticSummary>> {
    if payload.content.trim().is_empty() {
        return Err(AppError::bad_request("content must not be empty"));
    }
    let summary = state
        .semantic
        .analyze_full(payload)
        .await
        .map_err(AppError::internal)?;
    Ok(Json(summary))
}

#[derive(Deserialize)]
pub struct SymbolsQuery {
    pub language: String,
    pub path: Option<String>,
    pub content: Option<String>,
}

#[derive(Serialize)]
pub struct SymbolsResponse {
    pub symbols: Vec<Symbol>,
}

pub async fn get_symbols(
    State(state): State<AppState>,
    Query(query): Query<SymbolsQuery>,
) -> AppResult<Json<SymbolsResponse>> {
    let content = if let Some(path) = &query.path {
        let normalized = normalize_path(path)?;
        state
            .storage
            .get_file(&normalized)
            .await
            .map_err(AppError::internal)?
            .map(|f| f.content)
            .unwrap_or_default()
    } else {
        query.content.unwrap_or_default()
    };

    if content.trim().is_empty() {
        return Err(AppError::bad_request("content or path required"));
    }

    let symbols = state
        .semantic
        .symbols(&query.language, &content)
        .map_err(AppError::internal)?;

    Ok(Json(SymbolsResponse { symbols }))
}

#[derive(Deserialize)]
pub struct ReferencesQuery {
    pub symbol_name: String,
    pub path: Option<String>,
    pub content: Option<String>,
}

#[derive(Serialize)]
pub struct ReferencesResponse {
    pub references: Vec<Reference>,
}

pub async fn get_references(
    State(state): State<AppState>,
    Query(query): Query<ReferencesQuery>,
) -> AppResult<Json<ReferencesResponse>> {
    let content = if let Some(path) = &query.path {
        let normalized = normalize_path(path)?;
        state
            .storage
            .get_file(&normalized)
            .await
            .map_err(AppError::internal)?
            .map(|f| f.content)
            .unwrap_or_default()
    } else {
        query.content.unwrap_or_default()
    };

    if content.trim().is_empty() {
        return Err(AppError::bad_request("content or path required"));
    }

    let references = state
        .semantic
        .references(&query.symbol_name, &content)
        .map_err(AppError::internal)?;

    Ok(Json(ReferencesResponse { references }))
}

pub async fn analyze_full(
    State(state): State<AppState>,
    Json(payload): Json<SemanticRequest>,
) -> AppResult<Json<SemanticSummary>> {
    if payload.content.trim().is_empty() {
        return Err(AppError::bad_request("content must not be empty"));
    }
    let summary = state
        .semantic
        .analyze_full(payload)
        .await
        .map_err(AppError::internal)?;
    Ok(Json(summary))
}

pub async fn semantic_stream_ws(State(state): State<AppState>, ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(move |socket| handle_semantic_stream_ws(state, socket))
}

async fn handle_semantic_stream_ws(state: AppState, socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();

    // Send initial ready event
    if sender
        .send(Message::Text(
            json!({
                "event": "connected",
                "service": state.service_name,
                "version": state.version,
            })
            .to_string(),
        ))
        .await
        .is_err()
    {
        return;
    }

    // Simulate periodic health updates
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(5));
    let mut event_id = 0;

    loop {
        tokio::select! {
            _ = interval.tick() => {
                event_id += 1;
                let health_data = json!({
                    "timestamp": Utc::now().to_rfc3339(),
                    "status": "operational"
                });

                if sender
                    .send(Message::Text(
                        json!({
                            "event": "health_update",
                            "id": event_id,
                            "data": health_data,
                        })
                        .to_string(),
                    ))
                    .await
                    .is_err()
                {
                    break;
                }
            }
            Some(msg) = receiver.next() => {
                match msg {
                    Ok(Message::Text(raw)) => {
                        // Handle incoming requests for on-demand events, e.g., trigger analysis
                        if let Ok(request) = serde_json::from_str::<SemanticRequest>(&raw) {
                            if let Ok(summary) = state.semantic.analyze_full(request).await {
                                let _ = sender
                                    .send(Message::Text(
                                        json!({
                                            "event": "analysis_stream",
                                            "summary": summary,
                                        })
                                        .to_string(),
                                    ))
                                    .await;
                            }
                        }
                    }
                    Ok(Message::Ping(payload)) => {
                        let _ = sender.send(Message::Pong(payload)).await;
                    }
                    Ok(Message::Binary(_)) => {}
                    Ok(Message::Pong(_)) => {}
                    Ok(Message::Close(_)) => break,
                    Err(_) => break,
                }
            }
            else => break,
        }
    }
}

fn normalize_path(raw: &str) -> AppResult<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(AppError::bad_request("path must not be empty"));
    }
    if trimmed.contains("..") {
        return Err(AppError::bad_request("path traversal is not allowed"));
    }
    Ok(trimmed.replace('\\', "/"))
}

fn default_top_k() -> usize {
    5
}

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug)]
pub struct AppError {
    status: StatusCode,
    message: String,
    source: Option<anyhow::Error>,
}

impl AppError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
            source: None,
        }
    }

    pub fn with_source(status: StatusCode, err: anyhow::Error) -> Self {
        Self {
            status,
            message: err.to_string(),
            source: Some(err),
        }
    }

    pub fn bad_request(msg: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, msg)
    }

    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, msg)
    }

    pub fn internal(err: anyhow::Error) -> Self {
        Self::with_source(StatusCode::INTERNAL_SERVER_ERROR, err)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        if let Some(source) = &self.source {
            error!(error = ?source, status = ?self.status, "request failed");
        }
        let body = Json(ErrorResponse {
            error: self.message.clone(),
        });
        (self.status, body).into_response()
    }
}

#[derive(Serialize)]
pub struct ErrorResponse {
    error: String,
}

pub async fn run() -> Result<()> {
    dotenv().ok();
    init_tracing()?;

    let config = AppConfig::from_env()?;
    let addr = config.socket_addr();

    let storage = StorageAdapter::new(config.storage_dir()).await?;
    let semantic = SemanticAdapter::new();
    let state = AppState {
        service_name: "ghost-gateway",
        version: env!("CARGO_PKG_VERSION"),
        storage,
        semantic,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/storage/files", get(list_files))
        .route(
            "/api/storage/file",
            get(get_file).put(put_file).delete(delete_file),
        )
        .route("/api/storage/file/rename", post(rename_file))
        .route("/api/storage/embeddings/index", post(upsert_embedding))
        .route("/api/storage/embeddings/search", post(search_embeddings))
        .route("/api/semantic/analyze", post(analyze_code))
        .route("/api/semantic/analyze/full", post(analyze_full))
        .route("/api/semantic/symbols", get(get_symbols))
        .route("/api/semantic/references", get(get_references))
        .route("/api/semantic/stream", get(semantic_stream_ws))
        .route("/api/chat/plan", post(agents::chat_plan))
        .route("/ws/agent", get(agents::agent_ws))
        .with_state(state)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .with_context(|| format!("failed to bind to {}", addr))?;

    info!("🚀 ghost-gateway listening on http://{}", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("server error")?;

    info!("👋 ghost-gateway shutdown complete");
    Ok(())
}

fn init_tracing() -> Result<()> {
    let env_filter =
        std::env::var("RUST_LOG").unwrap_or_else(|_| "ghost_gateway=info,tower_http=info".into());
    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .compact()
        .try_init()
        .map_err(|err| anyhow::anyhow!("failed to initialize tracing subscriber: {err}"))?;
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to listen for ctrl_c signal");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => warn!("received Ctrl+C"),
        _ = terminate => warn!("received termination signal"),
    }

    tokio::time::sleep(Duration::from_millis(100)).await;
}
