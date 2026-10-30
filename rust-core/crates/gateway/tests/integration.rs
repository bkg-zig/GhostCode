#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use ghost_gateway::{
        analyze_code, analyze_full, delete_file, get_file, get_references, get_symbols, health,
        list_files, put_file, rename_file, search_embeddings, semantic_stream_ws, upsert_embedding,
        AppConfig, AppState,
    };
    use semantic_adapter::SemanticAdapter;
    use storage_adapter::StorageAdapter;
    use tower::Service;
    use tower_http::trace::TraceLayer;

    async fn test_app() -> Router {
        let config = AppConfig::from_env().unwrap();
        let storage = StorageAdapter::new(config.storage_dir()).await.unwrap();
        let semantic = SemanticAdapter::new();
        let state = AppState {
            service_name: "ghost-gateway-test",
            version: "0.1.0",
            storage,
            semantic,
        };
        Router::new()
            .route("/health", axum::routing::get(health))
            .route("/api/storage/files", axum::routing::get(list_files))
            .route(
                "/api/storage/file",
                axum::routing::get(get_file)
                    .put(put_file)
                    .delete(delete_file),
            )
            .route("/api/storage/file/rename", axum::routing::post(rename_file))
            .route(
                "/api/storage/embeddings/index",
                axum::routing::post(upsert_embedding),
            )
            .route(
                "/api/storage/embeddings/search",
                axum::routing::post(search_embeddings),
            )
            .route("/api/semantic/analyze", axum::routing::post(analyze_code))
            .route(
                "/api/semantic/analyze/full",
                axum::routing::post(analyze_full),
            )
            .route("/api/semantic/symbols", axum::routing::get(get_symbols))
            .route(
                "/api/semantic/references",
                axum::routing::get(get_references),
            )
            .route(
                "/api/semantic/stream",
                axum::routing::get(semantic_stream_ws),
            )
            .with_state(state)
            .layer(TraceLayer::new_for_http())
    }

    #[tokio::test]
    async fn test_analyze_full_endpoint() {
        let mut app = test_app().await;

        let request = Request::builder()
            .method("POST")
            .uri("/api/semantic/analyze/full")
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"language":"rust","content":"fn main() { println!(\"Hello\"); }"}"#,
            ))
            .unwrap();

        let response = app.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
