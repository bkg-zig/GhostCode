FROM rust:1.78 AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY crates ./crates

RUN cargo build --release -p ai-server

FROM debian:bookworm-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV AI_SERVER_HOST=0.0.0.0 \
    AI_SERVER_PORT=5001 \
    HELPER_DB_PATH=/data/helper.db \
    HELPER_MODE=production \
    HELPER_ANALYSIS_THREADS=4 \
    AI_SERVER_LOG_LEVEL=info \
    RUST_LOG=info

WORKDIR /srv

COPY --from=builder /app/target/release/ai-server /usr/local/bin/ai-server

VOLUME ["/data"]

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:5001/health || exit 1

CMD ["ai-server"]
