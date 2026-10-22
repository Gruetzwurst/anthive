# A1 – Ressourcen-Grundlage

Stand: 22.10.2026. A1-Umfang; keine Freigabe oder Umsetzung von A2.

## Sicherung und Planungsabgleich (A0)

- Lokale Teich-Seitenansicht und Übergabedateien im Commit `ecbecef` gesichert.
- Zusätzlich vollständiges Archiv der 218 erfassten Projektdateien vor Synchronisierung: `/home/paul/Desktop/ANTHIVE-vor-A1-2026-10-22.tar.gz`. `node_modules/`, `dist/` und Git-Verwaltungsdaten sind nicht enthalten.
- GitHub war 37 Planungscommits voraus (`c439b12`). Prüfung ergab ausschließlich 36 neue Dateien unter `planung/`; kontrolliert mit lokalem Sicherungscommit zusammengeführt (`baa7853`). Kein Reset oder Force-Push.
- Alle 36 Planungsdateien gelesen, mit `00-START-HIER…` begonnen. Umsetzung auf `codex/a1-resource-foundation`.

## Verbindliche Regeln, Testwerte und offene Entscheidungen

**Verbindlich für A1:** tatsächliche Quellenentnahme, endliche regenerierende Nahrung, unbegrenztes Teichwasser, mehrere getrennte individuelle Lager mit Kapazitätsgrenzen, keine negativen Bestände oder falschen Ressourcen. Unfertige/unerreichbare Lager bieten keine nutzbare Kapazität. Keine automatische Lagerumverteilung.

**Zentrale Testwerte:** 600 Echtzeitsekunden/Tag; Nahrungskapazität 200, Regeneration 20/Tag, Erholung 2 Tage nach Erschöpfung; Lagerkapazität je Tile Nahrung/Wasser 10, Baumaterial 8. Die bestehenden Lagerflächen ergeben 540 Nahrung und 384 Baumaterial. Startbestände werden nicht als neue Balanceentscheidung vergeben: neutral leer, explizite Bestände optional validierbar.

**Technische Festlegung:** Erholungsphase bei vollständiger Erschöpfung; währenddessen keine Entnahme/Regeneration. Anschließend kontinuierliche Regeneration nur für die restliche verstrichene Spielzeit. Ein früherer Auslöser bei Teilentnahme ist nicht beschlossen. Zeit-/Mengenparameter sind endliche, nichtnegative Zahlen; ungültige Angaben werden vor der Mutation abgewiesen. Tageslänge muss positiv sein.

**Offen für spätere Schritte:** tragfähige Startvorräte und Koloniegröße, konkrete Wasserlagerkammer und erreichbar begehbare Verbindung zum Teich, Parameter kleiner Wasserquellen, Verbrauch/Mangel und tatsächliche Abhol-/Lieferereignisse. Keine dieser Fragen wurde durch kostenlose Bestände oder neue Weltgeometrie stillschweigend beantwortet.

**Neuere Beschlüsse für C vorgemerkt:** automatische Eierzuweisung nach Spielerquoten, möglichst gleichmäßig innerhalb gleicher Brutkammertypen; Pflege allein verursacht keine Brutverluste; Larven-Ressourcenmangel getrennt; Gesamtentwicklung `min(Pflegefaktor, Ressourcenfaktor)` und getrennte Erholung. Keine ältere manuelle Eierzuweisung implementiert, überhaupt kein Brutcode in A1.

## Änderungen

