# C1 – Königin, Eierpuffer und automatische Zuweisung

Stand: 26.10.2026. Freigabe „weiter“, Basis B6 `620b6c3`, sauber und mit GitHub identisch geprüft. Branch `codex/c1-queen-egg-allocation`. Stopp vor C2.

## Änderungen

- Königin legt über die vorhandene Kolonie-Uhr selbständig **5 Eier/Spieltag** bei voller Versorgung. Der bestehende A3-Eiablagefaktor wirkt einmal auf die Rate; pausierte Zeit erzeugt keine Eier. Teilfortschritt bleibt erhalten.
- Bestätigte Nutzer-Testwerte: **25 % je Spezialisierung**, Eierpuffer **50**. Ab **75 %** Pufferfüllung halbe Rate, ab **90 %** Viertelrate, voll Pause. Alle Werte zentral konfigurierbar. Bei 50 Plätzen beginnt die erste Drosselung bei 38 wartenden Eiern.
- Deterministischer gewichteter Rundlauf erhält Restanteile statt jedes Ei getrennt zu runden; auch 0,1-%-Anteile werden über genügend Eier berücksichtigt. Unveränderte Einstellungen erneut anzuwenden setzt das Guthaben nicht zurück.
- Jedes Ei besitzt eine eindeutige Identität. Vorgesehenes Ziel wird bei Eiablage vorgemerkt; bei vollen/unbrauchbaren Kammertypen wartet dieses Ei im Puffer. Andere Spezialisierungen bleiben zuweisbar. Quotenänderungen gelten für künftige Eier; bestehende wartende Ziele bleiben erhalten. Die tatsächliche Spezialisierung ergibt sich erst aus der zugewiesenen Kammer.
- Automatik wählt innerhalb eines Typs eine betriebsbereite Kammer mit geringster Belegung, bei Gleichstand stabile ID. Keine Überfüllung, Fremdzuweisung, Duplikate oder Verluste. Neu fertige Kammern übernehmen passende wartende Eier.
- Vorhandene vier Startbrutkammern liefern je **48 Plätze** (24 reale Kacheln × 2). Neue fertige Brutkammern verwenden das bestehende B5-Register. Erreichbarkeit der Startkammern wird nur bei Geländeänderungen neu berechnet.
- Im bestehenden **Gruppenfenster**: vier prozentuale Zielanteile, Prüfung auf zusammen 100 %, Eiablagerate, Puffer und individuelle Kammerbelegungen. Ungültige Eingaben verändern keine Quoten. Die Anzeige erläutert, dass Quotenänderungen für neue Eier gelten.

## Betroffene Dateien

- `src/game/simulation/queenSystem.ts`: reines Königinnen-/Eiermodell, Zuweisung, Drosselung, atomare Validierung und kopierte Snapshots.
- `simulationConfig.ts`: bestätigte zentrale C1-Testwerte.
- `colonySimulation.ts`, `workforceSimulation.ts`, `scenes/WorldScene.ts`: vorhandene Uhr, Versorgung und dynamische Brutkammern anschließen.
- `tunnelTrafficSystem.ts`: gesonderte Geländeversionsnummer, damit reine Verkehrsänderungen keine unnötige Kammer-Erreichbarkeitssuche auslösen.
- `src/game/world/worldTypes.ts`, `worldGenerator.ts`: Metadaten der vorhandenen vier Brutkammern; keine Änderung an Weltkacheln oder Teichgrafik.
- `src/game/ui/WorkforcePanel.ts`: Quotenformular und aktuelle Königinnen-/Brutkammerdaten im vorhandenen Dialog.
- `tests/queen-eggs.test.mjs`, `tests/queen-integration.test.mjs`: 13 neue Modell-/Integrationsprüfungen.
- `scripts/check-economy-browser.py`: gezielter Schalter `--queen-only`. README und C1-Plan ergänzt.

## Prüfung

- Neue Modell- und Integrationsprüfungen zunächst rot, nach Umsetzung grün. Geprüft: Rate, Pausieren, A3-Mangel, Drosselung, Puffergrenze, kleine Quoten, Zeitschrittgleichheit, volle/unerreichbare Räume, Gleichverteilung, echte zusätzliche Kammer, Identitäten und Bilanz.
- Ein vollständiger `npm test`-Lauf: **181/181 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bekannte Chunk-Warnung über 500 kB bleibt. Nach abschließender Änderung der sichtbaren Kammerbeschriftung Build erneut geprüft; kein erneuter langer Modelltestlauf erforderlich.
- Gezielter Firefox-Check: native Quotenbedienung und Fehler bei 99 %, echte fünf gelegte/zugewiesene Eier nach einem Spieltag, vier Startkammern mit 48 Plätzen, Pause, Quotenänderung für folgende Eier, mobile Anzeige und Teich erfolgreich. Isolierter Puffercheck stoppt bei genau 50; keine Entwicklungsfortschritte oder neuen Arbeiterinnen. Nach Beschriftungskorrektur gezielten Browsercheck wiederholt.
- Eigenprüfung ohne Zusatzagenten. Logs `/tmp/anthive-c1-*.log`; Screenshots `node_modules/.cache/anthive-c1-*.png`. Diffcheck sauber.

## Grenzen / nächster Schritt

- C1 enthält keine Entwicklung oder Geburt: Auch zugewiesene Eier bleiben vorerst im Ei-Stadium. Damit werden die endlichen Brutkammern bei hinreichend langer Versorgung schließlich voll. Unzugewiesene Eier erhalten niemals Entwicklungsfortschritt.
- Brutpflege/Entwicklungsstadien folgen C2; Larvenverbrauch und echte Fütterungstransporte C3; Mangelkombination/Erholung C4. Keine provisorischen Larven- oder Nahrungsvorgänge vorgezogen.
- Quoten, Rate und Drosselung sind Testwerte. Bestehende offene Ruhekammer-/Spezialfreischaltungsfragen bleiben unverändert offen. Neuladen startet weiterhin ein neues Spiel.

**Nächster geplanter Schritt: C2 – Brutstadien, Entwicklungsdauer und Pflege. Erst nach Freigabe.**
