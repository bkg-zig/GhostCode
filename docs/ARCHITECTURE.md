Mega — hier ist die **komplett ausführliche `ARCHITECTURE.md`** (in Deutsch), exakt so, wie du sie für **`v0-2a/docs/ARCHITECTURE.md`** brauchst.
Ich habe **Ghost als integrierten Stack-Bestandteil** modelliert (API-Key/Projekt-Core), **User=Projekt-Mapping**, **Admin mit Vollzugriff**, **Ollama + MCP**, **Postgres + pgvector**, **Cave-Terminal mit npm/pip/cargo**, **ohne externes Netzwerk** (mit internem Paket-Cache), und **alle Flows, Tabellen & Container** beschrieben.

> Lege diese Datei einfach unter: `v0-2a/docs/ARCHITECTURE.md`

---

```markdown
# 🧱 ARCHITECTURE — Ghost / Coding-Cave (v0.2a)

> **Scope:** Vollständiges, produktionsreifes Architektur-Blueprint für das Ghost / Coding-Cave-Ökosystem.  
> Integriert: **Ghost (Auth/Project Core)**, **Caves** (Python/Node/Rust), **Admin**, **Ollama + MCP**, **PostgreSQL + pgvector**,  
> **Token-Ökonomie**, **Versionierung**, **Audit**, **Terminal mit npm/pip/cargo** (ohne externes Netz).

---

## 0) Leitprinzipien

- **User = Projekt**: Ghost erzeugt für jeden User einen **Projekt-weiten API-Key** (Primär-Key), über den Caves, Token, Versionen und Stats laufen.  
- **Ghost ist Core**: Auth, Projekte, Caves, Token, Versionen, Audit — alles in **einem** integrierten Backend.  
- **Sicher by Default**: Caves sind isoliert, **kein Internet**, nur interne Services (Paket-Mirror, MCP, Ollama, DB, WS).  
- **LLM-Kontrollpfad**: Model-Interaktion via **MCP (Model Control Plane)** → **Ollama**; Vektorisierung in **pgvector**.  
- **Replit-Erlebnis**: IDE (Explorer + Editor + LiveCanvas) + **Chat-Agent** (kontextbewusst), Live-Token & Versionen.  
- **Admin-Kontrolle**: Alles sichtbar, steuerbar, revertierbar — inkl. Limits & Rechte.

---

## 1) Komponentenübersicht

### Core
- **Ghost API (NestJS)**  
  Auth (E-Mail + Passwort + API-Key), RBAC, Projekte, Caves, Versionen, Token, Audit, Admin, Provider (HF/Ollama).
- **Dashboard (Next.js)**  
  User-IDE (Explorer/Editor/Canvas/Chat), Admin-Panel (Users/Caves/Versions/Logs/Tokens/Models/Agents/API Keys/Settings).
- **PostgreSQL + pgvector**  
  Relationale Daten + Vektor-Indizes (`vector`), Partitionen für TokenUsage, Audit.
- **Redis (optional)**  
  Job-Queue, Rate-Limit, WebSocket Pub/Sub.

### Execution & AI
- **Cave Runner** (per Language: Python/Node/Rust)  
  Container mit **TTY/PTY** für Terminal, Runner-Agent (Exec, FS, Stream), Ressourcenlimits (CPU/RAM).
- **Terminal Gateway**  
  WebSocket ↔ PTY-Bridge (Shell, npm/pip/cargo).
- **Artifact & Package Mirror**  
  Interne Mirror/Cache für **npm/pip/crates** → Offline-Betrieb ohne Internet (lokales Registry-Proxy).
- **MCP Server**  
  Model-Control-Plane: Tools (FS, Versioning, Search, Policies), Model Routing (Ollama), Limits/Quoten.
- **Ollama**  
  Lokaler Inferenzdienst (z. B. `llama3`, `codellama`, `qwen-coder`).  
  Bereitgestellt per GPU/CPU, angebunden an MCP.
- **Vectorizer**  
  Embedding-Pipeline (Code-Chunks, Chat-Kontexte, Versionsdiffs) → **pgvector** (z. B. `all-minilm`, `nomic-embed` via Ollama).

---

## 2) Datenmodell (DB-Schema, logisch)

### 2.1 Benutzer, Projekte & Keys
- **users**  
  `id`, `email` (uniq), `password_hash`, `role` (`user|admin|dev`), `main_cave_id`, `created_at`, `last_login`
- **api_keys**  
  `id`, `user_id`, `key_hash`, `is_active`, `token_balance`, `allowed_models` (JSONB), `allowed_actions` (JSONB), `token_limit`, `expires_at`, `created_at`
- **projects** *(User == Projekt)*  
  `id`, `user_id`, `name`, `quota_cpu`, `quota_ram`, `max_caves`, `allowed_languages` (string[]), `created_at`

> **Mapping:** Ein **User** hat **genau ein Projekt** (Hauptprojekt). Unter diesem hängen alle **Caves**.

### 2.2 Caves, Dateien, Versionen
- **caves**  
  `id`, `project_id`, `name`, `language` (`python|node|rust`), `ram_mb`, `cpu_millicores`, `tokens_per_run`, `status` (`active|stopped|archived`), `last_run_at`, `created_at`
- **files**  
  `id`, `cave_id`, `path`, `content_sha`, `size`, `updated_at`
- **file_blobs**  
  `sha` (PK), `content` (BYTEA/TOAST) → Dedupe, versioniert
- **versions**  
  `id`, `cave_id`, `timestamp`, `author_user_id`, `summary`, `changeset` (JSONB), `execution_logs` (TEXT), `used_tokens`  
  > *`changeset` enthält Add/Mod/Del + Blob-SHAs; `execution_logs` optional.*

### 2.3 Token-Ökonomie & Audit
- **token_usage** *(partitioniert tageweise)*  
  `id`, `timestamp`, `user_id`, `project_id`, `cave_id?`, `api_key_id`, `agent_id?`, `model_id?`, `action` (`run|chat|version|tool|install|terminal`), `direction` (+|-), `tokens`
- **token_usage_agg** *(stündlich/täglich)*  
  `bucket_start`, `user_id?`, `project_id?`, `cave_id?`, `model_id?`, `sum_tokens`
- **audit_events**  
  `id`, `created_at`, `actor_user_id?`, `actor_api_key_id?`, `entity_type` (`user|project|cave|file|version|model|agent|policy`), `entity_id`, `action` (`create|update|delete|start|stop|assign|import|revert|limit_exceeded|deny`), `payload` (JSONB), `correlation_id`

### 2.4 Modelle, Agenten & Instanzen (MCP/Ollama)
- **models**  
  `id`, `name`, `provider` (`ollama|huggingface|local`), `source_ref`, `revision`, `status` (`available|pulling|failed|disabled`), `meta` (JSONB)
- **agents**  
  `id`, `name`, `status` (`active|stopped|unreachable`), `max_models`, `last_heartbeat`, `metrics` (JSONB)
- **model_instances**  
  `id`, `model_id`, `agent_id`, `endpoint` (host:port), `status`, `created_at`, `terminated_at`

### 2.5 Vektorisierung (pgvector)
- **embeddings_docs**  
  `id`, `project_id`, `cave_id`, `source` (`file|version|chat`), `path?`, `ref_id?` (z. B. version_id), `chunk_idx`, `text`, `embedding vector(1536)`, `created_at`
- **embeddings_symbols** *(optional)*  
  Code-Symbole/Signaturen: `id`, `cave_id`, `symbol`, `file_path`, `span`, `language`, `embedding`
- **chat_messages**  
  `id`, `project_id`, `cave_id?`, `role` (`user|assistant|system`), `content`, `embedding?`, `tokens`, `timestamp`

> **Indizes:** HNSW/IVFFlat je nach pgvector-Version; Filter-Indizes auf (`project_id`, `cave_id`).

---

## 3) Auth & RBAC

### 3.1 Registrierung
- POST `/auth/register` → E-Mail anlegen, **API-Key (Projekt-Key)** generieren, Start-Tokens gutschreiben, Passwort setzen.

### 3.2 Login
- POST `/auth/login` → E-Mail + Passwort + API-Key (muss zu E-Mail gehören).  
- JWT ausstellen; Session-Handling; Rate-Limit per `api_key_id`.

### 3.3 Guards & Policies
- **RBAC** (`user|dev|admin`) + **Key-Policies** (allowed_models/actions, token_limit).  
- **Jeder Request**: check `email ↔ api_key` Binding, Token-Stand, Rechte.  
- **Audit**: Alle relevanten Aktionen geloggt (inkl. correlation_id).

---

## 4) Cave-Runtime & Terminal

### 4.1 Sprachen & Tools (müssen vorhanden sein)
- **Python Cave**: `python3`, `pip`, `venv`  
- **Node Cave**: `node`, `npm` (optional `pnpm|yarn` intern gespiegelt)  
- **Rust Cave**: `rustc`, `cargo`

> **Terminal ist Pflicht**: Jede Cave hat **vollwertiges Terminal** mit PTY.  
> **Kein externes Netz**: `npm/pip/cargo` laufen über **interne Mirror** (read-only), bereitgestellt im Stack.

### 4.2 Container-Images (empfohlen)
- `cave-python:<tag>` → Debian/Alpine + `python3 pip venv build-essentials`  
- `cave-node:<tag>` → Node LTS + `npm` + build tools  
- `cave-rust:<tag>` → `rustup`, `cargo`, `clang`, `lld` (falls nötig)

Alle Images enthalten:
- **Runner-Agent**: gRPC/HTTP/WS für `exec`, `fs`, `stream`.
- **Non-root user**, `seccomp`, `no-new-privileges`, **readonly rootfs** (schreibbar nur `/workspace`, `/tmp`).
- **Resource Limits**: `cpu.millicores`, `mem.limit_in_bytes`, PIDs, FDs.

### 4.3 Terminal-Gateway (WS ↔ PTY)
- WebSocket in Frontend → Gateway im Backend → PTY im Container.  
- Server-seitige **Command-Whitelist** optional: `bash/sh`, `python`, `node`, `cargo`, `npm`, `pip`.  
- **Installationen**:
  - npm: `npm install <pkg>` → Mirror Proxy (kein Internet)  
  - pip: `pip install <pkg>` → interner PyPI Cache  
  - cargo: `cargo add <crate>` → crates-io Mirror  
- **Policy Enforcement**: Zeit-/CPU-Budget je Prozess; **Tokenabbuchung** für `install`-Aktionen (konfigurierbar).

---

## 5) Execution Flow (Run wie Replit)

1. **Run Button** / `Ctrl+Enter`  
2. Frontend sendet: `code + cave_id + language + api_key`  
3. Backend prüft: RBAC + Tokenstand + Limits + Cave-Status  
4. **Tokenabbuchung** (z. B. 50 Tokens pro Run); `token_usage` event  
5. Runner-Agent startet Prozess im Container; Streams (stdout/stderr) via WS → **LiveCanvas**  
6. Post-Run: **Version** erzeugen (Snapshot + Changeset + Logs + used_tokens)  
7. Aggregation: `token_usage_agg` (stündlich/täglich) aktualisiert

> **Fehlerfälle**: Zeitüberschreitung / OOM / Policy-Verstoß → Stream-Ende + Audit + UI-Hinweis

---

## 6) Chat-Agent (MCP + Ollama + Vektor)

### 6.1 Kontext
- Aktive Cave (Sprache, Dateien), offene Datei(en), Token-Stand, Versionen, letzte Runs.  
- Vektor-Retrieval aus `embeddings_docs`/`chat_messages` für **kontextreiche Antworten**.

### 6.2 Befehle (Sprachsteuerung)
- „Erstelle Datei …“, „Starte Rust-Cave“, „Führe Code aus“, „Versioniere“  
- „Erkläre diesen Code“, „Vergleiche Version 10 vs 15“, „Wie viele Tokens habe ich?“

### 6.3 Pipeline
```