- `src/game/simulation/gameClock.ts`: gemeinsame konfigurierbare Uhr, Tagesgrenzen/große Sprünge, Bruchteilakkumulation, Pause ohne Nachholen.
- `simulationConfig.ts`: ausschließlich A1-Testwerte zentral.
- `validation.ts`: gemeinsame Mengen-/Zeitvalidierung.
- `resourceTypes.ts`, `resourceSystem.ts`: endliche/unbegrenzte Quellen, Regeneration/Erholung, tatsächliche Entnahme, individuelle Lager, Teilannahme und Entnahme, geschützte Momentaufnahmen. Restladungen bleiben Verantwortung des späteren Transportaufrufers.
- `resourceSimulation.ts`: Datenadapter aus bestehender Welt, genau eine Uhr als Zeitquelle, keine aktive zweite Wirtschaft in der Szene.
- `src/game/world/worldTypes.ts`: vorhandene Ressourcentypen um Baumaterial erweitert und als gemeinsamer `ResourceKind` wiederverwendet; beschreibende Lagerkammermetadaten.
- `worldGenerator.ts`, `worldMap.ts`: zwei vorhandene Lager aus denselben Kammergrenzen als Daten verfügbar. Keine Kachel, Dekoration oder Route verändert, keine Wasserlagerkammer ergänzt.
- `tests/game-clock.test.mjs`, `resource-system.test.mjs`, `resource-simulation.test.mjs`: automatisierte Verhaltensprüfungen; bestehende drei Testdateien unverändert.
- `package.json`: ein vollständiger `npm test`-Aufruf; `README.md`: Start/API/Abgrenzung dokumentiert.
- `docs/superpowers/plans/2026-10-22-a1-resource-foundation.md`: kleiner Umsetzungsplan und Arbeitsprotokoll.

## Abschließender Prüfstand

- `npm test`: **40 einzelne Tests erfolgreich** (Uhr, Entnahme, Erholung, Wasser, Kapazitäten/Trennung, ungültige Mengen, unabhängige Zustände, Weltadapter und bestehende Welt-/Grafiktests).
- `npm run test:world`: **10 Tests erfolgreich**.
- `npm run build`: erfolgreich; bestehende Warnung für einen JavaScript-Chunk über 500 kB bleibt bestehen.
- Der Standard-Node-Testlauf zeigte in der Umgebung nur Dateiergebnisse. Der neue vollständige Testbefehl verwendet bewusst `--test-isolation=none` und zeigt die einzelnen ausgeführten Tests.
- Unabhängiges Code-Review: keine kritischen, wichtigen oder kleinen Befunde; 40/40 Tests und TypeScript-Prüfung unabhängig bestätigt.
- Firefox: normale Map und direkte Teichansicht nach vollständigem Laden per Bildschirmaufnahme geprüft. Direkter Vergleich der A0-/A1-Startwelt bestätigt unveränderte Kacheln, Dekorationen, Landmarken, Quellenpositionen und Maße. Szene, Grafiken, Teich- und Grabcode sind unverändert. Kein iPhone-Test, keine neue vollständige interaktive Grab-Abnahme.
- Review bewusst ohne A2-Transporte, Wasserlagerbau, B2-Materialzähler, Verbrauch/Brut/UI oder finale Balance: Diese gehören laut Nutzerauftrag nicht zu A1 und wurden nicht vorgezogen.

## Entwicklungsreihenfolge und Stopppunkt

- [x] A0: lokale Sicherung, GitHub-Abgleich, Planungsunterlagen, grüne Baseline.
- [x] A1: Ressourcen-/Uhrgrundlage, abschließendes Review und Bericht.
- [ ] A2: echte Sammeltransporte, Quellen-/Lagerwahl und Wasserlager. **Nicht begonnen; Freigabe erforderlich.**
- [ ] A3/A4: Verbrauch/Mangel und Ressourcenoberfläche, erst anschließend.
- [ ] B: Gruppen, Materialbilanz/Grablogik, Bau-/Kammerfunktionen und Verkehr.
- [ ] C: Königin, automatische Eierzuweisung, Brutpflege/Ressourcenmangel und Wachstum.
- [ ] D: spätere Gefahren, Spezialmaterialien und Nachfolge.

Der nächste geplante Entwicklungsschritt ist **A2 – Echte Transporte**. Erst nach ausdrücklicher Freigabe des Nutzers starten. A1 verändert sichtbar weder die Demo-Ameisen noch den Teich; das ist die ausdrücklich geforderte Umfangsgrenze.
