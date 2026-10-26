# B3 – Bauwarteschlange und Werkzeuge

Begonnen: 22.10.2026. Abschluss: 26.10.2026. Nutzerfreigabe „weiter“ nach B2. Basis `8a95e61` vor Beginn lokal sauber und per GitHub-Connector identisch bestätigt. Eigener Branch `codex/b3-construction-planning`. **Stopp vor B4.**

## Umgesetzt

- **Bauen → Typ auswählen → Zeichnen** startet einen Entwurf. **Pinsel** und **Rechteck** lassen sich darin kombinieren; **Karte verschieben** erhält den Entwurf. Erst **Bestätigen** erstellt den Auftrag. **Verwerfen** verändert weder Welt noch Aufträge.
- Gemeinsame Kanten wie im bestehenden Wegfinder definieren Zusammenhang. Pinsel füllt Zeigersprünge kardinal auf; inklusive Rechtecke funktionieren in beide Richtungen. Doppelte Kacheln werden vereinigt, getrennte Inseln und ungültiges Terrain beim Bestätigen abgewiesen.
- Tunnel sowie die beschlossenen Lager-, Brut- und Ruhe-Kammertypen sind planbar. Typ, ID, Form und ursprüngliche Erstellungsreihenfolge bleiben beim Auftrag. Zwei nicht abgebrochene Kammerpläne beanspruchen nicht dieselben Kacheln; Tunnel können sich mit vorhandenen Planflächen überschneiden.
- Entfernte und durch Grabkraft gesperrte Aufträge bleiben blockiert erhalten. Spätere ausführbare Aufträge dürfen sie vorübergehend umgehen. Der tatsächliche, vom Spieler gezeichnete Verbindungstunnel macht eine frühere Kammer wieder ausführbar; keine automatisch erzeugten Verbindungstunnel.
- Freie Flächen werden vom tatsächlich erreichbaren Rand bearbeitet, unabhängig von der Reihenfolge der markierten Kacheln. Eine bereits reservierte aktive Grabaktion rechtfertigt kein paralleles Beginnen späterer Baustellen. Zusätzliche parallele Arbeitskacheln gehören B4.
- **Pausieren/Fortsetzen** bewahrt Rang und Fortschritt, ermöglicht andere ausführbare Aufträge und beendet eine bereits laufende Kachelarbeit sicher. Ein Weg zur noch nicht begonnenen Grabung wird freigegeben. **Abbrechen** stoppt unfertigen Aushub und erhält fertige Hohlräume sowie Material. Getragene/gerade geladene Ressourcen werden weiter sicher behandelt.
- Unterbrechbar freigegebene angefangene Grabzeit bleibt beim Auftrag, etwa nach Grabkraft-Sperre oder Verlust einer Baumeisterin. Reservierungen werden freigegeben und Ersatzarbeit kann fortsetzen.
- Baustellen tragen kompakte Statusmarkierungen. Ein Klick auf die Planfläche oder ein Eintrag in **Bauen** öffnet Details mit Aushub, ausstehender Einrichtung und Materialbedarf. Fertige/abgebrochene Aufträge bleiben als Historie erhalten. Außerhalb Zeichnen verschiebt Ziehen die Karte.
- Neue Blockadeursachen erzeugen einmalige kurze Meldungen. Gleicher ungelöster Zustand meldet nicht pro Frame erneut; manuelle Pause erzeugt keine Fehlerwarnung. Nach echter Behebung darf ein erneut auftretendes Problem wieder melden.
- Die bekannten Einrichtungskosten sind ausschließlich eine zentrale **Vorschau**: Lager/Ruhe 2 je Kachel, Brut 3, Tunnel 0. Noch keine Materialreservierung, Entnahme, Einrichtung oder zusätzliche Kapazität. Ausgegrabene Kammern warten auf Einrichtung.

## Betroffene Dateien

| Datei | Änderung |
| --- | --- |
| `src/game/simulation/constructionPlanning.ts` | Typen, Beschriftungen, Pinsel/Rechteck, Zusammenhang und Materialvorschau |
| `src/game/simulation/simulationConfig.ts` | Zentrale Vorschaukosten und Meldungsdauer |
| `src/game/simulation/excavationSystem.ts` | Bestehenden Scheduler um stabile Aufträge, FIFO-Bypass, Status, Pause, Abbruch und Teilfortschritt ergänzt |
| `src/game/ui/ConstructionPanel.ts` | Native Planung, Zeichenleiste, Liste und auswählbare Auftragsdetails |
| `src/game/scenes/WorldScene.ts` | Zeichen-/Kameraeingabe, Vorschau, Bestätigung, Baustellenstatus und Modellanbindung |
| `src/game/ui/EconomyHud.ts`, `src/style.css` | Bauen-Button und passende scrollbare Bedienung |
| `tests/construction-planning.test.mjs`, `tests/construction-orders.test.mjs` | Neue Geometrie-, Auftrags-, Ressourcen- und Unterbrechungsprüfungen |
| `scripts/check-economy-browser.py` | Echte B3-Bedienung zusätzlich zu bestehenden A4/B1/B2-Regressionsprüfungen; fokussiert auch mit `--construction-only` |
| `README.md`, B3-Plan, dieser Bericht | Bedienung, Prüfungen und Grenzen |

