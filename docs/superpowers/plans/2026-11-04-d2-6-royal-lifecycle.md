# D2.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Inline, sparsam, bestehende lokale Änderungen erhalten.

**Goal:** Königliche Brut wird aufgezogen und zusätzliche Königinnen legen eigene normale Eier.
**Architecture:** Ein gemeinsamer Brutzeitstrahl, individuelle Quellköniginnen/Puffer; RoyalBroodSystem bleibt Eigentümer der königlichen Entwicklung.
**Tech Stack:** TypeScript, Phaser, Node Tests, Firefox-Browserprüfung.
**Spec:** docs/superpowers/specs/2026-11-04-d2-6-royal-lifecycle-design.md

## Global Constraints
12 Minuten2/6/4;2 Pflegeplätze; täglicher königlicher Larvenbedarf doppelt;
kein Tod königlicher Brut; normale6 Minuten und120-Sekunden-Eiablage erhalten;
Freischaltungen50/150/500/1000; reale Versorgung und Transport; Schema8 schützt Altstände.

## Review Focus
- Kein Fortschritt vor Ankunft/ohne Pflege/ohne Larvenvorrat, auch große Zeitschritte.
- Genau einmaliger Schlupf und kein Fortschrittsverlust bei Reload aller Phasen.
- Unabhängige Puffer und Ursprungsorte bei gemeinsamem Transport und Quoten.
- Zusätzliche Erwachsene zählen zu Höchststand und Versorgung.
- Migration verwirft keine unbekannten Königinnendaten; strikte Identitäten/Referenzen.

### Task 1: Gemeinsame Entwicklung und Eiablage
Files: royalBroodSystem.ts, queenSystem.ts, broodSupplySystem.ts, colonySimulation.ts,
workforceSimulation.ts, colonySession.ts; tests/royal-lifecycle.test.mjs.
- [x] Failing tests: Phasen2/6/4, Versorgung/Pflege/Ankunft-Pausen,2 Pflegeplätze,
  doppelte Larvenkosten, unabhängige Quellen/Puffer/Quoten, große vs kleine Schritte.
- [x] Minimal implementieren; gezielte neue und bestehende Bruttests grün.

### Task 2: Persistenz
Files: colonyMigration.ts, colonyRepository.ts, colonySession.ts, validateColonyState.ts,
Migrationstestfixtures, neue Reload-/Manipulationsregressionen.
- [x] Erst rote Reload-/Migrations-/Validierungstests, dann Schema8/Migration1–7.
- [x] Alle königlichen Phasen und Eiablageguthaben ohne Verdopplung fortsetzen.

### Task 3: Spieltest und Abnahme
Files: WorldScene.ts, WorkforcePanel.ts, scripts/check-economy-browser.py, README.md,
WEITERMACHEN.md, Ergebnisbericht.
- [x] Entwicklungsstatus/erwachsene Königin darstellen, gemeinsames HUD aktualisieren.
- [x] Browser: echte Kammer/Eitransport,12-Minuten-Entwicklung simulieren, eigene
  Eiablage am neuen Ort, realer Transport, Reload und Altstandmigration prüfen.
- [x] Gesamttests, Build, frischer Review und Befunde beheben; Server erreichbar lassen.


## Ausführungsnotizen
Bestehender Featurebranch in-place weitergeführt: alle D2-Vorarbeiten liegen
lokal und werden für den laufenden Spieltest benötigt. Keine fremden Änderungen
zurückgesetzt, keine Commits/Pushes in diesem Auftrag.
Task1/2:22 gezielte Tests grün (19,6s). Schema8/Build grün. Reale Ressourcen-
Tests benötigten explizit gefüllte Ausgangslager (neue Kolonie startet leer).
Zusatzbefunde rot→grün: volle Startpuffer dürfen nächsten Ei-Termin einer anderen
Königin nicht verbergen; Königinnenschlupf muss Höchststand vor gleichzeitigen
Arbeiterinnenverlusten erfassen. Eigener Test pro Befund.
Unabhängiger Read-only-Review d2_6_review: keine wichtigen Befunde.

Abschluss:359/359 Gesamttests,0 Fehler/übersprungen, Exitcode0 (297,2s).
Build und Browser-Lebenszyklus erfolgreich; Browsermigration1/2/7 erfolgreich,
Sammel-Automationstimeout bei3 dokumentiert. Separate Modellprüfung bis5
Königinnen erfolgreich. Server5173 läuft. Änderungen lokal, keine Integration.
Log: /tmp/anthive-d26-full-final.log. Task1–3 abgeschlossen.
