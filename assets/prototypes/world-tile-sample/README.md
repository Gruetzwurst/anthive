# ANTHIVE – erster Kachelprototyp

Dieser Ordner enthält ausschließlich den freigegebenen Mustersatz: fünf Bodenkacheln und drei Oberflächenübergänge. Die bestehende Weltgrafik und Spielmechanik wurden nicht geändert.

## Dateien

- `source-atlas.png`: unveränderte Bildgenerierung als Arbeitsquelle.
- `anthive-terrain-sample-24px.png`: kompakter Atlas mit 4 Spalten × 2 Reihen; jede Zelle ist genau 24 × 24 Pixel.
- `tiles/`: dieselben acht Grafiken einzeln, jeweils 24 × 24 Pixel.
- `preview.html`: vergrößerte Sichtprüfung im Browser, 8× dargestellt.

## Phaser-Einbindung

Die einzelnen PNG-Dateien können in `preload()` mit `this.load.image('topsoil', '.../topsoil.png')` geladen und anschließend mit `this.add.image(...).setDisplaySize(24, 24)` angezeigt werden. Der kompakte Atlas kann mit `this.load.spritesheet(...)` und `frameWidth: 24`, `frameHeight: 24` geladen werden. Für eine spätere Kachelwelt sollten die Texturen über eine Tilemap-Ebene gezeichnet und beim Graben nur die betroffenen Zellen aktualisiert werden. Das ist eine Integrationsmöglichkeit, keine Änderung am aktuellen Renderer.

## Sichtprüfung

`preview.html` direkt aus dem Dateimanager öffnen. Es zeigt die acht Kacheln, ohne die laufende Spielszene umzuschalten.
