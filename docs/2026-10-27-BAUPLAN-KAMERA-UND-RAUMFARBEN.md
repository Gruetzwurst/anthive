# Bauplan-Kamera und Raumfarben – 27.10.2026

Nutzerauftrag: beim Zeichnen langer Gänge automatisch weiter verschieben;
alle nutzbaren Räume mit glatten, thematisch klar vom Erdreich unterscheidbaren
Innenwänden gestalten. Diese neue Farbrichtung ersetzt den früheren Wunsch
nach nur dezenten erdfarbenen Funktionsunterschieden.

## Bedienung

Beim Zeichnen mit gedrückter Maus bzw. gehaltenem Finger nahe dem Kartenrand
bleiben: Kamera scrollt weiter, auch ohne weitere Zeigerbewegung. Pinselstriche
bleiben kantenverbunden; Rechtecke behalten ihren ursprünglichen Weltanker.
Geschwindigkeit berücksichtigt Zoom und tatsächliche UI-Zeit (unabhängig von
der Simulationsuhr). Im HUD, bei offenen Dialogen und nach Loslassen kein
Weiterrollen. Kameragrenzen gelten weiterhin. Die vorhandene freie Verschieben-
Option bleibt verfügbar; keine automatischen Bauaufträge vor Bestätigung.

## Raumgestaltung

Gemeinsame modulare Gestaltung für vorhandene Startkammern und neue Räume,
auch unregelmäßige Formen: glatte durchgehende Innenflächen, heller Rand nur an
der tatsächlichen Außenkontur. Vorhandene Gangeinmündungen bleiben optisch offen.
Keine Linien an inneren Kachelgrenzen; Einrichtung wächst weiterhin mit real
installiertem Material. Die acht Startkammern sind bereits eingerichtete Räume
und verwenden ihre vorhandenen geschützten Kachelflächen, keine neue Kapazität.

- Ruhe: wollweiße Einfassung, kühles graublaues Inneres.
- Wasser: eisblaue Einfassung, petrolblaues Inneres.
- Nahrung: pollengelber Rand, olivgrünes Inneres.
- Baumaterial: schiefer-/stahlblaue Farbfamilie.
- Königin: Lavendel/Violett.
- Brut Sammeln: Mint/Grün; Bauen: Immergrünblau; Pflegen: Rosa; Kämpfen: Beere.

Helle Schrift bleibt lesbar. Vorräte und Tiere stammen weiterhin ausschließlich
aus tatsächlichen Zuständen; Farb-/Materialthemen führen keine Wolle, Kosten,
Boni oder neuen Ressourcen ein. Tunnel behalten die bisherige Erddarstellung.

## Prüfung

Neue Kamera-/Startkammerprüfungen zunächst rot, danach grün. 23 fokussierte
Kamera-, Einrichtungs- und Bautests sowie Build erfolgreich. Browserprüfung erfolgreich: gehaltene Maus-Pinselzeichnung und Touch-Rechteck
scrollen über den ursprünglichen Bildschirmrand hinaus (37 bzw. 35 Kacheln,
jeweils eine durchgehende Reihe). Zusätzlich bisherige Vorlagen-, Abstands-,
Touch-, Baufortschritts-, Ruheplatz- und Lagerbestandsprüfung grün. Startnest
und neue Ruhekammer visuell geprüft. Logs `/tmp/anthive-planning-colors-*.log`,
Screenshots `node_modules/.cache/anthive-{long-*,colored-start-rooms,post-c5-*}.png`. Kein Commit/Push.
