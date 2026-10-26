# B6 – Tunnelverkehr und Performance

Freigabe „frei“. Basis B5 bc59ec8, sauber und per ls-remote mit GitHub identisch. Eigener Branch; sparsame Inline-Arbeit ohne Zusatzagenten.

Spec: `planung/2026-10-22-tunnelverkehr-wegwahl-und-simulation.md` und zentrale Arbeitsreihenfolge B6. Bestehende Karten, Pfadfindung, Zeit und Ressourcensysteme erhalten.

Technik: gemeinsames Verkehrsmodell aggregiert Positionen in kurzen Abschnitten gerader, ein Kachel breiter Tunnel. Breite Räume/Kreuzungen und Oberfläche bleiben ohne Engpassabschlag. Belegte Abschnitte verändern nur Laufgeschwindigkeit und erwartete Reisezeit, keine Grab-/Einrichtungsleistung. Vorhandene Kardinalsuche erhält optionale gewichtete Kosten. Bestehende Sammel- und Baustellenlagerwahl bewerten diese Reisezeiten. Routen werden bei Jobbeginn/realer Blockade ausgewählt; keine ständige Neuzuordnung laufender Ladungen.

Zentrale vorläufige Testwerte (technische Wahl, ausdrücklich keine neuen verbindlichen Spielregeln): 4 Kacheln/Abschnitt, 4 Ameisen ohne Abschlag, danach 15 % Zeitaufschlag je zusätzlicher Ameise, mindestens 60 % Geschwindigkeit; Verkehrsaktualisierung alle 0,5 Spiel-Echtzeitsekunden. Alle Werte austauschbar. Keine paarweisen Kollisionen, keine Unsichtbarkeit, kein Stillstand allein durch Verkehr.

- [x] Tests rot: Basisstrecke, Dichte/Engstelle, Gegenverkehr, freie Umleitung, Sperren, periodische Aktualisierung und viele Individuen.
- [x] Gemeinsames Verkehrsmodell und gewichtete Erweiterung der vorhandenen Wegfindung; Anschluss an reale Sammler-/Baumeisterbewegung und Quellen-/Lagerbewertung.
- [x] Integrationsprüfungen: echte Transporte, Ladungen, Bauleistung und Reservierungen; Darstellung aller Individuen erhalten. Eigenprüfung.
- [x] Ein kompletter Testlauf + Weltprüfungen + Build, gezielter Browsercheck, Bericht, Commit/Push. Stopp vor C1.

Keine Forschung, neue Brut-, Ruhebelegungs- oder Kampfsysteme. Laufende Routen wechseln erst bei Bedarf/Jobgrenzen: verhindert Flackern und erhält reale Transportvorgänge. Bei späteren Balancingtests können zusätzliche periodische Routenprüfungen ergänzt werden, sofern notwendig.
