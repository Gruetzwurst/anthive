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

- Eine fertige Grabkachel wird als begehbarer Tunnel geöffnet und erhält einen kleinen sichtbaren Erdhaufen. Der Haufen muss abgeholt werden, blockiert den Tunnel in dieser Vorschau aber nicht.
- Solange ein Haufen wartet, ist er ein eigener Zustand der Kachel; er wird erst als eingelagertes Material gezählt, wenn eine Trägerameise damit das separate Baustofflager erreicht.
- Ameisen der Baumeistergruppe holen wartende Haufen ab und wechseln anschließend wieder zu offenen Grabaufträgen. Damit können mehrere Ameisen gleichzeitig arbeiten: eine kann graben, während eine andere eine frühere Ladung abtransportiert; alternativ gräbt und transportiert dieselbe Ameise nacheinander.
- Der Lagerbestand wird im Spiel sichtbar angezeigt. Das Futterlager bleibt davon getrennt.
- Bewegungen der Ameisen und Ladungen werden weich animiert. Es gibt nur wenige laufende Figuren und einfache Kachelzustände, damit die Vorschau leicht bleibt.
- Tragmenge, Gruppengröße, Laufgeschwindigkeit und Priorität zwischen Graben und Tragen sind Vorschauwerte. Das Dokument legt diese Balancewerte noch nicht endgültig fest.
- Der Prototyp zeigt vorerst die Arbeit der Baumeistergruppe. Ein späteres Zuweisen von Ameisen anderer Gruppen wird so modelliert, dass diese ausschließlich Baustoff transportieren; eine neue Zuweisungsoberfläche ist nicht Teil dieses Entwurfs.

## Abgrenzung

Keine endgültigen Materialkosten, Upgrades, Produktionsraten oder dauerhafte Simulation. Die Vorschau prüft den sichtbaren Ablauf: Graben → wartende Ladung → Transport → eigener Lagerbestand.
