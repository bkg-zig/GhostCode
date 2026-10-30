Perfekt ✅ — das ist jetzt die **komplett ausführliche, finale Version der `README.md`**
für das **Ghost / Coding-Cave System** — dein vollständiges Blueprint-Dokument in Markdown,
**100 % detailreich, produktionsreif, mit vollständiger Architektur, Designsystem, Interaktionsfluss und Admin-Funktionalität.**

Du kannst diese Datei **direkt in dein GitHub-Repository als `README.md`** übernehmen.
Sie beschreibt **alles**: Auth, IDE, Chat-Agent, Token-System, Versionierung, Admin, Security, UX, Architektur & Next Steps.

---

````markdown
# ⚡️ Ghost / Coding-Cave  
### _Elite Cloud IDE & AI Development Environment_

---

## 🌌 Vision

Ghost / Coding-Cave ist eine **Next-Gen Cloud-IDE-Plattform**, inspiriert von **Replit**, **Linear**, **Vercel** und **GitHub Codespaces**,  
die durch **Ghost-Authentifizierung, Token-basiertes Rechenmodell**, **automatische Versionierung**,  
einen **intelligenten Chat-Agenten** und **ein Admin-gesteuertes Überwachungssystem** erweitert wurde.

Das Ziel:  
Eine sichere, KI-gestützte, Dark-Mode Cloud-IDE für Entwickler, Admins und Agenten –  
mit **modernem Motion-Design, Soft-UI und Realtime-Collaboration**.

---

## 🧩 Kernfunktionen

- 🔐 **Ghost API-Key Authentifizierung (E-Mail + Passwort + API-Key)**
- 🧠 **Replit-Style IDE mit Chat-Agent & Live Execution**
- 🏗️ **Caves für Python / Node.js / Rust mit Container-Isolation**
- 🪄 **Automatische Versionierung und Diff-Vergleiche**
- 💰 **Token-basiertes Ressourcen- & Ausführungsmodell**
- 🧾 **Live Tokenverbrauch, Aufladung & Tracking**
- 🏛️ **Admin Dashboard mit Monitoring, Logs & Tokens**
- 🎨 **High-End Dark UI mit Glassmorphism, Motion & Soft Glow**
- 🧱 **PostgreSQL + NestJS + Next.js Full-Stack Architektur**

---

## 🧠 Rollen & Rechte

| Rolle | Berechtigungen | Sichtbare Bereiche | Farbcode |
|-------|----------------|--------------------|-----------|
| 👤 **User** | Eigene Caves verwalten, Code ausführen, Tokens laden, Versionen ansehen | Dashboard, IDE, Chat, Tokens | Hellblau `#38bdf8` |
| ⚙️ **Developer** | Erweiterter Zugriff, Debugging, Agentensteuerung, Analyse | Developer Panel, Live Agent | Türkis→Violett `#00ffe0 → #7c3aed` |
| 🏛️ **Admin** | Komplette Systemkontrolle: User, Caves, Tokens, Logs, API-Keys | Admin Dashboard | Gold `#facc15` |

---

## 🔐 Registrierung & Authentifizierung

### Registrierung
1. User registriert sich mit **E-Mail-Adresse**.
2. Ghost erstellt automatisch:
   - Einen **API-Key** (z. B. `ghost_f48sd9as`)
   - Eine **Benutzerrolle** (`user`)
   - Einen **Token-Startsaldo** (z. B. `1000`)
   - Einen **Eintrag in der Datenbank** mit E-Mail und API-Key-Bindung.
3. Danach legt der User sein Passwort fest.

### Login
- Über: **E-Mail + Passwort + API-Key**
- Validierung durch Ghost-Server:
  - E-Mail ↔ API-Key Zuordnung
  - Passwortprüfung
  - Tokenbalance > 0
- Nach Login:
  - JWT Session generiert
  - `role`, `token_balance`, `main_cave_id` geladen
  - Zugriff auf Dashboard

---

## 🧱 Datenstruktur des API-Keys

