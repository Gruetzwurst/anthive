# ANTHIVE – Nestbau, Bauaufträge und Kammerfertigstellung

**Verbindliche Nutzerentscheidungen vom 21.10.2026.** Ergänzung zum Planungsordner `planung/`. Bestehende Spielentscheidungen nicht überschreiben.

## Beschluss 1: Kammergestaltung B – frei gestalten

- Der Spieler **markiert selbst Form und Position** von Tunneln und Kammern in der unterirdischen Spielwelt.
- Baumeisterinnen graben die markierten Felder/Bereiche selbstständig aus; **keine Einzelsteuerung**.
- Dies ist kein System mit ausschließlich vorgegebenen Kammerbauplätzen und keine vollautomatische Standortwahl der Ameisen.
- Die Auswahl des **Kammertyps** muss später für die Einrichtungsphase mit der geplanten Form verknüpft werden; exakte Bedingungen für gültige Kammerformen und -größen sind noch nicht beschlossen.
- Das bestehende Terrain-/Grab- und Schutttransportsystem weiterverwenden statt ersetzen. Prüfen, welche freien Formen mit Kachelgitter, vorhandenen Terrainhärten und Pfadfindung realisierbar sind.

## Beschluss 2: Bauauftragssteuerung A – Erstellungsreihenfolge

- Mehrere Bauaufträge werden in der **Reihenfolge abgearbeitet, in der der Spieler sie erstellt hat (FIFO)**.
- Keine verpflichtenden Prioritätsklassen niedrig/normal/dringend und keine automatische gleichmäßige Aufteilung auf alle Baustellen.
- Innerhalb eines Auftrags können mehrere Baumeisterinnen zusammenarbeiten, soweit das technisch sinnvoll ist; genaue Verteilung und Umgang mit unerreichbaren/blockierten Aufträgen sind noch offen.
- Baumeisterinnen führen Bau- und Grabaufträge autonom aus. Die Spielmechanik soll bei Blockaden nicht dauerhaft stehen bleiben: konkrete Pausen-/Überspringregel später entscheiden, nicht ungefragt das FIFO-Grundprinzip ersetzen.

## Beschluss 3: Kammerfertigstellung B – nach Einrichtung

- **Ausgraben allein macht einen Raum noch nicht funktionsfähig.**
- Zuerst wird die Kammer in der vom Spieler markierten Form ausgegraben.
- Anschließend wird sie mit **Baumaterial eingerichtet**.
- Erst wenn die Einrichtung abgeschlossen ist, kann die Kammer ihre geplante Funktion übernehmen (z. B. Nahrung oder Wasser lagern).
- Benötigte Materialmengen, Einrichtungsdauer und konkrete visuelle Darstellung sind noch nicht endgültig entschieden.
- Bereits vorhandener Baumaterialtransport durch Graben ist die Grundlage. Ressourcen weder bei Abbruch noch bei Bauabschluss verdoppeln.

## Technische Folgen / Arbeitsaufträge für Codex

**Nicht alles gleichzeitig implementieren.** Die aktuelle Reihenfolge aus der übergeordneten Phase-1-Datei beibehalten:
1. Erst den aktuellen lokalen VM-Stand mit GitHub abgleichen; lokale Änderungen an Teich/Welt nicht überschreiben.
2. Ressourcen-Grundsystem, getrennte Lager und Spieluhr aus Auftrag 01 erstellen. Für Lagerkammern möglichst zwischen **geplant / ausgegraben / eingerichtet / betriebsbereit** unterscheiden, damit eine ausgegrabene Kammer nicht vorzeitig Kapazität liefert.
3. Bestehende Grabmechanik inspizieren. Erst in einem abgegrenzten **Nestbau-Arbeitspaket** Spieler-Markierung von Tunneln/Kammerformen, persistente Bauwarteschlange und autonomen Aushub integrieren.
4. Anschließend Einrichtungsphase über Baumaterial-Lieferungen und Aktivierung der Kammerfunktion ergänzen.
5. Bereits beschlossene Lagerregeln: Mehrere Nahrungs- und Wasserlagerkammern, begrenzte Kapazität pro betriebsbereiter Kammer. Ein unfertiger Raum zählt **nicht** zu verfügbaren Lagerkapazitäten.
6. Keine Änderung der bisher beschlossenen autonomen Sammellogik, Gruppenspezialisierungen oder Überlebensregeln durch diese Datei.

## Akzeptanztests für später

- Spieler markiert frei zusammenhängende Tunnel-/Kammerfelder; Bauauftrag speichert die Form nachvollziehbar.
- Zwei erstellte Aufträge: Erster vor zweitem; keine heimliche Prioritätsumsortierung.
- Terrain wird nur in vorgesehenen, tatsächlich bearbeitbaren Feldern abgetragen; bestehende Wege-/Härtelogik gilt.
- Nach abgeschlossener Grabphase: Raum bleibt **nicht nutzbar**, solange Einrichtung/Baumaterial fehlen.
- Mit vollständig gelieferter Einrichtung: Kammer wechselt genau einmal in betriebsbereiten Zustand.
- Mehrere fertige Lagerkammern vergrößern Kapazität; unfertige nicht.
- Keine Materialduplikation bei mehreren Baumeisterinnen oder Unterbrechung.
- Vorhandene Weltgrafik, besonders lokale Änderungen, und Tests bleiben erhalten.

## Noch offen für gemeinsame Planung

- Wie sollen Tunnel/Kammerformen gezeichnet werden (Pinsel, Rechteck, Kombination)?
- Welche Grenzen gelten für zulässige Kammergrößen und -formen?
- Was geschieht mit unerreichbaren/blockierten Bauaufträgen in der FIFO-Warteschlange?
- Wann und wie wird der geplante Kammertyp festgelegt?
- Welche Bau-/Materialkosten und ob spätere Umwidmung möglich ist?

**Status: Dokumentation der Entscheidungen, keine Spielcodeänderungen.**