Chat UI → Ghost API (MCP Client) → MCP Server (Tools/Policies) → Ollama (LLM)
↘ pgvector (RAG)

```

- **Tool-Calls** (MCP): FS-Edit, Versionieren, Ausführen, Diff, Suche, Tokens anzeigen.  
- **Modelle**: `models` Registry; Import via HuggingFace (später); aktuell Ollama-Tags.  
- **Tokenkosten**: pro Prompt/Tool-Call abgerechnet; UI zeigt Delta.

---

## 7) Monitoring, Aggregation & Audit

- **Realtime**: WebSocket/SSE Channels  
  - Token-Deltas, Agent-Status, Run-Logs, Terminal-Output
- **Aggregation**: `token_usage_agg` per Scheduler (stündlich/täglich)  
- **Audit**: jede kritische Operation, inkl. Fehler (`MONITORING_ERROR`, `POLICY_DENY`, `CAPACITY_EXCEEDED`)  
- **Admin-Charts**: CPU/RAM (Runner), Tokens/min, Top-User, Top-Caves, Model-Nutzung

---

## 8) Admin-Panel (Tabs & Funktionen)

1. **Users**: Liste, Rolle ändern, Keys sperren/erneuern, Tokens geben/abziehen, Detail-Sheet (Caves/Verbrauch/Logs)  
2. **Caves**: Status, Ressourcen, Limit setzen, Archivieren/Löschen (sicher), Reopen  
3. **Versions**: Global Timeline, Diff-Viewer, Revert (mit Confirm & Audit)  
4. **Logs**: Audit-Tabelle, Filter (Aktion, Entität, Zeitraum, Actor), Export  
5. **Tokens**: Zeitreihen, Events, Limits/Alerts  
6. **Models**: Registry (Ollama/HF), Pull/Start/Stop/Unload, Metadaten  
7. **Agents**: Status/Heartbeat, Kapazität, Reassign, Health-Checks, Metrics  
8. **API Keys**: allowed_models/actions, token_limit, Ablaufdatum, Aktivierung  
9. **Settings**: Defaults (Start-Tokens, allowed_languages, max_caves), Integrationen (HF-Token), Security (PW-Policy, 2FA)

---

## 9) Security Model

- **Strict Isolation**: Container ohne Internet; nur interner DNS/Netz (Mirror, MCP, Ollama, DB)  
- **Secrets**: API-Keys gehasht; JWTs signiert; `.env` über Secrets-Store  
- **Runtime**: non-root, `seccomp`, `no-new-privileges`, readonly rootfs, Schreibrechte limitiert  
- **RBAC**: Server-seitige Guards, Frontend blendet nur aus (kein Schutz alleine)  
- **Rate Limit**: pro API-Key (auth + chat + exec + install)  
- **Policies**: Allowed actions/models, token_limit, Cave-Limits (CPU/RAM), Install-Whitelist  
- **Audit**: Vollständig, manipulationssicher (append only)

---

## 10) API-Surface (Auszug)

### User-/Projekt-Routen
- `POST /auth/register` — registriert, erzeugt API-Key  
- `POST /auth/login` — validiert Login  
- `GET /api/caves/list` — Caves des Users  
- `POST /api/caves/create` — neue Cave (language, limits)  
- `POST /api/caves/execute` — Code ausführen (Tokens)  
- `POST /api/caves/version` / `GET /api/caves/versions`  
- `WS /api/caves/terminal/:caveId` — Terminal PTY (npm/pip/cargo)  
- `POST /api/user/tokens/recharge` — Tokens aufladen  

### Admin
- `GET /api/admin/users`, `PATCH /api/admin/users/:id`  
- `GET /api/admin/caves`, `PATCH /api/admin/caves/:id`  
- `GET /api/admin/versions`, `POST /api/admin/versions/:id/revert`  
- `GET /api/admin/logs` (Audit), Export  
- `GET /api/admin/tokens/events`, `GET /api/admin/tokens/agg`, `POST /api/admin/tokens/limits`  
- `GET /api/admin/models`, `POST /api/admin/models/import`, Start/Stop/Unload  
- `GET /api/admin/agents`, Start/Stop, Reassign, Capacity  
- `GET /api/admin/apikeys`, `PATCH /api/admin/apikeys/:id`

---

## 11) Container-Topologie (Docker Compose)

**Services (empfohlen):**
- `api` (NestJS, Port **5905** → Host **4003/4006**)  
- `dashboard` (Next.js, Port **5900** → Host **4004/4007**)  
- `db` (PostgreSQL + **pgvector**, Port **5432** → Host **4000**)  
- `redis` (optional, **6379** → Host **4001**)  
- `ollama` (Ollama Runtime, **11434** → Host **4002**)  
- `mcp` (MCP Server / Model Router, **6010** → Host **4003**)  
- `mirror-npm`, `mirror-pypi`, `mirror-crates` (interne Registry-Proxys)  
- `gateway-terminal` (WS ↔ PTY Bridge, **5910**)  
- `runner-python`, `runner-node`, `runner-rust` (dynamisch/skalierend)

**Volumes:**
- `pgdata` (DB)  
- `ollama_models` (Model Caches)  
- `mirror_*_cache` (Paket-Caches)  
- `caves_workspace` (Persistente Workspaces je Cave: `/workspace/<cave_id>`)

**Netz:**
- `internal` (alle Services)  
- `public` (nur `dashboard` & `api` via Ingress)

---

## 12) Umgebungsvariablen (Auszug)

- `DATABASE_URL=postgresql://ghost:ghost@db:5432/ghost`  
- `JWT_SECRET=...`  
- `OLLAMA_HOST=http://ollama:11434`  
- `MCP_HOST=http://mcp:6010`  
- `MIRROR_NPM_URL=http://mirror-npm:4873`  
- `MIRROR_PYPI_URL=http://mirror-pypi:8080`  
- `MIRROR_CRATES_URL=http://mirror-crates:8081`  
- `WS_TERMINAL_URL=ws://gateway-terminal:5910`  
- `DEFAULT_START_TOKENS=1000`  
- `ALLOWED_LANGUAGES=python,node,rust`  
- `MAX_CAVES_PER_PROJECT=3`

