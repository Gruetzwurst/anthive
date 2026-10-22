# A2 – Echte Sammeltransporte

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vorhandene sieben Demo-Sammlerinnen durch reale Quellenentnahme, sichtbare Ladungen und korrekte Lieferung an individuelle Nahrung-/Wasserlager ersetzen. Danach stoppen; A3 nicht beginnen.

**Spec:** A2 in `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md`; Details in `2026-10-21-intelligente-sammel-und-transportlogik.md`, `2026-10-21-quellenwahl-und-sammlerverteilung.md`, `2026-10-21-ersatzarbeit-und-ruheverhalten.md`.

**Architecture:** A1-Uhr und ResourceSystem weiterverwenden. Gemeinsame Kachel-Pfadsuche aus der bestehenden Baumeistersuche extrahieren; Sammler-Navigation ergänzt die begehbare Geländeoberfläche. Phaser-unabhängiges Transportmodell verwaltet eindeutige Sammler, Wege, Ladungen, Aufnehmen/Abliefern und sicheren Leerlauf. Szene animiert dessen tatsächliche Positionen und Ladungen. Eigene Wasserlagerkammer additiv westlich des Baustofflagers mit Verbindung; keine vorhandene Kammer ersetzen.

## Global Constraints

- A1-Baseline `a98dd06`, sauber und mit GitHub synchron; neuer Branch `codex/a2-resource-transports`.
- Keine Einzelsteuerung, keine nachhaltige Quellschonung oder künstliche Gleichverteilung gleicher Quellen. Schnellste tatsächlich erreichbare Versorgungskette bevorzugen.
- Nahrung/Wasser/Ausgeglichen als testbare Priorität; Oberfläche für diese Wahl erst A4. Bedarf ohne Verbrauch zunächst freier Lagerraum und bestehende/unterwegs geplante Versorgung; Heuristik zentral konfigurierbar.
- Nur bei echter Entnahme Quelle vermindern, nur bei realer Lieferung Lager erhöhen. Volle/zwischenzeitlich volle Lager und Abbruch blockieren/umplanen ohne Ladungsverlust.
- Kein Wasser durch das Bild schwimmen lassen: begehbarer Uferzugang statt Teichmitte. Teichgrafik bleibt erhalten.
- Keine Verbrauchs-/Mangel-/Brut-/Gruppen-/Verkehrssimulation, keine Änderung der bestehenden Grab-/Baustoffregeln. Baumeister nutzen dieselbe extrahierte Pfadsuche mit ihrer bisherigen Begehbarkeit.
- Transportmengen, Tempo, Interaktionszeit und Wiederprüfintervall sind technische Testwerte; sieben Figuren bleiben bestehende Vorschauzahl.

## Review Focus

1. Mehrere Ameisen dürfen eine Quelle nicht doppelt abbuchen; unterwegs/reservierte Mengen sind kein Lagerbestand.
2. Volles Lager oder gesperrte Verbindung während einer Lieferung: Ladung bleibt erhalten, keine Phantomablage.
3. Unerreichbare Quellen/Lager ausschließen; Oberflächenhöhen und feste Erde nicht durchqueren.
4. Leerlauf kehrt bei neuer Kapazität/Regeneration zur erlaubten Sammelarbeit zurück; Priorität bleibt erhalten.
5. Eine gemeinsame Uhr, pausierte Zeit und große Zeitintervalle ohne mehrfache Lieferung; öffentliche Momentaufnahmen unabhängig.

## Task 1 – Gemeinsame Navigation und Wasserlager

**Files:** `src/game/world/gridPathfinding.ts`, `collectorNavigation.ts`; `worldGenerator.ts`, `worldTypes.ts`, `worldMap.ts`; `tests/collector-navigation.test.mjs`, Anpassung bisheriger Welt-/Adaptertests.