## Prüfungen

- `npm test`: **134/134 einzelne Tests erfolgreich**.
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bestehende Warnung für JavaScript-Chunk über 500 kB bleibt.
- `git diff --check`: ohne Fehler.
- Geometrie zuerst mit fehlendem Modul rot, danach 4/4 grün. Auftragsmodell zuerst neun rote Prüfungen, danach grün; zusätzlich Pause während Laufen/Laden/Abliefern und Ersatz einer verlorenen Baumeisterin geprüft. Bestehende B1/B2-Modelle bleiben grün.
- Browser zuerst rot wegen fehlender B3-Bedienung. Danach echte Mauszeichnung mit Rechteck plus Pinsel: zwölf Kacheln, kein Auftrag vor Bestätigung, Nahrungslager mit Materialvorschau 24, blockierter Fernplan, Pause/Fortsetzung, Auswahl per Kartenklick. Tatsächlicher späterer Verbindungstunnel fertig, frühere Kammer anschließend angegraben, Nahrungs-Lagerkapazität weiterhin 540. Abbruch und Verwerfen geprüft.
- Vollständiger Wirtschafts-Browserlauf erfolgreich: zusätzlich zu B3 bleiben Prioritäten, Gruppen, echte Rollenwechsel, 50-%-Graben, Voll-Lager-Weitergrabung, Aufräumen, Bilanz, Ruhe, Warnungen und Teich erfolgreich. Aktuelle B2-Bilanz nach B3-Arbeit: 9 produziert = 6 im Lager + 3 am Boden; nach Entnahme/Aufräumen 9 = 6 verbraucht + 3 im Lager, Boden/getragen 0.
- `python3 scripts/check-economy-browser.py --construction-only`: erfolgreich, wiederholt echte B3-Mausplanung und ergänzt echte Touch-Rechteckzeichnung, Bestätigung, scrollbare Detailansicht und Abbruch im kleinen Querformat. Desktop-/Querformat-Details und Teich-Screenshots visuell geprüft. Der vollständige Standard-Harness enthält diese zusätzliche Touchprüfung nun ebenfalls.
- Unabhängige Prüfung `8a95e61..2908741`: zwei wichtige Eingabebefunde, keine kritischen/kleinen und keine ausgesparten Designfragen. Ein kontinuierlicher Pinselstrich mit Rückweg verwendete die letzte deduplizierte Auswahlkachel statt des letzten Zeigerpunkts. Langsames Kartenziehen summierte seine Bewegung nicht und konnte beim Loslassen die Baustellenauswahl öffnen. Beide mit echten WebDriver-Gesten zuerst rot reproduziert (`backtrackingBrushCorrect=false`, `slowPanWithoutDialog=false`), dann korrigiert: separater letzter Pinsel-Zeigerpunkt und dauerhafte Zieherkennung anhand Gesamtverschiebung seit dem Druckpunkt. Der fokussierte Browserlauf mit beiden Regressionen und Touchbedienung ist danach grün. Kein Zweitreview, keine aufgeschobenen kleinen Befunde oder still verworfenen Verhaltensfragen. Nach beiden Korrekturen erneut 134/134 Gesamttests, 10/10 Welttests, Build und Diffcheck erfolgreich. Vollständiger Browser-Schlusslauf einschließlich beider Gestenregressionen, B3-Touchprüfung, A4/B1/B2-Wirtschaft und Teich erfolgreich. B3 abgeschlossen; Stopp vor B4.

## Grenzen und nächster Schritt

- Einrichtung, deren tatsächliche Baustellenversorgung und Parallelbau sind **B4**. Noch keine funktionsfähigen neuen Kammern, kein kostenloser Kapazitätszuwachs.
- Typspezifische Mindestflächen, Kapazitätsaktivierung und spätere Freischaltungen folgen **B5**. In B3 wird die Form und spätere Funktion geplant; ein kleinerer Entwurf aktiviert keine Kammer.
- Vor Aktivierung kostenpflichtiger Einrichtung bleibt der Material-Bootstrap aus der zentralen Planung zu entscheiden.
- Speicherung gilt wie bisher für den laufenden Spielstand. Neuladen startet eine neue Vorschau; kein Savegame vorgezogen.
- Virtuelle Touch-Hardware im Firefox ersetzt keinen Test auf einem physischen Handy.

**Nächster Schritt: B4 – Parallelbau und Einrichtung. Erst nach ausdrücklicher Freigabe.**
