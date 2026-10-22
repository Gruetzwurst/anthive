# A1 Ressourcen-Grundlage – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Eine Phaser-unabhängige, getestete Grundlage für Spielzeit, endliche/unbegrenzte Quellen und individuelle Lager bereitstellen; nach A1 stoppen.

**Architecture:** Vorhandene Welttypen erweitern, statt konkurrierende Ressourcennamen einzuführen. Eine zentrale Spieluhr liefert Zeitdifferenzen in Spieltagen an das Ressourcensystem. Ein Adapter erzeugt eine frische Simulation aus bestehenden Weltquellen, Teich und expliziten Startlagerdaten; noch keine Transport-, Verbrauchs- oder UI-Integration.

**Tech Stack:** TypeScript, Node-Testläufer mit TypeScript-Stripping, bestehendes Phaser/Vite-Projekt, keine neuen Abhängigkeiten.

**Spec:** `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md`, A1; Details Auftrag 01 in `planung/2026-10-21-phase-1-entscheidungen-und-codex-auftrag.md`; individuelle Kammern in `planung/2026-10-21-lagerkapazitaet-und-erweiterung.md`.

## Global Constraints

- Alle 36 Planungsdateien eingelesen. Neuere ausdrückliche Beschlüsse gewinnen: automatische Eierzuweisung; Bruttempo = Minimum aus Pflege/Ressourcen, getrennte Erholung. Beide erst Abschnitt C.
- 600 Echtzeitsekunden/Spieltag, Quelle 200 Nahrung, 20/Tag Regeneration, 2 Tage Erholung: vorläufige zentral konfigurierbare Startwerte.
- Lager getrennt pro Ressource und individueller Kammer, eigene IDs/Position/Kapazität/Bestand; unfertige oder unerreichbare Lager nicht nutzen.
- Vorhandene Grafik einschließlich Teich, Wege, Graben, Materialzähler und Demoanimationen bleiben unverändert. Anschluss der echten Transporte folgt A2 bzw. B2, keine zweite aktive Ressourcenwirtschaft neben der Demo.
- Kein Verbrauch, kein HUD, keine Brut, keine Bauwirtschaft, keine neue Wasserlagerkammer in A1.
- Keine eigenständige Festlegung unbestätigter Startpopulation/Verbrauchswerte. Leere Lager als neutraler Adapter-Default; optionale explizite Startbestände werden validiert.
- Quellen regenerieren kontinuierlich in Spieltagen; Erholung beginnt bei vollständiger Erschöpfung, danach regeneriert nur der verbleibende Zeitanteil. Frühere Erholungsschwellen unterhalb vollständiger Erschöpfung sind nicht beschlossen.

## Review Focus

1. Ungültige, negative, nicht endliche Mengen oder Zeitwerte: Fehler vor Zustandsänderung.
2. Große Zeitsprünge über Erholungsende/Tagesgrenzen: nur aktive Restzeit regeneriert, kein Rücksetzen durch leere Entnahmen.
3. Mehrere gleichartige Lager: keine automatische Verteilung, Entnahme/Gutschrift ausschließlich am angegebenen Lager, Restmenge bleibt beim Aufrufer.
4. Weltadapter: echte bestehende Positionen/Flächen nutzen, keine erfundene Wasserlagerposition; Welt unverändert und frische Simulationen unabhängig.
5. Öffentliche Momentaufnahmen und übergebene Startdaten: Änderungen durch Aufrufer können interne Grenzen nicht umgehen.

## Task 1: Spieluhr und zentrale Testkonfiguration

**Files:** Create `src/game/simulation/gameClock.ts`, `simulationConfig.ts`, `validation.ts`; Test `tests/game-clock.test.mjs`.

**Interfaces:** `GameClock(secondsPerGameDay=600)`, `advance(realSeconds)` liefert `{ elapsedGameDays, daysCrossed, totalGameDays, dayFraction }`; `setPaused(boolean)`; keine zweite Uhr in Folgemodulen.

- [x] Tests zuerst: 600 Sekunden = 1 Tag; 599 + 1 über Grenze; 1500 Sekunden = 2,5 Tage; 60 Sekunden/Tag konfigurierbar; Pause zählt nichts; negative/NaN/Infinity und ungültige Tageslängen abweisen, unveränderter Zustand.
- [x] Tests ausführen und erwartetes Scheitern prüfen.
- [x] Uhr mit kompensierter Sekundenakkumulation und zentraler Konfiguration implementieren.
- [x] Tests erneut ausführen, Ergebnis dokumentieren.

## Task 2: Quellen und individuelle Lager

**Files:** Modify `src/game/world/worldTypes.ts`; Create `src/game/simulation/resourceTypes.ts`, `resourceSystem.ts`; Test `tests/resource-system.test.mjs`.

**Interfaces:** Gemeinsamer `ResourceKind = food | water | buildingMaterial` in bestehenden Welttypen. `ResourceSystem` verwaltet Quellen/Lager über eindeutige IDs; `takeFromSource`, `takeFromStore` liefern tatsächliche Ladung `{resource, amount}`, `depositInStore` liefert tatsächlich akzeptierte Menge, `advance(gameDays)` regeneriert. Zugriffsmethoden geben Kopien zurück; keine automatischen Transporte.

