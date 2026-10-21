# Baustoff aus dem Graben: Entwurf

## Ziel

Beim Graben soll sichtbar Material entstehen und jede Ladung soll tatsächlich im eigenen Baustofflager ankommen. Die Baumeistergruppe erledigt sowohl das Graben als auch den Transport. Später zugeteilte Ameisen aus anderen Gruppen helfen ausschließlich beim Transport.

## Festgelegt durch die Projektvorgabe

- Jede abgebaute Bodenkachel erzeugt Baustoff.
- Jede erzeugte Ladung muss zum separaten Baustofflager transportiert werden.
- Ameisen der Baumeistergruppe dürfen sowohl graben als auch transportieren.
- Werden Ameisen aus anderen Gruppen zur Hilfe abgezogen, übernehmen sie nur Transportaufgaben.
- Die grabende Ameise soll sich flüssig bewegen statt zwischen Kacheln zu springen.

## Vorschlag für den aktuellen Prototyp

- Eine fertig abgebaute Kachel wird zu einem blockierten Tunnel mit einem sichtbaren Erdhaufen. Sie wird erst begehbar, wenn die Ameise, die sie abgebaut hat, genau diesen Haufen aufnimmt. Dadurch kann in einem schmalen Gang nicht weitergegraben werden, solange der Haufen den Weg versperrt.
- Die grabende Ameise übernimmt ihre eigene Ladung direkt und bringt sie ins separate Baustofflager. Die Kachel wird beim Aufnehmen frei; danach darf die nächste Arbeit beginnen, während dieselbe Ameise ihre Ladung noch zum Lager trägt.
- Mehrere Ameisen können dadurch parallel arbeiten, wenn der Gang oder andere Grabaufträge es erlauben. Jede Ameise trägt höchstens die eine Ladung aus ihrer eigenen Grabaktion.
- Im Lager gibt es einen einzelnen großen, statischen Baustoffhaufen. Nur die Zahl des eingelagerten Materials ändert sich; einzelne Blöcke werden nicht dauerhaft hinzugefügt.
- Das Futterlager bleibt davon getrennt.
- Bewegungen der Ameisen und Ladungen werden weich animiert. Es gibt nur wenige laufende Figuren und einfache Kachelzustände, damit die Vorschau leicht bleibt.
- Tragmenge, Gruppengröße, Laufgeschwindigkeit und Priorität zwischen Graben und Tragen sind Vorschauwerte. Das Dokument legt diese Balancewerte noch nicht endgültig fest.
- Der Prototyp zeigt vorerst die Arbeit der Baumeistergruppe. Ein späteres Zuweisen von Ameisen anderer Gruppen wird so modelliert, dass diese ausschließlich Baustoff transportieren; eine neue Zuweisungsoberfläche ist nicht Teil dieses Entwurfs.

## Abgrenzung

Keine endgültigen Materialkosten, Upgrades, Produktionsraten oder dauerhafte Simulation. Die Vorschau prüft den sichtbaren Ablauf: Graben → wartende Ladung → Transport → eigener Lagerbestand.