---

## 13) Events & Sequenzen

### 13.1 Registrierung
```

Dashboard → /auth/register
API: create user → create api_key → seed project → audit(USER_CREATE)
Return: masked api_key → UI zeigt Key + Copy

```

### 13.2 Cave erstellen
```

Dashboard → /api/caves/create(language, limits)
API: check quotas → create cave → scaffold workspace → audit(CAVE_CREATE)
UI: öffnet IDE

```

### 13.3 Run
```

Editor: Run → /api/caves/execute
API: check tokens → debit → start runner → stream logs
Post: save version → token_usage → agg → audit(RUN)

```

### 13.4 Chat Prompt
```

Chat → API (MCP client) → MCP → RAG (pgvector) + Ollama → Tools (FS/Run/Version)
token_usage(chat + tools) → audit(CHAT/TOOL_CALL)

```

### 13.5 Terminal Install
```

Terminal WS → PTY → npm/pip/cargo via mirrors
Policy + Budget Checks → token_usage(install) → audit(INSTALL)

```

---

## 14) Performance & Skalierung

- **Runner-Autoscaling**: pro Sprache Pod-Set; Kaltstart minimieren (warm pool).  
- **Streaming**: Backpressure-Handling für WS (Chunking, Rate-Limit).  
- **DB**: Partitionen (token_usage), sinnvolle Indizes; asynchrone Aggregation.  
- **Cache**: Mirror-Services + Embedding-Cache.  
- **Models**: Pull in Hintergrund; Pre-warm model instances.

