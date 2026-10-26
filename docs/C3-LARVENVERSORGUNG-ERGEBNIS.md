# C3 – Echte Larvenversorgung

Stand: 26.10.2026. Freigabe „mit c3 weiter“. Basis C2 `82acea6`, sauber und mit GitHub identisch geprüft. Branch `codex/c3-larval-supply`. Stopp vor C4.

## Änderungen und Dateien

- `src/game/simulation/broodSupplySystem.ts`: eigene kleine Vorräte je Brutkammer; getrennte Nahrung/Wasser-Bestände, Bedarfe, Höchstbestände und Fehlmengen. Dies sind keine allgemeinen Ressourcenlager. Nur tatsächliche Pflege-Lieferungen erhöhen den Bestand.
- `simulationConfig.ts`: zentrale bestätigte C3-Testwerte: **0,5 Nahrung + 0,5 Wasser je Larve/Spieltag**, Zielreichweite **2 Tage**, Nachfüllen bei **<=50 %**, Ladung maximal **5 Einheiten einer Ressource**. Geschwindigkeit und Interaktionszeiten übernehmen bestehende Werte.
- Zielbestand folgt aktuellen Larven; harter Höchstbestand folgt maximalen Brutplätzen × Verbrauch × Reichweite (Startbrutkammer: je 48 Einheiten). Ohne Larven keine neue Bestellung. Sinkender Bedarf löscht keine realen Bestände oder Ladungen. Ein ausgelöstes Nachfüllen bleibt bis Zielerreichung aktiv; reservierte/unterwegs befindliche Mengen verhindern Mehrfachbestellung.
- Quelllagerwahl nach tatsächlicher erwarteter Gesamtwegzeit einschließlich Verkehrsbelastung; technische Zielpriorität geringste relative Reichweite, danach Laufzeit/stabile IDs. Echte Entnahme erst nach Ankunft und Aufnahme; Kammergutschrift erst nach Ablieferung. Leere/unerreichbare Lager erzeugen keine Phantomlieferung.
- `queenSystem.ts`, `colonySimulation.ts`: Verbrauch an den tatsächlichen Larvenintervallen der vorhandenen Ereigniszeitachse. Ei und Puppe verbrauchen direkt nichts. Erwachsenenbedarf bleibt separat. Wirklicher Kammerverbrauch und ungedeckter Bedarf werden getrennt erfasst; keine neue Uhr.
- `workforceSimulation.ts`: echte Pflege-Transportengine in bestehenden Gruppenablauf integriert. Fachfremde Leistung, A3-Arbeitsfaktor und gemeinsamer Tunnelverkehr gelten weiter. Fütterungstransporte zählen als Pflegearbeit im vorläufigen gemeinsamen C2-Pool. Wechsel beenden tatsächliche Ladungen sicher; Tod legt Ladung am realen Ort ab. Nicht erreichbare Lieferziele erlauben reale Rücklieferung in erreichbare passende Lager; sonst bleibt Ladung erhalten.
- `scenes/WorldScene.ts`: tatsächliche Pflegepositionen und sichtbare Nahrung-/Wasserladungen mit vorhandener Ameisendarstellung. Abgelegte Pflege-Ladungen verwenden vorhandene Ressourcenhaufenanzeige.
- `ui/WorkforcePanel.ts`: Bestand/Ziel und unterwegs befindliche Mengen pro Brutkammer; leere Vorräte erkennbar. Pflege- und Ressourcenmangel bleiben unterscheidbar.
- `tests/larval-supply.test.mjs`, `tests/larval-integration.test.mjs`: 14 neue Prüfungen. `scripts/check-economy-browser.py`: gezielter Schalter `--larvae-only`; README und Plan ergänzt.

## Prüfung

- Neue Vorrats-/Transportprüfungen zuerst rot, danach grün. Bei Eigenprüfung zusätzlich rot→grün abgesichert: synchronisierte Kammer-Metadaten dürfen keine erfundenen Bestände aus einem veränderten Snapshot übernehmen.
- Geprüft: Aufnahme vor Ankunft, Teilladungen, schnellstes Quelllager, 50%-Schwelle und vollständiges Nachfüllen, mehrere gleichzeitige Reservierungen, getrennte Kammern, fehlende/gesperrte Quellen, Bedarfsschrumpfung während einer Fahrt, sichere Rücklieferung, echter Gruppenwechsel mit Ladung und Ablage bei Entfernung/Tod.
- Eine Larve über 1/3/2 Stadientage verbraucht bei voller Versorgung **genau 1,5 Nahrung + 1,5 Wasser**, nur in ihrer dreitägigen Larvenphase – auch bei einem großen Modellupdate.
- Ein vollständiger `npm test`-Lauf: **207/207 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**. `npm run build`: erfolgreich. Bekannte Chunk-Warnung über 500 kB bleibt; Diffcheck sauber.
- Firefox mit realer Gruppenbedienung und für den Test gefüllten Startlagern: sichtbare reale Pflege-Ladung, tatsächliche Entnahme und Lieferung von je einer Einheit Nahrung/Wasser für eine Larve, beide Kammerbestände positiv, Verbrauch exakt bilanziert. Alle neun Arbeiterinnen bleiben vorhanden/sichtbar. Mobile Vorratsanzeige und Teich geprüft.
- Interne Bilanz je Ressource: **entnommen = Kammerbestand + getragen + verbraucht + abgelegt + zurückgeliefert**. Im Browser z. B. Nahrung 1 entnommen = 0,994833 Bestand + 0,005167 verbraucht, innerhalb Fließkommatoleranz.
- Eigenprüfung ohne Zusatzagenten. Logs `/tmp/anthive-c3-*.log`, Screenshots `node_modules/.cache/anthive-c3-*.png`. Ein vollständiger Prüf-/Buildlauf, keine unnötige Wiederholung.

## Grenzen / nächster Schritt

- Fehlmengen und leere Vorräte werden bereits erkannt. **Ressourcenbedingte Entwicklungsbremse, Warn-/Erholungsverlauf und spätere Verluste gehören erst zu C4.** Pflegefaktor aus C2 bleibt aktiv; kein erfundener zusätzlicher Abschlag.
- Pflege bleibt das vorläufige gemeinsame Kapazitätsmodell. Die tatsächlichen Fütterungswege sind jetzt vorhanden; räumliche Zuordnung der übrigen Pflegezeit zu einzelnen Kammern ist nicht neu beschlossen.
- Abgelegte Ladungen bleiben erhalten und sichtbar; automatisches Einsammeln solcher Nahrung-/Wasserhaufen ist noch nicht implementiert. Das entspricht der bisherigen Ablage bei Erwachsenenverlusten. Gesperrte Wege und volle Rücklieferlager können einen Gruppenwechsel mit Ladung weiter warten lassen.
- Kein Savegame ergänzt. Derselbe lokale Browser-Link zeigt bei laufendem Vite-Server den aktuellen ausgecheckten Entwicklungsstand. Nach Neuladen beginnt weiterhin ein neues Spiel.

**Nächster geplanter Schritt: C4 – Larvenmangel, Erholung und Minimum aus Pflege-/Ressourcenfaktor. Erst nach Freigabe.**
