# B2 – Materialbilanz und Grablogik

Stand: 22.10.2026. Freigabe „frei“ nach B1. Basis `33fbed1`, vor Beginn lokal sauber und mit GitHub synchron. Eigener Branch `codex/b2-material-excavation`. **Stopp vor B3.** Lokale Teichgestaltung und vorherige Entwicklung bleiben erhalten.

## Umgesetzt

- Aushub erzeugt Material genau einmal bei tatsächlicher Entfernung der Kachel. Zentrale veränderbare Testwerte in `EXCAVATION_CONFIG`: lockere Erde 6 s / 1 Material, kompakte Erde 12 / 2, Lehm 18 / 3, Stein 30 / 4, Tiefengestein **36 / 5**. Letzteres wie vorab zurückgespiegelt aus Nutzerantwort „höchster + geringster Wert“ je Spalte: 30+6 und 4+1. Vorhandene Grabkraft-Freischaltungen bleiben getrennt.
- Traglast 5; mit 4 weitergraben, wenn ausführbare Grabarbeit besteht. Volle Ladungen abliefern, Teilladungen bei Auftragsende, Blockierung oder angefordertem Gruppenwechsel abwickeln. Kein Materialzuwachs ohne reale Aufnahme und tatsächliche Einlagerung.
- Ein gemeinsamer Bestand in den bestehenden einzelnen A1-Materiallagern; alter separater Szenenzähler entfernt. HUD zeigt echten Bestand und Kapazität, Startlager weiterhin leer mit 384 Kapazität. Lagergrafik erscheint erst bei tatsächlichem Bestand.
- Volle oder unerreichbare Lager stoppen das Graben nicht. Überschuss verbleibt als sichtbarer Mengenhaufen am tatsächlichen Grabungsort und blockiert offene Wege nicht. Alter Abraum wird erst nach ausführbaren Grabaufträgen eingesammelt. Gesperrte/unerreichbare Aufträge verhindern Aufräumen nicht.
- Teilannahme und ein zwischenzeitlich volles Ziellager bewahren die Restladung; anderes erreichbares Materiallager kann gewählt werden. Mehrere Baumeisterinnen duplizieren weder Kachelertrag noch Haufeninhalt.
- Bilanz: **Anfang + tatsächlicher Ertrag = Boden + getragen + Lager + verbraucht**. Eine Verbrauchs-API bildet Entnahmen ab; Einrichtung und Baukosten sind noch nicht aktiviert.
- Tod entfernt den tatsächlichen Bauakteur und lässt dessen Material am tatsächlichen Ort zurück. Gruppenwechsel während Graben/Laden/Transport beendet die laufende Aktion mit sicherer Lieferung. Blockierte Restladung bleibt erhalten und der Wechsel ausstehend; ruhend bedeutet deshalb nicht automatisch bereit zum Rollenwechsel.
- Bestehender Zeittakt, A3-Mangelfaktor und B1-Fremdleistung (50 %) wirken auf Bewegung, Graben und Materialtransport. Bestehende Gruppen-, Prioritäts-, Karten- und Teichdarstellung bleiben angebunden.

## Betroffene Dateien

| Datei | Änderung |
| --- | --- |
| `src/game/simulation/buildingMaterialSystem.ts` | Bodenhaufen, getragene Mengen, echte A1-Einlagerung, Entnahmebilanz und Trägerverlust |
| `src/game/simulation/excavationSystem.ts` | Testbare bestehende Grab-/Transportabläufe, Zeiten/Erträge, Reservierungen, echte kardinale Laufwege und Abraumpriorität |
| `src/game/simulation/simulationConfig.ts` | Zentrale B2-Testwerte |
| `src/game/simulation/workforceSimulation.ts` | Ressourcenabhängiger Baumeisteradapter, sichere Unterscheidung Ruhe/Wechselbereitschaft |
| `src/game/scenes/WorldScene.ts` | Alte doppelte Material-/Grablogik ersetzt; tatsächliche Akteure, Ladungen, Haufen und Lager darstellen |
| `src/game/ui/economyOverview.ts`, `EconomyHud.ts` | Echter A1-Materialbestand samt Kapazität |
| `tests/building-material.test.mjs`, `excavation-system.test.mjs`, `excavation-workforce.test.mjs`, `economy-overview.test.mjs` | Bilanz, Zeiten, Transport, Randfälle und tatsächliche Baumeister-Gruppenwechsel |
| `scripts/check-economy-browser.py` | Bestehende A4/B1-Prüfung auf neues Modell angepasst, Voll-Lager-/Aufräumprüfung ergänzt |
| `README.md`, B2-Plan, dieser Bericht | Verhalten, Prüfungen und Stopppunkt |

