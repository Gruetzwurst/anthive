# ANTHIVE – Bodenkachel-Erweiterung, Phase 1

Zusätzlicher Mustersatz auf Basis des freigegebenen Prototyps in `../world-tile-sample/`. Alle neuen Dateien liegen ausschließlich in diesem Ordner. Die bestehende Spielwelt, der Renderer und alle Spielmechaniken wurden nicht geändert.

## Umfang

- 15 neue Bodentexturen: je drei Varianten für Oberboden, kompakte Erde, Lehm, Steinschicht und Tiefengestein.
- 4 Übergänge: Oberboden → kompakte Erde → Lehm → Steinschicht → Tiefengestein.
- 5 Wandkanten: je eine für jeden Bodentyp. Die offene Seite verwendet den hellbraunen Tunnelton des vorhandenen Spiels.
- Alle fertigen Einzelkacheln sind 24 × 24 Pixel groß.

## Vorschau

`preview.html` direkt im Browser öffnen. Sie zeigt jeden Bodentyp als 8 × 4-Muster aus Referenzkachel und drei neuen Varianten. Übergänge werden achtmal nebeneinander gezeigt. Die Wandkanten stehen links und rechts neben passender Erde bzw. passendem Gestein; die rechte Seite ist in der Vorschau horizontal gespiegelt.

## Linke und rechte Wandseite

Es ist keine zweite PNG-Datei nötig: Die Wandkante zeigt offene Tunnel-Fläche links und Material rechts. Für die rechte Wand wird dieselbe Kachel horizontal gespiegelt. Phaser unterstützt das direkt, etwa mit `image.setFlipX(true)` oder `tileSprite.setFlipX(true)`. Der aktuelle Spielrenderer wurde dafür nicht verändert; nur die separate Vorschau zeigt die gespiegelte Variante.

Zusätzliche Prüfbilder:

- `material-repetition-check.png`: Varianten der fünf Bodenarten in einer wiederholten Fläche.
- `transition-close-up.png`: Übergänge auf 8-facher Vergrößerung.
- `transition-edge-check.png`: Übergänge und Wandkanten in wiederholten Reihen.

## Quellen und Aufbau

Die `*-source.png`-Dateien sind Arbeitsatlanten. `build-prototype.mjs` schneidet Rasterfelder daraus auf 24 × 24 Pixel zu und erzeugt die kleinen Atlanten und Prüfbilder. Das Skript verwendet nur Node.js-Bordmittel. Es lässt sich so ausführen:

```sh
node assets/prototypes/world-tile-expansion/build-prototype.mjs
```

Ein erster dunkler Entwurf für Wandkanten ist unter `ground-edges-dark-study-unused.png` und `clay-edge-dark-study-unused.png` erhalten, wird aber nicht verwendet. Die endgültige Wandkante ist `ground-edges-light-tunnel-source.png`.

Einzelkacheln liegen unter `tiles/`. Atlanten:

- `ground-variants-24px.png`: 5 Spalten × 3 Reihen.
- `layer-transitions-24px.png`: 2 × 2.
- `ground-edges-24px.png`: 5 Spalten × 1 Reihe.

## Sichtprüfung und Grenzen

Die wiederholte Vorschau zeigt keine leeren Zwischenräume; die Kanten schließen im Muster an die hellbraune Tunnel-Fläche an. Die Übergänge von Oberboden zu kompakter Erde und von kompakter Erde zu Lehm sind bei 24 × 24 Pixeln recht subtil, auf der Vergrößerung aber erkennbar. Die Bodentexturen sind bewusst dicht und kleinteilig wie die freigegebene Vorlage; in sehr großen gleichförmigen Flächen kann trotz der Varianten eine Wiederholung auffallen.

Dies ist ein Kunstprototyp, noch kein in Phaser eingebundener Tileset. Die Vorschau prüft die Grafikdateien isoliert und ersetzt keine Prüfung in der laufenden Welt. Für den Einsatz in einer generierten Karte wäre vorab ggf. manuelles Pixel-Tuning nötig.

## Ergänzung: Tunnel-Ecken