```json
{
  "api_key": "ghost_93sd8fj3",
  "role": "user",
  "token_balance": 1200,
  "main_cave_id": "cave_839fj3",
  "created_at": "2025-10-29T13:40:00Z",
  "last_login": "2025-10-29T14:15:00Z",
  "usage_stats": {
    "tokens_used": 2200,
    "runs": 18,
    "versions": 5
  }
}
````

---

## 🏗️ User-Erstellung & Main-Cave

Nach dem ersten Login:

* Der User legt ein **Hauptprojekt (Main Cave)** an.
* Er wählt eine Sprache:

  * 🐍 **Python**
  * 🟢 **Node.js**
  * 🦀 **Rust**

### Eigenschaften der Main Cave

* Isolierte Umgebung (Container oder Sandbox)
* Ressourcenlimit (RAM/CPU)
* Tokenverbrauch pro Run
* Version-Historie mit Diffs
* Letzte Ausführung
* Letzter gespeicherter Snapshot

### Beispielpfade:

```
/user/{id}/caves/python-cave
/user/{id}/caves/node-cave
/user/{id}/caves/rust-cave
```

---

## 🖥️ Replit-Style IDE Layout

```jsx
<div class="dashboard">
  <DashboardNav />
  <main class="main-grid">
    <FileExplorer />
    <CodeEditor />
    <LiveCanvas />
  </main>
  <ChatAgent />
  <FooterStatus>
    <TokenIndicator />
    <ConnectionStatus />
  </FooterStatus>
