# Raumränder und Nahrung – 27.10.2026

Nutzerfeedback: sichtbare Lücke zwischen farbigem Raum und Erdwand, zu grelle
Farben, Nahrungsvorrat sinkt trotz zwanzig Sammlerinnen.

## Darstellung

Die beige Lücke war der bisherige gekrümmte Tunnelrand in den angrenzenden
Erdkacheln. Eingerichtete Raumflächen erhalten nun direkt angrenzende volle
Erdgrafik statt dieser Aussparung. Gilt auch an Ecken und im Startnest. Gewöhnliche
Tunnel behalten ihre bisherigen Kanten. Die Terrain-Geometrie, Begehbarkeit,
Kammergröße und Kapazität bleiben unverändert. Neu eingerichtete Zellen und
spätere Nachbargrabungen aktualisieren die Darstellung. Raumfarben sind deutlich
entsättigt; die bisherigen thematischen Farbgruppen bleiben erkennbar.

## Nahrungsbilanz

Bisher: einzige Quelle mit Vorrat 200 und Nachschub 20 pro Spieltag. Zwanzig
aktive Sammlerinnen benötigen bereits 20 Nahrung pro Spieltag, zuzüglich
Königin, weiterer Arbeiterinnen und Larven. Mehr Personal behebt diesen
Nachschubengpass nicht und kann die kleine Quelle schneller erschöpfen.

Als angekündigter vorläufiger Testwert gilt für die Spielszene:
**1.000 Quellenvorrat, 60 Nachschub pro Spieltag**. Bestehender Verbrauch,
Ladungen, Laufwege, Lagerkapazitäten und Quellenerholung bleiben unverändert.
Die Startquelle füllt keine Lager automatisch. Werte zentral in
`PLAYABLE_COLONY_CONFIG.simulationConfig`; historische Modellszenarien können
weiterhin die ursprünglichen Ressourcenwerte verwenden.

Ein neuer Test startet zwanzig tatsächliche Sammlerinnen mit drei weiteren
Erwachsenen und der Königin, ohne Startbestände in Lagern. Über fünfzehn
Spieltage werden reale Nahrung-/Wasserlieferungen, Vorratsstabilität, verbleibende
Quelle und keine Erwachsenenverluste geprüft. Unter den alten Werten fällt der
Test rot aus (Nahrung am Ende etwa 139,7, Quelle fast leer); mit neuen Werten
grün. Dies bestätigt diese feste Testpopulation, keine unbegrenzte Versorgung
beliebig großer Kolonien.

## Prüfung

Darstellungstest zuerst rot, danach 16 gezielte Grafik-/Raumtests grün.
Nahrungstest und drei bestehende Spielstart-/Bruttests grün. Build und Diffcheck
erfolgreich. Browser prüft tatsächliche Tiles an allen Startkammergrenzen,
gedeckte Darstellung und weiterhin reale Bau-/Ruhe-/Lagervorgänge. Bilder
`node_modules/.cache/anthive-muted-flush-rooms.png` und `anthive-post-c5-*.png`.
**263/263 Gesamttests erfolgreich**, letzter Lauf ca. 156 Sekunden.
Browserprozess ebenfalls erfolgreich beendet; der frühere Aufräum-Rennfall
bei fokussierten Firefox-Prüfungen wurde durch geregeltes Beenden vor
Profilbereinigung behoben. Logs `/tmp/anthive-food-rooms-{suite,build}.log`
und `/tmp/anthive-muted-rooms-browser.log`. Kein Commit/Push.