`ground-corners-source.png` ist die Arbeitsquelle der ergänzten Eckmotive. `build-corners-prototype.mjs` erzeugt daraus zehn neue 24 × 24 Einzelkacheln (`tiles/*-inner-corner.png` und `tiles/*-outer-corner.png`), den Atlas `ground-corners-24px.png` und die zusammengesetzte Prüfgrafik `ground-tunnel-layout-preview.png`. Das Skript schreibt ausschließlich diese neuen Eckdateien und lässt die bisherigen Grafiken unangetastet.

`tunnel-preview.html` zeigt fünf zusammenhängende Bodenschichten mit einem verzweigten Tunnelabschnitt und den Eckatlas. Gerade Wandkanten bleiben durch Drehung und Spiegelung wiederverwendbar. Die vier vorhandenen Schichtübergänge bleiben unverändert; die neuen Eckmotive sind ein zusätzlicher Prototyp und nicht in die Spielszene eingebunden.

## Ergänzung: Wandkanten und Schichtecken

`build-ground-completion.mjs` erzeugt ausschließlich weitere neue Dateien: zehn zusätzliche gerade Wandkanten (`tiles/*-wall-edge-v2.png` und `*-v3.png`) sowie vier Eckübergänge zwischen jeweils benachbarten Bodenschichten. Die Kacheln bleiben 24 × 24 Pixel groß; Atlanten sind `ground-edge-variants-24px.png` (5 × 2) und `layer-corner-transitions-24px.png` (2 × 2). Die vergrößerten Kontaktbögen heißen `ground-edge-variants-preview.png` und `layer-corner-transitions-preview.png`. Die Bildquellen sind `ground-edge-variants-source.png` und `layer-corner-transitions-source.png`.

`ground-completion-preview.html` wiederholt die drei Wandkantenvarianten gespiegelt und zeigt die Schichteckübergänge sowie die vorherige Tunnelvorschau. Diese Prototypgrafiken bleiben außerhalb der Spielszene.

## In-game integration (2026-10-21)

Die freigegebenen Atlanten werden inzwischen in der gesamten bestehenden Welt als Phaser-Tilemap dargestellt. Das Spiel baut dafür beim Start einen kleinen gemeinsamen Atlas im Speicher aus den oben aufgeführten PNG-Dateien zusammen; die Quelldateien bleiben unverändert. Terrain und offene Tunnel werden weiterhin aus `worldMap` gelesen. Änderungen durch bestehende Grabaufträge aktualisieren nur die betroffenen Kacheln samt angrenzender Wandkanten.

Die Integration ändert weder Weltmaße noch Generierung, Kollisionen, Grabregeln, Wegfindung, Ameisen- oder Transportlogik. Der Produktions-Build und die Welt- sowie Kachel-Layouttests liefen erfolgreich. Eine Browser-Sichtprüfung war in der Codex-Umgebung wegen blockiertem lokalem Port (`listen EPERM`) nicht möglich.

## Oberflächenkacheln und Teichrand (2026-10-21)

Die beiden freigegebenen Oberflächenkacheln aus `../world-tile-sample/tiles/` (`grass-earth-transition.png` und `irregular-surface-edge.png`) werden auf den vorhandenen `surface`-Zellen der Spielwelt abwechselnd angezeigt. Die Zellen, Oberflächenhöhe und Spielregeln bleiben unverändert. Die bestehenden Landschaftsdekorationen bleiben in ihrem bisherigen Renderer.

### Teichrand: nächster Grafikschritt

**Überholt durch die Seitenansicht unten:** Die folgende Ellipsenprobe entstand aus einer falschen Vogelperspektive. Sie bleibt als Studie erhalten und ist nicht mehr das Ziel für den Spielteich.

`../world-tile-sample/tiles/pond-shore-transition.png` ist eine einzelne 24 × 24-Kachel mit Wasser auf der linken und Erde/Gras auf der rechten Seite. Spiegeln und Drehen kann diese eine Kachel für die vier Hauptrichtungen ausrichten. Sie enthält aber weder eine reine Wasserfläche noch eigene Innen-/Außenecken; zudem wird der bestehende Teich aktuell als breite Ellipse gezeichnet. Ein einfaches Kachelraster würde daher rechteckige Kanten oder auffällige Wiederholungen erzeugen.

