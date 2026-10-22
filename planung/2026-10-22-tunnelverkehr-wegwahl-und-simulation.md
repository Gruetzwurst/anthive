# ANTHIVE – Tunnelverkehr, Wegwahl und Verkehrssimulation

**Verbindliche Entscheidungen vom 22.10.2026.** Dieses Dokument ergänzt den GitHub-Ordner `planung/`. Es hält Designregeln fest, ist **keine Änderung am Spielcode**.

## Beschluss 1: Einfluss enger Tunnel B – leichte Behinderung

- Bei vielen Ameisen in einem **engen Tunnel** sinkt die Bewegungsgeschwindigkeit.
- Es entstehen **keine dauerhaften Blockaden oder unauflösbaren Staus** allein durch Gegenverkehr/Überfüllung.
- Die Tunnelbreite ist damit ein sinnvoller strategischer Faktor für die Transporteffizienz, ohne dass jede Ameise einzeln an einer anderen hängenbleibt.
- Verkehrsverlangsamung ist von **echter Unpassierbarkeit** zu unterscheiden: Nicht ausgegrabene, gesperrte oder nicht verbundene Bereiche sind weiterhin nicht begehbar.
- Genaue Schwellen für „eng“, Dichte und Geschwindigkeitsreduktion sind **noch nicht entschieden**; zentral konfigurierbare Testwerte verwenden.

## Beschluss 2: Wegwahl B – voraussichtlich schnellste Route

- Ameisen wählen autonom eine **voraussichtlich schnellste erreichbare Route**, nicht zwingend den geometrisch kürzesten Weg.
- Sie berücksichtigen dafür neben der Weglänge auch die **Verkehrsbelastung**: Ein etwas längerer, freier Tunnel kann schneller sein als ein stark frequentierter enger Weg.
- Keine manuelle Pflicht zur Festlegung von Haupttransportwegen.
- Die Route muss immer begehbar sein. Die genaue Wegekostenformel und wie oft neue Routen berechnet werden, sind technische/testbare Parameter, **noch keine endgültigen Balanceentscheidungen**.
- Frühere Beschlüsse bleiben erhalten: Sammlerinnen bevorzugen **schnell verfügbare Ressourcenquellen** und nutzen bei der Ablieferung ein **geeignetes Lager anhand Weg, Auslastung und freiem Platz**. Verkehrsbedingte Reisezeiten ergänzen diese Regeln, statt sie zu ersetzen.

## Beschluss 3: Verkehrssimulation B – vereinfachte Bereichssimulation

- **Jede Ameise bleibt sichtbar**, auch bei großen Kolonien.
- Die Verkehrsbelastung und ihre Auswirkungen werden **effizient je Tunnelabschnitt/-bereich** modelliert, statt vollständige physische Kollisionen und individuelle Ausweichmanöver zwischen jeder Ameise zu simulieren.
- Ziel: auch Hunderte Ameisen mit angemessener Leistung im Browser darstellen.
- Die vereinfachte Simulation ist keine Erlaubnis, Ameisen außerhalb erreichbarer Wege zu bewegen, zu teleportieren oder Transportzeiten zu ignorieren.
- Keine willkürliche Gruppensichtbarkeit/Reduktion sichtbarer Ameisen als Teil dieses Beschlusses; Gruppensimulation C wurde nicht gewählt.
- Konkrete technische Performancegrenzen und Aktualisierungsintervalle sind noch offen; durch Tests bestimmen.

## Unveränderte Spielregeln

