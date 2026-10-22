# A3 – Erwachsenen-Verbrauch und Mangel

Stand: 22.10.2026. Freigabe durch „frei“ nach A2. Nutzer-Testentscheidung: **ab Tag 7 mit 5 % Arbeiterinnenverlust pro weiterem Mangeltag**. **A4 nicht begonnen.**

## Änderungen

- Tatsächliche sieben Sammlerinnen und zwei Baumeisterinnen verbrauchen Nahrung und Wasser; die vorhandene Königin wird separat mitgerechnet. Keine neue Startbevölkerung oder kostenlosen Vorräte.
- Verbrauch ausschließlich aus erreichbaren betriebsbereiten Einzellagern. Quellen und getragene Ladungen zählen nicht als verfügbare Versorgung. Bestände werden nicht negativ.
- Nahrung und Wasser haben getrennte Mangel- und Erholungszustände. Bei Auswirkungen zählt das Minimum, keine Multiplikation oder doppelte Sterblichkeit.
- Warnphase, spätere Arbeitsverlangsamung und ein vorbereiteter Eiablagefaktor. Sammlerinnen laufen/arbeiten langsamer; Baumeisterinnen laufen, graben und laden entsprechend langsamer. Noch keine Eiablage oder Brut.
- Allgemeiner Ruhemodus ohne Kammer für untätige Arbeiterinnen, mit reduziertem Verbrauch. Kein vorgezogener Ruhekammerbau oder neue Gruppenverwaltung.
- Nach wiederhergestellter Versorgung schrittweise, pro Ressource getrennte Erholung. Kurze Lieferungen verbessern Faktoren teilweise; sie löschen anhaltenden Mangel erst nach vollständiger Erholung.
- Erst nach sechs vollständigen Mangeltagen werden Verluste mit 5 % der jeweils überlebenden Arbeiterinnen pro Tag angesammelt. Bruchteile bleiben erhalten: neun Arbeiterinnen verlieren dadurch nicht pauschal täglich eine. Bei 100 Arbeiterinnen ergeben sich im ersten Gefahrentag vier ganze Verluste und ein Restanteil, weil die Rate nach jedem Verlust auf die Überlebenden sinkt. Die Königin fällt nicht unter diese Quote.
- Verluste entfernen tatsächliche Arbeiterinnen und ihre Reservierungen. Getragene Ressourcen bleiben am Boden erhalten, ohne fälschliche Lagergutschrift. Grabreservierungen werden freigegeben. Noch liegender Abraum bleibt bestehen.
- Gemeinsame A1-Spieluhr steuert Regeneration, Sammeln, Verbrauch und Baumeisterarbeit. Pause stoppt diese Systeme gemeinsam. Große Versorgungsupdates werden an tatsächlichen Ereignissen aufgeteilt.
- Kleine sichtbare Warnzeile für Mangel/Erholung, Arbeitstempo und Verluste; vollständiges Ressourcen-HUD und Prioritätsbedienung bleiben A4. Bestehende Welt- und Teichgrafiken unverändert.

## Betroffene Dateien

| Datei | Zweck |
| --- | --- |
| `src/game/simulation/adultSupplySystem.ts` | Phaser-unabhängiger Verbrauch, Mangel, Erholung, Verlustanteile; Ereignisgrenzen großer Updates |
| `src/game/simulation/colonySimulation.ts` | Verbindung mit echter Bevölkerung, gemeinsamer Uhr, Baumeisteradapter und erhaltenen Bodenladungen |
| `src/game/simulation/simulationConfig.ts` | Alle A3-Testwerte zentral |
| `src/game/simulation/gatheringSimulation.ts` | Schrittweises Anbinden des Verbrauchs an vorhandene Uhr |
| `src/game/simulation/gatheringSystem.ts` | Arbeitsfaktor und sichere Entfernung realer Trägerinnen |
| `src/game/scenes/WorldScene.ts` | Tatsächliche Baumeisterinnen bilanzieren, Tempo, Warnung, sichtbare Verluste und erhaltene Ladungen |
| `tests/adult-supply.test.mjs`, `tests/colony-simulation.test.mjs`, `tests/gathering-system.test.mjs` | Verbrauchs-, Grenz-, Erholungs-, Verlust-, Transport- und Integrationstests |
| `README.md`, A3-Plan und dieser Bericht | Aktueller Umfang, technische Entscheidungen und Abnahme |

