# A2 – Echte Sammeltransporte

Stand: 22.10.2026. Freigabe durch „weiter“ nach A1. **A3 nicht begonnen.**

## Ausgangslage und Umfang

- A1 `a98dd06` war lokal sauber und mit seinem GitHub-Branch synchron. `git fetch origin` ergab keine neuen Änderungen. `main` steht weiterhin auf den Planungsdateien `c439b12`; keine erzwungene Synchronisierung.
- A2-Branch `codex/a2-resource-transports` basiert auf A1 und enthält damit auch den gesicherten Teichstand und die neue Planung.
- Autorität: zentraler Arbeitsplan A2 und die Dateien zur intelligenten Sammel-/Transportlogik, Quellenwahl und geeigneten Ersatzarbeiten. Die neueren Eier-/Brutmangelregeln bleiben für C vorgemerkt.

## Umgesetzt

- Sieben bestehende Vorschau-Sammlerinnen laufen jetzt nach einem Phaser-unabhängigen Transportmodell. Die alte periodische Futterroute wurde entfernt.
- Entnahme vermindert den tatsächlichen Quellenbestand. Eine sichtbare, reale Ladung bleibt unterwegs nachverfolgbar. Erst erfolgreiche Lieferung/Entladung erhöht den Bestand der passenden Lagerkammer.
- Endliche Nahrung regeneriert/erholt sich weiter nach A1. Teichwasser bleibt unbegrenzt, muss aber getragen werden.
- Reservierte Quellen-/Lagerkapazität ist nur Planung, kein zusätzlicher Vorrat. Mehrere Sammlerinnen erhalten keine doppelte Gutschrift derselben Einheit.
- Pro Ressource werden nutzbare erreichbare Quellen nach praktischer Routendauer gewählt, keine künstliche gleichmäßige Aufteilung oder aktive Quellschonung. Lagerwahl berücksichtigt Wegzeit, vorgesehene Lieferungen, Füllstand und freie Kapazität.
- Modellpriorität `food` / `water` / `balanced`, standardmäßig ausgeglichen. Bevorzugung ist eine Gewichtung, kein vollständiger Ausschluss der anderen Ressource. Die Bedienoberfläche dafür gehört weiterhin zu A4.
- Vorläufige Bedarfsheuristik vor A3: freie nutzbare Lagerkapazität relativ zur Gesamtkapazität, abzüglich vorgesehener/unterwegs befindlicher Lieferungen. Sobald Verbrauch existiert, kann Vorratsdauer als bessere Bedarfsgröße anschließen.
- Wenn nichts passend gesammelt/abgeliefert werden kann: Leerlauf und spätere Wiederprüfung. Kein automatischer fachfremder Einsatz. Ressourcenverbrauch im Ruhemodus kommt erst mit A3/B.
- Wird ein Lager voll oder ein Weg blockiert, bleiben reale Restladungen erhalten. Andere geeignete Lager oder späteres Fortsetzen sind möglich; kein automatischer Lager-zu-Lager-Ausgleich.

## Welt und Grafik

- Eine **eigene Wasserlagerkammer mit 9 × 6 Kacheln** liegt westlich des Baustofflagers und ist über einen kurzen Tunnel angeschlossen. Alle bisherigen Kammerpositionen und Funktionen bleiben erhalten.
- Ihre Kapazität beträgt nach dem zentralen Testwert 540 Wasser. Der Startbestand ist wie bei den anderen A1-Lagern 0.
- Der Futtermarker wurde an seine lokale Grasoberfläche angepasst; bisher schwebte die Demoquelle relativ zur Geländehöhe.
- Die vorhandene Teich-Seitenansicht ist unverändert. Sammlerinnen interagieren an einem erreichbaren **trockenen Uferzugang**, nicht in der Teichmitte. Das ist eine abstrahierte Quelleninteraktion; keine Schwimm-, Wasserstands- oder Trinkphysik.
- Sammlerinnen gehen durch offene Tunnel und am freiliegenden Gelände entlang. Bei Stufen können sie um die Bodenecke krabbeln; die Bewegung bleibt zwischen kardinal verbundenen Kacheln. Kein Weg durch feste Erde, reine Luftlinien oder nur diagonal verbundene Tunnel.
- Gelbe Ladung = Nahrung, blaue Ladung = Wasser. Nahrungsvorrat wird nur bei tatsächlich vorhandenem Lagerbestand gezeichnet. Wasserlager zeigt einen Behälter und einen anteiligen Füllstand. Lokale Lagerbeschriftungen zeigen die realen gelieferten Mengen, noch kein umfassendes A4-HUD.
- Die bisherige Baumeister-Pfadsuche wurde unverändert in eine gemeinsame BFS ausgelagert. Grab-, Erdhaufen- und Baustofftransportregeln wurden nicht auf die späteren B2-Regeln umgebaut.

## Technische Änderungen

