# ANTHIVE – Materialverteilung, Versorgung von Baustellen und Materialmangel

**Verbindliche Nutzerentscheidungen vom 22.10.2026:** Materialumverteilung **A**, Lagerwahl für Baustellen **B**, Verhalten bei Baumaterialmangel **B**. Diese Datei ergänzt die bestehenden Entscheidungen im Ordner `planung/`. **Kein Spielcode geändert.**

## 1. Beschluss A – Keine automatische Materialumverteilung zwischen Lagern

- Bereits eingelagertes Baumaterial **bleibt in seiner konkreten Lagerkammer, bis es tatsächlich gebraucht wird**.
- Ameisen führen **keine vorsorglichen Ausgleichstransporte** zwischen Materiallagern durch – weder dauerhaft zum gleichmäßigen Füllen noch automatisch nur, um eine andere Lagerkammer näher an einer Baustelle aufzufüllen.
- Transporte **vom Lager direkt zur Baustelle zum tatsächlichen Verbrauch** sind weiterhin erlaubt und vorgesehen (siehe Beschluss 2); dies ist **keine Lager-zu-Lager-Umverteilung**.
- Materialbestände einzelner Kammern bleiben voneinander unterscheidbar; für Gesamtanzeigen dürfen sie addiert werden.
- Die bestehenden Regeln für Material **am Grabungsort, getragen, eingelagert, verbraucht** bleiben erhalten.

## 2. Beschluss B – Baustelle aus den schnellsten geeigneten Lagern versorgen

- Für die **tatsächliche Materiallieferung zur Baustelle** wählen Ameisen verfügbare Materiallager automatisch nach **erwarteter Transportdauer**, unter Berücksichtigung von Weglänge, Tunnelverkehr und vorhandenen Vorräten.
- Wenn nötig oder vorteilhaft, dürfen **mehrere Lager** zur Versorgung derselben Baustelle genutzt werden.
- Keine manuelle Pflicht, jeder Baustelle eine einzelne Lagerkammer zuzuweisen.
- Der Lagerbestand muss beim Aufnehmen korrekt reduziert und transportiertes Material eindeutig geführt werden. **Nicht mehrfach reservieren, abbuchen oder gutschreiben.**
- Die bereits beschlossene Wegwahl ist die voraussichtlich **schnellste erreichbare Route**, inklusive vereinfachter Tunnel-Auslastung ohne dauerhaften Stau.
- **Keine automatische Vorverlagerung** der Vorräte in ein anderes Lager nur zur Beschleunigung späterer Lieferungen – dieser Unterschied hält Beschluss 1 und 2 widerspruchsfrei.

## 3. Beschluss B – Schrittweise Einrichtung bei Materialmangel

- Kammern werden nach dem Aushub **schrittweise mit tatsächlich vorhandenem Baumaterial eingerichtet**.
- Es muss **nicht** das gesamte erforderliche Material von Anfang an eingelagert sein.
- Wenn das verfügbare Baumaterial aufgebraucht ist, **pausiert die Einrichtung**, ohne bislang erreichten Baufortschritt oder bereits verbrauchtes Material zurückzusetzen.
- Sobald wieder Material verfügbar ist, wird die Einrichtung am bestehenden Fortschritt **fortgesetzt**.
- Eine nur teilweise eingerichtete Kammer ist **noch nicht betriebsbereit** und bietet insbesondere **keine anteilige Lager-, Brut- oder Ruhekapazität**, gemäß den bisherigen Kammerregeln.
- Bei Materialmangel entsteht **keine künstliche Materialgutschrift** oder kostenloser Ausbau.
- Die bestehende Bauauftragsreihenfolge **FIFO mit vorübergehendem Überspringen blockierter Aufträge** bleibt erhalten. Ob ein pausierter Einrichtungsauftrag als „blockiert“ gilt und nachfolgende ausführbare Aufträge zwischenzeitlich bearbeitet werden können, muss im Bauauftragsmodell konsistent umgesetzt werden; kein generelles eigenmächtiges Umpriorisieren.
- Bauabbrüche behalten bisherigen Aushub und unverbrauchtes Material; bereits eingebautes Material wird nicht grundlos zurückerstattet.

## 4. Frühere Beschlüsse und Werte bleiben gültig

