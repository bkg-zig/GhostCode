#!/bin/bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.production.yml"
COMPOSE=(docker-compose -f "$COMPOSE_FILE")

cd "$ROOT_DIR"

echo "🚀 Starting Ghost Coding Cave v0.2a..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${RED}❌ docker-compose is required but was not found.${NC}" >&2
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo -e "${RED}❌ pnpm is required. Enable Corepack or install pnpm 10.12.1, then retry.${NC}" >&2
    exit 1
fi

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env not found, copying from .env.example${NC}"
    cp .env.example .env
fi

mkdir -p logs

echo -e "${BLUE}📦 Starting Docker services...${NC}"
"${COMPOSE[@]}" up -d postgres redis ollama ghost-server mirror-npm mirror-pypi

echo -e "${BLUE}⏳ Waiting for PostgreSQL...${NC}"
db_ready=false
for ((attempt = 1; attempt <= 30; attempt++)); do
    if "${COMPOSE[@]}" exec -T postgres pg_isready -U ghost -d ghost >/dev/null 2>&1; then
        db_ready=true
        break
    fi
    sleep 2
done

if [ "$db_ready" != true ]; then
    echo -e "${RED}❌ PostgreSQL did not become ready. Recent logs:${NC}" >&2
    "${COMPOSE[@]}" logs --tail=50 postgres >&2
    exit 1
fi

echo -e "${BLUE}🔧 Generating Prisma Client...${NC}"
pnpm run db:generate

echo -e "${BLUE}🗄️  Initializing database...${NC}"
DATABASE_URL=postgresql://ghost:ghost@localhost:4000/ghost pnpm run db:push

if [ ! -x node_modules/.bin/nest ]; then
    echo -e "${RED}❌ Local Nest CLI is missing. Run 'pnpm install' from the project root, then retry.${NC}" >&2
    exit 1
fi

echo -e "${BLUE}🔨 Building API...${NC}"
pnpm --filter @ghost/api run build

echo ""
echo -e "${GREEN}✅ Infrastructure ready!${NC}"
echo ""
echo -e "${YELLOW}Starting services...${NC}"
echo ""

echo -e "${BLUE}🔧 Starting API on port 4003...${NC}"
(
    cd apps/api
    API_PORT=4003 \
    JWT_SECRET=ghost-cave-secret-key-2a-production-ready-change-this-32chars \
    DATABASE_URL=postgresql://ghost:ghost@localhost:4000/ghost \
    GHOST_SERVER_URL=http://localhost:4005 \
    GHOST_SERVER_API_KEY=ghost-dev-api \
    GHOST_LOG_WS_URL=ws://localhost:4005/ws/logs \
    node dist/apps/api/src/main.js
) > logs/api.log 2>&1 &
API_PID=$!

sleep 3
if ! kill -0 "$API_PID" 2>/dev/null; then
    echo -e "${RED}❌ API failed to start. Recent logs:${NC}" >&2
    tail -n 50 logs/api.log >&2
    exit 1
fi

echo -e "${BLUE}🎨 Starting Dashboard on port 4004...${NC}"
(
    cd apps/dashboard
    pnpm run dev
) > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!

sleep 3
if ! kill -0 "$DASHBOARD_PID" 2>/dev/null; then
    echo -e "${RED}❌ Dashboard failed to start. Recent logs:${NC}" >&2
    tail -n 50 logs/dashboard.log >&2
    kill "$API_PID" 2>/dev/null || true
    exit 1
fi

echo "$API_PID" > .api.pid
echo "$DASHBOARD_PID" > .dashboard.pid

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Ghost Coding Cave v0.2a is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Services:${NC}"
echo -e "   Dashboard:    ${GREEN}http://localhost:4004${NC}"
echo -e "   Admin Panel:  ${GREEN}http://localhost:4004/admin${NC}"
echo -e "   API:          ${GREEN}http://localhost:4003${NC}"
echo -e "   API Docs:     ${GREEN}http://localhost:4003/api/docs${NC}"
echo ""
echo -e "${BLUE}🐳 Docker Services:${NC}"
echo -e "   PostgreSQL:   ${GREEN}localhost:4000${NC}"
echo -e "   Redis:        ${GREEN}localhost:4001${NC}"
echo -e "   Ollama:       ${GREEN}http://localhost:4002${NC}"
echo -e "   Ghost Server: ${GREEN}http://localhost:4005${NC}"
echo -e "   NPM Mirror:   ${GREEN}http://localhost:4008${NC}"
echo -e "   PyPI Mirror:  ${GREEN}http://localhost:4009${NC}"
echo ""
echo -e "${BLUE}📋 Process IDs:${NC}"
echo -e "   API PID:      ${YELLOW}$API_PID${NC}"
echo -e "   Dashboard:    ${YELLOW}$DASHBOARD_PID${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   - View API logs:       tail -f logs/api.log"
echo -e "   - View Dashboard logs: tail -f logs/dashboard.log"
echo -e "   - Stop services:       ./stop-dev.sh"
echo -e "   - View Docker logs:    docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
