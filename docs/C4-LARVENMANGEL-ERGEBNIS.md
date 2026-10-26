# C4 – Larvenmangel und proportionale Brutquoten

Stand: 26.10.2026. Basis 46ed96f lokal und mit GitHub identisch geprüft; keine lokalen Änderungen vorhanden. Entwicklungsbranch: `codex/c4-brood-shortage`. Keine erzwungene Synchronisierung, bestehende Grafik erhalten.

## Fertig

- `ui/eggQuotaDistribution.ts`, `ui/WorkforcePanel.ts`: Ein bearbeiteter Prozentwert bleibt maßgeblich; andere positive Anteile werden proportional auf insgesamt 100 % verteilt. Rundung auf Hundertstel nach größten Resten, Nullanteile bleiben ausgeschlossen. Sonderfall: Wird ein alleiniger 100-%-Anteil reduziert, erhalten die anderen drei den Rest gleichmäßig. Erst „Zielanteile übernehmen“ verändert die Quoten neuer Eier; vorhandene Eier behalten ihre Zuweisung. Strenge Modellvalidierung bleibt bestehen.
- `simulation/larvalShortageSystem.ts`: Mangelhistorie pro Kammer, ein voller Warn-Spieltag ohne zusätzlichen Ressourcenabschlag; danach proportional zur schlechteren Nahrung-/Wasserdeckung, mindestens 25 %. Bei Vollversorgung lineare Erholung über einen Spieltag; bestehender Pflegeengpass bleibt erhalten. Warnung wird als Zustand mit gezähltem Eintritt geführt, ohne Meldung pro Frame.
- `simulationConfig.ts`: zentral veränderbare Testwerte, einschließlich ausdrücklich bestätigter Schwelle **Deckung <25 %**, **sechs volle schwere Mangeltage** vor möglichen Verlusten und **5 % je weiterem Spieltag**. Bruchteile sammeln sich an; kein Aufrunden auf eine sofortige tote Larve. Die Verlustrate folgt der aktuell verbleibenden Larvenzahl.
- Technische Entlastungsregel gegen minimale Zwischenlieferungen: Unterversorgungsdauer wird erst nach einem vollen Spieltag Vollversorgung zurückgesetzt; schwere Mangelhistorie/Verlustrest erst nach einem vollen Spieltag ohne schweren Mangel. Kurze Entlastung pausiert den schweren Zähler und verursacht währenddessen keine Verluste. Ohne Larven werden aktive Mangelzustände zurückgesetzt, die Verluststatistik bleibt erhalten.
- `simulation/broodSupplySystem.ts`: bestehende echte Vorräte/Transportbilanz bleiben maßgeblich. Reale Vorräte werden bis zu ihrem exakten Ende verbraucht; Entwicklung und Mangelzeiten werden an Vorratsende, Warnfrist, Erholung und Verlustereignissen geteilt. Zwischen Lieferungen ist die tatsächlich verfügbare Verbrauchsdeckung maßgeblich; kleine Vorräte verhindern Mangel, solange sie reichen. Keine globalen Phantomabbuchungen.
- `simulation/queenSystem.ts`, `colonySimulation.ts`: nur Larven erhalten **MIN(Pflegefaktor, Ressourcenfaktor)**. Die lineare Erholung wird über die Zeit integriert; Stadiengrenzen werden dabei eingehalten. Eier/Puppen bleiben ressourcenunabhängig. Verluste betreffen ausschließlich lebende Larven, geben Brutplätze frei und erzeugen keine Geburt. Bilanz: gelegt = Puffer + zugewiesen + erwachsen + verloren. Derselbe vorhandene Takt treibt alle Systeme.
- `ui/WorkforcePanel.ts`: getrennte Anzeige von Pflege, Ressourcenfaktor, Larventempo, Warn-/Mangelzeit, Erholung und Verlusten. `world/BroodRenderer.ts` entfernt verlorene Larven aus der Darstellung. Bestehende Königin, Eiertransporte und übrige Grafik weiterverwendet.

## Prüfung

- Drei neue Testdateien mit insgesamt **12 Prüfungen**: proportionale Quoten/Rundung/Nullanteile; Warnung/Mindesttempo/Erholung/Unterbrechungen/Verlustanteile; echte Vorratslieferung, Erholung, Ressourcenbilanz, Verluste und gleiche Ergebnisse großer/kleiner Schritte.
- Tests vor Implementierung rot, danach grün. Ein zusätzlich gefundener Fehler beim gespeicherten Fortschritt im letzten Intervall einer verlorenen Larve wurde mit dem Groß-/Kleinschrittvergleich abgesichert und korrigiert.
- `npm test`: **225/225 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**. `npm run build`: erfolgreich; bekannte Chunk-Warnung >500 kB bleibt.
- `python3 -u scripts/check-economy-browser.py --c4-only`: erfolgreich. Native Übernehmen-Bedienung, automatische Quoten und unveränderte Nullgruppe; 20 echte Modelllarven, keine Verluste vor Tag 7, danach 19 Larven und ein korrekt ausgeblendeter Verlust; Ressourcenfaktor 25 %, sichtbare Verlustanzeige, Mobilansicht und Teichansicht.
- Browserprüfung verwendet einen eigenen Server und Testkohorten, keine Beschleunigung oder Startbrut im eigentlichen Spiel. Ein erster Browserstart endete mit Navigations-Timeout; Wiederholung erfolgreich. Eigenprüfung ohne Zusatzagenten. `git diff --check` sauber.
- Logs `/tmp/anthive-c4-*.log`, Screenshots `node_modules/.cache/anthive-c4-*.png`.

## Grenzen und nächster Schritt

- Vorläufige Balance, insbesondere die freigegebenen Verlustwerte, bleibt veränderbar. Mangelhistorie wird pro Kammer geführt, nicht als individuelle Hungerbiografie jeder nachkommenden Larve.
- Bestehende Grenzen bleiben: gemeinsamer Pflegekapazitätspool, kein Savegame, abgelegte Ressourcenladungen noch ohne automatisches Einsammeln. Nach Browser-Neuladen neues Spiel.
- Nächster Entwicklungsschritt **C5 – integrierte Wachstumstests über zahlreiche Spieltage**. Hier nicht begonnen. Keine späteren Systeme implementiert.