---

## 15) Testing & QA

- **E2E-Flows**: Register → Create Cave → Edit → Run → Version → Chat → Tokens → Admin  
- **Berechtigungen**: allowed_models/actions, token_limit (403/Policy-Fehler)  
- **Runner Smoke**: Start/Stop/Capacity, Reassign, OOM/Timeout  
- **Monitoring**: Events → Agg → Live Feed  
- **Terminal**: npm/pip/cargo ohne Internet (Mirror-Pflicht)  
- **Security**: RBAC, Rate-Limit, Secrets, Container Hardening

---

## 16) Migrations & Deployment

- **DB-Migrationen**: via Prisma/TypeORM; `ALTER TABLE` live kompatibel; Rollback-Plan.  
- **Secrets**: nicht im Repo, per Secret Store injizieren.  
- **Deploy**: Compose/Swarm/K8s — Ingress für `api` + `dashboard`, interne Netzwerke für Rest.  
- **Rollback**: Blue/Green; immutables; Datenbackup (pg_dump + model cache restore).

---

## 17) Frontend-Integration (Kurzübersicht)

- **IDE**: Explorer (FS APIs), Editor (Monaco), Canvas (WS), Chat (MCP), Footer (Token/Conn).  
- **Admin**: Tab-Navigation, Lazy-Data-Fetch (SSR/CSR je nach Page), Realtime-Cards, Audit-Drawer.  
- **UX**: Dark, Soft-UI, Motion, Glass; Skeleton-Loading; freundliche Fehlerkarten.

---

## 18) Sicherheit — Checkliste

- [ ] Kein Internet in Caves (nur interne Mirrors)  
- [ ] non-root, seccomp, readonly rootfs, no-new-privileges  
- [ ] API-Keys gehasht, JWT sicher  
- [ ] RBAC Guards serverseitig  
- [ ] Rate Limits pro Key  
- [ ] Audit vollständig, immutable storage  
- [ ] TokenUsage Partition + Monitoring Alerts

---

## 19) Roadmap (v0.2a → v0.3)

- ✅ v0.2a: Ghost Core, Caves + Terminal (npm/pip/cargo), MCP + Ollama, pgvector, Admin Tabs, Token/Audit  
- 🔜 v0.3: HF-Import (Provider), Model-Policies, Collab (Multi-Cursor), CI-Export, Templates-Katalog

---

**Ende — v0.2a Architektur**  
_Single source of truth für Implementierung, Security & Operations._
```

---