| Datei | Änderung |
| --- | --- |
| `src/game/simulation/gatheringSystem.ts` | Quellen-/Lagerwahl, Priorität, Reservierungen, Wege, reale Ladung, Entnahme/Lieferung, sicherer Leerlauf |
| `src/game/simulation/gatheringSimulation.ts` | Eine A1-Uhr mit Regeneration und Transport verzahnen; große Updates in kleine Schritte zerlegen; Pause stoppt beide |
| `src/game/simulation/resourceSystem.ts` | Sichere Auflistung von Quellen und Lagern als Kopien |
| `src/game/simulation/simulationConfig.ts` | Zentrale Transport-Testwerte |
| `src/game/world/gridPathfinding.ts` | Gemeinsame, aus bestehender Szene extrahierte kardinale BFS |
| `src/game/world/collectorNavigation.ts` | Begehbare Oberflächen, Tunnel, Uferzugänge und Wegprüfung |
| `src/game/world/worldGenerator.ts`, `worldTypes.ts`, `worldMap.ts` | Additive Wasserlagerkammer, Metadaten/Export, korrigierter Futtermarker |
| `src/game/scenes/WorldScene.ts` | Demopfad durch Modellpositionen und echte Ladungen ersetzen; lokale Lagerwerte und Wasserbehälter; Baumeister nutzen gemeinsame Suche |
| `tests/collector-navigation.test.mjs`, `gathering-system.test.mjs`, `gathering-simulation.test.mjs` | Neue Verhaltens- und Integrationstests |
| Bisherige Welt-/Adaptertests | Erwartete Lager-/Kammerzahl ausdrücklich um die neue Wasserlagerkammer erweitert |
| `README.md`, A2-Plan, dieser Bericht | APIs, Umfang, Heuristiken, Abnahme und Stopppunkt |

## Veränderbare Testwerte

`simulationConfig.ts`: fünf Einheiten pro Ladung, 78 Pixel/Sekunde, 0,25 Sekunden Interaktion beim Aufnehmen/Entladen, eine Sekunde Wiederprüfung im Leerlauf, Prioritätsgewicht 2, kleine Gewichtungen für Lagerauslastung/Füllstand. Gemeinsame Tageslänge bleibt 600 Sekunden. Sieben Sammler sind die bisherige Vorschauzahl und keine neue Startkolonie-Festlegung. Transportsimulation maximal 0,1 Sekunden pro Teilschritt, ohne zweite Spieluhr.

Die genaue Bedarf-/Lagerbewertung sind technische Testheuristiken, keine eigenmächtig als endgültig ausgegebenen Designentscheidungen. Fortschrittsschwellen, Verbrauchsraten, Brut oder Lagerbauoberfläche wurden nicht erfunden.

## Abnahme

- Vollständiger Testlauf umfasst 57 einzelne Tests. Zusätzliche Fälle: tatsächlicher Pickup vor Gutschrift, Teilmengen, mehrere Sammler, Lagergrenzen, Quellenwechsel, gesperrter Weg, Restladung, automatische Wiederaufnahme, alle drei Prioritäten, Oberflächen-/Ufernavigation und Integration auf der vorhandenen Welt.
- Der Vergleich großer/kleiner Zeitupdates läuft nun 120 Sekunden und verlangt tatsächlich positive Nahrung- und Wasserlieferungen; die erste kurze Fassung verglich noch leere Lager. Dieser Testhinweis aus dem unabhängigen Review wurde aufgenommen.
- Unabhängiges Code-Review: keine kritischen oder wichtigen Implementierungsbefunde; 57 Tests unabhängig erfolgreich. Einziger Hinweis war die oben verbesserte Dauer des Integrationstests.
- Abschließend: `npm test` **57/57**, `npm run test:world` **10/10**, `npm run build` erfolgreich, `git diff --check` ohne Fehler. Die bestehende Chunkgrößenwarnung bleibt.
- Laufende Phaser-Szene im Firefox geprüft: 120 simulierte Sekunden über tatsächliche Szenenupdates ergaben **55 Nahrung / 40 Wasser**, sieben Sammlerinnen. Danach zusätzlicher Grabauftrag und 25 Sekunden Szenenupdates: **1 Baustoffladung** korrekt angeliefert; Beschriftungen standen auf **70 Nahrung / 50 Wasser**. Dies war ein beschleunigter Browser-Prüflauf, kein zweiminütiger Echtzeit- oder iPhone-Test.
- Bildschirmaufnahmen von Wasserlager, Futterlager und unverändertem Teich geprüft. Die Automatisierung musste im tatsächlichen Seitenkontext ausgeführt werden, weil ihr isolierter JavaScript-Kontext eigene Modulinstanzen lud; dafür wurde kein zusätzlicher Spielcode oder globaler Debugzugang eingebaut.

## Grenzen / nächster Schritt

- Keine Erwachsenenversorgung, kein Verbrauch und keine Mangelfolgen: **A3** wartet auf Freigabe. Ohne Verbrauch können sich Lager füllen; dann ruhen Sammlerinnen bestimmungsgemäß.
- Keine neue Prioritäts-UI oder zentrale Ressourcenübersicht: A4. Priorität ist bereits als Modellfunktion testbar.
- Baustoffzähler und dessen bestehender Transport bleiben bis B2 separat; keine vorzeitige Umstellung der Grab-/Abraummengen oder Traglasten.
- Keine spätere Verkehrs-/Kollisionssimulation oder Optimierungsabnahme für Hunderte Ameisen. Alle sieben Sammler werden dargestellt, können sich auf schmalen Wegen aber noch überlagern.
- Kein Speichern/Laden, keine Offline-Fortschreibung, keine Brut oder neuen Gruppenspezialisierungsregeln.
- Der Wasserzugang ist ein abstrahierter Uferpunkt; der gemalte Teich ist weiterhin keine vollständige Geländewasser-Simulation.
- Bestehende Vite-Warnung zu einem JavaScript-Chunk über 500 kB bleibt. Keine neuen Abhängigkeiten.

**Stopppunkt:** A2 abschließen, Änderungen sichern und berichten. Danach erst auf Freigabe **A3 – Erwachsenen-Verbrauch und Mangel** beginnen.
