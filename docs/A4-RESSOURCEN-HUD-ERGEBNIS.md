# A4 – Ressourcenübersicht und Sammelpriorität

Stand: 22.10.2026. Freigabe „weiter“ nach abgeschlossenem A3. Basis `98951a7`; eigener Branch `codex/a4-resource-hud`. Lokaler Stand vor Beginn sauber, A3 auf GitHub gesichert, Fetch ohne neue Remoteänderungen. **Stopp vor B1.**

## Umgesetzt

- Festes kompaktes Ressourcenpanel in der bestehenden Phaser-Ansicht. Nahrung und Wasser getrennt mit tatsächlich nutzbarem Lagerbestand und Kapazität. Unterwegs getragene Ladungen und Quellen werden nicht als Vorrat gutgeschrieben.
- Baustoffanzeige liest ausschließlich den bisherigen tatsächlich angelieferten Zähler. Keine Vermischung mit dem noch getrennten A1-Baumateriallager, keine erfundene Kapazitätsanzeige. Vollständige Materialbilanz bleibt B2.
- Vorhandene gemeinsame Spieluhr als Spieltag und Tagesfortschritt, tatsächliche Arbeiterinnen-/Sammlerinnenzahl, Arbeitstempo und bisherige Verluste.
- Quellenlage: erreichbare Nahrung mit Bestand/Kapazität und Regeneration oder verbleibender Erholungszeit; Teichwasser als unbegrenzt. Ohne Weg wird die Quelle ausdrücklich als unerreichbar angezeigt.
- Drei Schaltflächen **Nahrung / Ausgeglichen / Wasser** verändern unmittelbar die bestehende A2-Priorität der Sammlerinnen. Aktive Auswahl hervorgehoben, echte Maus-/Touch-Bedienung geprüft. Laufende Transporte und Ladungen bleiben erhalten; kein neuer Gruppenscheduler.
- Getrennte Hinweise für Nahrungs- und Wasserversorgung: gut versorgt, Warnphase, Mangel, starker Mangel, spätes Verlustrisiko, schrittweise Erholung. Keine sich pro Frame wiederholenden Toast-Meldungen.
- Grabstatus, Gestenhinweis und bestehender Grabkraft-Testschalter liegen unten, damit sie das Ressourcenpanel nicht überlagern. HUD-Eingaben starten keine Kamera- oder Grabgeste. Die übrige Karte bleibt verschiebbar.
- Quellenwege werden mit vorhandenem Wegfinder beim Start und nach neu geöffneten Grabfeldern geprüft; keine neue Wegsuche pro Frame. Normale Anzeigenaktualisierung alle 0,25 Sekunden, Prioritätswechsel und Materiallieferungen sofort.
- Keine Balancewerte, Spielregeln, Welt-/Teichgrafiken oder Abhängigkeiten geändert.

## Betroffene Dateien

| Datei | Änderung |
| --- | --- |
| `src/game/ui/economyOverview.ts` | Reines Read-Modell bestehender A1–A3-Zustände, Quellen- und Versorgungstexte |
| `src/game/ui/EconomyHud.ts` | Phaser-Panel, hervorgehobene Prioritätsauswahl und Eingabebereich |
| `src/game/scenes/WorldScene.ts` | Read-Modell anbinden, Quellenwegprüfung, bestehende Grabbedienung unten, Eingaben trennen |
| `tests/economy-overview.test.mjs` | Bestände/Quellen, Priorität/Tag, getrennte Warn- und Erholungszustände |
| `tests/economy-cycle.test.mjs` | Acht tatsächliche Spieltage je Priorität, separate Quellenerschöpfung und Wiederaufnahme |
| `scripts/check-economy-browser.py` | Wiederholbarer Firefox-Prüflauf mit eigener lokaler Vite-Instanz und Maus-/Touch-Eingaben |
| `README.md`, A4-Plan, dieser Bericht | Bedienung, Prüfungen, Grenzen und Stopppunkt |

## Prüfungen

