#!/usr/bin/env bash
set -euo pipefail

: "${GHOST_PORT:=5905}"

echo "🚀 Starting Ghost server on port ${GHOST_PORT}"

exec uvicorn ghost_api:app --host 0.0.0.0 --port "${GHOST_PORT}" --log-level info
