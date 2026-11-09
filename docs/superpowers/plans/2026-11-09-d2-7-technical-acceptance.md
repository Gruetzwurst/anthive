# D2.7 – technische Gesamtabnahme

> Ausführung: Superpowers executing-plans, inline und sparsam. Ein frischer unabhängiger Review am Ende.

**Goal:** Aktuellen D2-Stand einschließlich physischer Königinnenversorgung technisch abnehmen.
**Architecture:** Vorhandene Modelle, Persistenz und Firefox-Prüfungen verwenden; nur reproduzierte Fehler beheben.
**Spec:** planung/2026-10-28-D2-kolonieentwicklung-berufsverbesserungen-und-mehrere-koeniginnen.md, neuere Nutzerfreigaben vom04.11.2026 und09.11.2026.
**Tech Stack:** TypeScript/Phaser, Node-Tests, Firefox/Marionette.

## Verbindlich
Normale Brut6 Minuten, Königinnenbrut12 Minuten/2 Pflegeplätze. Freischaltungen
50/150/500/1000 ergeben2/3/4/5 Königinnen. Erwachsene benötigen5 Nahrung und5
Wasser je Spieltag, tatsächlich von Pflegerinnen geliefert. Keine neuen
Balanceentscheidungen und keine langen Balancetests für den festgelegten Bedarf.
Spielstände unverändert erhalten. Kein Merge nach main und keine Veröffentlichung
neuer Änderungen ohne Auftrag; bestehender Featurebranch wird in-place fortgeführt.

## Review Focus
- Fünf Königinnen: getrennte Vorräte/Eierpuffer/Quellen, keine doppelten Ressourcen oder Erwachsenen.
- Tatsächliche Lieferungen und Unterversorgung bei mehreren Königinnen; kein Schlupfverlust beim Laden.
- Schema1–9 und Originalschutz, aktive Transportaufträge, reproduzierbares Fortsetzen.
- Kurze realistische Lastmessungen bei150/500/1000 Erwachsenen; Initialkosten von laufender Simulation trennen.
- Handy-Querformat, native Menüs und Touch; keine Behauptung echter iPhone-Prüfung ohne Gerät.

### Task 1: Bestandsprüfung und Regressionen
- [x] Git-Stand sauber bei b4d66b6, vorhandene Abnahmen/Plan abgleichen.
- [x] Vollständige bestehende Tests ausführen; jeden Fehler einordnen, nur gezielt nachprüfen und beheben.
- [x] Produktionsbuild für /anthive/ prüfen.

### Task 2: Integration und Last
- [x] Reale fertig eingerichtete Königinnenkammern und physische Pflegerinnenlogistik für bis zu5 Königinnen prüfen.
- [x] Aktiven Transport, Versorgung, eigenen Eiursprung und identisches Fortsetzen nach Reload prüfen.
- [x] Kurze Messungen150/500/1000: echte Sammlerinnen/Pflegerinnen/Baumeisterinnen, Zeit- und Speicherwerte dokumentieren.
- [x] Keine Simulation eines langfristigen Wachstumsgleichgewichts und keine Balanceänderung ableiten.

### Task 3: Browser und Abschluss
- [x] Gezielter Firefox-Ablauf für Königinnen/Versorgung/Reload; native Touch-/Handyprüfung.
- [x] Finaler unabhängiger Review; wichtige Befunde in einem gezielten Rot→Grün-Pass beheben.
- [x] Erforderliche Schlussprüfungen, Ergebnisbericht und aktueller Fortsetzungsstand; Grenzen ausdrücklich nennen.

## Ausführungsprotokoll
09.11.2026: Bestand sauber, npm test als Baseline gestartet (Log /tmp/anthive-d27-baseline.log).
Browser und Lastmessungen werden nicht parallel zum Gesamttest ausgeführt,
damit kleine VM und Messwerte nicht unnötig belastet werden.