## Prüfungen

- `npm test`: **117/117 einzelne Tests erfolgreich**.
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bestehende Warnung für JavaScript-Chunk über 500 kB bleibt.
- `git diff --check`: ohne Fehler.
- Material- und Grabmodell mit erst fehlgeschlagenen Tests umgesetzt. Ressourcenabhängiger Baumeisteradapter und echte Übergänge ebenfalls rot → grün. Zusätzliche Regressionen: Lager füllt sich während Anfahrt, alternatives Lager, kombinierte Mangel-/Fremdleistung sowie große/gerahmte Zeitschritte.
- Unabhängige Gesamt-Codeprüfung `33fbed1..83270b1`: kein kritischer/kleiner Befund, ein wichtiger Befund. Beim Herabsetzen der Test-Grabkraft blieb ein nun gesperrter aktiver Auftrag am Arbeiter hängen. Korrektur gibt aktive Reservierung/Job frei und erhält den wartenden Auftrag. Regression rot → grün: andere ausführbare Grabung, danach alter Abraum, Wiederaufnahme nach Freischaltung und Wechselbereitschaft ohne Ladung. Anschließend 117/117 Gesamttests und Build erneut erfolgreich. Keine ausgesparten Designentscheidungen und keine aufgeschobenen kleinen Befunde.
- Firefox bestätigt reale Lieferung, neun sichtbare IDs und 50-ms-Fortschritt pro 100 ms Fremdarbeit. Voll-Lager-Bilanz: 5 produziert, 2 gelagert, 3 am Boden; nach realer Entnahme von 2 und Aufräumen: 3 gelagert, 2 verbraucht, 0 am Boden/getragen. Vollständiger abschließender Firefox-Prüflauf nach beiden Korrekturen erfolgreich: Prioritäten, echte Gruppenformulare, sichere Übergänge, 50-%-Graben, volle Lager, Aufräumen, Massenerhaltung, Ruhe, Warnungen, kleiner Querformat-Dialog und Teich. Echte Touchverarbeitung explizit bestätigt; aktuelle Screenshots visuell geprüft.
- Touch-Harness korrigiert: Der Desktop-Firefox hatte keine von Phaser erkannte Touch-Hardware; künstliche DOM-Touchereignisse wurden teils nur über zufällige Kompatibilitäts-Mausereignisse wirksam. Das isolierte Testprofil meldet jetzt vor Spielstart einen Touchpunkt. Gezielt geprüft: Phaser erkennt Touch und verarbeitet Prioritätswahl sowie Gruppenöffnung direkt. Der Schlusslauf prüft zusätzlich explizit Geräteerkennung und `activePointer.wasTouch`. Keine Spielregel oder Produktkonfiguration dafür verändert. Testpräferenz gegen [Mozillas Voreinstellungsquelle](https://github.com/mozilla/gecko-dev/blob/master/modules/libpref/init/StaticPrefList.yaml) abgeglichen.
- Der erste neue Browser-Voll-Lager-Test zielte auf bereits offene Kammerkacheln. Tatsächliche Weltkoordinaten geprüft und Test auf feste Erde korrigiert; dafür keine Spielregel und kein Produktcode verändert.

## Grenzen und nächster Schritt

- Keine neuen Bauwerkzeuge, Auftragsdetail-/Pausenoberfläche, Einrichtungen oder Raumkosten vorgezogen. Die vorhandenen linearen Grabaufträge bleiben bestehen.
- Leere Startlager sind für B2 spielbar, weil tatsächlicher Aushub sie befüllt. Vor späterer kostenpflichtiger Einrichtung bleibt der in der Planung genannte Material-Bootstrap ausdrücklich zu entscheiden.
- Die neue Abraumabholung betrifft Baumaterial. Bereits erhaltene fallengelassene Nahrung/Wasser gehören weiterhin zum separaten Sammelmodell und werden noch nicht automatisch eingesammelt.
- Kein neues Savegame: Neuladen startet wie bisher eine neue Vorschau. Firefox mit kleinem Querformat ersetzt keinen Test auf einem physischen Handy.

**Nächster Schritt: B3 – Bauwarteschlange und Werkzeuge. Erst nach ausdrücklicher Freigabe.**