- [x] Tests zuerst: Quelle 200 − 5 = 195; Rest 3 bei Anfrage 5 liefert 3; leer bleibt leer; 2 Tage Erholung und danach 20/Tag; Kapazitätsdeckel; endliches Wasser, unbegrenzter Teich; Teilzeiten und großer Sprung äquivalent.
- [x] Lagertests zuerst: Teilannahme, Überfüllung abweisen, keine negativen Bestände, Nahrung/Wasser/Material strikt getrennt, zwei Nahrungskammern unabhängig; unfertige/unverbundene Kammern ohne aktive Kapazität; unbekannte IDs/duplizierte IDs/ungültige Mengen; Kopien nicht als Hintertür nutzbar.
- [x] Tests ausführen, erwartete Fehler prüfen; minimale Implementierung ergänzen und grün prüfen.

## Task 3: Bestehende Welt anbinden und Abschluss

**Files:** Modify `worldTypes.ts`, `worldGenerator.ts`, `worldMap.ts`, `package.json`, `README.md`; Create `src/game/simulation/resourceSimulation.ts`, `tests/resource-simulation.test.mjs`, `docs/A1-RESSOURCEN-ERGEBNIS.md`.

**Interfaces:** Startwelt liefert individuelle `storageChambers` aus denselben bestehenden Kammergrenzen; `createResourceSimulation(world, config?, initialStocks?)` liefert `{clock, resources, advance(realSeconds)}`. Uhrdifferenz treibt Regeneration. Quell-ID der Nahrung und Teich-ID werden wiederverwendet.

- [x] Tests zuerst: bestehende Quelle/Teichposition und Lagerpositionen; tatsächliche Kammerflächen 54 Nahrung/48 Material; Kapazität Fläche × 10/8 zentraler Testwert; kein Wasserlager erfunden; Startbestände nur nach expliziter Angabe und innerhalb Kapazität; Welt und zweite Simulation unberührt; Zeit wird genau einmal integriert und Pause stoppt Quellenregeneration.
- [x] Tests ausführen, erwartete Fehler prüfen; Adapter und nur beschreibende Weltmetadaten ergänzen, keine Kacheln umzeichnen.
- [x] `npm test`, `npm run test:world`, `npm run build`, `git diff --check` ausführen; Browser-Start und Teichdarstellung prüfen, soweit Umgebung erlaubt.
- [x] Ganze A1-Änderung unabhängig prüfen lassen; wichtige Befunde mit Regressionstest beheben.
- [x] Ergebnis, Testwerte, technische Grenzen und A2 als nächsten freigabepflichtigen Schritt dokumentieren. A2 nicht beginnen.

## A0 / Arbeitsprotokoll

- Sicherung: Desktop `ANTHIVE-vor-A1-2026-10-22.tar.gz` (218 Dateien, Archivinhalt geprüft) und Commit `ecbecef`.
- GitHub bis `c439b12` kontrolliert übernommen; ausschließlich 36 neue Planungsdateien, kein Konflikt mit lokalem Spielcode.
- Baseline: Produktionsbuild und drei bisherige Testdateien erfolgreich; bestehende Warnung >500-kB-Chunk.
- Umsetzung im aktuellen Checkout auf eigenem Entwicklungsbranch, damit die laufende lokale Vorschau den Arbeitsstand zeigt. Kein Zurücksetzen, kein Force-Push.

## Abschlussprotokoll

- Task 1 complete: Uhrtests nach fehlender Implementierung grün; 600 Teilupdates erhalten Tagesgrenze.
- Task 2 complete: Quellen/Lager nach fehlender Implementierung grün; tatsächliche Entnahme, Erholung, Teilannahme und defensive Kopien geprüft.
- Task 3 complete: Weltadapter grün, insgesamt 40 Einzeltests plus 10 Weltprüfungen; Build erfolgreich.
- Technische Ausführung: npm test mit --test-isolation=none liefert in dieser Umgebung verifizierbare Einzeltestergebnisse.
- A0/A1-Weltvergleich: Kacheln, Dekorationen, Landmarken, Quellenpositionen und Maße vollständig identisch; Szene, Grafiken, Teich und Grabcode unverändert.
- Firefox: normale Map und Teich nach vollständigem Laden per Bildschirmaufnahme geprüft. Kein iPhone-Test.
- Unabhängiges Abschlussreview: keine kritischen, wichtigen oder kleinen Befunde; 40/40 Tests unabhängig bestätigt. Ausgenommen blieben ausdrücklich spätere Transporte, Wasserlagerbau, B2-Materialintegration, Verbrauch/Brut/UI, finale Balance und Browseroptik; diese Grenzen sind durch A1 vorgegeben, die Browseroptik wurde separat geprüft.
- A1 beendet. A2 nicht begonnen. Entwicklungsbranch bleibt erhalten; Integration in main ist nicht Teil dieses Schritts.