</div>
```

---

### Komponentenbeschreibung

#### 🗂️ File Explorer

* Seitenleiste mit Projektstruktur.
* Aktionen:

  * * Neue Datei
  * * Neuer Ordner
  * Umbenennen / Löschen
  * "Im Chat erklären"
* Jede Änderung → **automatische Versionierung**

#### 💻 Code Editor

* Monaco-Editor (Replit-ähnlich)
* Syntax Highlighting, Autocomplete, Linting
* Features:

  * `Ctrl + Enter` → Code ausführen
  * `Ctrl + S` → Snapshot speichern
  * Live Tokenverbrauch pro Aktion
  * Autosave alle 60 Sekunden

#### 🪞 Live Canvas

* Zeigt Terminal-Ausgabe oder Web-App.
* Unterstützt Python, Node.js & Rust Execution.
* Live Output via **WebSockets** (SSE).

#### 🤖 Chat Agent

Ein kontextbewusster KI-Assistent, der:

* In derselben Cave arbeitet
* Den Dateikontext kennt
* Tokens, Sprache, Datei & Status berücksichtigt

### Chat-Befehle:

| Sprachbefehl                 | Aktion                   |
| ---------------------------- | ------------------------ |
| „Erstelle Datei main.py“     | Neue Datei im Explorer   |
| „Starte Rust-Cave“           | Neue Rust-Umgebung       |
| „Versioniere Projekt“        | Snapshot speichern       |
| „Erkläre diesen Code“        | KI-Analyse               |
| „Wie viele Tokens habe ich?“ | Tokenanzeige             |
| „Führe Code aus“             | Code Run mit Live Output |

---

## ⚙️ Backend-Endpunkte

| Methode | Endpoint                    | Beschreibung                      |
| ------- | --------------------------- | --------------------------------- |
| `POST`  | `/auth/register`            | Registrierung, API-Key generieren |
| `POST`  | `/auth/login`               | Login validieren                  |
| `POST`  | `/api/caves/create`         | Neue Cave anlegen                 |
| `GET`   | `/api/caves/list`           | Caves eines Users anzeigen        |
| `POST`  | `/api/caves/execute`        | Code ausführen (Tokens abziehen)  |
| `POST`  | `/api/caves/version`        | Snapshot speichern                |
| `GET`   | `/api/caves/versions`       | Liste aller Versionen             |
| `POST`  | `/api/user/tokens/recharge` | Tokens aufladen                   |
| `GET`   | `/api/admin/users`          | Admin: alle Nutzer anzeigen       |
| `GET`   | `/api/admin/caves`          | Admin: alle Caves                 |
| `GET`   | `/api/admin/logs`           | Audit Logs                        |

---

## ⚡ Ablauf: Code Execution Flow

1. User klickt auf **Run**.
2. Frontend sendet:

   ```json
   { "code": "...", "language": "python", "cave_id": "123", "api_key": "ghost_..." }
   ```
3. Backend:

   * Prüft API-Key, Tokens, Limits.
   * Zieht Tokens ab (z. B. 50).
   * Führt Code in Container aus.
4. Output wird über **WebSocket** an UI gestreamt.
5. Nach Ausführung → Snapshot erstellt.

### Tokenverbrauchs-Flow

* Jeder Run: -50 Tokens
* Jede Chat-Anfrage: -10 bis -50 Tokens
* Jede Version: -5 Tokens
* Realtime-Update in FooterStatus.

---

## 🪄 Automatische Versionierung

Jede Dateiänderung oder Ausführung erzeugt:

```json
{
  "version_id": "v12",
  "timestamp": "2025-10-29T14:20Z",
  "file_snapshot": "base64(...)",
  "changeset": "+12 lines",
  "execution_logs": "Output...",
  "used_tokens": 45
}
```

### `<VersionTimeline />`

* Zeigt alle Versionen als Zeitleiste.
* Aktionen:

  * 🔁 Wiederherstellen
  * 🔍 Diff-Vergleich
* Hover → zeigt Tokenverbrauch & User.

---

## 💰 Token-System

Tokens sind **Recheneinheiten** für:

* Codeausführung
* Chatinteraktion
* Analysen
* Versionierung

### Beispielkosten:

| Aktion        | Tokens |
| ------------- | ------ |
| Code Run      | 50     |
| Chat Prompt   | 10–50  |
| Version Save  | 5      |
| Datei-Analyse | 15     |

**Recharge:**
POST `/api/user/tokens/recharge`
User kann neue Tokens laden oder Admin kann sie zuweisen.

### UI-Komponente `<TokenIndicator />`

* Zeigt Verbrauch / verbleibende Tokens live.
* Animation bei Änderung.
* Farbwechsel bei niedrigem Stand (< 100).

---

## 🏛️ Admin-Dashboard

### Tabs

1. **Users** – Rollen, Tokenstände, letzte Aktivität
2. **Caves** – Projekte, Sprachen, Ressourcennutzung
3. **Versions** – Globale Versionen mit Zeitstrahl
4. **Logs** – Audit-Events & Fehler
5. **Tokens** – Aufladungen & Verbrauch
6. **Models** – KI-Modelle (optional)
7. **Agents** – Aktive KI-Agenten
8. **API Keys** – Verwaltung & Rechte
9. **Settings** – Systemkonfiguration

### Admin-Aktionen

* Tokens hinzufügen / sperren
* API-Key deaktivieren
* Cave löschen oder wiederherstellen
* Logs einsehen
* Ressourcenlimits ändern

### Monitoring

* Echtzeit-Charts (CPU, RAM, Tokens/h)
* WebSocket Feed: Live Activity Stream
* Filter nach User, Sprache, Zeitraum

---

## 📊 Monitoring & Logging

* **Audit Logs**: Jede Aktion wird gespeichert.
* **TokenUsage Table**: Partitioniert nach Tagen.
* **Health Monitor**: Ressourcenstatus.
* **Error Tracker**: Laufzeitfehler & Exceptions.
* **Analytics:** Tokenverbrauch pro Stunde/User.

---

## 🔒 Sicherheitsrichtlinien

* Kein externer Netzwerkzugriff aus Caves.
* Alle Tokens & API-Keys AES-256 verschlüsselt.
* RBAC Guards (Admin, Dev, User)
* JWT + API-Key Double Validation.
* Rate Limiting pro User.
* Audit Logging aktiv für jede Aktion.
* TokenUsage partitioniert für Effizienz.

---

## 🎨 Designsystem (Premium Elite Theme)

| Element      | Farbe / Stil                                                            |
| ------------ | ----------------------------------------------------------------------- |
| Hintergrund  | Gradient `#0f172a → #1e1e1e`                                            |
| Akzentfarben | Türkis `#00ffe0`, Violett `#7c3aed`, Hellblau `#38bdf8`, Gold `#facc15` |
| Textfarben   | Hell `#f9fafb`, Grau `#9ca3af`                                          |
| Schrift      | Satoshi / Inter / JetBrains Mono                                        |
| Schatten     | `0 4px 30px rgba(0,0,0,0.4)`                                            |
| Animationen  | Fade 0.25s, Hover Scale 1.05                                            |

