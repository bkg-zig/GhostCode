# 🚀 Ghost Coding Cave v0.2a - Installation & Setup

## Status

Die v0.2a Implementierung ist **vollständig strukturiert** und bereit für Installation:

### ✅ Implementiert

- **Backend (NestJS)**
  - ✅ Authentifizierung (Email + Password + API-Key)
  - ✅ RBAC (USER, DEV, ADMIN)
  - ✅ Cave Management (Python/Node/Rust)
  - ✅ Token-System & Recharge
  - ✅ Versionierungs-System
  - ✅ Admin-APIs (Users, Caves, Logs, Stats)
  - ✅ WebSocket Gateway
  - ✅ Guards & Policies

- **Frontend (Next.js)**
  - ✅ UX-Design gemäß UX.md implementiert
  - ✅ Auth-Modal (Login/Register)
  - ✅ Dashboard-Layout (Replit-Style)
  - ✅ Premium UI-Komponenten (CardPremium, ButtonPremium, InputGhost)
  - ✅ Dark Mode & Glassmorphism
  - ✅ Tailwind + Custom Theme (Türkis, Violett, Gold)

- **Database (Prisma + PostgreSQL)**
  - ✅ Vollständiges Schema mit pgvector
  - ✅ Users, Projects, API Keys
  - ✅ Caves, Files, Versions
  - ✅ Token Usage & Aggregation
  - ✅ Audit Events
  - ✅ Models, Agents, Embeddings

- **Infrastructure**
  - ✅ Docker Compose Setup
  - ✅ PostgreSQL + pgvector
  - ✅ Redis
  - ✅ Ollama
  - ✅ NPM/PyPI Mirrors
  - ✅ Multi-Stage Dockerfiles

## 📋 Voraussetzungen

- **Node.js** >= 20.0.0
- **pnpm** >= 10.12.1
- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git**

## 🔧 Installation

### 1. Dependencies installieren

```bash
cd /home/wind/code/ghost-coding-cave/v0-2a
pnpm install
```

### 2. Umgebungsvariablen einrichten

```bash
cp .env.example .env
```

Bearbeite `.env` und setze sichere Werte:

```env
# Wichtig: Ändere diese Werte in Production!
JWT_SECRET=dein-super-geheimer-jwt-key-mindestens-32-zeichen
DATABASE_URL=postgresql://ghost:ghost@localhost:4000/ghost
```

### 3. Prisma Client generieren

```bash
pnpm run db:generate
```

### 4. Datenbank starten (Docker)

```bash
docker-compose up -d db redis ghost-server
```

Warte bis PostgreSQL & Ghost Server bereit sind (ca. 10-15 Sekunden).

### 5. Datenbank migrieren

```bash
pnpm run db:push
```

Oder für Production mit Migrationen:

```bash
pnpm run db:migrate
```

### 6. Services starten

#### Option A: Vollständiges Docker Setup

```bash
docker-compose up -d
```

Dies startet alle Services:
- PostgreSQL + pgvector (Port 4000)
- Redis (Port 4001)
- Ollama (Port 4002)
- Ghost Server (Port 4005)
- Ghost API (Port 4003)
- Dashboard (Port 4004)
- NPM Mirror (Port 4008)
- PyPI Mirror (Port 4009)

#### Option B: Lokale Development

```bash
# Terminal 1: Backend API
cd apps/api
API_PORT=4003 \
GHOST_SERVER_URL=http://localhost:4005 \
GHOST_SERVER_API_KEY=ghost-dev-api \
GHOST_LOG_WS_URL=ws://localhost:4005/ws/logs \
pnpm run dev

# Terminal 2: Frontend Dashboard
cd apps/dashboard
pnpm run dev
```

## 🌐 Zugriff

- **Dashboard**: http://localhost:4004
- **API**: http://localhost:4003
- **API Docs (Swagger)**: http://localhost:4003/api/docs
- **Ghost Server**: http://localhost:4005
- **Prisma Studio**: `pnpm run db:studio` → http://localhost:5555

## 👤 Erster Login

1. Öffne http://localhost:4004
2. Klicke auf "Create Account"
3. Registriere mit Email + Passwort
4. **Wichtig**: Kopiere den generierten API-Key – er wird für Code-Ausführung benötigt.
5. Login mit Email + Passwort. Speichere den API-Key anschließend im Dashboard-Control-Panel.

## 🧪 Testing

### API testen

