FROM rust:1.78 AS builder

WORKDIR /app

# Leverage build caching by copying manifests first
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates

RUN cargo build --release -p ghost-gateway

FROM debian:bookworm-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV GHOST_GATEWAY_HOST=0.0.0.0 \
    GHOST_GATEWAY_PORT=5907 \
    GHOST_STORAGE_DIR=/data \
    RUST_LOG=ghost_gateway=info,tower_http=info

WORKDIR /srv

COPY --from=builder /app/target/release/ghost-gateway /usr/local/bin/ghost-gateway

VOLUME ["/data"]

EXPOSE 5907

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:5907/health || exit 1

CMD ["ghost-gateway"]
