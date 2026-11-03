# Post-C5 – Bauvorlagen, echte Ruheplätze und sichtbare Einrichtung

Stand: 27.10.2026. Nutzerfreigabe: „ja handle nach deiner empfehlung“.
Basis `99b2767` auf `codex/c4-brood-shortage`; bereits vorhandene lokale
C5-Tests und Dokumentation erhalten. Kein Branchwechsel, Commit, Push oder Merge.
Die drei verbindlichen Post-C5-Planungen von GitHub wurden unverändert lokal
unter `planung/` übernommen, damit Spezifikation und Implementierung gemeinsam
prüfbar sind.

## Bedienung und Verhalten

1. **Bauen → Kammerart → Form und Größe:** Klein/Mittel/Groß erzeugen feste
   Quadrate (Lager/Ruhe 4/6/8, Brut 5/7/9 Kacheln Seitenlänge). Vorlage auf der
   Karte positionieren, danach ausdrücklich bestätigen. Frei bietet weiterhin
   Pinsel und Rechteck; Karte verschieben bleibt verfügbar. Vorschau zeigt
   Fläche, Kapazität und Materialbedarf. Gemeinsame Validierung in Vorschau
   und Auftragsannahme prüft Mindestfläche, 128/162 Höchstfläche, Zusammenhang,
   Gelände und Abstand zu bestehenden/geplanten/im Bau befindlichen Kammern.
   Zwei volle Kacheln Zwischenraum sind auch diagonal erforderlich. Bei
   Verstößen roter Entwurf, markierte Konfliktzellen, konkrete Meldung und keine
   Bestätigung. Tunnel dürfen den Zwischenraum durchqueren. Alte Startkammern
   bleiben bestehen. Keine zusätzliche Bauengine oder Vorlagenboni.
2. **Fertige Ruhekammern:** untätige Ameisen reservieren exklusive freie Plätze
   und laufen real dorthin. Zwei Plätze pro Kachel, mindestens 16 Kacheln,
   nur betriebsbereite erreichbare Kammern. Arbeitsengines behalten die Ameisen
   und deren tatsächliche Positionen. Neue passende Arbeit weckt Sammlerinnen,
   Baumeisterinnen und Pflegerinnen ohne Rückteleport. Tod, Gruppenwechsel,
   Raum-/Wegausfall und Arbeitsbeginn geben die Reservierung frei.
   Erwachsene verbrauchen aktiv 100 %, ruhend außerhalb/unterwegs 80 %,
   tatsächlich am Ruheplatz 50 % Nahrung und Wasser. Der bestehende
   Erwachsenenverbrauch bleibt die einzige Verbrauchsbuchung.
3. **Einrichtung:** modulare natürliche Boden-/Randdetails, leere Lagermulden,
   trockene Wasserbecken, Wurzelpolster und dezente Unterscheidung der vier
   Brutspezialisierungen. Sichtbarkeit und Ausbaugrad stammen aus real
   installierten Materialeinheiten je Zelle; keine Renderuhr baut weiter.
   Unregelmäßige Räume nutzen dieselbe Logik. Funktion/Kapazität weiterhin erst
   nach vollständiger Einrichtung. Neue Lager zeigen Nahrung, Wasser und
   Baumaterial ausschließlich nach tatsächlichem Bestand; Brut bleibt durch
   den bestehenden Brutrenderer dargestellt, ruhende Ameisen individuell.

## Technische Änderungen

- `constructionPlanning.ts`, `simulationConfig.ts`: Vorlagen, Maximalflächen,
  Abstandskonflikte; `excavationSystem.ts`: eine Vorschau-/Annahmevalidierung,
  echte `installedByCell`-Snapshots und sicheres Verschieben untätiger Baumeister.
- `ConstructionPanel.ts`, `WorldScene.ts`: native Größenwahl, Maus-/Touchvorschau,
  Fehlermeldungen und Konfliktmarkierung; Integration Ruhekammeradapter/Renderer.
- `restSystem.ts`: Plätze, Reservierungen und reale Bewegung; Integration über
  `workforceSimulation.ts`, `colonySimulation.ts`, `adultSupplySystem.ts` sowie
  abgesicherte Idle-Positionsmethoden in Sammel-/Pflegeengine. Ruheparameter
  zentral in `REST_CONFIG`.
- `chamberFurnishingLayout.ts`, `ChamberFurnishingRenderer.ts`: reine Ableitung
  aus tatsächlichen Zuständen, vorhandene Phaser-Grafikmittel, keine Assets
  oder Abhängigkeiten ergänzt.
- Neue Prüfungen in `chamber-placement`, `rest-system`, `rest-integration` und
  `chamber-furnishing-layout`; Browserharness um `--post-c5-only` erweitert.

## Prüfung

- `npm test`: **248/248 erfolgreich**, einschließlich C5-Wachstumsläufen;
  letzter Lauf ca. 76 Sekunden (`/tmp/anthive-post-c5-suite.log`).
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bekannte Warnung zur Bundlegröße bleibt.
- `--post-c5-only`: erfolgreich mit nativen Vorlagen, Abstandsfehler, Desktop/
  Touch, echtem Teilbau, Baupause, Fertigstellung, real belegten Ruheplätzen und
  tatsächlichen Lagerinhalten. Desktop- und mobile Screenshots visuell geprüft.
- `--construction-only`: erfolgreich; bestehende Desktop-/Touch-Zeichnung,
  Bestätigung, Baustellendetails, Abbruch und Gestenregressionen bleiben grün.
- `git diff --check`: sauber.

Browserlogs `/tmp/anthive-post-c5-browser.log` und
`/tmp/anthive-post-c5-construction.log`; Screenshots unter
`node_modules/.cache/anthive-post-c5-*.png`.

**Alle drei freigegebenen Post-C5-Pakete abgeschlossen.**
Die Tests wurden für die neuen Funktionen zuerst rot ausgeführt. Dabei wurde
auch ein verzögertes Aufwachen bei Rest-Retryzeiten reproduziert und korrigiert:
Idle-Positionssynchronisierung gibt neue passende Arbeit sofort wieder frei.

Unabhängige Codeprüfung der drei Pakete: keine kritischen/wichtigen Befunde.
Anschließend zusätzliche Prüfung tatsächlicher Lagerinhalte statt optisch
gefüllter Einrichtung ergänzt. Keine zurückgestellten Reviewbefunde.

## Grenzen und nächster Schritt

Die Grundausstattung verwendet vorläufige natürliche Formen, keine neuen
Pixelart-Assets. Alte Startkammern behalten ihre bisherige Darstellung;
neue Funktionskammern nutzen die modulare Einrichtung. Keine neue
500-Ameisen-FPS-Abnahme. Bestehende C5-Modellläufe sowie bisherige Bauprüfungen
bleiben Teil der Verifikation.

Nächster Schritt ist **D1.0**: Dateninventar und Speichervertrag planen.
Zusätzlich zu den bisher bekannten Zuständen dabei Ruheplatzreservierungen,
Belegung, reale Weg-/Arbeitspositionen und installierte Einheiten je Kammerzelle
berücksichtigen. Kein D1-Spielcode in diesem Paket.