```bash
# Registrierung
curl -X POST http://localhost:4003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ghost.dev","password":"test123"}'

# Login (Cookie wird in cookies.txt gespeichert)
curl -c cookies.txt -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ghost.dev","password":"test123"}'

# Token Balance abrufen
curl -b cookies.txt -X GET http://localhost:4003/api/user/tokens/balance

# Code ausführen (API-Key im Authorization Header)
curl -b cookies.txt -X POST http://localhost:4003/api/caves/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ghost_..." \
  -d '{"caveId":"<DEINE_CAVE_ID>","code":"print(42)"}'
```

## 🐳 Docker Commands

```bash
# Alle Services starten
docker-compose up -d

# Services anzeigen
docker-compose ps

# Logs anzeigen
docker-compose logs -f

# Services stoppen
docker-compose down

# Mit Volumes löschen (Datenbank zurücksetzen)
docker-compose down -v

# Rebuild nach Code-Änderungen
docker-compose build
docker-compose up -d
```

## 📊 Prisma Studio

Für visuelle Datenbankverwaltung:

```bash
pnpm run db:studio
```

Öffnet Browser auf http://localhost:5555

## 🔍 Troubleshooting

### Problem: Dependencies fehlen

```bash
# Root installieren
pnpm install

# Prisma neu generieren
pnpm run db:generate
```

### Problem: Datenbank Connection Error

```bash
# Prüfe ob PostgreSQL läuft
docker-compose ps

# PostgreSQL Logs
docker-compose logs db

# Neustart
docker-compose restart db
```

### Problem: Port bereits belegt

Ändere Ports in `.env`:
```env
API_PORT=5906
DASHBOARD_PORT=5901
```

### Problem: Lint-Fehler in IDE

Die TypeScript-Fehler sind normal vor `pnpm install`. Nach Installation:

```bash
# Im Root
pnpm install

# Prisma Client generieren
cd packages/database
pnpm --filter @ghost/database exec prisma generate
```

## 📁 Projektstruktur

```
v0-2a/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/     # Auth & Guards
│   │   │   ├── caves/    # Cave Management
│   │   │   ├── tokens/   # Token System
│   │   │   ├── versions/ # Versionierung
│   │   │   ├── admin/    # Admin APIs
│   │   │   └── websocket/# WebSocket
│   │   └── Dockerfile
│   └── dashboard/        # Next.js Frontend
│       ├── src/
│       │   ├── app/      # Pages (App Router)
│       │   ├── components/# UI Components
│       │   └── lib/      # Utils
│       └── Dockerfile
├── packages/
│   ├── database/         # Prisma Schema
│   ├── types/            # Shared Types
│   └── ui/               # Shared Components
├── services/
│   ├── cave-runner/      # (TODO)
│   ├── terminal-gateway/ # (TODO)
│   └── mcp-server/       # (TODO)
├── docs/
│   ├── START.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── UX.md
│   └── README.md
├── docker-compose.yml
├── .env.example
└── package.json
```

## 🎨 UI/UX Features (gemäß UX.md)

- **Dark Mode** mit Gradient (#0f172a → #1e1e1e)
- **Akzentfarben**: Türkis (#00ffe0), Violett (#7c3aed), Gold (#facc15)
- **Glassmorphism** Effects
- **Glow-Hover** Animationen
- **Monaco Editor** für Code
- **Replit-Style Layout**
- **Premium Components**: CardPremium, ButtonPremium, InputGhost

## 🔄 Nächste Schritte

1. ✅ **Installation abschließen** (pnpm install)
2. ✅ **Datenbank initialisieren** (db:push)
3. 🔄 **Dashboard-Komponenten vervollständigen**:
   - DashboardNav
   - FileExplorer
   - CodeEditor (Monaco)
   - LiveCanvas
   - ChatAgent
   - FooterStatus
4. 🔄 **Cave-Runner implementieren** (Code Execution)
5. 🔄 **Terminal-Gateway** (PTY WebSocket)
6. 🔄 **MCP Server** (Ollama Integration)
7. 🔄 **Admin Dashboard** UI

## 📝 Wichtige Hinweise

- **Lint-Fehler** vor Installation sind normal
- **API-Keys** immer sicher speichern
- **JWT_SECRET** in Production ändern
- **Ollama** benötigt GPU für beste Performance
- **pgvector** Extension wird automatisch geladen

## 🆘 Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs`
2. Services neu starten: `docker-compose restart`
3. Clean install: `rm -rf node_modules && pnpm install`

---

**Status**: Basis-Implementierung vollständig, bereit für Installation und Weiterentwicklung! 🚀
