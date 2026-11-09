# Übernahme des geprüften D2-Stands nach main

Nutzerfreigabe09.11.2026: geprüften D2.7-Stand nach main übernehmen und auf
GitHub veröffentlichen. D2.7-Quelle05cebbf, bisheriger GitHub-main b08a64d.

Der lokale main/origin-main war älter als der tatsächliche GitHub-main. Dieser
enthält zusätzliche Planungsdokumente sowie die beiden iPhone-Anpassungen
b6bda71 (sicherer sichtbarer Bildschirmbereich) und b08a64d (verhindertes
Dokumentverschieben im Standalone-Modus). Diese Änderungen werden vollständig
erhalten und mit D2.7 zusammengeführt; kein Ersetzen/Force-Push von main.

## Konfliktauflösung

- D2-Plan (add/add): gemeinsamer Plantext plus die neueren ausdrücklichen
  Nutzerbeschlüsse aus dem Entwicklungsbranch. Keine Rückkehr zu älteren
  Brutzeiten, Königinnenlimits oder Verbrauchswerten.
- src/style.css: image-rendering:pixelated aus dem Entwicklungsbranch UND
  max-width/max-height100% aus main. Dynamische Viewporthöhe, Safe-Area-
  Abstände, festes Dokumentlayout und bestehende Dialogstile bleiben erhalten.
- Spielmodelle, Spielregeln, Testmodelle und Paketabhängigkeiten gegenüber
  05cebbf unverändert; nur zusammengeführte Styles und technische Prüfroutine.

## Prüfung

Browser bei Handygröße: Canvas innerhalb des sichtbaren Bereichs, Gruppen-/
Bau-Bedienung über synthetisches Touch, Zoom, Speicherreadback und echter
Refresh/Fortsetzen derselben Kolonie erfolgreich. Inneres Dialog-Scrollen
über native WebDriver-Wheel-Eingaben bei unbewegtem Dokument erfolgreich.
Ein synthetischer Touch-Swipe erzeugt in diesem Headless-Firefox weder mit
Touch-Sperren noch nach deren temporärer Deaktivierung normales Panning;
daraus wurde kein Produktionsfehler abgeleitet. Tatsächliches Safari-/iPhone-
Swipe-Verhalten bleibt ohne Gerät unbestätigt. Die iPhone-Anpassungen wurden
nicht wegen dieser Automationsgrenze entfernt.

Unabhängiger Read-only-Review der Zusammenführung ohne wichtige Befunde.
Produktionsbuild erfolgreich. Vollständiger Gesamttest des zusammengeführten
Stands:363/363 erfolgreich,0 Fehler/übersprungen, Exitcode0 (323,3 Sekunden).
Nach dem Testlauf nur Ergebnis-/Fortsetzungsdokumentation und bedeutungslose
Leerzeichen in übernommenen Planungsdokumenten bereinigt. Veröffentlichung
über den bestehenden Pages-Workflow nach dem main-Push, unveränderte Spieladresse.
Logs: /tmp/anthive-main-{mobile,full,build}.log.

Technischer Hinweis: Fetch meldet eine ungültige interne Codex-Checkpoint-
Referenz. Der vollständige Refetch hat die GitHub-Objekte dennoch geladen;
der tatsächliche main-Tip wurde zusätzlich über gh/ls-remote abgeglichen und
als Tracking-Referenz übernommen. Keine internen Checkpoints gelöscht und
keine Projektänderungen überschrieben. Vor späteren Fetch-Problemlösungen
zwischen solchen internen Referenzen und echten Entwicklungsbranches unterscheiden.
