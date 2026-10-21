# ANTHIVE – Bauwerkzeuge und blockierte Bauaufträge

**Verbindliche Entscheidungen vom 21.10.2026.** Ergänzung zu `planung/2026-10-21-nestbau-bauauftraege-und-kammern.md` und den übrigen Planungsdateien.

## Beschluss 1: Bauwerkzeug C – Kombination aus Pinsel und Rechteck

- Spieler können **Pinselwerkzeug** für frei gezeichnete Tunnel, unregelmäßige Kammern und Anpassungen verwenden.
- Zusätzlich gibt es ein **Rechteckwerkzeug**, mit dem sich größere zusammenhängende Bereiche schnell markieren lassen.
- Beide Werkzeuge können **innerhalb derselben Bauplanung kombiniert** werden. Planung erfolgt auf dem vorhandenen Kachelraster und soll langfristig auch per Touch gut benutzbar sein.
- Das zuvor beschlossene **freie Gestalten** von Lage und Form bleibt erhalten; keine verpflichtenden vorgegebenen Bauplätze.
- Die markierten Felder ergeben **Bau-/Grabaufträge**, keine sofortige Terrainänderung. Baumeisterinnen graben autonom; danach müssen funktionale Kammern noch mit Baumaterial eingerichtet werden.
- Details wie Lösch-/Radierwerkzeug, Vorschau, Bestätigung, maximale Pinselgröße und Eingabegesten sind **noch nicht entschieden**.

## Beschluss 2: Blockierte Bauaufträge B – vorübergehend überspringen

- Die grundsätzliche Bauwarteschlange bleibt **FIFO (Erstellungsreihenfolge)**, wie zuvor beschlossen.
- Ist der nächste Auftrag **momentan unerreichbar oder blockiert**, bleibt er **mit seiner ursprünglichen Position** in der Warteschlange erhalten.
- Baumeisterinnen dürfen **vorübergehend einen späteren erreichbaren Auftrag** bearbeiten, statt komplett stillzustehen.
- Sobald der frühere Auftrag wieder ausführbar ist, erhält er entsprechend der ursprünglichen Reihenfolge wieder Vorrang. Diese Regel soll ohne ständiges hektisches Wechseln während einzelner Arbeitsschritte umgesetzt werden.
- **Kein automatisches Löschen/Abbrechen** blockierter Aufträge; der Spieler soll den blockierten Status erkennen können.
- Konkrete Prüfung von Erreichbarkeit, zeitliche Wiederprüfung und Behandlung aktiver Teilaufträge sind noch technische Details.

## Hinweise für die Codex-Umsetzung

1. Lokalen VM-Stand und noch nicht gepushte Teichänderungen prüfen/synchronisieren, bevor Spielcode verändert wird.
2. Bestehende Grab- und Pfadfindungslogik wiederverwenden. Bauaufträge als persistente, geordnete Einträge mit markierten Kacheln, Fortschritt, Status und Erstellungsreihenfolge modellieren.
3. Pinsel und Rechteck erzeugen denselben einheitlichen Datentyp von markierten Grabfeldern. Eingabeoberfläche erst nach stabiler Auftrags- und Ausgrabungslogik anschließen.
4. Unzugängliche Aufträge mit Status `blockiert` kennzeichnen, aber in der Warteschlange behalten; spätere erreichbare Aufträge dürfen die Kapazität der Baumeisterinnen sinnvoll nutzen.
5. Nach Beseitigung der Blockade ursprüngliche FIFO-Reihenfolge wieder respektieren. Keine unfertige Kammer als betriebsbereites Lager zählen.
6. Testfälle: beide Werkzeuge erzeugen korrekte Kachelauswahl; kombinierte Auswahl ohne Duplikate; blockierter erster Auftrag bleibt erhalten; zweiter Auftrag kann bearbeitet werden; erster wird nach Entblockung fortgesetzt; nichts wird automatisch gelöscht.
7. Noch **nicht** zusätzlich Kampfsystem, umfassende UI oder aufwendige freie Kammerformenvalidierung einbauen. Diese Planung ist ein Folgeschritt nach der Ressourcen-Grundlage.

## Noch offen für nächste Entscheidung

- Welche Regeln gelten für zulässige Kammergröße und Kammerform?
- Wie wird der Typ einer fertig gegrabenen Kammer bestimmt, und kann man ihn später ändern?
- Welche Baukosten/Einrichtungskosten fallen an?
- Wie werden ungültige oder unverbundene Baupläne angezeigt?

**Nur Design- und Entwicklungsplanung; keine Änderung am Spielcode.**
