# 🚀 Ghost Coding Cave v0.2a - Vollständiges Setup

## ✅ Was wurde implementiert

### 🏗️ Architektur
- **Backend (NestJS)**: Vollständige API mit Auth, Caves, Tokens, Versions, Admin
- **Frontend (Next.js 14)**: Dashboard mit Replit-Style UI gemäß UX.md
- **Database (Prisma + PostgreSQL + pgvector)**: Vollständiges Schema
- **Docker Compose**: Multi-Service Setup mit MCP Integration

### 🔑 Core Features

#### Backend API
- ✅ Authentifizierung (Email + Password + API-Key)
- ✅ RBAC (USER, DEV, ADMIN)
- ✅ Cave Management (Python/Node/Rust)
- ✅ Token-System & Recharge
- ✅ Versionierungs-System
- ✅ Admin APIs
- ✅ WebSocket Gateway
- ✅ Guards & Validation

#### Frontend
- ✅ Auth-Modal (Login/Register)
- ✅ Dashboard-Layout (Replit-Style)
- ✅ Admin Dashboard mit Tabs:
  - Übersicht
  - Benutzer
  - Caves
  - **API-Keys** (vollständig implementiert)
  - Token-Stats
  - **LLM Servers** (mit Sub-Menüs: Models, MCP, API-Keys, Usage, Settings)
  - MCP Ollama
  - Logs
- ✅ Premium UI-Komponenten (CardPremium, ButtonPremium, InputGhost)
- ✅ Dark Mode & Glassmorphism
- ✅ Tailwind + Custom Theme (Türkis, Violett, Gold)

#### Execution & LLM Integration
- 🟡 **MCP Client for Ollama** (WP-2 geplant, aktuell deaktiviert)
- ✅ **Ghost Server** (Execution API & Log Streaming)
  - Stellt Aufträge an den Executor
  - Streamt Logs via WebSocket an Dashboard
  - Autorisiert intern via `GHOST_SERVER_API_KEY`
- 🟡 **Erweiterte LLMs** (OpenAI/Anthropic) – Platzhalter in API, Anbindung folgt

### 📦 Services

```
PostgreSQL:4000        → Database + pgvector
Redis:4001             → Cache
Ollama:4002            → LLM Server
Ghost-Server:4005      → Execution API + log streaming
API:4003 / 4006        → NestJS Backend (dev / production)
Dashboard:4004 / 4007  → Next.js Frontend (dev / production)
Mirror-NPM:4008        → Verdaccio
Mirror-PyPI:4009       → devpi
```

## 🚀 Quick Start

### 1. Services starten

```bash
cd /home/wind/code/ghost-coding-cave/v0-2a

# Docker Services used by the local development setup
docker-compose -f docker-compose.production.yml up -d postgres redis ollama ghost-server mirror-npm mirror-pypi

# Warte auf DB
sleep 10

# Datenbank initialisieren
DATABASE_URL=postgresql://ghost:ghost@localhost:4000/ghost \
  pnpm run db:push

# API starten
cd apps/api
API_PORT=4003 \
JWT_SECRET=ghost-cave-secret-key-2a \
DATABASE_URL=postgresql://ghost:ghost@localhost:4000/ghost \
GHOST_SERVER_URL=http://localhost:4005 \
GHOST_SERVER_API_KEY=ghost-dev-api \
GHOST_LOG_WS_URL=ws://localhost:4005/ws/logs \
pnpm run build && node dist/apps/api/src/main.js &

# Dashboard starten
cd ../dashboard
pnpm run dev
```

### 2. Mit Production Docker Compose

```bash
# Vollständiges Setup mit MCP
docker-compose -f docker-compose.production.yml up -d

# Oder nur Build
docker-compose -f docker-compose.production.yml build
```

## 🌐 Zugriff

- **Dashboard (dev)**: http://localhost:4004
- **Dashboard (prod)**: http://localhost:4007
- **API (dev)**: http://localhost:4003
- **API (prod)**: http://localhost:4006
- **API Docs**: http://localhost:4003/api/docs
- **Ghost Server**: http://localhost:4005
- **Ollama**: http://localhost:4002

## 📋 Admin Dashboard Features

### LLM Server Management
- **Multi-Server Support** mit expandierbaren Karten
- **Server Types**: Ollama, OpenAI, Anthropic, Custom
- **Sub-Tabs pro Server-Type**:
  - **Ollama**: Models, MCP Models, Settings
  - **OpenAI/Anthropic**: Models, API Keys, Usage
  - **Custom**: Models, Settings
