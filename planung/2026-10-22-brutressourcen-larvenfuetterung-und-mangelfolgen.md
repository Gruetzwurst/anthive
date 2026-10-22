# ANTHIVE – Brutressourcen, Larvenversorgung und Mangelkonsequenzen

**Verbindliche Nutzerentscheidungen vom 22.10.2026:** Ressourcenverbrauch der Brut **C**, Versorgungstransport **B**, Folgen bei Ressourcenmangel **B**.

> Dieses Dokument ergänzt die vorherigen Dateien im Ordner `planung/`. **Verbindlich sind die unten aufgeführten Mechaniken. Konkrete Mengen und Zeitgrenzen bleiben unentschieden und werden erst als zentral änderbare Testwerte gewählt.** Noch kein Eingriff in den Spielcode.

## Verbindlich 1: Direkter Brutverbrauch C – nur Larven

- **Nur während des Larvenstadiums benötigt die Brut direkt Nahrung und Wasser.**
- **Zugewiesene Eier und Puppen haben keinen eigenen direkten Nahrungs- oder Wasserverbrauch** im Brutsystem. Nicht zugewiesene Eier im Königinnenpuffer erst recht nicht.
- Die Königin, Brutpflegerinnen und andere erwachsene Ameisen haben weiterhin ihren regulären Kolonieverbrauch. `kein direkter Verbrauch für Ei/Puppe` ist **keine** Entscheidung, dass adulte Ameisen oder die gesamte Kolonie dort keine Ressourcen benötigen.
- Keine automatisch erfundenen zusätzlichen direkten Futterkosten für Ei- oder Puppenstadium programmieren.
- Vorläufige, bereits gewählte Entwicklung: **Ei 1 Spieltag, Larve 3 Spieltage, Puppe 2 Spieltage**, zusammen **6 Spieltage** bei ausreichender Pflege/Versorgung. Ein Spieltag **600 Echtzeitsekunden**. Das sind änderbare Testwerte.

## Verbindlich 2: Versorgungstransport B – Brutpflegerinnen liefern

- **Brutpflegerinnen holen Nahrung und Wasser aus den zugehörigen Lagern und bringen diese zu den Brutkammern**, um die Larven dort zu versorgen.
- Larvenversorgung erfordert **tatsächliche Transporte**; Vorräte werden **nicht** allein dadurch direkt vom Lager abgezogen, dass eine Larve Bedarf anmeldet.
- Lager, getragene Ladung und in der Brutkammer angekommenes Futter/Wasser müssen buchhalterisch unterscheidbar bleiben. Lagerbestand sinkt bei tatsächlicher Entnahme; erfolgreiche Ablieferung erhöht den vor Ort verfügbaren Vorrat bzw. löst eine nachprüfbare Versorgung aus. Kein Phantomtransport, keine Doppelbuchung.
- Sammelameisen bleiben grundsätzlich für das Einsammeln von Nahrung und Wasser zuständig. Die nun entschiedene **interne Verteilung** aus Lagern an Larven übernehmen Brutpflegerinnen. Dauerhafte Spezialisierung und Spieler-Gruppenverwaltung gelten unverändert.
- Mehrere Nahrungs-/Wasserlager, jeweils endliche Kapazität, intelligente Wegwahl und vereinfachter Tunnelverkehr sind bereits beschlossen. Wie ein Brutpfleger konkret das Quelllager auswählt und die Tragkapazität sind noch offen und sollen später konsistent in der Transportlogik abgebildet werden.
- Bei blockiertem Weg oder fehlendem Vorrat wird **keine Lieferung vorgetäuscht**; die Larvenversorgung meldet entsprechenden Mangel.

## Verbindlich 3: Ressourcenmangel B – zuerst Entwicklungsbremse, später möglicher Brutverlust

- Wird die Larvenversorgung mit Nahrung und/oder Wasser unzureichend, **verlangsamt sich zunächst die Entwicklung**.
- **Erst bei längerer schwerer Unterversorgung** kann es zu Brutverlust kommen.
- Die schon beschlossene **entspannte Überlebensausrichtung** bleibt bestehen: rechtzeitige Warnungen und Chance, die Versorgung wiederherzustellen, bevor ernste Folgen auftreten.
- **Pflegepersonalmangel ist davon klar zu unterscheiden:** Zu wenige Brutpflegerinnen verlangsamen die Entwicklung nach den vorläufigen Pflegefaktoren, führen **allein** aber nicht automatisch zu Bruttod. Fehlende tatsächliche Nahrung oder fehlendes Wasser kann hingegen nach längerer schwerer Unterversorgung zu Verlusten führen.
- Pflegefaktor und Versorgungsfaktor für den Entwicklungsfortschritt müssen nachvollziehbar kombiniert werden; keine unabsichtlichen mehrfachen Abschläge und keine spontanen Verluste durch einzelne ausgelassene Simulationsupdates.
- **Noch unentschieden:** genaue Larven-Verbrauchsmengen, Tragkapazität für Brutpflege-Transporte, ggf. Zwischenvorräte pro Brutkammer, Warnschwellen, Mindestfortschritt bei Nahrungsmangel, Dauer bis zu Brutausfällen. Diese Werte nicht als verbindlich ausgeben.

