Hier ist die angepasste **START.md**, die erklärt, dass die Version **v0.2a** bereits umsetzt werden soll und der LLM nun die Aufgabe hat, die Systemarchitektur direkt in der IDE umzusetzen. Es wird klar beschrieben, dass er die Implementierung basierend auf der Architektur und dem Design ausführen soll:

---

# **START.md — Ghost Coding Cave v0.2a Implementierung**

## Einführung

Herzlich willkommen bei der **Ghost Coding Cave**. Du bist jetzt dabei, die **v0.2a** Version der **Ghost Coding Cave** Plattform umzusetzen. Dies ist eine vollständige und produktionsreife Cloud-IDE, die es Entwicklern und Administratoren ermöglicht, isolierte Entwicklungsumgebungen (Caves) zu erstellen und zu verwalten.

In **v0.2a** konzentrieren wir uns darauf, die Architektur und die Funktionalitäten gemäß den im Design beschriebenen Vorgaben in die IDE zu integrieren. Das System wird bereits in einer vollständigen Entwicklungsumgebung ausgeführt, und deine Aufgabe ist es, diese basierend auf den spezifizierten Anforderungen zu implementieren.

---

## 1. **Deine Aufgaben:**

### 1.1. **Umsetzung der v0.2a Architektur**

* Die **Ghost API** ist bereits implementiert und wartet darauf, dass du die Architektur in die IDE umsetzt.
* **Caves** sind isolierte Umgebungen, die in den Programmiersprachen **Python**, **Node.js** und **Rust** ausgeführt werden. Deine Aufgabe ist es, diese Umgebungen zu konfigurieren, die notwendige Codeausführung zu ermöglichen und die **Token-System-Integration** zu integrieren.
* Jedes Projekt wird durch einen **API-Key** geschützt, der an den Benutzer gebunden ist und alle Aktionen (einschließlich Codeausführung) überwacht.

### 1.2. **Integration der Replit-Style IDE**

* Die **Replit-Style IDE** sollte die drei Hauptsprachen (Python, Node.js, Rust) unterstützen und die Benutzeroberfläche entsprechend den Anforderungen implementieren.
* Stelle sicher, dass der **Monaco-Editor** oder eine vergleichbare Lösung integriert wird, um eine leistungsstarke Codebearbeitung zu ermöglichen.
* Baue die **Chat-Agent**-Integration aus, sodass der Benutzer Code ausführen kann, Sprachbefehle wie „Starte Python-Cave“ oder „Zeige Canvas“ ausführen kann.

---

## 2. **Funktionen der v0.2a**

### 2.1. **Ghost API & Authentifizierung**

Die **Ghost API** sorgt für eine gesicherte **Benutzerregistrierung** und **API-Key-Generierung**. Der API-Key ermöglicht es, den **Tokenverbrauch** zu steuern und zu verfolgen.

* Jedes Projekt (Cave) wird mit einem einzigartigen API-Key verknüpft.
* Nutzer können über das Frontend einen neuen API-Key generieren und in die Plattform integrieren.

### 2.2. **Caves und Projektverwaltung**

Die Caves sind separate, isolierte Umgebungen, die mit spezifischen Ressourcen (RAM/CPU) und einem Token-Limit ausgestattet sind. Der Benutzer kann neue Caves in einer der drei unterstützten Sprachen anlegen:

* **Python-Cave**
* **Node.js-Cave**
* **Rust-Cave**

Jede dieser Caves hat ihre eigene Versionshistorie, und jede Änderung in einer Cave wird versioniert. Der **Admin** kann alle Caves überwachen und Versionshistorien einsehen.

### 2.3. **Token-System**

Jede Codeausführung, jeder API-Aufruf und jeder Chat-Call verbraucht **Tokens**. Ein API-Key hat eine bestimmte Anzahl an verfügbaren Tokens:

* Bei **Token-Überzug** wird der Benutzer benachrichtigt und aufgefordert, neue Tokens aufzuladen.
* Die Tokens können über das Backend (via `/api/user/tokens/recharge`) aufgeladen werden.

---

## 3. **Frontend und Admin-Dashboard**

### 3.1. **Replit-Style Layout**

Das Frontend sollte ein Replit-ähnliches Layout haben, das folgendermaßen aussieht:

```jsx
<div className="dashboard">
  <DashboardNav />
  <main className="main-grid">
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

* **FileExplorer**: Zeigt alle Dateien im aktuellen Projekt an.
* **CodeEditor**: Der Editor zum Bearbeiten und Ausführen von Code.
* **LiveCanvas**: Zeigt das Ergebnis der Codeausführung an (z. B. Terminalausgaben, UI-Darstellung).
* **ChatAgent**: Ermöglicht dem Benutzer, natürliche Sprachbefehle zu verwenden, um Aktionen wie „Starte Cave“ oder „Versioniere Projekt“ auszuführen.
* **FooterStatus**: Zeigt wichtige Informationen wie den verbleibenden Token-Balance und den Verbindungsstatus an.

### 3.2. **Admin-Dashboard**

Im **Admin-Dashboard** kannst du alle Caves, Benutzer, Versionen und Logs überwachen. Es gibt folgende Tabs:

* **Users**: Liste der registrierten Benutzer, deren API-Schlüssel und Token-Verbrauch.
* **Caves**: Alle Caves, deren Ressourcenverbrauch und Logs.
* **Versions**: Anzeige der Versionierung der Caves.
* **Logs**: Zeigt System-Logs und Fehlerberichte an.
* **Tokens**: Verwaltung der Token für Benutzer und Caves.

### 3.3. **Interaktion mit Chat-Agent**

Der Chat-Agent soll in der Lage sein, einfache natürliche Sprachbefehle zu verstehen und zu verarbeiten:

* „Erstelle Datei `main.py`“.
* „Starte Rust-Cave“.
* „Zeige Canvas“.
* „Versioniere Projekt“.

Der Chat-Agent reagiert mit Codeblöcken, Erklärungen und Visualisierungen.

---

## 4. **Sicherheitsrichtlinien**

* **Keine Demo- oder Dev-Modi**: Nur autorisierte API-Keys und Benutzer haben Zugriff auf die Funktionen.
* **Strikte Trennung**: Die Admin-UI und die User-UI sind strikt voneinander getrennt, um die Datensicherheit zu gewährleisten.
* **Verschlüsselung**: Alle sensiblen Daten, einschließlich Tokens und Versionen, sind sicher verschlüsselt.

## 5. **Ausblick:**

Jetzt, da die Architektur klar definiert ist und du das System gemäß den Anforderungen implementieren wirst, liegt der Fokus auf der tatsächlichen Implementierung. Die Plattform nutzt **Docker** für eine einfache Bereitstellung und ist vollständig isoliert, sodass Benutzer in ihren Caves sicher arbeiten können.

Starte den **LLM**-Prozess, indem du die **IDE und Backend-Integration** umsetzt und alle vorgesehenen Features testest. Jede Cave soll stabil laufen, und der Chat-Agent soll korrekt auf die Sprachbefehle reagieren.

---

**Wichtige Hinweise:**

1. Der LLM soll alle **v0.2a** Features und das **Design** korrekt implementieren.
2. Der Code und alle Module sollten getestet und sicher sein.
3. Berücksichtige alle in der Architektur beschriebenen Komponenten.

---

Dies ist die vollständige **START.md**, die dir als Anleitung dient, die **v0.2a**-Version der **Ghost Coding Cave** gemäß dem beschriebenen Design zu implementieren.