Für eine saubere Teichdarstellung sollte der bestehende Teich als rein visuelle, aus Kacheln zusammengesetzte Dekoration gerendert werden. Als erster Schritt sollte eine separate kleine Vorschau prüfen, wie weit sich die vorhandene Übergangskachel durch Drehen und Spiegeln entlang der Teichform wiederverwenden lässt. Die Vorschau muss außerdem zeigen, ob eine passende Wasserfüllung und zusätzliche Eckmotive nötig sind, bevor die Kachel an die Stelle der bisherigen Ellipse tritt. Das ändert weiterhin weder Weltdaten noch Ressourcen-, Lauf- oder Grabregeln.

### Separate Teichrandprobe (2026-10-21)

[`pond-preview.html`](pond-preview.html) direkt im Browser öffnen oder über den Vite-Entwicklungsserver unter `/assets/prototypes/world-tile-expansion/pond-preview.html` aufrufen. Die Seite benötigt keine zusätzlichen Pakete und lädt ausschließlich die vorhandenen Ufer- und Oberbodenkacheln.

Die Probe zeigt sechs Wiederholungen pro Uferseite sowie die bisherige Teichellipse und eine vergrößerte Rasterfassung derselben Außenform (13 × 3,1 Kacheln). Raster und Ellipsenkontur lassen sich ein- und ausblenden. Wasserflächen sind blau schraffiert; Felder mit mehreren offenen Randrichtungen sind als fehlende Eck-/Rundungsmotive ockerfarben markiert. Diese Platzhalter sind keine neuen freigegebenen Grafiken. Die Zellen werden anhand ihrer Mittelpunkte der Ellipse zugeordnet; die Vorschau ist eine Grafikbedarfsprobe, kein fertiger Autotiler.

Ergebnis: Die vorhandene Kachel deckt die vier geraden Uferausrichtungen ab. Für eine geschlossene Darstellung fehlen eine wiederholbare reine Wasserfläche und konvexe Eck-/Rundungsmotive für die flachen Teichenden. Konkave Innenecken sind bei dieser elliptischen Form noch nicht nötig. Die direkte Wiederholung macht zudem wiederkehrende Gras- und Wassermuster sichtbar. Nächster Schritt ist, passende Wasser- und Rundungsmotive in dieser isolierten Probe zu ergänzen und ihre Anschlüsse visuell zu prüfen, bevor der bestehende Teichrenderer ersetzt wird. Spielszene und Weltdaten wurden für diese Probe nicht geändert.

### Korrektur: Teich in Seitenansicht (2026-10-21)

Der Spielteich wird jetzt wie die übrige Welt im seitlichen Schnitt dargestellt: eine waagerechte Wasseroberfläche in einer Bodenmulde mit stufigem, zur Mitte tieferem Grund. Die bisherige Ellipse und ihr ovaler Glanz entfallen. `pondProfile.ts` berechnet aus den örtlichen Oberflächenhöhen einen durchgehend gleichen Wasserspiegel unterhalb der Ufer; `worldDecorationRenderer.ts` überzeichnet den bisherigen Grasstreifen innerhalb der Mulde mit Himmel und zeichnet darunter die Wasserfläche. Das umgebende Bodentileset bleibt als Erdwand und Teichboden sichtbar.

Die Darstellung verwendet zunächst farbige Pixel-Flächen, einen dunkleren Tiefenbereich und kleine horizontale Lichtstreifen. Die frühere Uferkachel aus Vogelperspektive wird hierfür nicht verwendet. Es ist eine visuelle Dekoration, noch keine Simulation: Weltdaten, Wegfindung und Grabregeln bleiben unverändert; insbesondere haben Wasser und Mulde noch keine eigene Kollision.

Die normale Map lässt sich mit `http://127.0.0.1:5173/?view=pond` direkt am Teich öffnen, wenn der Entwicklungsserver auf Port 5173 läuft. Ohne diesen Parameter bleibt die bisherige Startkamera erhalten. `node --experimental-strip-types --test tests/*.test.mjs` prüft auch den gleichmäßigen Wasserspiegel und das Tiefenprofil auf unebenem Gelände.