Baseline:361 Tests,358 grün/3 rot (285s). Ursache real: Refill-Latch blieb bei
laufender Metabolik aktiv; Mikrolieferungen verdrängten Eiertransport. Dedizierte
Regressionsprüfung zuerst rot, nach Korrektur grün; Nachfüllung endet nach
abgeschlossener Lieferung oberhalb Nachfüllschwelle. Verbrauch/Kapazitäten/
Schema unverändert. Zwei Baselinefehler dadurch behoben; ein alter120-Sekunden-
Puffertest benötigte reale Erstversorgung vor Beginn seiner Eiablage-Zeitmessung.

Task1/2 gezielt:22/22 grün inkl. fünf tatsächlich eingerichteter Kammern,
physischer Transporte, Ressourcenerhaltung und identischer Fortsetzung nach
Reload. Fixture-Ruling: vorgeöffneter Testkorridor muss unter dem Teich verlaufen;
flache künstliche Öffnung war wegen Wassermaske nicht begehbar. Navigation prüft
Fixture explizit, keine Änderung am Spielgelände/der Bauvalidierung.

Lastprobe: je2 simulierte Sekunden bei150/500/1000 Erwachsenen,3/4/5 Königinnen,
60/200/200 Sammlerinnen, je20 Pflegerinnen/Baumeisterinnen. Median pro50ms-Schritt:
1,48/2,40/3,02ms; P95:2,25/3,95/4,11ms. Initialisierung96–124ms, erster Schritt
38–53ms. JSON1,71–1,89MB, Capture+Validierung+Serialisierung79–191ms, Parsen+
Wiederherstellung150–170ms. Identische Fortsetzung in allen Fällen. Node-Modell,
kein Render-/iPhone-FPS-Versprechen, kein Wachstumsgleichgewicht gemessen.

Unabhängiger Review d2_7_review: keine wichtigen Produktionsbefunde. Ein
Nachweislabel „saveReload“ war nur Readback; Browserprüfung um echte Refresh-
und Fortsetzen-Aktion derselben Kolonie ergänzt. Touchgruppen/Baudialog/Zoom/
Speicherreadback/echter Szenenreload erfolgreich.

Zusatzregression: generisches Beenden der Nachfüllung änderte normale Larven-
Zielpuffer (2 vorhandene Tests rot). Korrektur auf abgeschlossene Lieferungen
an erwachsene Königinnen beschränkt;21/21 Versorgungstests grün. Normale Larven
füllen unverändert bis zum Ziel auf, Bedarf/Kapazitäten unverändert.

Browser-Stresstest1000 Arbeiterinnen (zusätzlich1 Königin,200-Sammlerinnen-
Größenordnung,20 Pflege-/Bauzuordnungen):978 Nicht-Bau-Körper,157458 wiederholte
Vektorbefehle pro Bild; Median159ms bei100%,149ms bei200% (anderer Vorlauf
309/259ms: Headless-VM-Streuung). Regression bewusst rot bei >1000
statischen Ameisenbefehlen, ohne ausgeblendete/entfernte Arbeiterinnen.
Ameisenkörper aus unveränderter Geometrie jetzt einmalig als24×16-Texturen
mit NEAREST-Filter; Transportlasten/Bewegung weiter individuell. Set statt
quadratischer .some-Suche beim Anlegen. Grün:978 Körper weiterhin vorhanden,
0 wiederholte Körper-Vektorbefehle,34ms/26ms Render-Median bei100%/200%.
Kein Echtgerät-FPS-Versprechen. Unabhängiger Nachreview ohne wichtige Befunde.

Browser1→9 und8→9 inklusive Originalschutz/Kopierabbruch erfolgreich. Eine
Schema8-Testvorlage entfernte irrtümlich das bereits vorhandene Royal-Pflichtfeld;
Generator korrigiert, keine Produktionsänderung nötig. Schlusslauf363 erwartete
Tests läuft nach allen Produktionskorrekturen, Browserprüfung danach nicht parallel.

Abschluss:363/363 Gesamttests grün (319,6s), Build/Browser/Review erfolgreich. Kein Push/Deployment/Merge. Bericht: docs/D2.7-TECHNISCHE-GESAMTABNAHME-ERGEBNIS.md.
