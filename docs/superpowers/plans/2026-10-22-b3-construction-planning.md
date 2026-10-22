# B3 – Bauwarteschlange und Werkzeuge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native Umsetzung und ein frisches Gesamt-Review wie in den bisherigen freigegebenen Phasen.

**Goal:** Frei zeichnbare, typisierte, zusammenhängende Baupläne mit beständiger FIFO-Reihenfolge, temporärem Bypass, Pause/Fortsetzung/Abbruch und auswählbaren Baustellen.

**Architecture:** Bestehendes ExcavationSystem bleibt alleiniger Grab-/Material-Scheduler. Reine Planungsgeometrie und Auftragstypen in constructionPlanning.ts; Auftragsdaten, Fortschritt und Status im vorhandenen Modell. Native Bedienung ergänzt den vorhandenen HUD/Dialog-Stil, Karte rendert kompakte Auftragsstatus und Vorschau.

**Tech Stack:** Bestehendes TypeScript, Phaser, Vite, Node-Tests und Firefox-Marionette; keine neuen Abhängigkeiten.

**Spec:** planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md Abschnitt B3; 2026-10-21-bauwerkzeuge-und-blockierte-auftraege.md, 2026-10-21-kammerformen-verbindung-und-bauabbruch.md, 2026-10-22-baufortschritt-pausieren-und-bauwarnungen.md, 2026-10-21-kammergroessen-typen-und-umnutzung.md. Bekannte Materialkostentestwerte aus 2026-10-22-testwerte-grabdauer-und-einrichtungskosten.md nur als Vorschau.

## Global Constraints

- Basis 8a95e61, sauber, per GitHub-Connector identisch bestätigt; Nutzerfreigabe „weiter“ gilt B3. Lokale Teich-/Weltarbeit erhalten. Eigener Branch, kein Main-Merge/Force-Sync.
- Verbindlich: Form zusammenhängend, freie Lage; Kammertyp bei Planung; FIFO-Rang bleibt; echte Wege, keine erfundenen Verbindungstunnel; Abbruch erhält Aushub/Material; manuelle Pause ist kein Fehler; Warnungen nur bei neuem Problemzustand.
- Technisch: bestehende kardinale Nachbarschaft für Planverbindung verwenden, 1-Kachel-Pinsel mit kardinal gefüllten Strichen und inklusive Rechtecken; Auswahl deduplizieren. Eingabedetails sind technische Ausgestaltung, keine neue Balanceentscheidung.
- Bestehende Materialbilanz, Ladungen und 50-%-Fremdleistung unverändert. Aktive Kachelarbeit bei Pause atomar beenden; bei Abbruch unfertigen Aushub stoppen, fertige Kacheln/Ladungen erhalten. Unterbrechbar freigegebener Grabfortschritt bleibt beim Auftrag.
- B3 plant Kammertypen, aktiviert sie aber nicht. Aushubfertige Kammern warten auf Einrichtung; keine neuen Ressourcenlager/Brut/Ruhefunktion. Materialkosten nur als zentral konfigurierbare Vorschau, keine Reservierung/Entnahme. Mindestgrößen-/Kapazitätsaktivierung B5; Parallelbau/Einrichtung B4.
- Bestehende addOrder(cells)-Tunnel-API und getOrders()-aktive-Aufträge für B2 behalten; getConstructionOrders() liefert auch abgeschlossene/abgebrochene Historie. Kein Savegame vorziehen.

## Review Focus

- Frühere blockierte Aufträge werden nach Entblockung ohne hektischen Abbruch der laufenden Kachelarbeit wieder bevorzugt; reservierte Arbeit ist keine Blockade, die spätere parallele Baustellen legitimiert.
- Pause/Abbruch während Laufen, Graben, Laden und Abliefern konservieren Material und lösen Reservierungen; Pause behält Fortschritt und Rang, Abbruch schafft keine Kapazität.
- Freiformen funktionieren unabhängig von Reihenfolge der markierten Kacheln; Sprünge, Rechtecküberlappung und Diagonalen liefern keine getrennten Inseln oder unerreichbare Innenraumgrabung.
- Baustellenauswahl, Kartenziehen, Zeichnen und native Dialoge bleiben auch bei Touch und kleinem Querformat getrennt; verworfene Vorschau erzeugt keine Aufträge/Terrainänderung.
- Wiederholte identische Blockaden melden nur einmal; manuelle Pause spammt nicht; echte Behebung mit erneutem Auftreten meldet wieder. Details unterscheiden tatsächlichen Aushub von noch nicht vorhandener Einrichtung.

## Task 1: Planungsgeometrie und Typen

