UX.md — Ghost Coding Cave v0.2a UI/UX Design
Einführung

Dieses Dokument beschreibt die UI/UX-Elemente und das Design für die Ghost Coding Cave v0.2a-Plattform. Es umfasst alle Farben, Layouts, Menüs, Komponenten und deren Interaktionen, um sicherzustellen, dass die Benutzeroberfläche konsistent und benutzerfreundlich ist.

Design-Style-Guide
Farben

Hintergrund:

Primär: #0f172a → #1e1e1e (dunkler Hintergrund für die gesamte Anwendung).

Sekundär: #1e1e1e (für Unterseiten und weniger prominente Bereiche).

Akzentfarben:

Türkis: #00ffe0

Violett: #7c3aed

Hellblau: #38bdf8

Gold: #facc15

Textfarben:

Helles Textfarbe: #f9fafb (für den Haupttext auf dunklen Hintergründen).

Text-Grau: #9ca3af (für sekundäre Informationen und weniger auffällige Texte).

Schattierungen:

Schatten: 0 4px 30px rgba(0,0,0,0.4) (für Hover-Effekte und Panels).

Schriftarten:

Primär: Satoshi

Sekundär: Inter

Code/Monospace: JetBrains Mono (für Code-Editoren und technische Textdarstellung).

Animationen

Fade: Alle UI-Elemente sollten mit einer sanften Fade-Animation von 0.25s erscheinen und verschwinden.

Hover-Scale: Auf Hover wird ein leichtes Vergrößern (Scale 1.05) für Buttons und interaktive Elemente verwendet.

Layout- und UI-Elemente
Dashboard-Layout

Das Replit-Style Layout sollte in diesem Format aufgebaut werden:

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


DashboardNav: Topbar mit einem Gradient-Highlight und Icon-Glow, das den aktuellen Status anzeigt (z. B. Tokenverbrauch, aktuelle Cave).

main-grid: Das Haupt-Grid, das aus dem FileExplorer, CodeEditor und LiveCanvas besteht.

FileExplorer: Zeigt alle Dateien und Projekte des Benutzers in der aktuellen Cave an.

CodeEditor: Integriert einen Monaco-Editor für den Code, einschließlich Syntax-Highlighting und IntelliSense.

LiveCanvas: Zeigt die laufende Ausführung des Codes an, einschließlich der Konsole und der visuellen Darstellung des Projekts.

ChatAgent: Ein intelligenter Chat-Agent, der die Benutzer unterstützt und mit ihnen auf natürliche Weise interagiert. Der Agent reagiert auf Sprachbefehle wie „Starte Python-Cave“ oder „Zeige Canvas“.

FooterStatus: Der Fußbereich, der wichtige Informationen anzeigt:

TokenIndicator: Zeigt den aktuellen Token-Balance an.

ConnectionStatus: Zeigt die Verbindung des Benutzers mit der Plattform an.

Admin-Panel

Das Admin-Panel bietet eine vollständige Übersicht über alle Benutzer, Caves, Versionen und Logs. Es sollte folgende Tabs enthalten:

Users: Zeigt eine Liste aller registrierten Benutzer, ihren API-Key und den Tokenverbrauch.

Caves: Zeigt eine Übersicht aller Caves, einschließlich Ressourcenverbrauch und Logs.

Versions: Zeigt die Versionshistorie für jede Cave.

Logs: Zeigt System-Logs und Fehlerberichte an.

Tokens: Verwaltung von Token-Balance und Aufladung.

Interaktive UI-Komponenten

CardPremium: Ein Glassmorphism-Panel mit Blur-Effekt, das verwendet wird, um wichtige Informationen und Stats anzuzeigen.

Beispiel: Eine Karte, die den aktuellen Stand der Cave-Ressourcen oder Benutzerinformationen zeigt.

ButtonPremium: Halbtransparente, gradientierte Buttons, die beim Hover mit einem leichten Glow-Effekt reagieren.

Beispiel: „Starten“ oder „Stoppen“-Buttons zum Ausführen von Projekten oder Caves.

InputGhost: Ein transluzenter Input mit einem klaren Fokusrahmen, der bei der Benutzereingabe reagiert.

Beispiel: Eingabefelder für API-Schlüssel, Benutzernamen oder Projektbezeichner.

VersionTimeline: Eine Zeitleiste, die alle Versionen eines Projekts anzeigt, einschließlich der Möglichkeit, auf frühere Versionen zurückzusetzen.

Beispiel: Ein Panel, das die letzte Version eines Codes oder einer Cave anzeigt und es dem Admin ermöglicht, ältere Versionen wiederherzustellen.

AuthModal: Ein Modal, das die Authentifizierung für den Benutzer mit API-Key und Passwort ermöglicht.

Beispiel: Login- oder Registrierungsformular für den Zugriff auf das System.

TokenRechargePanel: Ein Bereich zum Aufladen von Tokens und Anzeigen der Details zum API-Key.

Beispiel: Ein Panel, das es dem Benutzer ermöglicht, neue Tokens aufzuladen und die verbleibende Balance anzuzeigen.

Menüstruktur
Benutzermenü

Das Benutzermenü ist in der oberen Navigationsleiste eingebaut und enthält folgende Optionen:

Dashboard: Die Startseite, die alle Caves und den aktuellen Tokenverbrauch anzeigt.

Caves: Eine Liste aller Caves, die der Benutzer verwaltet, einschließlich der Möglichkeit, neue Caves zu erstellen und zu verwalten.

Account: Einstellungen für den Benutzeraccount, einschließlich der Möglichkeit, den API-Key zu generieren oder zu erneuern.

Logout: Abmelden des Benutzers aus der Plattform.

Admin-Menü

Das Admin-Menü ist ebenfalls in der oberen Navigationsleiste eingebaut und enthält folgende Optionen:

Users: Anzeige aller Benutzer und ihrer Tokenverwendung.

Caves: Überblick über alle Caves und deren Ressourcenverbrauch.

Logs: Anzeige von Fehlerberichten und System-Logs.

Tokens: Verwaltung von Tokens und API-Schlüsseln für alle Benutzer.

Audit Logs: Protokollierung aller Aktionen der Benutzer und Administratoren auf der Plattform.

Interaktion und UX-Besonderheiten

Interaktive Elemente: Alle interaktiven Elemente wie Buttons und Eingabefelder haben Hover- und Fokus-Effekte, um eine reibungslose und benutzerfreundliche Navigation zu gewährleisten.

Dark Mode: Das gesamte Design ist im Dark Mode gehalten, um die Augenbelastung zu minimieren und eine moderne, edle Benutzeroberfläche zu bieten.

Responsive Design: Alle UI-Elemente passen sich an unterschiedliche Bildschirmgrößen an, um eine benutzerfreundliche Erfahrung auf Mobilgeräten und Desktops zu gewährleisten.