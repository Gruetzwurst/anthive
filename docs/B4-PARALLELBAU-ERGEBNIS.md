# B4 – Parallelbau und Einrichtung

Stand: 26.10.2026. Freigabe „sparsam weiter“. Basis B3 `56b253e`, lokal sauber und mit GitHub identisch. Branch `codex/b4-parallel-furnishing`. Stopp vor B5.

## Änderungen

- Mehrere Baumeisterinnen bearbeiten verschiedene erreichbare Kacheln desselben FIFO-Auftrags. Reservierte Frontkacheln erlauben kein automatisches Beginnen späterer Baustellen; Engpässe begrenzen Parallelität.
- Einrichtung erst nach vollständigem Aushub. Echte Lagerentnahme → getragene Ladung → Baustellenvorrat → tatsächlicher Verbrauch. Lagerwahl nach Laufdauer über bestehende Wege, ggf. mehrere Lager, keine vorsorgliche Lager-Umlagerung.
- Nutzer-Testwerte zentral: **24 Startmaterial** im bestehenden Materiallager der Spielvorschau und **2 Sekunden je verbauter Einheit** bei 100 %. Bestehender Mangel- und Fremdleistungsfaktor gilt weiter. Kosten bleiben 2 je Kachel für Lager/Ruhe und 3 für Brut.
- Reservierungen für Material und Einrichtungsplätze verhindern Doppelbuchung und Überlieferung. Materialmangel erhält eingebauten Fortschritt; spätere Lieferungen setzen fort. Pause beendet nur bereits laufende atomare Arbeit. Abbruch bewahrt Aushub/Verbrauch und legt ungenutzten Baustellenvorrat am tatsächlichen Ort ab; Ladungen bleiben erhalten. Tod gibt Reservierungen frei, Ersatzpersonal behält Teilfortschritt.
- Bilanz erweitert: Anfang + Ertrag = Lager + getragen + Boden + Baustellenvorrat + verbraucht. Vollständige Einrichtung wird genau einmal gemeldet.
- Details zeigen tatsächlichen Einrichtungsfortschritt, Baustellenvorrat, Transportmengen und offenen Lieferbedarf. Keine fiktive Kapazitätsgutschrift.

## Dateien

- `simulation/excavationSystem.ts`: vorhandener Scheduler, Parallelfront, Liefer-/Einrichtungsjobs, Fortschritt und Fertigmeldung; kurzlebiger Pfadcache für wiederholte Zuordnungen.
- `simulation/buildingMaterialSystem.ts`: echte Entnahme, Baustellenvorräte, Verbrauch und Rückführung bei Abbruch.
- `simulation/simulationConfig.ts`, `scenes/WorldScene.ts`: neue Testwerte und tatsächlicher Startbestand vor Erfassung der Anfangsbilanz.
- `ui/ConstructionPanel.ts`: tatsächlicher Fortschritt, Materialmangel und fertig eingerichteter Zustand.
- `tests/furnishing.test.mjs`, `tests/excavation-workforce.test.mjs`: neue B4- und echte Gruppenwechselprüfungen. Historische B3-Prüfung auf den nun tatsächlichen Materialmangel nach Aushub angepasst.
- `scripts/check-economy-browser.py`: gezielter Schalter `--furnishing-only`; README und B4-Plan dokumentieren Umfang.

## Prüfung

- Gezielte neue Modelltests zunächst rot, nach Implementierung grün. Geprüft: breite/enge Front, getrennte Reservierungen, 9/24 plus spätere 15, mehrere Lager, Transport vor Verbrauch, Abbruch in drei Phasen, Pause, Tod, echte B1-Umteilung, Bruchmengen, Mehrfachlieferer, FIFO-Rückkehr und kombinierte Leistungsfaktoren.
- Ein vollständiger `npm test`-Lauf: **146/146 erfolgreich**. `npm run test:world`: **10/10**. `npm run build` erfolgreich; bekannte Chunk-Warnung über 500 kB bleibt. Diffcheck sauber.
- Gezielter Browsercheck erfolgreich: 24 Startmaterial, zwei parallele Baumeisterinnen, echter Verbrauch, Pause/Fortsetzung, mobile Baustellendetails und Teichdarstellung. Abschlussbilanz: 24 Anfang + 10 Ertrag = 24 verbraucht + 10 eingelagert. Screenshots unter `node_modules/.cache/anthive-b4-*.png`. Eine Wartebedingung für die Fenstergrößenanpassung im Browserprüfskript wurde korrigiert; der anschließende gezielte Lauf war erfolgreich.
- Eigenprüfung ohne Zusatzagenten gemäß Nutzerwunsch. Logs in Dateien, nur kurze Auszüge; keine Wiederholung des langen A4/B1/B2/B3-Browserlaufs.

## Grenzen / nächster Schritt

- B5 aktiviert die Funktionen/Kapazitäten vollständig eingerichteter Kammern und prüft Mindestflächen/Freischaltungen. B4 meldet „fertig eingerichtet“; unfertige oder zu kleine Kammern erhalten keine nutzbare Kapazität.
- Fortgeschrittene Verkehrslast und alternative belastungsabhängige Routen bleiben B6; B4 verwendet die tatsächlichen vorhandenen Wege und Transportdistanzen.
- Startbestand und Einrichtungszeit sind Testwerte. Kein neues Savegame, Brut- oder Kampfsystem.

**Nächster Schritt: B5. Erst nach Freigabe.**