- Kammerfunktion wird schon bei Planung gewählt und nach Fertigstellung nicht umgewidmet; freie, zusammenhängende Kammerformen, Pinsel + Rechteck.
- Einrichten erst nach erfolgreichem Aushub; nur fertig eingerichtete und erreichbare Kammern sind funktionsfähig.
- Einrichtungskosten nach Größe und Kammertyp. **Vorläufige Testwerte**: Nahrung-/Wasser-/Baumateriallager und Ruhekammer 2 Material/Kachel, Brutkammern 3 Material/Kachel.
- Mehrere Materiallagerkammern mit separaten Beständen und endlicher Kapazität sind möglich.
- **Vorläufige Testwerte**: 5 Materialeinheiten Tragkapazität je Baumeisterin; 6 Sekunden Basis-Grabzeit in lockerer Erde; weitere Erdschichten mit 2× / 3× / 5×.
- Bei vollem Materiallager darf weitergegraben werden; überschüssiger Abraum bleibt am Grabungsort. Abholung alten Abraums grundsätzlich **nachrangig, wenn keine ausführbaren Grabaufträge mehr anstehen**.
- Baumeisterinnen transportieren Baumaterial bei voller Ladung, Teilladungen bei Auftragsende sicher behandeln; überschüssige Baumeisterinnen können zulässige Materialtransporte übernehmen.
- Keine individuelle Ameisensteuerung.

## 5. Entwicklungsauftrag für Codex (erst nach den vorrangigen Ressourcenaufträgen)

1. **Vor Codeänderungen lokalen VM-Stand mit GitHub abgleichen**, besonders neue lokale Teich-/Weltdateien schützen.
2. Zuerst Ressourcen-Grundlage und tatsächliche Transporte nach vorhandener Reihenfolge umsetzen. Danach Bau-/Einrichtungslogik als separates Arbeitspaket.
3. Für jede Materiallagerkammer eigene Bestände und Positionen verwalten. **Keine Lager-zu-Lager-Umverteilungsjobs** erzeugen.
4. Bei Baustellenversorgung geeignete erreichbare Materiallager mit tatsächlichen Vorräten anhand einer testbaren Schätzung der Transportzeit auswählen. Material darf ggf. aus mehreren Lagern kommen.
5. Einrichtungsbedarf, bislang geliefertes/eingebautes Material und ausstehende Menge je Bauauftrag speichern. Bei Mangel pausieren, bei erneuter Verfügbarkeit ohne Fortschrittsverlust fortsetzen.
6. Kein Abzug oder Verbrauch derselben Materialeinheit mehrmals; transportierte und eingelagerte Mengen sauber auseinanderhalten.
7. Keine teilfertige Kammer vorzeitig freischalten.

## 6. Tests

- Zwei Materiallager: Inhalt bleibt ohne konkreten Bauauftrag in den jeweiligen Lagern; keine automatischen Transfers zwischen Lagern.
- Baustelle wählt ein geeignetes erreichbares Lager mit niedrigster geschätzter Transportdauer und tatsächlichem Materialbestand.
- Ist ein Lager fast leer, darf Material derselben Baustelle aus weiteren Lagern geliefert werden.
- Auch bei überlastetem Tunnel kann der zeitlich bessere Umweg ausgewählt werden.
- Für 24 Einheiten Einrichtungskosten werden zunächst nur 9 angeliefert: Fortschritt 9/24, Kammer bleibt nicht betriebsbereit.
- Später 15 weitere Einheiten verfügbar: Auftrag setzt bei 9/24 fort und wird bei 24/24 genau einmal abgeschlossen.
- Materialmangel vernichtet keinen Fortschritt und erzeugt weder Duplikate noch negative Lagerbestände.
- Abbruch einer unfertigen Kammer hält bereits ausgegrabene Felder und nicht verbrauchtes Material erhalten.
- Bestände werden nicht mehrfach gebucht, wenn mehrere Ameisen dieselbe Baustelle beliefern.
- Auftragsreihenfolge und Blockaderegeln gelten weiterhin.

## 7. Nächster offener Planungsbereich

- **Wie sichtbar ist der Ausbaufortschritt** (Aushub, Einrichtung, Materialbedarf, Baustellenstatus)?
- **Wie wird ein Materialmangel angezeigt** und wie erfährt der Spieler, warum eine Baustelle pausiert?
- Können Spieler Bauaufträge **manuell pausieren/wieder aufnehmen** oder nur abbrechen?
- Umgang mit zu vielen parallelen Materialanforderungen (automatische Reservierung, Lieferreihenfolge) ist noch nicht explizit entschieden.

**Status: neue Designentscheidungen dokumentiert; keine Änderungen an der Spielimplementierung.**
