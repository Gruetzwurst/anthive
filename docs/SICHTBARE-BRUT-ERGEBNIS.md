# Sichtbare Königin, Brut und Eiertransporte

Stand: 26.10.2026. Nutzerauftrag als Zwischenschritt vor C4. Basis C3 `201b0c4`, sauber und mit GitHub identisch geprüft. Branch `codex/visible-queen-and-brood`.

## Ergebnis

- Sichtbare größere Königin im vorhandenen Phaser-Ameisenstil, leichte Bewegung und tatsächlicher Eiablageimpuls. Anzeige der verbleibenden Zeit zum nächsten Ei beziehungsweise Eiablagepause. Keine erfundenen Start-Eier, keine Zeitbeschleunigung.
- Individuelle Eier bei der Königin sowie unterschiedliche Formen für Eier, Larven und Puppen in den tatsächlichen Kammerkacheln. Nahrung-/Wasservorräte direkt an den Brutkammern; dezenter Impuls bei tatsächlichem Larvenverbrauch.
- **Ausdrücklich bestätigte neue Regel:** Die Automatik reserviert weiterhin einen passenden Brutplatz nach Spielerquoten. Eine explizit für Pflege eingeteilte Ameise holt das Ei am tatsächlichen Ort ab und trägt es zur Kammer. **Erst nach Ablieferung beginnt Entwicklung.** Ohne Pflegekräfte bleiben Eier sichtbar bei der Königin.
- Eine weiße Eierladung zeigt den tatsächlichen Träger. Ein Ei pro Fahrt als technische Anfangsumsetzung; vorhandene Wege, Verkehr und Effizienz bleiben erhalten. Offene ausführbare Larvenlieferungen haben Vorrang vor neuen Eierfahrten.
- Reservierte und getragene Eier bleiben bis zur Ankunft im begrenzten Puffer gezählt und reservieren ihren Kammerplatz. Keine Doppelvergabe/Überfüllung. Bei Tod der Trägerin bleibt dasselbe Ei am realen Ort liegen und kann erneut abgeholt werden. Gruppenwechsel beenden geladene Eier sicher; blockierte Wege halten Ei und Reservierung fest.

## Dateien

- `src/game/world/BroodRenderer.ts`: Königin, Brutstadien, Zeit-/Vorratsanzeige und tatsächliche Versorgungsimpulse. `broodVisualLayout.ts`: deterministische Positionen auf vorhandenen Kammerkacheln.
- `scenes/WorldScene.ts`: Darstellung anschließen, weiße Eierladung und vorhandene Futterladungen; statische Brutdaten maximal etwa zehnmal pro Sekunde aktualisieren, Ameisenbewegung bleibt einzeln und flüssig.
- `simulation/queenSystem.ts`: Reservierung, Abholung, Ankunft, Eigentümer-/Doppelvergabeschutz; kein Fortschritt unterwegs; unverlorene Eier bei Verlust der Trägerin.
- `simulation/broodSupplySystem.ts`: Eierfahrten mit derselben echten Pflege-Engine. `workforceSimulation.ts`: im Spiel standardmäßig aktiv, individuelle Eierladung bereitstellen.
- `ui/WorkforcePanel.ts`: bestätigten Ablauf erläutern; noch nicht angelieferte Eier nicht als vorhandene Brut anzeigen.
- `tests/egg-transport.test.mjs`, `tests/brood-visual-layout.test.mjs`: sechs neue Prüfungen. Numerische C1–C3-Integrationsfixtures schalten echte Eierfahrten ausdrücklich aus, um ihre getrennten Entwicklungs-/Versorgungsfälle weiter gezielt zu prüfen. Das vollständige Spiel und der neue Integrationstest verwenden echte Transporte.
- `scripts/check-economy-browser.py`: `--visible-brood-only`; ältere präzise Kohortenfixtures explizit auf den neuen Ablauf angepasst.

## Prüfung

- Neue Transporttests zuerst rot, nach Umsetzung grün. Abgesichert: kein Fortschritt vor Ankunft, genau ein Eigentümer, sichere Ablieferung vor Gruppenwechsel, echte Pflegewege, abgelegtes Ei mit gleicher ID erneut abholen, reale Kammerkacheln/50 unterscheidbare Pufferpositionen.
- Ein vollständiger `npm test`-Lauf: **213/213 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**. `npm run build`: erfolgreich; bekannte Chunk-Warnung über 500 kB bleibt. Diffcheck sauber.
- Firefox: zunächst Königin ohne erfundene Eier; tatsächliche Eiablage und sichtbares wartendes Ei. Native Pflegezuweisung, tatsächliche Abholung durch `collector-0`, weißes Ei am Träger und kein zweites Ei am Ausgangsort; nach tatsächlicher Ankunft beginnt Fortschritt. Anschließend sichtbare Larve mit tatsächlich gelieferter Nahrung/Wasser und sichtbare Puppe. Teich weiterhin korrekt. Screenshots visuell geprüft.
- Screenshots `node_modules/.cache/anthive-visible-*.png`, Logs `/tmp/anthive-visible-*.log`. Im automatisierten Test werden bestehende Update-Schritte zum Prüfen der langen Stadienzeiten ausgeführt; die Spielgeschwindigkeit selbst ist unverändert.
- Eigenprüfung ohne zusätzliche Agenten. Vorhandene Codegrafik erweitert; keine Bildgenerierung oder externe Designprojekte nötig.

## Ausprobieren und Grenzen

Lokales Spiel neu laden, damit die neue Königin und die neuen Regeln aktiv sind. Mindestens eine Ameise unter **Gruppen** für Pflege einteilen. Beim normalen Tempo kommt das erste Ei nach ungefähr zwei Echtzeitminuten bei guter Versorgung; die Anzeige zeigt die verbleibende Zeit. Karte zum Verfolgen der Pflegekraft und zu den tiefer gelegenen Brutkammern ziehen.

Brutpositionen innerhalb einer Kammer sind eine geordnete Darstellung, keine neue Einzelplatz-Steuerung. Pflege außerhalb der tatsächlichen Fütterungs-/Eierwege bleibt das bestehende gemeinsame Kapazitätsmodell. Noch kein Savegame und keine C4-Mangelfolgen.

**Nächster geplanter Schritt bleibt C4. Erst nach Freigabe.**
