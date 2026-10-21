# ANTHIVE – Kammergrößen, Funktionsfestlegung und Umnutzung

**Verbindliche Entscheidungen vom 21.10.2026** – ergänzend zu den Nestbau-Dokumenten im Ordner `planung/`.

## Beschluss 1: Kammergrößen B – flexibel

- Der Spieler kann **Größe und Form** einer Kammer frei gestalten, mit bereits beschlossenem Pinsel- und Rechteckwerkzeug.
- Größere Kammern haben bei geeigneter Funktion **mehr nutzbare Kapazität** (z. B. mehr Nahrungs- oder Wasserlagerplatz), erfordern dafür **mehr Baumaterial für die Einrichtung**.
- Die genaue Kapazitätsformel, Materialkosten, Mindestgrößen, Obergrenzen und mögliche Ausnahmen für spezielle Kammern sind **noch keine beschlossenen Werte**.
- Kammern müssen sinnvoll zusammenhängend und erreichbar sein; genaue Gültigkeitsregeln folgen.

## Beschluss 2: Kammertyp A – bei der Planung festlegen

- Beim Erstellen des Bauauftrags wählt der Spieler **direkt die spätere Funktion der Kammer** (z. B. Nahrungslager oder Wasserlager).
- Die geplante Kammer behält diesen Typ durch die Phasen **geplant -> ausgraben -> einrichten -> betriebsbereit**.
- Erst vollständig eingerichtete Kammern erfüllen ihre Funktion; insbesondere erhalten unfertige Lager **noch keine verfügbare Lagerkapazität**.
- Keine standardmäßige neutrale Kammer, die erst nach dem Ausgraben frei zugewiesen wird. Wie separate reine Tunnel-/Verbindungsaushübe behandelt werden, kann technisch eigenständig geregelt werden.

## Beschluss 3: Spätere Umnutzung A – keine Umwidmung

- Eine **fertige Kammer behält dauerhaft ihre ursprüngliche Funktion**.
- Ein Nahrungslager kann nicht nachträglich in ein Wasserlager umgewandelt werden, auch nicht durch Räumen oder neue Einrichtung.
- Aus diesem Beschluss folgt **nicht automatisch**, dass eine bestehende Kammer niemals vergrößert oder abgerissen werden dürfte; Vergrößerung, Abriss und technische Behandlung unfertiger Pläne bleiben gesondert zu entscheiden.
- Die Benutzeroberfläche soll schon bei der Planung erkennbar machen, dass die Funktionswahl nach Fertigstellung verbindlich ist.

## Zusammenspiel mit vorhandenen Beschlüssen

- Frei gezeichnete Tunnel/Kammern (Pinsel und Rechteck).
- Bauaufträge grundsätzlich in Erstellungsreihenfolge; blockierte Aufträge vorübergehend überspringbar und bleiben gespeichert.
- Aushub und anschließende Einrichtung mit Baumaterial sind beide erforderlich.
- Je Nahrung und Wasser **mehrere getrennte**, individuell kapazitätsbegrenzte Lagerkammern möglich; zusätzliche fertiggestellte Lager erhöhen die Gesamtkapazität.
- Baumeisterinnen arbeiten automatisch und nutzen bestehende Grab-/Schuttlogik.
- Keine Einzelsteuerung, keine stillschweigende Änderung anderer Spielfunktionen.

## Konkrete Umsetzung für Codex, nach den priorisierten Ressourcenaufträgen

1. Bauplan-Objekt mit unveränderlich geplantem `chamberType`, frei definierter zusammenhängender Kachelmenge, eindeutiger ID und Fortschrittsstatus vorsehen.
2. Datenmodell für Lagerkammern: konkrete Kacheln/Position, Ressourcentyp, Kapazität, Bestand; Kapazität abhängig von gültiger Kammergröße, **erst ab betriebsbereiter Einrichtung**.
3. Benötigtes Einrichtungs-Baumaterial mit Fläche skalieren lassen; genaue Zahl zentral konfigurierbar.
4. Für betriebsbereite Kammern keine UI-Aktion für Umwidmung anbieten. Vor dem Start des Bauplans den Typ anzeigen.
5. Bestehende lokale VM-Änderungen prüfen/synchronisieren, bevor Codex Spielcode bearbeitet.

## Spätere Tests

- Unterschiedlich große Kammern desselben Typs erhalten entsprechend verschiedene Lagerkapazitäten.
- Größere Kammer benötigt mehr Einrichtungsmaterial.
- Typ der geplanten Kammer bleibt bis Fertigstellung gleich.
- Ausgegrabene, aber nicht eingerichtete Kammer speichert noch nichts.
- Fertige Kammer kann nicht in einen anderen Typ umgewidmet werden.
- Mehrere fertige Kammern des gleichen Lagertyps vergrößern verfügbare Kapazität.
- Bestehende Bauwarteschlange und Pfadfindung bleiben korrekt.

## Noch offen – bewusst keine Festlegung

- Mindest-/Maximalgröße und zulässige Kammergeometrie.
- Materialverbrauch pro Fläche und Unterschiede nach Typ.
- Umgang mit Abbruch, Vergrößerung, Rückbau oder beschädigten Kammern.
- Erdschichtenabhängige Grabgeschwindigkeit, Aushubmengen und Hindernisse.

**Dieses Dokument ist Planung. Keine Spielcodeänderungen.**
