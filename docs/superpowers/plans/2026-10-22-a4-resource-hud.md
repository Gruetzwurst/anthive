# A4 – Ressourcen-HUD und Prioritätsbedienung

Basis: A3 `98951a7`, sauber und mit GitHub synchron; Freigabe „weiter“. Branch `codex/a4-resource-hud`. Bestehenden Ressourcenfluss und Phaser-Oberfläche begrenzt erweitern; keine neuen Wirtschaftsregeln. Nutzerauftrag erlaubt Umsetzung innerhalb der festgelegten A4-Planung ohne erneute Freigabe derselben Aufgabe.

## Entwurf und Umfang

Kompaktes festes Panel oben in der vorhandenen 640×360-Spielansicht: getrennte nutzbare Nahrungs-/Wasservorräte mit Kapazität; tatsächlich angelieferter bisheriger Baustoffzähler; Spieltag, Arbeiterinnenzahl, Arbeitstempo und Verluste. Quellenlage (Bestand/Regeneration/Ruhe bzw. unbegrenzter Teich, fehlende Verbindung), getrennte Mangel-/Erholungswarnungen. Drei direkt bedienbare Schaltflächen Nahrung/Ausgeglichen/Wasser ändern die bestehende A2-Gruppenpriorität ohne laufende Ladungen abzubrechen. Grabstatus und bestehender Grabkraft-Testschalter unten, damit nichts überlappt. Karte bleibt verschiebbar. Keine neuen Grafikassets oder neuen Produktabhängigkeiten.

Anzeige liest die bestehenden Modelle; keine zweite Uhr, Inventar oder simulierte Gratislieferung. Baumaterial bleibt bis B2 beim bestehenden tatsächlich angelieferten Zähler, ohne erfundene Lagerkapazität. Quellenwege nicht pro Frame berechnen; vorhandenen Wegfinder nutzen und nach Geländeänderungen neu prüfen. HUD-Flächen dürfen keine Karten-/Grabeingaben auslösen.

## Schritte und Prüfungen

- [x] Read-Modell: Test zuerst für nutzbare getrennte Bestände, echte Quellenzustände, Priorität und getrennte Warn-/Erholungsstufen; Anzeigen dürfen Simulation nicht verändern.
- [x] Phaser-Panel und Szene anbinden; echte Pointer-Bedienung aller Prioritäten prüfen, aktive Auswahl und Weiterlaufen realer Transporte kontrollieren; keine Kartenbewegung/Grabaufträge durch HUD-Eingabe.
- [x] Mehrtagestests des bestehenden Kreislaufs mit tatsächlicher Tageslänge und allen drei Prioritäten; Quellerschöpfung/Erholung, Lagergrenzen, Bedarf und frühe Verlustfreiheit prüfen. Keine eigenmächtigen Balanceänderungen.
- [ ] Vollständige Tests, Welttests, Build, Browserprüfung bei normaler und kleiner Querformatgröße, Graben und Teich weiter prüfen; frisches unabhängiges Review. Ergebnisbericht, Commit/Push auf Featurebranch. Stopp vor B1.

## Review Focus

Falsche Lagergutschrift durch unterwegs befindliche Ladung; vermischte Baustoffbilanz; falsche Quellenverfügbarkeit bei Ruhe/fehlendem Weg; falscher Tag oder Mangelstatus; Prioritätsklick verändert tatsächlich bestehende Sammlergruppe und keine andere Spielregel; Bedienflächen lösen keine Kamera-/Grabaktionen aus; Textüberlappung in 640×360 und mobilem Querformat; keine wiederholten Warn-Toasts oder Wegsuchen pro Frame; keine B-/C-Systeme und keine Balanceänderungen.

## Protokoll

- Lokal sauber, A3 vollständig gesichert. Fetch ohne neue Remoteänderungen. Bestehende geplante A4-Anforderungen und aktueller Quellcode geprüft.

- Read-Modell-Test zunächst rot (Modul fehlte), danach 4/4 grün. Browserprüfung zunächst rot mit „A4 HUD missing“, nach Anbindung grün.
- Vollständige Tests 80/80, Welttests 10/10, Build erfolgreich (bestehende Chunkgrößenwarnung). Browserprüfung mit eigener Vite-/Firefox-Instanz prüft echte Maus-/Touch-Pointer, Auswahl, Eingabetrennung, Textgrenzen, reale Transporte, Graben und Warnungen. Bildschirmaufnahmen normal/klein/Teich geprüft. Keine neuen Abhängigkeiten.
- Testpräzisierung: Der erste Mehrtagestest verlangte ständig positive Vorräte und zwingende Quellenerschöpfung im normalen Verlauf. Das sind keine beschlossenen Regeln: Nahrungsbevorzugung darf vorübergehend Wasserwarnungen auslösen; bei laufender Regeneration muss eine Quelle nicht exakt leer werden. Korrigierte Abnahme verlangt Nichtnegativität/Kapazitätsgrenzen, tatsächliche Anfangs- und Wiederbelieferung, alle acht Tage volle Arbeitsleistung und keine Verluste. Quellenerschöpfung wird separat tatsächlich herbeigeführt und Wiederaufnahme geprüft, ohne Produktionswerte zu ändern.
- Balancingbefund: Mit vorhandenen 7 Sammlerinnen + 2 ruhenden Baumeisterinnen + Königin und dauerhaftem Vorrang Nahrung fällt Wasser an Tag 5 auf 0; sammelt sich nach knapp 1,9 Mangeltagen wieder, volle Erholung bis Tag 8. Kein dauerhafter Ausschluss, keine Leistungseinbuße oder Verluste. Bestehende Heuristik bleibt unverändert, Befund im Bericht ausweisen.
- Browserharness: Laden zunächst irrtümlich an mehr als einem DOM-Canvas erkannt; Phaser verwendet genau einen sichtbaren Canvas. Ladebedingung korrigiert; keine Änderung am Spiel erforderlich.