- [x] Tests zuerst: offene Tunnel verbinden, feste/diagonal isolierte Zellen ausschließen, Oberfläche über Höhenwechsel begehbar, kein Luftlinienweg durch Erde oder über Teich; neue Wasserlagerkammer verbunden ohne alte Räume zu löschen.
- [x] Tests rot ausführen; BFS aus bestehender Suche wiederverwenden und Oberflächen-Navigation ergänzen. Wasserlager aus eigenen Grenzen/Metadaten erzeugen.
- [x] Tests grün prüfen; bestehende Baumeistersuche auf gemeinsamen Algorithmus umstellen, gleiche Nachbarschaft/Begehbarkeit beibehalten.

## Task 2 – Reales Transportmodell

**Files:** `src/game/simulation/gatheringSystem.ts`, Ergänzung `resourceSystem.ts`, `simulationConfig.ts`; `tests/gathering-system.test.mjs`.

- [x] Tests zuerst: Lager erst nach Lieferung; reale Entnahme/Teilmengen; schnellste erreichbare Quelle; passende Lager mit Kapazität/Belegung; Alternative bei leerer Quelle/vollem Lager; alle drei Prioritäten; keine Möglichkeit -> Leerlauf; Ladung bei gesperrtem Weg/vollem Lager erhalten; Wiederaufnahme, mehrere Sammler, pausierte Zeit, Bruchteile.
- [x] Rot prüfen, Modell implementieren; zentrale Testwerte und sichere Snapshot-/Auflistungs-APIs nutzen.
- [x] Einzeltests und vorhandene Tests grün prüfen.

## Task 3 – Szene anschließen und prüfen

**Files:** `src/game/scenes/WorldScene.ts`, `src/game/simulation/gatheringSimulation.ts`; Integrationstests, README, `docs/A2-TRANSPORTE-ERGEBNIS.md`.

- [x] Integrationstests zuerst: bestehende Welt liefert echtes Futter/Wasser in getrennte Lager, bleibt ohne Verbrauch begrenzt; sieben Sammler und Uhr aus A1, Wege konsistent.
- [x] Demopfad entfernen; tatsächliche Positionen und Ladungen darstellen; nur lokale Kammerbeschriftungen um echte Bestände ergänzen. Kein A4-HUD.
- [x] `npm test`, `npm run test:world`, `npm run build`, `git diff --check`; Browser-Sicht-/Laufprüfung einschließlich Graben/Material, unabhängiges Review, Dokumentation.
- [x] Ergebnis sichern; A3 nicht beginnen.

## Abschlussprotokoll

- Task 1 complete: gemeinsame BFS und Navigation rot/grün; eigene angeschlossene Wasserlagerkammer, ursprüngliche Kammern erhalten.
- Task 2 complete: reale Aufnahme/Lieferung, Quellen-/Lagerwahl, Prioritäten, Reservierungen und Restladung getestet. Ein Testhorizont wurde auf die tatsächliche Dauer der fernen Transportfahrten abgestimmt, keine Spielregel geändert.
- Task 3 complete: Szene angeschlossen; vollständige Suite 57/57 und ursprüngliche Weltprüfungen 10/10, Build und Diffprüfung erfolgreich.
- Review: keine kritischen/wichtigen Implementierungsbefunde. Hinweis zur Testqualität umgesetzt: Vergleich großer/kleiner Schritte prüft nach 120 Sekunden tatsächlich positive Lieferungen statt nur leere Lager nach 12 Sekunden.
- Browser: laufende Szene liefert nach 120 simulierten Sekunden 55 Nahrung/40 Wasser; anschließender Grabauftrag liefert 1 Baustoff. Lager- und Teichaufnahmen geprüft. Keine iPhone-Abnahme.
- Bewusst außerhalb dieses Schritts: A3-Verbrauch/Mangel, A4-HUD/Prioritätsoberfläche, B/C-Gruppen/Bauwirtschaft/Brut, finale Balance, Wasserphysik und Hunderte-Ameisen-Performance. Keine dieser späteren Funktionen ist als Voraussetzung für A2 vorgezogen.
- A2 beendet; A3 nicht begonnen. Entwicklungsbranch bleibt erhalten.