## Zentrale Testwerte / technische Entscheidungen

`ADULT_SUPPLY_CONFIG` in `simulationConfig.ts`:

- Aktive Arbeiterin: je 1 Nahrung und Wasser/Spieltag; Königin separat ebenfalls je 1.
- Ruhend: 80 % des aktiven Verbrauchs. Keine Kammer erforderlich.
- Bis einschließlich 2 Mangeltage Warnung ohne Leistungseinbruch; danach 85 % Arbeit und 75 % vorbereiteter Eiablagefaktor.
- Nach 4 Mangeltagen 65 % Arbeit und 0 % Eiablagefaktor.
- Nach 6 vollen Mangeltagen 5 % Verlust/Tag, Bruchteile ansammeln. Erholung löscht den Verlustrest erst nach vollständiger Versorgungserholung beider Ressourcen.
- Erwachsenen-Erholung testweise 1 vollständig versorgter Tag. Tageslänge weiterhin 600 Sekunden.

Nur die 5-%-Verlustquote wurde in dieser Freigabe ausdrücklich ausgewählt; übrige Zahlen sind veränderbare Testvorgaben, keine endgültigen Spielregeln. Der Ruhe-Rabatt und die Erwachsenen-Erholungsdauer waren offen und wurden als zentral änderbare technische Defaults gewählt; Risiko bei anderer gewünschter Balance: diese Werte anpassen.

Verlustauswahl vorläufig deterministisch: aktive Arbeiterinnen vor ruhenden, innerhalb davon stabile ID. Damit verwenden das reine Verbrauchsmodell und die Entfernung sichtbarer Arbeiterinnen dieselben Verbrauchsraten der Überlebenden. Keine biologische Aussage; bei anderer gewünschter Auswahl muss die Strategie ausgetauscht werden.

## Prüfungen

- `npm test`: **72/72 einzelne Tests erfolgreich**.
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich. Bereits bestehende Warnung wegen JavaScript-Chunk über 500 kB bleibt.
- `git diff --check`: ohne Fehler.
- Frisches unabhängiges Code-Review: keine kritischen Befunde; zwei wichtige Befunde zur reinen Versorgungs-API bei großen Zeitschritten entdeckt und mit zunächst fehlschlagenden Regressionstests behoben: Verbrauch nach eintretenden Verlusten neu berechnen und vollständige Erholung vor einer neuen Mangelphase berücksichtigen. Keine zurückgestellten kleinen Reviewbefunde.
- Firefox: 120 simulierte Sekunden mit tatsächlichen Szenenupdates lieferten rund **53,3 Nahrung und 39,0 Wasser** trotz laufendem Verbrauch. Anschließender bestehender Grabauftrag lieferte **1 Baustoffladung**. Gezieltes Leeren der Lager und simulierter anhaltender Mangel ergaben die sichtbare Warnung **Arbeit 65 %**. Bestehende Teichansicht geprüft. Beschleunigter Browser-Prüflauf, kein Handytest.

## Grenzen und offene Punkte

- Fallen gelassene Ladungen und alter Abraum bleiben erhalten, können aber noch nicht automatisch wieder eingesammelt werden; die bestehende Grablogik holt nur ihren eigenen neuen Haufen ab. Stirbt eine Baumeisterin vor dessen Aufnahme, kann der Haufen bis zur B2-Abholintegration den Tunnel blockieren. Kein Ressourcenverlust, aber bewusst dokumentierte Funktionsgrenze vor B2.
- Baumaterialzähler und alte Materialtraglasten bleiben bis B2 separat.
- Startvorräte, endgültige Koloniegröße, Ruhe-Rabatt, Erwachsenen-Erholungsdauer und sämtliche Balancewerte sind weiter abzustimmen. Die vorhandene Vorschau läuft unverändert mit sieben Sammlerinnen, zwei Baumeisterinnen und einer Königin.
- Keine Speichern-/Laden-Funktion, Offline-Fortschreibung, Brutmechanik oder Königinnen-Sterblichkeit. Der Teich bleibt abstrahierte Wasserquelle ohne Wasserphysik.

**Nächster Schritt: A4 – Ressourcen-HUD und Prioritätsbedienung. Erst nach Freigabe beginnen.**
