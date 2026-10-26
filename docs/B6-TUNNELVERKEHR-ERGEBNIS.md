# B6 – Tunnelverkehr und Performance

Stand: 26.10.2026. Freigabe „frei“. Basis B5 `bc59ec8`, sauber und mit GitHub identisch geprüft. Branch `codex/b6-tunnel-traffic`. Stopp vor C1.

## Änderungen und Dateien

- `src/game/simulation/tunnelTrafficSystem.ts`: gemeinsames Verkehrsmodell für Sammlerinnen, Baumeisterinnen und geparkte Arbeiterinnen. Individuelle Positionen werden linear in kurze räumliche Abschnitte gerader, ein Kachel breiter Tunnel aggregiert. Keine paarweisen Kollisionen, keine unsichtbaren Gruppen, keine Verkehrssperren.
- `simulationConfig.ts`: zentrale vorläufige Testwerte: Abschnittslänge 4 Kacheln, bis 4 Ameisen ohne Abschlag, danach 15 % zusätzliche Laufzeit je weiterer Ameise; mindestens 60 % Basisgeschwindigkeit. Aktualisierung alle 0,5 Simulationssekunden. Breite Räume, Kreuzungen und Oberfläche erhalten keinen Engpassabschlag. Diese technischen Testwerte sind keine neuen endgültigen Spielregeln.
- `src/game/world/gridPathfinding.ts`: vorhandene Kardinalsuche um optionale gewichtete A*-Kosten mit binärem Heap erweitert. Ohne Gewichte bleibt die ursprüngliche BFS erhalten. Wegkosten folgen denselben Verkehrsabschlägen wie reale Bewegung; unpassierbare Kacheln bleiben gesperrt.
- `world/collectorNavigation.ts`: Verkehrskosten, Reisezeitberechnung und begrenzter Routencache (maximal 2048 Einträge), ungültig bei Verkehrs-/Geländeänderungen. Tatsächliche Endpositionen und bestehende Oberflächen-/Teichregeln bleiben erhalten.
- `simulation/gatheringSystem.ts`, `excavationSystem.ts`: reale Laufbewegung wird verlangsamt; Quellenwahl, Ablieferlager und Baustellenversorgung bewerten erwartete Reisezeiten. Grabung, Laden, Entladen und Einrichtung erhalten keinen zusätzlichen Verkehrsabschlag. Ladungen, Aufträge und Kachelreservierungen bleiben erhalten. Geländeänderungen invalidieren Verkehrs-/Wegeinformationen.
- `gatheringSimulation.ts`, `colonySimulation.ts`, `workforceSimulation.ts`, `scenes/WorldScene.ts`: eine gemeinsame Verkehrslage, gespeist aus allen tatsächlichen Arbeiterinnenpositionen, ohne Doppelzählung. Bestehende individuelle Darstellung erhalten.
- `tests/tunnel-traffic.test.mjs`: 9 neue Prüfungen zu Basisgeschwindigkeit, Dichte, freier Umleitung, Sperren, Taktung, realen Lieferungen, Bauleistung/Reservierungen, gemeinsamen Gruppenpositionen, 500 Individuen sowie verkehrsabhängiger Lagerwahl.
- `scripts/check-economy-browser.py`: `--traffic-only` prüft den bestehenden realen Bauablauf und zusätzlich gemeinsame Verkehrsdaten, individuelle Darstellung und 500 Sammlerinnen im isolierten Simulationsmodell.

## Prüfergebnisse

- Neue Kernprüfungen zunächst rot, nach Umsetzung grün. Reale Bewegungsprüfungen zeigten vor Anschluss fehlenden Abschlag bzw. fehlende Baumeister-Verkehrsanbindung.
- Ein kompletter `npm test`-Lauf: **168/168 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; vorhandene Chunk-Warnung über 500 kB bleibt. Diffprüfung sauber.
- Firefox: gemeinsames Verkehrsmodell und alle **9 vorhandenen Arbeiterinnen sichtbar**. Reale Parallelgrabung, Materialtransporte, Pause/Fortsetzung, Einrichtung und +120 Nahrungslagerkapazität weiterhin erfolgreich. Mobile Details und Teich geprüft.
- Firefox-Modellversuch: **500 individuelle Sammlerinnen**, 10 simulierte Sekunden in ungefähr **213 ms** in diesem Lauf, 20 Verkehrsaktualisierungen, 3 belegte Abschnitte, 1660 tatsächlich eingelagerte Nahrungseinheiten; ursprüngliche 5000 Einheiten vollständig als Quelle + Lager + Ladungen erhalten. Das ist eine Messung des isolierten Modells, kein FPS-Nachweis für eine vollständig gerenderte 500er-Kolonie.
- Eigenprüfung ohne Zusatzagenten; Logs `/tmp/anthive-b6-*.log`. Keine unnötige Wiederholung der vollständigen Prüfungen.

## Grenzen und nächste Schritte

- Neue Routen werden an Arbeits-/Transportgrenzen oder nach einer echten Wegblockade gewählt. Laufende begehbare Routen werden bei bloßen Lastschwankungen beibehalten: kein ständiges Hin-und-her-Planen, aber auch keine laufende Optimierung jeder bereits begonnenen Fahrt.
- Engpassmodell ist eine räumliche Näherung gerader Ein-Kachel-Tunnel. Keine physische Einzelkollision; Schwellen und Abschnittslänge müssen später im großen Nest balanciert werden.
- Vorhandene Darstellung blendet keine Individuen wegen Koloniegröße aus. Eine vollständig gerenderte 500er-Kolonie mit Brutwachstum ist noch kein durchgängiger Spieltest; Wachstum folgt erst in C.
- Offene B5-Punkte (Ruheplatzbelegung/Zusatzverbrauchsfaktor, konkrete Spezialfreischaltungen) bleiben unverändert offen. Keine Brut-, Forschungs- oder Kampfmechanik vorgezogen.

**Nächster geplanter Schritt: C1 – Königin, Eierpuffer und automatische Eierzuweisung nach Spielerquoten. Erst nach Freigabe.**
