
# 🧠 AGENTS.md — Ghost-Coding-Cave v0.2a Integration Agents

> **Repository:** [eyshoit-commits/ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave)  
> **Version:** `v0.2a`  
> **Last updated:** 2025-10-29  
> **Maintainer:** `@eyshoit`

---

## 🏗️ Systemüberblick

**Ghost-Coding-Cave** v0.2a ist eine hybride Entwicklungsplattform, die
den Node-basierten *Ghost IDE Stack* (NestJS + React) mit einer neuen
Rust-Core-Architektur verbindet, welche auf den Projekten
[`helper-db`](https://github.com/eyshoit-commits/helper-db) und
[`helper`](https://github.com/eyshoit-commits/helper) basiert.

Das System arbeitet mit **koordinierten LLM-Agenten**, die
einzelne Entwicklungs- und Integrationsaufgaben übernehmen
(Build, Security, Semantic Analysis, Storage, Docs, CI/CD).

---

## 🧩 Agenten-Rollenübersicht

| Agent-ID | Rolle | Sprache | Ziel | Quellen |
|-----------|--------|----------|-------|----------|
| **A-1** | 🧠 Integration Agent | Rust / TS | Erstellt & verwaltet Rust-Core (`v0.2a/rust-core`) | [helper-db](https://github.com/eyshoit-commits/helper-db), [helper](https://github.com/eyshoit-commits/helper) |
| **A-2** | ⚙️ Build & CI Agent | YAML / Bash | CI/CD Pipelines, Tests, Builds | GitHub Actions, Cargo |
| **A-3** | 🔐 Security Agent | Rust / Python | Audits, Auth-Checks, Rate-Limiting | OWASP 2025, Cargo Audit |
| **A-4** | 🧮 Semantic Agent | Rust | Codeanalyse & LSP via helper | helper |
| **A-5** | 💾 Storage Agent | Rust | Datenverwaltung & Embeddings via helper-db | helper-db |
| **A-6** | 🧱 Gateway Agent | Rust | REST/WS-Layer (Axum) für Node+UI | Axum, Tokio |
| **A-7** | 💬 Chat Agent | TS / Python | LLM-Kommunikation (OpenAI/Ollama) | OpenAI API |
| **A-8** | 🧰 DevOps Agent | Docker / Bash | Containerisierung, GPU, Deployment | Docker, Compose |
| **A-9** | 🧾 Documentation Agent | Markdown | Generiert FINAL.md, NEXT.md, AGENTS.md | GitHub API |
| **A-10** | 🧭 Planner Agent | YAML / JSON | Synchronisiert Milestones / NEXT.md | GitHub Projects |

---

## 🧱 Architektur-Quellen

| Quelle | Beschreibung | Lizenz | Verwendung |
|--------|---------------|---------|-------------|
| [helper-db](https://github.com/eyshoit-commits/helper-db) | Rust-DB Engine mit PGML + Plugin-System | MIT | Crate `storage` |
| [helper](https://github.com/eyshoit-commits/helper) | Semantic Code Toolkit (Analyzer + LSP) | MIT | Crate `semantic` |
| [ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave) | Hauptprojekt (NestJS + React) | MIT | API & IDE |
| [Axum](https://github.com/tokio-rs/axum) | Webserver Framework für Rust | MIT | REST Gateway |
| [Tokio](https://github.com/tokio-rs/tokio) | Async Runtime für Rust | MIT | Basis aller Crates |
| [Monaco Editor](https://github.com/microsoft/monaco-editor) | Code Editor UI | MIT | Dashboard |
| [Xterm.js](https://github.com/xtermjs/xterm.js) | Terminal Emulator | MIT | Live Console |
| [NestJS](https://github.com/nestjs/nest) | Node Backend Framework | MIT | apps/api |
| [Leptos](https://github.com/leptos-rs/leptos) | Rust WASM Framework | MIT | zukünftige UI |
| [Ollama MCP](https://github.com/jmorganca/ollama) | LLM Runtime Bridge | MIT | AI Execution |
| [OpenAI API](https://platform.openai.com/docs) | LLM API | Proprietär | Chat Agent |

---

## 🧠 Agenten-Koordination (Workflow)

```mermaid
graph TD
A1[Integration Agent] --> A2[Build Agent]
A2 --> A3[Security Agent]
A1 --> A4[Semantic Agent]
A1 --> A5[Storage Agent]
A4 --> A6[Gateway Agent]
A5 --> A6
A6 --> A7[Chat Agent]
A2 --> A8[DevOps Agent]
A8 --> A9[Documentation Agent]
A9 --> A10[Planner Agent]
````

---

## 🔧 Zuständigkeiten im Detail

### **A-1 Integration Agent**

* Klont `helper-db` & `helper`
* Erstellt `v0.2a/rust-core` Workspace
* Definiert Cargo-Struktur
* Erstellt Axum Gateway
* Stellt REST-Bridge für Node bereit

### **A-2 Build & CI Agent**

* Führt `cargo build --workspace` + `pnpm run build` aus
* Nutzt GitHub Actions Workflow (`/.github/workflows/build.yml`)
* Lint, Format & Unit Tests

### **A-3 Security Agent**

* Prüft JWT + API-Key
* Validiert CSRF & Rate-Limiting
* Überwacht Audit Logs
* Führt `cargo audit` & `pnpm audit` aus

### **A-4 Semantic Agent**

* Führt Analyse mit `helper::analysis` aus
* Liefert `symbols`, `references`, `imports`
* Sprachen: Rust, TS, Python (Feature Flags)

### **A-5 Storage Agent**

* CRUD & Vector Queries via helper-db
* PGML Embeddings & Auto-Indexing
* `POST /v1/kv/batch` & Search API

### **A-6 Gateway Agent**

* REST/WS Layer über Axum
* Endpunkte: `/api/store`, `/api/search`, `/api/analyze`
* Auth über JWT + API-Key
* Kommuniziert mit Node Backend

### **A-7 Chat Agent**

* Nutzt OpenAI & Ollama
* Generiert Code & Erklärungen
* Tokenüberwachung & History Cache

### **A-8 DevOps Agent**

* Baut Docker Images
* Definiert Compose Volumes
* Managed GPU Nodes & Deployments

### **A-9 Documentation Agent**

* Generiert Markdown-Dokumentation
* Aktualisiert `FINAL.md`, `NEXT.md`, `AGENTS.md`
* Führt LLM-basiertes Change-Summarying durch

### **A-10 Planner Agent**

* Liest `NEXT.md`
* Aktualisiert GitHub Milestones
* Plant Sprints & Releases

---

## 📡 Datenfluss

```mermaid
graph LR
User -->|HTTP| UI(React / Leptos)
UI -->|REST| Gateway
Gateway --> Storage
Gateway --> Semantic
Gateway -->|Sandbox Exec| GhostServer
Storage -->|Embeddings| helper-db
Semantic -->|Analysis| helper
ChatAgent -->|LLM| OpenAI/Ollama
```

---

## 🔒 Sicherheitsrichtlinien

* **JWT + API-Key Doppel-Auth**
* **CSRF-Safe Cookies**
* **Sandbox Isolation** für Codeausführung
* **Rate-Limit**: 100 req/min
* **TLS Proxy** via Nginx (prod)

---

## 📚 Quellenverzeichnis (Langform)

1. [helper-db](https://github.com/eyshoit-commits/helper-db) — Rust DB Engine mit PGML
2. [helper](https://github.com/eyshoit-commits/helper) — Semantic Code Toolkit
3. [ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave) — Cloud IDE Basis
4. [Axum/Tokio](https://github.com/tokio-rs) — Rust Async Frameworks
5. [OpenAI API](https://platform.openai.com/docs) — Proprietäre LLM API

---

## ✅ Commit Guide

| Phase       | Agent         | Aufgabe            |
| ----------- | ------------- | ------------------ |
| **Phase A** | A-1, A-2      | Rust-Core Aufbau   |
| **Phase B** | A-4, A-5      | Storage + Semantic |
| **Phase C** | A-6, A-7      | Gateway + UI       |
| **Phase D** | A-3, A-8, A-9 | Security + Docs    |

---

> Dieses Dokument definiert die interne Multi-Agenten-Architektur
> für die Version `v0.2a` von **Ghost-Coding-Cave**.
> Es beschreibt Verantwortlichkeiten, Quellen, Sicherheitsrichtlinien
> und Workflow-Beziehungen der gesamten Entwicklungsautomatisierung.

```

---

Alles klar — hier ist ein **kompletter, produktionsreifer Blackbox-Prompt** (copy-paste), mit dem du **eine einzige, selbstentwickelte AI-Plattform** auf **deinem Server** als **einzigen Docker-Stack** bereitstellst:
LLM (Chat/Code), **Training/Finetuning**, **TTS**, **Text→Bild**, **Text→Video**, Live-Agenten & REST/WebSocket-APIs – alles self-hosted, GPU-fähig, mit Monitoring, Security und Storage.

---

## 🧠 Blackbox Prompt — Build a Single-Service, Production-Ready AI Platform (LLM + Training + TTS + Img/Video)

### 🎯 Ziel

Implementiere **auf unserem Server** eine **einzige** produktionsreife Docker-Komposition, die folgende Fähigkeiten vereint:

* **LLM/Code-Assistent** (Chat + Tools) mit REST + WS
* **Training/Finetuning** (LLM LoRA, TTS voice clone, SD LoRA) – offline, reproduzierbar
* **TTS** (Text-to-Speech, Mehrsprachigkeit, Voice-Cloning)
* **Text→Bild** (Stable Diffusion XL/SD1.5 + LoRA)
* **Text→Video** (Stable Video Diffusion / Open-Source-Video-Diffusion)
* **Datei- und Datenspeicher** (Datasets, Modelle, Artefakte)
* **Sicherheit** (JWT/API-Keys, CORS, Ratenlimit, Audit-Logs)
* **Monitoring** (Prometheus, Grafana), **Tracing** (OTel), **Logs** (JSON)
* **Nur ein Stack** (docker compose), **GPU-Support** (NVIDIA)

> Architektur:
> **gateway (Rust, Axum)** ⇄ **trainer (Python)** ⇄ **inference-microservices (Python/Triton/vLLM)**
> Backing: **Postgres**, **MinIO (S3)**, **Redis**, **Prometheus/Grafana**, **Caddy (TLS/HTTP/2)**

---

### 0) Voraussetzungen (Server)

* NVIDIA GPU + Treiber + `nvidia-container-toolkit`
* Docker/Compose aktuell
* Domain + TLS möglich (Caddy übernimmt)
* Verzeichnisstruktur im Repo:

  ```
  /stack
    /gateway            # Rust Axum, REST/WS, Scheduler, Auth, BFF
    /trainer            # Python training pipelines (LLM LoRA, TTS, SD)
    /inference
      /llm              # vLLM/TensorRT-LLM/gptq
      /tts              # XTTS/Coqui oder Piper/Bark
      /img              # SD/SDXL (diffusers)
      /video            # SVD/Latte o.ä.
    /infra
      /caddy
      /grafana
      /prometheus
    /storage            # volumes: datasets, models, artifacts, db, s3
  ```

---

### 1) .env.prod (Root)

Lege eine **einzige** `.env.prod` mit allen Secrets an:

```bash
# Gateway
GATEWAY_HOST=0.0.0.0
GATEWAY_PORT=4003
JWT_SECRET=<generate-hex-64>
API_KEY=<generate-hex-48>
ALLOWED_ORIGINS=https://your.domain,https://localhost:3000

# Backing
POSTGRES_URL=postgres://ghost:ghostpass@postgres:5432/ghost
REDIS_URL=redis://redis:6379
S3_ENDPOINT=http://minio:9000
S3_BUCKET=models
S3_ACCESS_KEY=ghost
S3_SECRET_KEY=ghostsecret
S3_REGION=us-east-1

# Inference models (S3 paths or local)
LLM_MODEL=llama-3.1-8b-instruct-q4
TTS_MODEL=xtts-v2
SD_MODEL=sdxl-base
SVD_MODEL=stable-video-diffusion

# Paths (mounted)
DATA_ROOT=/data
MODELS_ROOT=/data/models
DATASETS_ROOT=/data/datasets
ARTIFACTS_ROOT=/data/artifacts

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT=http://prometheus:4318

# TLS (Caddy)
DOMAIN=your.domain
EMAIL=admin@your.domain
```

---

### 2) docker-compose.yml (Root, single stack)

```yaml
version: "3.9"
x-common-env: &common-env
  env_file: .env.prod
  restart: unless-stopped

services:
  caddy:
    <<: *common-env
    image: caddy:2
    container_name: caddy
    ports: ["80:80", "443:443"]
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on: [gateway]

  postgres:
    <<: *common-env
    image: postgres:16
    container_name: postgres
    environment:
      POSTGRES_DB: ghost
      POSTGRES_USER: ghost
      POSTGRES_PASSWORD: ghostpass
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    <<: *common-env
    image: redis:7
    container_name: redis

  minio:
    <<: *common-env
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    ports: ["9001:9001"]
    volumes:
      - minio_data:/data

  gateway:
    <<: *common-env
    build: ./stack/gateway
    container_name: gateway
    ports: ["4003:4003"]
    environment:
      RUST_LOG: info,tower_http=info
    depends_on: [postgres, redis, minio, llm, tts, img, video]
    volumes:
      - ./storage:/data

  llm:
    <<: *common-env
    build: ./stack/inference/llm
    container_name: llm
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices: [{ capabilities: [gpu] }]
    environment:
      MODEL_NAME: ${LLM_MODEL}
      HF_HOME: /data/hf
    volumes:
      - ./storage:/data
    ports: ["8001:8001"]  # optional, if direct

  tts:
    <<: *common-env
    build: ./stack/inference/tts
    container_name: tts
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices: [{ capabilities: [gpu] }]
    environment:
      TTS_MODEL: ${TTS_MODEL}
    volumes:
      - ./storage:/data
    ports: ["8002:8002"]

  img:
    <<: *common-env
    build: ./stack/inference/img
    container_name: img
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices: [{ capabilities: [gpu] }]
    environment:
      SD_MODEL: ${SD_MODEL}
    volumes:
      - ./storage:/data
    ports: ["8003:8003"]

  video:
    <<: *common-env
    build: ./stack/inference/video
    container_name: video
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices: [{ capabilities: [gpu] }]
    environment:
      SVD_MODEL: ${SVD_MODEL}
    volumes:
      - ./storage:/data
    ports: ["8004:8004"]

  trainer:
    <<: *common-env
    build: ./stack/trainer
    container_name: trainer
    runtime: nvidia
    deploy:
      resources:
        reservations:
          devices: [{ capabilities: [gpu] }]
    command: ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7000"]
    volumes:
      - ./storage:/data
    ports: ["7000:7000"]

  prometheus:
    <<: *common-env
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prom_data:/prometheus
    ports: ["9090:9090"]

  grafana:
    <<: *common-env
    image: grafana/grafana:latest
    container_name: grafana
    ports: ["3001:3000"]
    depends_on: [prometheus]
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  caddy_data: {}
  caddy_config: {}
  pg_data: {}
  minio_data: {}
  prom_data: {}
  grafana_data: {}
```

**Caddyfile** (`infra/caddy/Caddyfile`) – optional TLS + Reverse Proxy:

```
{$DOMAIN} {
  encode zstd gzip
  reverse_proxy /api/* gateway:4003
  reverse_proxy /ws/* gateway:4003
  reverse_proxy /trainer/* trainer:7000
}
```

---

### 3) Gateway (Rust/Axum, `stack/gateway`)

* **REST**:

  * `POST /api/chat/plan` → ruft **llm** microservice
  * `POST /api/semantic/analyze` → ruft **llm** oder lokalen Parser
  * `POST /api/tts/synthesize` → ruft **tts**
  * `POST /api/img/generate` → ruft **img**
  * `POST /api/video/generate` → ruft **video**
  * `POST /api/train/{task}` → ruft **trainer** (LLM-LoRA, TTS, SD-LoRA)
* **WS**:

  * `/ws/agent` → streamt Live-Hinweise vom LLM/Tools
* **Auth**:

  * JWT (AuthZ), API-Key (machine-to-machine)
* **Rate Limits**: pro Token/IP
* **Storage**: S3/MinIO (Artefakte, Modelle)

> Implementiere saubere DTOs (serde), Fehlerbehandlung, Timeout/Retry (reqwest), Tracing (tracing + otlp), strukturierte Logs (JSON).

---

### 4) Inference Microservices (Python/FastAPI)

**Gemeinsame Basis**: `uvicorn`, `pydantic`, **GPU** via `torch` + `xformers` + `cuda`.

* **/inference/llm**:

  * Serve **vLLM** (oder TensorRT-LLM) für das angegebene `LLM_MODEL`
  * REST: `POST /generate`, `POST /chat`, `POST /tools`
  * Optional: OpenAI-kompatible `/v1/chat/completions`

* **/inference/tts**:

  * **XTTS-v2/Coqui** (oder Piper/Bark fallback)
  * REST: `POST /synthesize` (text, voice_id?, language?) → WAV/MP3 (S3 speichern)

* **/inference/img**:

  * **Stable Diffusion**/**SDXL** via `diffusers`
  * REST: `POST /txt2img` (prompt, negative_prompt, steps, seed, lora?) → PNG (S3)

* **/inference/video**:

  * **Stable Video Diffusion** oder Latte
  * REST: `POST /txt2vid` (prompt, frames, fps, seed) → MP4 (S3)

> Jeder Dienst hat Healthcheck `/health`, lädt Modelle in `/data/models`, schreibt Outputs nach `/data/artifacts`.

---

### 5) Trainer (Python/FastAPI, `stack/trainer`)

* **Tasks**:

  * `POST /train/llm-lora` (dataset S3 path, base model, hyperparams) → speichert LoRA-Gewichte nach S3
  * `POST /train/tts-voice` (speaker samples, lang) → erzeugt Voice-ID/Checkpoint
  * `POST /train/sd-lora` (images + captions) → speichert LoRA
* **Pipelines**:

  * LLM: PEFT/LoRA (transformers, accelerate), 8-bit/QLoRA
  * TTS: XTTS/Bark finetune/embedding + speaker enrollment
  * SD: DreamBooth/LoRA mit `diffusers`
* **Scheduler**:

  * GPU-Belegung prüfen, Queue (Redis), Jobs isolieren (unique run-id), Metriken emittieren
* **Outputs**:

  * Speichern der Artefakte/Logs in S3 + DB-Metadaten (Postgres)

---

### 6) Monitoring/Observability

* **Prometheus** scrape: gateway, inference, trainer (HTTP metrics), Node exporter wenn gewünscht
* **Grafana** Dashboards: Latenzen, Throughput, GPU-Auslastung (NVIDIA DCGM exporter optional)
* **Structured Logs** (JSON) + Korrelation (trace_id)

---

### 7) Security

* **JWT** für User/Session; **API-Key** für Service-to-Service
* **CORS**: nur Whitelist
* **Ratenlimit**: IP/User/Key
* **Upload-Validation** bei Trainingsdaten (Größe/MIME)
* **TLS** via Caddy
* **Audit-Logs**: wer trainiert welches Modell, wann?
* **Quotas** konfigurierbar (Max Steps, Max Vid Frames, etc.)

---

### 8) Human-Test (E2E)

1. `docker compose build --no-cache && docker compose up -d`
2. Health:

   * `curl http://localhost:4003/health`
   * `curl http://localhost:4003/api/tts/synthesize` (Test mit Demo-Text)
3. Chat im UI (falls UI separat existiert) → Gateway → LLM
4. Bild erzeugen: `POST /api/img/generate`
5. Video erzeugen: `POST /api/video/generate`
6. Training starten: `POST /api/train/llm-lora` (kleines Demo-Dataset) → Artefakt landet in S3

---

### 9) Produktions-Checkliste

* [ ] GPU genutzt (logs prüfen), OOM-frei
* [ ] JWT/API-Key funktionieren
* [ ] Rate-Limits aktiv
* [ ] S3 schreibt/liest
* [ ] Postgres/Migrations ok
* [ ] Prometheus + Grafana sichtbar
* [ ] Alle Healthchecks grün
* [ ] Artefakte reproduzierbar

---

### 10) Ergebnisse

* Ein **einziger Docker-Stack** auf unserem Server
* **Eigene** Implementierungen für LLM/TTS/Img/Video (open-source Basen)
* **Training & Inferenz** integriert
* **Produktionsreif**: Security, Monitoring, Storage, Skalierung

---

Wenn du möchtest, skizziere ich dir im nächsten Schritt **konkrete Code-Skeletons** (Rust Axum Gateway, FastAPI Endpoints, Diffusers/vLLM Bootstraps, TTS-Server) – alles so, dass blackbox direkt Dateien anlegt und loslegt.

