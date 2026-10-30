# Ghost Coding Cave – LLM Stack Status

## Aktueller Stand im Repository

- Rust-Workspace‑Mitglieder: `helper-core`, `semantic-adapter`, `storage-adapter`, `gateway`, `ai-server`.
- `ai-server` stellt Axum-Endpunkte für Chat, TTS, Bild-/Video-Generierung und Trainings-Jobs bereit. Der Dienst nutzt aktuell einen Registry-Stubs und legt Platzhaltermodelle unter `HELPER_DB_PATH` ab (Standard: `/data/helper.db`).
- `helper-core` liefert weiterhin In-Memory-Heuristiken für Analyse, Planner und Agents; eine persistente Modell-Datenbasis ist nicht angeschlossen.
- In den Docs (`docs/`) werden Deployments, Ops und Sicherheitsmaßnahmen beschrieben; `STATUS.md` referenziert allerdings noch die ältere helper-db-Integration, sodass die Roadmap mit der aktuellen Codebasis neu abgeglichen werden muss.
- Für die produktive Nutzung soll ein konsistenter „semantic-store“ (unser zukünftiger persistenter Speicher für Modelle/Tokenizers/Embeddings) eingeführt werden.

## Offene Aufgaben rund um den semantic-store

1. **Schema & Seeder**
   - Definition des `semantic-store`-Schemas (Tabellen/Kollektionen für `models`, `artifacts`, `tokenizers`, Trainings-Jobs, Service-Status).
   - Implementierung eines Seeders oder Admin-Befehls, der reale Modelle und Tokenizer in den semantic-store schreibt.

2. **Registry-Anbindung**
   - Austausch der Stub-Registry im AI-Server durch echte Datenbankabfragen gegen den semantic-store.
   - Ergänzung von APIs zum Hochladen, Aktualisieren und Entfernen von Modellen, einschließlich Metadaten- und Tokenizer-Verwaltung.

3. **Adapter-Integration**
   - Kopplung von `helper-core`, `semantic-adapter` und `gateway` an den semantic-store, sodass Analyse-, Planner- und Agentenfunktionen auf denselben Modelldaten basieren wie der AI-Server.

4. **Admin-Dashboard & Service-Control**
   - UI im Dashboard zum Herunterladen und Registrieren von Modellen (GGUF, ONNX, Transformers) direkt in den semantic-store.
   - Verwaltungskonsole zum Anzeigen, Aktualisieren und Löschen von Modellen sowie zum Konfigurieren eigener Tokenizer.
   - Service-Management (Start/Stop/Auto-Restart) für AI-Server, Gateway und weitere Backend-Dienste; Echtzeit-Monitoring von Modellstatus, Trainingsjobs und Servicegesundheit.

5. **Unterstützung verschiedener Modellformate**
   - Loader/Adapter für GGUF-, ONNX- und Transformers-Modelle inklusive automatischer Format-Erkennung.
   - Konsistente API-/Inferenzpfade für alle Formate innerhalb des AI-Servers und nachgelagerter Services.

6. **Docker-/DevOps-Erweiterungen**
   - Erweiterung der Compose-Umgebung um den AI-Server, den semantic-store (Persistenz/Volumes) und optional Load-Balancing-/Skalierungs-Setups.
   - Abgleich der bestehenden Deploy-/Ops-Dokumente mit dem neuen semantic-store-Flow.

7. **API, Tests & Dokumentation**
   - REST- und Dashboard-APIs für Modell-Upload/Download, Tokenizer-Management und Trainingsjob-Verwaltung, die auf den semantic-store zugreifen.
   - Integrationstests für Modell-Workflows, Datenbankzugriffe und Service-Steuerung.
   - Aktualisierung der Doku (u. a. `API_REFERENCE.md`, `PRODUCTION_READINESS.md`, `OPS_CHECKLIST.md`, `STATUS.md`) auf den semantic-store-Begriff und die neuen Abläufe.

## Zusammenfassung

Der bisherige helper.db-Platzhalter muss durch einen vollwertigen semantic-store ersetzt werden. Erst wenn Schema, Seeder und Service-Anbindungen stehen, können AI-Server, helper-core und Dashboard produktiv auf Modell- und Tokenizer-Daten zugreifen. Parallel entstehen Admin-Funktionen für Modellverwaltung und Service-Steuerung sowie Multi-Format-Support. Nach Abschluss dieser Arbeiten lässt sich der in den Docs beschriebene Produktionsstack (inkl. Docker Compose, Monitoring und Tests) realisieren.
