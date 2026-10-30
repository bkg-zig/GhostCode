Klar ✅ — hier ist **die komplette finale Systembeschreibung** als **vollständige, saubere Markdown-Datei (`.md`)**
für dein Ghost / Coding-Cave-Projekt.
Sie ist perfekt formatiert, enthält alle Systemteile, Designrichtlinien, Abläufe und Rollen — **bereit für dein Repo (`README.md`)**.

---

```markdown
# ⚡️ Ghost / Coding-Cave  
### _Next-Generation Cloud IDE with Ghost Authentication, Token System & Replit-Style Experience_

---

## 🧭 Vision & Ziel

Ghost / Coding-Cave ist eine **Cloud-IDE-Plattform der Zukunft**, inspiriert von **Replit**, **Linear**, **Vercel** und **GitHub Codespaces**.  
Sie kombiniert **kollaboratives Coden, KI-Assistenz, Token-basierte Ressourcenverwaltung**  
und **Admin-gesteuerte Sicherheit** in einer einzigen, modernen Oberfläche.

---

## 🧩 Kernfunktionen

- 🔐 **Ghost API-Key Authentifizierung**
- 🧠 **Replit-Style IDE mit KI-Chat-Agent**
- 🏗️ **Caves für Python / Node / Rust**
- 🪄 **Automatische Versionierung & Audit-Trails**
- 🧾 **Token-basiertes Ressourcensystem**
- 🏛️ **Admin-Dashboard mit Live-Monitoring**
- 🎨 **Premium-Design mit Dark-Mode, Glassmorphism & Motion**

---

## 👥 Rollen & Berechtigungen

| Rolle | Rechte | Sichtbare Module | Farb-Theme |
|-------|---------|------------------|-------------|
| 👤 **User** | Eigene Caves verwalten, Tokens laden, Chat & Code nutzen | Dashboard, IDE, Chat | Hellblau `#38bdf8` |
| ⚙️ **Developer** | Vollzugriff auf Live-Tools, Debug, Chat-Integration | Live-Logs, Modelle | Türkis→Violett `#00ffe0 → #7c3aed` |
| 🏛️ **Admin** | Verwaltung von Usern, Tokens, Versionen, Logs | Admin Dashboard | Gold `#facc15` |

---

## 🔐 Registrierung & Authentifizierung

### Registrierung (`/auth/register`)
1. User gibt E-Mail ein.
2. System erstellt:
   - **API-Key** (einzigartig, verschlüsselt)
   - **Rolle:** user
   - **Token-Balance:** 1000
   - **Main Cave:** leer
3. User legt Passwort fest.

### Login (`/auth/login`)
- **E-Mail + Passwort + API-Key**
- Ghost validiert Kombination & Token-Status.
- Session JWT wird erstellt.

### API-Key Struktur
```

api_key: ghost_8fj29sdj29fj
role: user
token_balance: 1000
main_cave_id: null
created_at: 2025-10-29
last_login: ...
usage_stats: ...

```

---

## 🏗️ Caves & Projekte

Jede **Cave** ist eine isolierte Umgebung (Container oder Sandbox)  
für eine bestimmte Sprache:

```

/user/{id}/caves/python-cave
/user/{id}/caves/node-cave
/user/{id}/caves/rust-cave

````

**Eigenschaften:**
- Sprache  
- Ressourcenlimit (RAM/CPU)  
- Tokens pro Run  
- Version-Historie  
- Letztes Ergebnis  

**Erstellt via:** `POST /api/caves/create`

---

## 🖥️ Replit-Style IDE-Layout

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
````

---

### 🔹 Komponentenübersicht

#### **File Explorer**

* Zeigt alle Dateien & Ordner der Cave.
* Aktionen:

  * * Datei / + Ordner
  * Rename / Delete / Versionieren
  * "Im Chat erklären" (AI Insight)

#### **Code Editor**

* Monaco-Editor mit Syntax Highlighting.
* Autocomplete, Linting, Multi-Tabs.
* `Ctrl+Enter` → Run
* `Ctrl+S` → Save Version
* Tokenverbrauch live sichtbar.

#### **Live Canvas**

* Zeigt Terminal-Ausgabe, App-Preview oder Visual Output.
* WebSocket-Streaming in Echtzeit.

#### **Chat Agent**

* KI-Entwicklungsassistent mit Sprachbefehlen:

  | Befehl                       | Aktion             |
  | ---------------------------- | ------------------ |
  | „Erstelle Datei main.py“     | Neue Datei anlegen |
  | „Führe Code aus“             | Code ausführen     |
  | „Versioniere Projekt“        | Snapshot speichern |
  | „Erkläre diesen Code“        | KI erklärt Code    |
  | „Wie viele Tokens habe ich?“ | Tokenanzeige       |
  | „Starte Rust-Cave“           | Neue Cave starten  |

* Kontextbewusst (weiß, in welcher Cave und Datei du bist)

* Tokenverbrauch pro Aktion sichtbar

#### **Footer Status**

* TokenIndicator (verbraucht / verbleibend)
* ConnectionStatus (live, idle, disconnected)
* ExecutionInfo (letzter Run, Sprache)

---

## ⚙️ Backend-Endpoints

| Methode | Route                       | Beschreibung                       |
| ------- | --------------------------- | ---------------------------------- |
| `POST`  | `/auth/register`            | Registrierung + API-Key-Erstellung |
| `POST`  | `/auth/login`               | Login mit API-Key                  |
| `POST`  | `/api/caves/create`         | Neue Cave anlegen                  |
| `GET`   | `/api/caves/list`           | Alle Caves anzeigen                |
| `POST`  | `/api/caves/execute`        | Code ausführen                     |
| `POST`  | `/api/caves/version`        | Snapshot speichern                 |
| `GET`   | `/api/caves/versions`       | Versionen anzeigen                 |
| `POST`  | `/api/user/tokens/recharge` | Tokens aufladen                    |
| `GET`   | `/api/admin/users`          | Admin: alle User anzeigen          |
| `GET`   | `/api/admin/caves`          | Admin: alle Caves anzeigen         |
| `GET`   | `/api/admin/logs`           | Admin: Audit-Logs anzeigen         |

---

## ⚡ Ablauf eines Code-Runs

1. User klickt **Run**
2. Editor sendet:

   ```
   { code, language, cave_id, api_key }
   ```
3. Backend prüft:

   * API-Key gültig?
   * Tokenbalance ausreichend?
   * Sprache erlaubt?
4. Tokens werden abgezogen.
5. Code läuft in isoliertem Container.
6. Output → LiveCanvas (WebSocket).
7. Snapshot → Version-Historie gespeichert.

---

## 🪄 Versionierungssystem

### Automatischer Snapshot

Bei jedem Speichern oder Run:

```
version_id
user_id
cave_id
timestamp
file_snapshot
changeset
execution_logs
tokens_used
```

### UI-Komponente `<VersionTimeline />`

* Zeitleiste mit allen Snapshots
* Buttons:

  * 🔁 Wiederherstellen
  * 🔍 Vergleichen
* Hover zeigt Tokenverbrauch & Timestamp

---

## 💰 Token-System

Tokens = **Compute-Währung**
Verbrauch wird in Echtzeit angezeigt.

| Aktion            | Tokenkosten |
| ----------------- | ----------- |
| Code Run          | 50          |
| Chat Prompt       | 10–50       |
| Version speichern | 5           |
| Datei-Analyse     | 15          |

Wenn `token_balance = 0` →
⚠️ *„Tokens aufgebraucht – bitte neue Tokens aufladen.“*

**TokenRechargePanel:**

* Zeigt API-Key & Token-Historie
* Recharge-Button (POST /tokens/recharge)

---

## 🏛️ Admin-Dashboard

### Tabs

1. **Users** – alle Konten, Rollen, Tokenstände
2. **Caves** – Projekte & Versionen
3. **Versions** – globale Zeitleiste
4. **Logs** – Audit-Log aller Aktionen
5. **Tokens** – Verbrauch & Limits
6. **Models** – KI-Modelle (optional)
7. **Agents** – Aktive KI-Instanzen
8. **API Keys** – Verwaltung & Rechte
9. **Settings** – Systemeinstellungen

### Features

* Live-Monitoring (CPU, RAM, Tokens/min)
* WebSocket-basierte Updates
* Filter nach User / Sprache / Zeitraum
* Diagramme: Tokens, Requests, Ressourcen

---

## 📊 Monitoring & Audit

* **Audit Log** – jede Aktion gespeichert
* **TokenUsage Table** – täglich partitioniert
* **System Health** – CPU/RAM aller Caves
* **Error Log** – Exceptions & Failures
* **Admin Charts** – Live-Verbrauchsstatistiken

---

## 🔒 Sicherheit

* Keine externen Internetzugriffe aus Caves
* Token & Keys AES-256 verschlüsselt
* JWT + API-Key Double Validation
* RBAC (Role-Based Access Control)
* Rate Limiting per API-Key
* Audit Logging jeder Aktion
* TokenUsage Partitionierung (täglich)

---

## 🎨 Design-Style-Guide (Elite Theme)

| Element     | Farbe / Stil                                                               |
| ----------- | -------------------------------------------------------------------------- |
| Hintergrund | Gradient `#0f172a → #1e1e1e`                                               |
| Akzente     | Türkis `#00ffe0` / Violett `#7c3aed` / Hellblau `#38bdf8` / Gold `#facc15` |
| Text        | Hell `#f9fafb`, Grau `#9ca3af`                                             |
| Schrift     | Satoshi / Inter / JetBrains Mono                                           |
| Schatten    | `0 4px 30px rgba(0,0,0,0.4)`                                               |
| Animation   | Fade 0.25s, Hover Scale 1.05                                               |