- `npm test`: **80/80 einzelne Tests erfolgreich**.
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bekannte Warnung wegen JavaScript-Chunk über 500 kB bleibt.
- `git diff --check`: ohne Fehler.
- `python3 scripts/check-economy-browser.py`: erfolgreich. Prüft alle Prioritäten per echter Mausaktion, aktive Hervorhebung, Touch auf Wasserpriorität, unveränderte Kamera/Grabaufträge bei HUD-Eingabe, Textgrenzen innerhalb 640×360, reale Transporte, bestehendes Graben, Baustoffanzeige, späte Mangelwarnung und Teichansicht.
- Browserlauf: 120 simulierte Sekunden über tatsächliche Szenenupdates ergaben rund **53,3 Nahrung / 39,0 Wasser**, anschließend lieferte ein bestehender Grabauftrag **1 Baustoffladung**. Bildschirmaufnahmen im Desktopfenster und kleineren Querformatfenster geprüft; kein Test auf einem physischen Handy.
- Testdaten werden nur im Prüfharness eingerichtet. Keine globalen Debugzugänge oder automatischen Gratislieferungen in den Spielcode eingebaut.
- Unabhängige Codeprüfung abgeschlossen: keine bestätigten kritischen, wichtigen oder kleinen Befunde; 80/80 Tests unabhängig erneut erfolgreich, Diff und Browseraufnahmen geprüft. Der erste Prüflauf scheiterte am Nutzungslimit seines Modells; die Ersatzprüfung mit frischem Kontext wurde vollständig abgeschlossen. Build und Browserlauf vom implementierenden Agenten, Unit-Tests vom Reviewer zusätzlich unabhängig ausgeführt.

## Balancingbefund und Grenzen

Die Mehrtagestests verwenden unverändert 600 Echtzeitsekunden pro Spieltag, sieben Sammlerinnen, zwei ruhende Baumeisterinnen und eine separat verbrauchende Königin. Jede der drei Prioritäten läuft acht Spieltage mit realen Quellen, Transporten und Verbrauch. Bei den Tagesprüfungen keine negativen/überfüllten Lager, keine Verluste und ab Tag 2 unverändert volle Arbeitsleistung. Nahrung und Wasser sind am Anfang tatsächlich geliefert und am Ende wieder vorhanden.

**Dauerhafter Vorrang Nahrung** kann das Wasserlager zwischenzeitlich leeren: im geprüften Aufbau ab Tag 5, automatische Wiederbelieferung nach knapp **1,9 zusammenhängenden Mangeltagen**, vollständige Erholung bis Tag 8. Das ist ein Balancingrisiko der bisherigen freien-Lagerkapazität-Heuristik, kein dauerhafter Ausschluss von Wasser. Die Prioritätsbedienung erlaubt bewusstes Gegensteuern. Keine eigenmächtige Änderung an Gewichtung, Verbrauch oder Startvorräten; zukünftige Bewertung nach Vorratsdauer bleibt als möglicher Balancingvorschlag offen.

Die endliche Nahrungsquelle muss im normalen Verlauf nicht exakt leer werden, weil auch während kleiner Ernteladungen Regeneration stattfindet. Die verpflichtende zweitägige Erholung bei tatsächlicher vollständiger Entleerung ist deshalb zusätzlich in einem gezielten integrierten Test herbeigeführt; danach nehmen reale Transporte wieder Nahrung auf.

Weitere bekannte Grenzen bestehen fort: keine Speicherung/Offline-Fortschreibung; Priorität gilt während des laufenden Spiels. Fallen gelassene Ladungen und alter Abraum werden bis B2 noch nicht automatisch eingesammelt. Keine vollständige Gruppenverwaltung, Bauwerkzeuge oder Brutmechanik. Kleine Querformatprüfung in Firefox ersetzt keinen iPhone-Test. Hochformat zeigt weiterhin den bestehenden Querformathinweis.

**Nächster geplanter Schritt: B1 – Arbeitsgruppen und Zuständigkeiten. Erst nach ausdrücklicher Freigabe.**
