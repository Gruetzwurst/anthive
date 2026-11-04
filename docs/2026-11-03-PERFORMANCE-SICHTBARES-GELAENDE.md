# Performance: sichtbares Gelände

Auslöser: Ruckeln beim Öffnen einer Kolonie und beim Heranzoomen mit etwa47
Ameisen. Untersuchung mit Superpowers systematic-debugging, reproduzierendem
Browsertest vor der Änderung und unabhängigem kurzem Code-Review.

## Ursache und Änderung

Der gesamte Geländeuntergrund bestand aus einem einzigen Phaser-Graphics-Objekt
mit515.514 Zeichenbefehlen. Phaser spielt diese Befehle bei jeder Darstellung
erneut ab, auch wenn fast das gesamte Gelände außerhalb der Kamera liegt.

`ViewportGraphics` zerlegt ausschließlich diesen statischen Untergrund in
Abschnitte von16×16 Kacheln. Ein Abschnitt baut seine bisherigen Zeichenbefehle
erst auf, wenn er erstmals sichtbar wird. Außerhalb der aktuellen Kamerasicht
wird er nicht gerendert. Kamerafilter und Sichtbarkeitsregeln bleiben wirksam.
Die Szene besitzt und entsorgt die Abschnitte wie andere Spielobjekte.

Weltgröße, Terrainfarben, Texturen, Kantenglättung und Simulationsregeln ändern
sich nicht. Die Tilemap und dynamische Grabungsdarstellung bleiben bestehen.

## Nachweis

Separate Testkolonie mit47 Arbeiterinnen, Firefox headless/Canvas. Simulation
und Darstellung getrennt gemessen; keine fremden Browser-Spielstände verändert.

| Messung | Vorher | Nachher |
| --- | ---: | ---: |
| Gelände-Zeichenbefehle bei100% |515.514 |8.241 |
| Gelände-Zeichenbefehle bei200% |515.514 |5.005 |
| Median Renderprobe bei100% |64ms |42ms |
| Median Renderprobe bei200% |56ms |29ms |

Jeweils12 synchrone Renderproben; Zeiten sind maschinenabhängig und keine
Messung der tatsächlichen Bildschirm-FPS. Ein zweiter Vorherlauf lag bei67/81ms.
Die Simulation der47 Arbeiterinnen benötigte ungefähr1,4–1,8ms pro1/60s-Schritt.
Der Screenshot bei200% war vor/nach der Änderung pixelgleich (Pillow-Differenz).

Die Regression prüft die tatsächliche renderbare Befehlsmenge bei nahem Zoom
(unter50.000) statt einer instabilen Zeitgrenze. Vorher scheiterte sie mit515.514,
nachher bestand sie mit5.005. Zusätzlich werden entfernte Geländeabschnitte
besucht und die Kamera zurückbewegt, damit die verzögerte Darstellung geprüft wird.

Logs: `/tmp/anthive-performance-before.log`, `-red.log`, `-green.log`.
Der unabhängige Review meldete keine wichtigen Befunde.
Build erfolgreich; die bekannte Bundlegrößenwarnung bleibt bestehen.
`npm test`:304/304 erfolgreich, keine Fehler/übersprungenen Tests,
Exitcode0, ca.256 Sekunden. Log: `/tmp/anthive-performance-full.log`.
Abschließender Browserlauf erfolgreich: nach Kamerafahrt in die entfernte
untere Kartenecke19.643 Gelände-Befehle, nach Rückkehr5.005; keine leeren
Abschnitte. Renderprobe erneut44/31ms bei100/200%, Screenshot weiterhin
pixelgleich. Log: `/tmp/anthive-performance-final.log`.
Bestehende Bau-/Grabungs-/Abbruchregression erfolgreich, Exitcode0:
`/tmp/anthive-performance-construction.log`.
Diff- und Python-Syntaxprüfung erfolgreich. Änderung zunächst lokal.

## Grenzen

Dies behebt einen gemessenen großen Engpass. Weitere Grafikobjekte und die
Simulation kosten weiterhin Zeit; ein vollständig ruckelfreies Spiel auf jeder
Hardware ist damit nicht belegt. Die gesamte Ladezeit einer bestehenden Kolonie
wurde nicht separat gemessen. Bei weiterem Ruckeln an diesem Stand erneut gezielt
profilieren, statt Grafikqualität oder Spielgeschwindigkeit zu reduzieren.

Spieltest-Rückmeldung: Darstellung etwas besser; nach dem Öffnen einer Kolonie
brauchen die Ameisen etwa1–2 Sekunden bis zum vollen Tempo. Nutzer und Assistent
haben vereinbart, diesen kurzen Anlauf vorerst zurückzustellen. Ursache noch
nicht gemessen; nicht als durch die Scriptgröße erklärt oder behoben behandeln.