## Vorhandene Regeln, die bestehen bleiben

- Automatische Eiablage der Königin, aktuell **5 Eier/Spieltag** als Testwert; Eierpuffer der Königin **50 Eier** als Testwert; bei zunehmender Füllung sinkende Rate, bei vollem Puffer Stop.
- Spieler weist Eier spezialisierten Brutkammern zu; erst dort beginnt Entwicklung; Spezialisierung wird durch den Kammertyp dauerhaft bestimmt.
- Brutpflegerinnen: vorläufig **10 Bruttiere je Pflegerin**. Pflegeunterbesetzung: Entwicklungsfaktor als Testwert zwischen 25 % und 100 % (bei 50 % Abdeckung -> 50 % Tempo). **Das modelliert Pflegepersonal, nicht tatsächliche Futterversorgung.**
- Kammern werden erst nach Graben und Einrichtung funktional; nur fertige spezialisierte Brutkammern haben Brutkapazität.
- Nahrung und Wasser werden begrenzt/erneuerbar gesammelt (Teich zunächst unbegrenzt), getrennt gelagert und transportiert. Die Versorgung der Kolonie verbraucht Ressourcen regelmäßig.

## Codex – Reihenfolge beachten

1. **Vor Spielcodeänderungen lokalen VM-Stand mit GitHub vergleichen und sicher synchronisieren**, insbesondere möglicherweise noch nicht gepushte Teich-/Weltänderungen schützen.
2. Erst die priorisierte Ressourcenbasis mit Lagerkammern, echter Sammlung, Verbrauch und Gruppenzuweisungen umsetzen. **Nicht sämtliche 28+ Planungsdokumente in einem einzigen Codex-Schritt implementieren.**
3. Beim späteren Brutmodul getrennte Larvenbedarfe und tatsächlich durch Brutpflegerinnen transportierte Liefermengen modellieren. Zugewiesene Eier und Puppen bekommen im Brutbedarf direkte Menge `0` für Nahrung und Wasser.
4. Ressourcen nur einmal aus einem existierenden Lager entnehmen; unterwegs befindliche Ressourcen eindeutig verfolgen; am Ziel die tatsächliche Lieferung verbuchen, ohne die gleiche Menge erneut aus dem Lager abzuziehen.
5. Bei unzureichenden Lieferungen zunächst mit einem konfigurierbaren Entwicklungsabschlag reagieren, bei ausreichend langem **schweren** Mangel mit möglichen Verlusten. Warnungen nachvollziehbar und nicht wiederholt pro Frame ausgeben.
6. Mangel/Personalpflege als getrennte Ursachen abbilden. Vermeide willkürlich kombinierte Sterblichkeitsregeln.
7. Große Zeitintervalle, Lagerüberfüllung, volle Brutkammern, Transportabbrüche und bestehende Pfadfindung sicher behandeln.

## Spätere Testfälle

- Zugewiesenes Ei und Puppe: direkter Brut-Verbrauch **0 Nahrung, 0 Wasser**; Larve: positive konfigurierbare Bedarfsmengen.
- Bei vorhandenem Nahrung-/Wasserlager erzeugt Larvenbedarf zunächst einen realen Transportauftrag für Brutpflegerinnen; kein sofortiger lagerseitiger Pauschalverbrauch ohne Entnahme.
- Nur die tatsächlich entnommene Menge reduziert das Quelllager, Lieferung und Verbrauch erfolgen exakt einmal.
- Fehlendes Wasser oder fehlende Nahrung -> Versorgungsmangel erkannt, Entwicklungsfortschritt sinkt zunächst, kein sofortiger Brutverlust.
- Wiederhergestellte Versorgung -> Entwicklung kann gemäß gewählter Erholungslogik normal weitergehen.
- Pflegepersonalmangel ohne Futter-/Wassermangel -> langsameres Wachstum, **keine direkte Sterblichkeit**.
- Anhaltender schwerer Futter-/Wassermangel -> Brutausfall erst nach entsprechend konfigurierbarer langer Schwelle, mit Warnphase.
- Mit mehreren Brutpflegerinnen dürfen Transporte/Bestände nicht mehrfach verbucht werden.

## Nächste gemeinsame Planung

- **Vorläufige Larven-Verbrauchswerte** (Nahrung und Wasser je Larve/Spieltag).
- Soll ein **kleiner Vorrat in jeder Brutkammer** angelegt werden, oder erfolgt jeder Transport bedarfsbezogen ohne Vorrat?
- Vorläufige **Transportkapazität von Brutpflegerinnen** je Nahrung/Wasser-Ladung.
- Detaillierte Mangel-/Verlustschwellen erst danach und in Einklang mit entspanntem Überlebenstempo.

**Status: verbindliche Mechaniken dokumentiert; keine Spielcodeänderungen.**