### UI-Komponenten

* `<DashboardNav>` – Topbar mit Glow-Icons
* `<CardPremium>` – Glassmorphism Panels
* `<ButtonPremium>` – Gradient Glow Buttons
* `<InputGhost>` – transluzent mit Fokusrahmen
* `<TokenIndicator>` – Live Verbrauchsanzeige
* `<VersionTimeline>` – Zeitleiste mit Diffs
* `<AuthModal>` – Login/Register Frost Modal
* `<TokenRechargePanel>` – Auflade-UI

---

## 🧱 Architektur

### Stack

| Ebene     | Technologie                          |
| --------- | ------------------------------------ |
| Backend   | NestJS (TypeScript)                  |
| Frontend  | Next.js (React 18 + App Router)      |
| Datenbank | PostgreSQL + Prisma ORM              |
| Auth      | JWT + Passport + API-Key             |
| Live      | WebSocket + SSE                      |
| Styling   | Tailwind + Shadcn/UI + Framer Motion |
| Container | Docker Compose                       |
| Logging   | Winston + PostgreSQL Audit Tables    |

### Struktur

```
root/
 ├─ apps/
 │   ├─ api/          ← NestJS Backend
 │   └─ dashboard/    ← Next.js Frontend
 ├─ packages/
 │   ├─ ui/           ← Shared Components
 │   ├─ types/        ← Shared Interfaces
 │   └─ db/           ← Prisma Models
```

---

## ⚙️ System-Flow (Schritt-für-Schritt)

1. **Registrierung** → Ghost erstellt API-Key
2. **Login** → JWT Session + Tokens geladen
3. **Main-Cave-Erstellung** → Sprache auswählen
4. **IDE-Start** → File Explorer, Editor, Canvas aktiv
5. **Coden + Ausführen** → Tokens abgezogen, Version gespeichert
6. **Chat-Agent** → Interaktive Hilfen & Erklärungen
7. **Tokens aufgebraucht** → Recharge-Modal öffnet sich
8. **Admin überwacht** alles live im Dashboard
9. **System speichert** jede Aktion als Audit-Eintrag

---

## 🚀 Zieldefinition

Ghost / Coding-Cave ist:

* 🔒 Eine sichere Cloud-IDE mit Rollenverwaltung
* 🧠 Eine KI-gestützte Coding Experience
* 🪄 Eine automatisch versionierende Entwicklungsumgebung
* 💰 Eine Token-gesteuerte Compute-Plattform
* 🏛️ Ein Admin-kontrolliertes Audit-System
* 🎨 Ein Elite-Designsystem mit Motion & Glow

---

## 🛠️ Next Steps (Umsetzung)

1️⃣ **Auth-Flow (Register → Login → API-Key)**
2️⃣ **Replit-Style IDE (Explorer, Editor, Canvas, Chat)**
3️⃣ **Token-System & Footer-Anzeige**
4️⃣ **Versionierung + Timeline**
5️⃣ **Admin Dashboard mit Monitoring & Tokens**
6️⃣ **Premium-Design & Motion Effects**
7️⃣ **QA, Security Audit, Deployment (Docker / Vercel)**

---

## ✅ Fazit

Ghost / Coding-Cave ist ein **vollständig geplantes, produktionsreifes Cloud-Entwicklungssystem**
mit einer einzigartigen Kombination aus:

* Ghost Auth
* Tokenökonomie
* KI-Chat-Agent
* Versionierung
* Admin-Überwachung
* Modernem Premium-UX

> Eine All-in-One Cloud-IDE-Plattform für die Zukunft.

---

```

---