### Komponenten

* `<DashboardNav>` – Gradient + Icon Glow
* `<CardPremium>` – Glass Blur Panels
* `<ButtonPremium>` – Gradient Glow
* `<InputGhost>` – transluzent, heller Fokus
* `<TokenIndicator>` – Live Tokenanzeige
* `<AuthModal>` – Login/Register Frost-UI
* `<VersionTimeline>` – Interaktive Timeline

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
| Styles    | Tailwind + Shadcn/UI + Framer Motion |
| Container | Docker Compose                       |
| Logging   | Winston + Audit Tables               |

### Struktur

```
root/
 ├─ apps/
 │   ├─ api/          ← NestJS Backend
 │   └─ dashboard/    ← Next.js Frontend
 ├─ packages/
 │   ├─ ui/           ← Shared Components
 │   ├─ types/        ← Interfaces
 │   └─ db/           ← Prisma Models
```

---

## 🚀 Ablauf – User Journey

1. **Registrierung** → API-Key generiert
2. **Login** → Dashboard geöffnet
3. **Main Cave erstellen** (Sprache wählen)
4. **IDE öffnen** → Chat + Code + Canvas aktiv
5. **Coden, ausführen, versionieren**
6. **Tokens verbrauchen & aufladen**
7. **Admin überwacht & verwaltet alles**

---

## 🧾 Zieldefinition

Ghost / Coding-Cave ist eine:

* 🔒 Sichere, rollenbasierte Cloud-IDE
* 🧠 Intelligente Umgebung mit Chat-Agent
* 🪄 Automatisch versionierende Entwicklungsplattform
* 💰 Token-ökonomisch gesteuerte Compute-Cloud
* 🏛️ Admin-kontrollierte Infrastruktur
* 🎨 Mit High-End Soft-UI, Motion & Glassmorphism

---

## 🛠️ Next Steps (Implementierungsplan)

1️⃣ Auth-Flow (Register → Login → API-Key)
2️⃣ Replit-Style IDE (Explorer + Editor + Canvas + ChatAgent)
3️⃣ Token-System mit Footer-Display
4️⃣ DB-Versionierung mit Timeline
5️⃣ Admin-Panel mit Tokens & Logs
6️⃣ Soft-UI Theme & Animationen
7️⃣ Security Audit + Production Deploy (Docker)

---

## ✅ Fazit

**Ghost / Coding-Cave** ist das ultimative
🧠 **All-in-One Cloud Development System** –
eine **sichere, KI-gestützte, versionierte Coding Experience**
mit **Rollenverwaltung, Tokenökonomie, Audit-Trails und Premium-Design.**

Bereit für **Production Deployment.**

---

```

---

Möchtest du, dass ich daraus direkt eine **bereitstellbare README.md-Datei** generiere (mit Titelbanner, Inhaltsverzeichnis und Abschnittsverlinkung), damit du sie direkt in dein GitHub-Repo committen kannst?
```
