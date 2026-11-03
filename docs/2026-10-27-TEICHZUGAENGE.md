# Teichzugänge am sichtbaren Wasser – 27.10.2026

Nutzerkorrektur: Tunnel endet neben dem Teich; bisherige feste Uferpunkte
lagen teilweise deutlich oberhalb des sichtbaren Wassers.

`CollectorNavigation` verwendet jetzt dieselbe `createPondProfile`-Geometrie
wie der Renderer. Die normalen Uferzugänge führen über die freiliegende trockene
Uferkante bis zur tatsächlichen Wasserlinie. Neue offene trockene Tunnelzellen
direkt neben der Wasserkontur werden bei der Aufgabenwahl ebenfalls als
Entnahmestellen berücksichtigt. Die bestehende Auswahl bewertet weiterhin die
gesamte Lauf-/Lieferzeit einschließlich Verkehr.

Sichtbares Wasser bleibt unpassierbar, auch wenn die darunterliegende Terrain-
Kachel geöffnet wurde. Die schmale begehbare Uferkante macht Erde hinter ihr
nicht frei: seitlicher Eintritt durch ungegrabene Erde ist ausgeschlossen.
Dafür unterstützt die gemeinsame Gittersuche optional die Herkunftszelle in
der Begehbarkeitsprüfung; ungewichtete und verkehrsgewichtete Suche prüfen
identische Übergangsregeln. Keine Wassersimulation/Überflutung ergänzt.

Drei neue Tests: neuer seitlicher Wasserzugang, tatsächliche Sammlung/Lieferung
auf der kürzeren Tunnelroute, keine verkehrsgewichtete Abkürzung durch Ufererde.
Tests zuerst rot, anschließend grün. Alte Uferprüfung an echte Randpunkte
angepasst. **257/257 Gesamttests**, Build, Diffcheck und Browserprüfung
`--pond-shore-only` erfolgreich. Browser startet eine bestehende Sammlerin für
diesen Test am Wasserlager neu, damit keine zuvor geplante Oberflächenroute
mitgemessen wird; tatsächlicher Aufnahmepunkt x=2352.5/y=519.6 liegt neben dem
gezeichneten Rand x=2352 und innerhalb seiner Wasserhöhe. Danach echte Lieferung.
Screenshot `node_modules/.cache/anthive-pond-shore-pickup.png` visuell geprüft.
Logs `/tmp/anthive-shore-{suite,build,browser}.log`.

Bereits laufende Transporte werden weiterhin sicher beendet. Neue Aufgaben
verwenden die aktuellen Zugänge. Änderungen lokal, kein Commit/Push.
