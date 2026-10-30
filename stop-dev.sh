#!/bin/bash

# Ghost Coding Cave v0.2a - Stop Script

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "🛑 Stopping Ghost Coding Cave v0.2a..."

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop Node processes
if [ -f .api.pid ]; then
    API_PID=$(cat .api.pid)
    if [[ "$API_PID" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}Stopping API (PID: $API_PID)...${NC}"
        kill "$API_PID" 2>/dev/null || echo "API already stopped"
    else
        echo "Invalid API PID in .api.pid; skipping process stop"
    fi
    rm -f .api.pid
fi

if [ -f .dashboard.pid ]; then
    DASHBOARD_PID=$(cat .dashboard.pid)
    if [[ "$DASHBOARD_PID" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}Stopping Dashboard (PID: $DASHBOARD_PID)...${NC}"
        kill "$DASHBOARD_PID" 2>/dev/null || echo "Dashboard already stopped"
    else
        echo "Invalid Dashboard PID in .dashboard.pid; skipping process stop"
    fi
    rm -f .dashboard.pid
fi

# Stop Docker services
echo -e "${RED}Stopping Docker services...${NC}"
docker-compose -f docker-compose.production.yml stop postgres redis ollama ghost-server mirror-npm mirror-pypi

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