**Files:** neu src/game/simulation/constructionPlanning.ts; Test tests/construction-planning.test.mjs; Konfiguration simulationConfig.ts.
**Interfaces:** Cell unverändert WorldCellCoordinate; PlanType = tunnel + drei Lager + vier spezialisierte Brutkammern + rest. lineSelection(start,end), rectangleSelection(start,end), mergeSelection(...groups), isConnectedSelection(cells), constructionMaterialEstimate(type, area). Einheitliche immutable Kopien.

- [ ] RED: L-Form, überlappende Rechtecke, rückwärts gezeichnetes Rechteck, diagonaler Strich kardinal zusammenhängend, Inseln ungültig, Kopien, bekannte Kosten 12×2/20×3/16×2 und Tunnel 0. Run node --experimental-strip-types --test --test-isolation=none tests/construction-planning.test.mjs → fehlendes Modul.
- [ ] GREEN: kleinste reine Implementierung; gleiche Tests erfolgreich. Commit.

## Task 2: Bestehende Grabaufträge zu B3 erweitern

**Files:** excavationSystem.ts; Test tests/construction-orders.test.mjs und bestehende B2-Tests.
**Interfaces:** addOrder(cells, type='tunnel'): number; getOrders() kompatible aktive Liste; getConstructionOrders() vollständige Kopien mit id/type/cells/paused/status/blockReason/excavated/total/partialDigSeconds/materialRequired; pauseOrder(id), resumeOrder(id), cancelOrder(id), drainConstructionNotices(). Job verweist auf stabile Auftrags-ID/-daten; Terrain bleibt bestehende Welt.

- [ ] RED: Fernkammer bleibt blockiert ohne Terrainänderung; späterer Tunnel verbindet und frühere Kammer erhält wieder Vorrang. Umgekehrt eingereihte Rechteckkacheln werden ab erreichbarem Rand gegraben. Pausierter erster Auftrag erlaubt zweiten, Wiederaufnahme behält ID/Rang; Pause während laufendem Graben beendet nur diese Kachel. Abbruch bei Graben/Laden/Transport erhält Bilanz; Sperre/Trägerverlust erhält anteiligen Grabfortschritt. Keine spätere Baustelle allein wegen reservierter aktueller Kachel starten. Warnungen bei neuer Sperre, unveränderte Sperre/manuelle Pause ohne Spam, Behebung/erneutes Problem erneut. Unfertige Kammer aktiviert keine Kapazität; Kopien/ungültige APIs mutieren nichts.
- [ ] GREEN: Aufträge persistent ergänzen; freie erreichbare Zielkachel in zusammenhängendem Plan deterministisch wählen; eine aktive Grabaktion bis B4; Status + Problemwechsel erfassen. Alte getOrders()-Semantik nur für aktive Aushübe beibehalten. Fokus-Tests und bestehende B2-/B1-Integration erfolgreich. Commit.

## Task 3: Bedienung und sichtbare Baustellen

**Files:** neu ui/ConstructionPanel.ts; WorldScene.ts, EconomyHud.ts, style.css; scripts/check-economy-browser.py.
**Interfaces:** Native Dialog zum Start eines Plans (Typ), Werkzeugwahl, Bestätigung/Verwerfen in kompakter Zeichenleiste; Liste/Details mit Pause/Fortsetzen/Abbruch. Szenenauswahl durch Klick auf markierten Plan. Rendering liest getConstructionOrders(), zeigt Status + kurze wechselbasierte Meldungen. Pure Geometrie aus Task 1, Modellaktionen Task 2.

- [ ] Browser RED: Bauen-Button/Planformular fehlen, echte Pinsel-/Rechteckeingaben und Bestätigung legen nichts an.
- [ ] GREEN: vorhandenen Stil und Zeichen-/Kamera-Fluss erweitern. Zeichnen erzeugt Vorschau, erst Bestätigen legt Plan an; Werkzeuge im Entwurf kombinierbar. Außerhalb Zeichnen Klick auswählbar/Kamera ziehbar. Dialog blockiert Karteneingabe; Touch mit bestehender echter Hardwareemulation. Aushub/Einrichtung/Materialvorschau getrennt sichtbar; keine virtuelle Betriebsbereitschaft.
- [ ] Gesamttests, Welttests, Build und Browser vollständig erfolgreich; Screenshots Teich/Details/Querformat prüfen. Unabhängiges Gesamt-Review, Befunde mit RED→GREEN beheben, Ergebnisbericht/README, Commit/Push. Stopp vor B4.

## Ledger

- Vorab: git status sauber, B2 auf GitHub identisch (8a95e61), Schutz durch bestehende B2-Commits/Remote. Keine ungesicherten lokalen Dateien.
- Interfaces Task 1 → Task 2: dieselben Cell-Typen, zusammenhängende Kopien und PlanType. Task 2 → Task 3: Snapshots statt paralleler UI-Zähler, mutierende Aktionen ausschließlich bestehendes Modell. Materialvorschau ist keine konsumierende Einrichtung; Einrichtung und Kammerkapazität bleiben spätere Phasen.
