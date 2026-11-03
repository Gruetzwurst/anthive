# Einklappbare Leiste und Kachelränder – 27.10.2026

Nutzer sieht lila/braune Linien außerhalb 100 % und möchte die obere Leiste
minimieren. Kachelatlas bisher ohne Abstand zwischen benachbarten Motiven:
jetzt 2 Pixel extrudierter Schutzrand je Motiv, 4 Pixel Abstand, passende
Tileset-Margin/-Spacing und explizite Nearest-Filterung. Kamerabewegung auf
Bildschirmpixel ausgerichtet. Keine Weichzeichnung oder neuen Grafikassets.
Alte durchgehende braune Bodenmarkierungen der Startkammern entfernt.

Leiste oben rechts per Minus einklappen, per Plus wieder öffnen. Kompakt nur
Kopfzeile, Bauen/Gruppen und Umschalter. Ausgeblendete Prioritäts-/Ressourcen-
felder blockieren keine Karteneingaben; Zeichnen und Zoom beachten die variable
obere Grenze. Bestehende Simulation und Ressourcendaten unverändert.

Prüfung: 22 fokussierte Grafik-/Welt-/Zoomtests, Build und Diffcheck grün.
Browser `--hud-art-only` prüft alle 137 Atlasframes pixelweise auf passende
Schutzränder, 25/50/200-%-Ansichten, Min-/Maximieren, Karte im freigewordenen
Bereich, weiter bedienbares Baumenü und Touch. Screenshots unter
`node_modules/.cache/anthive-hud-*.png`; Logs `/tmp/anthive-hud-art-*.log`.
Keine Behauptung einer erneuten Komplettsimulation: Verhalten wurde nicht geändert.
