# ANTHIVE – Kammerformen, Nestverbindung und Bauabbruch

**Verbindliche Entscheidungen vom 21.10.2026.** Dieses Dokument ergänzt die vorherigen Designentscheidungen im Ordner `planung/`. Es ist ein Planungsdokument, keine Codeänderung.

## 1. Kammerformen B – beliebige zusammenhängende Formen

- Der Spieler darf **beliebige zusammenhängende Kammerformen** auf dem Kachelraster zeichnen: unter anderem L-förmig, verwinkelt oder unregelmäßig.
- Eine einzelne Kammer muss eine **zusammenhängende Fläche** bilden; mehrere voneinander isolierte Flächen dürfen nicht ohne Verbindung als *eine* Kammer gelten.
- Einzelne Kammertypen **dürfen Mindestflächen/-anforderungen** haben. Die genauen Werte sind noch offen.
- Die bereits beschlossene freie Größe bleibt bestehen: Größere Kammern können mehr Leistung/Kapazität bieten und brauchen mehr Baumaterial; exakte Balancewerte später bestimmen.
- Pinsel- und Rechteckwerkzeug sollen kombinierbar sein. Beide markieren dieselbe geplante Tile-Fläche.
- Für die Konnektivitätsprüfung ist eine eindeutige Nachbarschaftsregel nötig (als technischer Vorschlag gemeinsame Kanten, nicht nur Ecken); diese Detailregel ist noch **kein expliziter Beschluss**.

## 2. Nestverbindung B – weit vorausplanen, erst bei Erreichbarkeit arbeiten

- Der Spieler darf Kammern **auch weit entfernt vom aktuellen Nest vorplanen**.
- Baumeisterinnen dürfen die Kammer **erst ausgraben und anschließend einrichten**, wenn ein tatsächlich zugänglicher Weg zum Baugebiet besteht.
- Eine unerreichbare Kammerplanung bleibt erhalten und ist als blockiert/unerreichbar erkennbar.
- Vorher beschlossen: Bauaufträge folgen grundsätzlich der **Erstellungsreihenfolge (FIFO)**; blockierte Aufträge dürfen vorübergehend übersprungen werden, ohne ihre Position zu verlieren. Sobald ein früherer Auftrag wieder erreichbar ist, erhält er erneut Vorrang.
- Es werden **keine Verbindungstunnel automatisch erfunden oder gebaut**: Der Spieler plant Verbindungen mit den vorhandenen Bauwerkzeugen selbst.
- Die Kammer erhält ihre nutzbare Funktion erst nach erfolgreichem Aushub, notwendiger Einrichtung mit Baumaterial und tatsächlicher Erreichbarkeit.

## 3. Bauabbruch B – abgebrochene Arbeiten bleiben, unverbrauchtes Material erhalten

- Der Spieler darf einen laufenden oder geplanten Bauauftrag **abbrechen**.
- Bereits **ausgegrabene Felder bleiben ausgegraben**; Aushub wird nicht rückgängig gemacht.
- **Unverbrauchtes Material bleibt erhalten** (etwa im Lager oder als noch nicht verbrauchte Baustellenlieferung, je nach Implementierung).
- **Bereits verbrauchtes Material wird nicht pauschal zurückerstattet.**
- Der gestoppte Auftrag wird nicht weiter bearbeitet; seine Warteschlangen-/Statusverwaltung muss sauber abgeschlossen werden.
- Ein abgebrochener, nur teilweise ausgegrabener oder eingerichteter Raum ist **keine automatisch betriebsbereite Kammer** und schafft insbesondere keine nutzbare Lagerkapazität.
- Wie ein Spieler den verbliebenen Hohlraum später in eine neue Planung einbezieht, wie gebundene Materialien zurücktransportiert werden und ob teilweise eingerichtete Räume speziell behandelt werden, ist **noch offen**.

## Kontexte aus bereits beschlossenen Systemen

- Funktionaler Kammertyp wird **bei der Planung** gewählt und kann nach Fertigstellung **nicht umgewidmet** werden.
- Flexible Größen und individuelle Lagerkapazität pro **fertig eingerichteter** Nahrung-/Wasserlagerkammer.
- Einrichtungs-Baumaterialkosten hängen von **Fläche und Funktion** ab.
- Härtere Erdschichten verlängern Grabdauer und können erst durch spätere Verbesserungen grabbar werden; vorübergehend gesperrte Bereiche bleiben planbar.
- Baumeisterinnen arbeiten autonom; keine Einzelsteuerung.
- Der bisherige Projektcode kann lokal in der VM weiter sein als GitHub `main`, insbesondere am Teich. Vor Codeänderungen **zuerst lokalen Stand prüfen und synchronisieren**.

## Konsequenzen für Codex – erst im passenden Nestbau-Arbeitspaket

1. Bauplan mit ID, unveränderlichem Kammertyp, zusammenhängender Tile-Menge, Erstellungsindex, Bauphase, Erreichbarkeits-/Blockadestatus und Materialfortschritt anlegen.
2. Erreichbarkeit gegen tatsächliche Gänge/Pfadfindung prüfen. Unerreichbare Pläne nicht löschen oder eigenständig verbinden; spätere machbare Baupläne dürfen gemäß Bypass-Regel bearbeitet werden.
3. Baumaßnahmen auf tatsächlich erreichbare geplante Tiles beschränken; Kombination aus Pinsel/Rechteck korrekt speichern.
4. Abbruch ist eine explizite Zustandsänderung. Bereits abgegrabenes Terrain und verbrauchtes Material bleiben unverändert, noch unverbrauchtes Material wird nicht vernichtet.
5. Kammer erst nach Einrichtung und gültiger Verbindung aktivieren; nur dann Lagerkapazität bereitstellen.
6. Diese Regeln **nicht in Codex-Auftrag 01 der Ressourcenwirtschaft hineinzwingen**. Reihenfolge der vorherigen Planung beibehalten.

## Vorgeschlagene automatisierte Tests

- Eine zusammenhängende L-förmige Tile-Fläche ist eine gültige Kammerform (sofern Mindestanforderungen erfüllt).
- Zwei getrennte Inseln dürfen nicht als eine zusammenhängende Kammer gelten.
- Fern geplante Kammer ohne gangbaren Zugang ist blockiert, bleibt aber in der Warteschlange.
- Blockierter früherer Bauauftrag kann übersprungen und nach Herstellung der Verbindung wieder aufgenommen werden.
- Ohne vorgeplanten Verbindungstunnel wird keine Verbindung automatisch hinzugefügt.
- Nach Abbruch bleibt vorhandener Aushub bestehen; unverbrauchtes Baumaterial bleibt vorhanden und verbrauchtes wird nicht dupliziert.
- Abgebrochene/unfertige Kammer liefert keinerlei betriebliche Lagerkapazität.

## Noch offen / nächster Planungsbereich

- Welche **Kammertypen** stehen zu Beginn zur Verfügung, welche erst später?
- Welche **Mindestgröße** benötigen Kammerarten (z. B. Königin, Brut, Lager)?
- Wie wird die Leistungs-/Kapazitätsskalierung von Kammern gestaltet?
- Welche Behandlung gilt für bereits ausgehobene, aber nach Abbruch ungenutzte Hohlräume?

**Status: dokumentierter Beschluss; noch kein Spielcode geändert.**