- Ameisen werden **nicht einzeln vom Spieler gesteuert**; Arbeitsgruppen und Prioritäten steuern ihre Aufgaben.
- Grab- und Bauaufträge bleiben grundsätzlich FIFO mit zeitweiligem Überspringen blockierter Aufträge.
- Ausgraben vom Bauzugang aus; pro Grabkachel höchstens eine Baumeisterin; mehrere arbeiten an verschiedenen erreichbaren Kacheln.
- Überschüssige Baumeisterinnen helfen bei zulässigen Materialtransporten statt ungefragt spätere Bauaufträge zu beginnen.
- Mehrere, kapazitätsbegrenzte Nahrungs-, Wasser- und Baumateriallager; Transportgutschrift erst bei wirklicher Lieferung.
- Ressourcen- und Baumaterialerträge nur durch tatsächlich erfolgte Vorgänge.
- Keine dauerhafte Verkehrsblockade durch Abraum allein; überschüssiges Baumaterial bleibt bei vollem Lager am Grabungsort und kann später eingesammelt werden.
- **Vor jedem Eingriff in den Spielcode zuerst den aktuellen lokalen VM-Stand mit GitHub abgleichen**, insbesondere neuere, noch nicht gepushte Teichgestaltung.

## Hinweise für Codex – nach den priorisierten Ressourcenaufträgen

1. Zuerst die bereits beschlossene Reihenfolge aus `planung/2026-10-21-phase-1-entscheidungen-und-codex-auftrag.md` einhalten (Ressourcen-Grundlage und Tests vor großem Verkehrs-/Baurework).
2. Vorhandene Wegfindung und Tile-Welt **wiederverwenden**, keine zweite widersprüchliche Navigation implementieren.
3. Begehbare Tunnelabschnitte erfassen und eine **vereinfacht berechnete Auslastung** pro Abschnitt vorsehen, mit konfigurierbarer Verzögerung bei hoher Dichte.
4. Für Routenwahl erwartete Reisezeit auf Basis von Distanz und Verkehrsverzögerung bewerten; geeignete kürzere freie Alternativen ermöglichen.
5. Routen nur in sinnvollen Intervallen neu beurteilen, um übermäßiges Umplanen/Flackern zu vermeiden; konkrete Frequenz erst testen.
6. Sichtbare Ameisen einzeln animieren, Verkehrsmodelldaten abschnittsweise zusammenfassen. Keine Vollkollisionsberechnung jedes Ameisenpaars in jedem Frame.
7. Staus dürfen Wege verlangsamen, aber **nicht permanent unpassierbar machen**. Arbeits-/Transportaufträge und mitgetragene Materialien dürfen durch Routenwechsel nicht dupliziert oder verloren gehen.

## Akzeptanztests / Testfälle

- Auf leerer Strecke entspricht die Laufzeit der Basisbewegung.
- Viele Ameisen in engem Tunnel -> reduzierte Geschwindigkeit, aber **kein dauerhafter Stillstand**.
- Zwei erreichbare Routen: eine kürzer, überlastet; die andere etwas länger, frei -> unter passenden Testwerten wird die **schnellere** Route gewählt.
- Veränderte Verkehrsbelastung darf zu sinnvoller anderer Route führen, ohne dauernd zwischen Wegen hin und her zu springen.
- Gesperrte/nicht ausgegrabene Felder sind trotz möglicher Stauumfahrung niemals begehbar.
- Ameisen bleiben sichtbar und benutzen gültige Wege; auch bei Hunderten Ameisen wird keine vollständige paarweise Kollisionssimulation erforderlich.
- Ressourcen-/Baumaterialtransporte bleiben bei Stau, Umweg und Routenwechsel bilanziell korrekt.
- Wegeverlangsamung und Baustellen-/Kachelreservierungen greifen nicht widersprüchlich ineinander.

## Nächster sinnvoller Planungsbereich

**Materialverteilung zwischen mehreren Lagern und Baustellen:**
- Sollen Bestände einzelner Lagerkammern automatisch umverteilt werden?
- Wie wählen Baumeisterinnen für die Einrichtung einer Kammer ein Quelllager mit Baumaterial?
- Was geschieht, wenn ein Lager Material enthält, aber ein anderes näher an der aktuellen Baustelle liegt?

**Status: verbindliche Designentscheidungen dokumentiert; keine Spielcodeänderung.**