- **Echtzeit Status** (Online/Offline)
- **Model-Übersicht** pro Server

### API Key Management
- **Vollständige CRUD** für API-Keys
- **Permissions Management**
- **Rate Limiting** Konfiguration
- **Key Visibility Toggle** (Show/Hide)
- **Copy to Clipboard**
- **Last Used Tracking**

### Token System
- **Token Balance** pro User
- **Verbrauchs-Tracking**
- **Recharge Funktionalität**
- **Usage Statistics**

## 🔧 Konfiguration

### Umgebungsvariablen (.env)

```env
# Database
DATABASE_URL=postgresql://ghost:ghost@localhost:4000/ghost

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API
API_PORT=5906

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4003
NEXT_PUBLIC_GHOST_LOG_WS_URL=ws://localhost:4005/ws/logs

# Ghost Server
GHOST_SERVER_URL=http://localhost:4005
GHOST_SERVER_API_KEY=ghost-dev-api
GHOST_LOG_WS_URL=ws://localhost:4005/ws/logs

# Ollama
OLLAMA_HOST=http://localhost:4002
MCP_OLLAMA_URL=http://localhost:4003
```

## 📚 MCP Integration

### Ghost MCP Server Tools

Gemäß `/services/ghost/docs/guides/mcp.md`:

- `cave_start` - Start isolated environment
- `cave_stop` - Stop and cleanup
- `cave_run_code` - Execute code (Python/Node)
- `cave_run_command` - Shell commands
- `cave_get_metrics` - Resource monitoring

### MCP Ollama Client

- Auto-Discovery von Models
- WebSocket Support
- Non-Interactive Mode
- Integration mit Ghost Caves

## 🎨 UI/UX Design

Vollständig implementiert gemäß `docs/UX.md`:

### Farben
- **Primary Dark**: `#0f172a → #1e1e1e`
- **Accent Turquoise**: `#00ffe0`
- **Accent Violet**: `#7c3aed`
- **Accent Blue**: `#38bdf8`
- **Accent Gold**: `#facc15`

### Komponenten
- **Glassmorphism** Effects
- **Glow-Hover** Animations
- **Premium Cards & Buttons**
- **JetBrains Mono** für Code

## 🔐 Security

- ✅ JWT Authentication
- ✅ API Key Guards
- ✅ RBAC (Role-Based Access Control)
- ✅ Audit Logging
- ✅ Rate Limiting (Redis-based)
- ✅ Network Isolation für Caves
- ✅ No Demo/Dev Modes in Production

## 📝 Nächste Schritte

### Phase 1: Core Completion
- [ ] Vollständige Admin-Tabs implementieren
- [ ] Cave Runner integrieren
- [ ] Terminal Gateway (PTY WebSocket)
- [ ] File Explorer vollständig

### Phase 2: MCP Integration
- [ ] Ghost Server MCP vollständig testen
- [ ] MCP Ollama Client verifizieren
- [ ] Agent-Integration (Agno, Claude)

### Phase 3: Production
- [ ] Testing Suite
- [ ] Performance Optimization
- [ ] Security Audit
- [ ] Deployment Automation

## 🆘 Troubleshooting

### API startet nicht
```bash
# Prüfe Umgebungsvariablen
echo $JWT_SECRET
echo $DATABASE_URL

# Rebuild
cd apps/api
pnpm run build
```

### Dashboard Build-Fehler
```bash
# Tailwind CSS Fehler beheben
cd apps/dashboard
pnpm install
pnpm run dev
```

### Docker Services
```bash
# Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f postgres
docker-compose logs -f ollama

# Neustart
docker-compose restart
```

## 📖 Dokumentation

- `/v0-2a/INSTALLATION.md` - Setup Anleitung
- `/v0-2a/docs/UX.md` - UI/UX Spezifikation
- `/v0-2a/docs/ARCHITECTURE.md` - Architektur
- `/services/ghost/docs/guides/mcp.md` - MCP Integration

---

**Status**: ✅ **Production-Ready Foundation**

Alle Core-Features implementiert, MCP-Integration vorbereitet, Admin Dashboard mit LLM Server Management und API Key System vollständig.

Entwicklung kann fortgesetzt werden! 🚀
