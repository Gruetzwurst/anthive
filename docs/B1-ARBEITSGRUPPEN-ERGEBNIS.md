# B1 – Arbeitsgruppen und Zuständigkeiten

Stand: 22.10.2026. Freigabe „frei“ nach A4; Nutzer-Testentscheidung: **50 % Leistung bei fachfremder Arbeit**. Basis A4 `7d68cd5`, lokal sauber und auf GitHub gesichert. Eigener Branch `codex/b1-workforce-groups`. **B2 nicht begonnen.**

## Umgesetzt

- Vier unveränderliche Spezialisierungen: Sammlerinnen, Baumeisterinnen, Brutpflegerinnen, Kämpferinnen. Aktueller Arbeitseinsatz getrennt: Sammeln, Bauen, Pflegen, Kämpfen oder ausdrückliche Ruhe.
- Die tatsächlichen sieben Sammel- und zwei Bauspezialistinnen behalten ihre IDs und Spezialisierung über Rollenwechsel hinweg. Keine zusätzlichen Ameisen, neue Geburten oder Königinnenarbeit.
- Gruppenbedienung über **Gruppen** im Ressourcen-HUD: Spezialisierung, bisheriger Einsatz, neuer Einsatz und Anzahl wählen, dann **Zuweisen**. Keine individuelle Ameisensteuerung. Tabelle zeigt gewünschte Gruppenverteilung; Zusammenfassung tatsächliche Ruhe und ausstehende Wechsel.
- Fachfremder Einsatz ausschließlich nach ausdrücklicher Mengen-Zuweisung durch den Spieler. Eigene Arbeit 100 %, fremde Arbeit testweise 50 %; zentral `WORKFORCE_CONFIG.foreignWorkEfficiency`. Der bestehende Erwachsenen-Mangelfaktor wirkt zusätzlich auf die Arbeitsgeschwindigkeit. Keine Änderung an Quellen, Traglasten, Verbrauch, Regeneration oder Verlustquote.
- Blockierte Sammlerinnen übernehmen weiter nur passende erreichbare Sammel-/Transportaufgaben. Ohne geeignete Aufgabe ruhen sie mit dem bestehenden A3-Verbrauchsrabatt und setzen passende Arbeit später selbstständig fort. Gruppenzuweisung und Spezialisierung bleiben dabei erhalten.
- Ausdrücklich nach Pflege/Kampf zugewiesene Arbeiterinnen ruhen, solange solche Aufgaben noch nicht existieren. Keine vorgezogenen Pflege-/Kampfmechaniken. Allgemeines Ruhen benötigt keine Kammer; Ruhekammerbau bleibt später.
- Reale Übergänge: Sammlerinnen erhalten nach Umteilung keine neue Sammelladung, liefern vorhandenes Transportgut ab und laufen über bestehende Wege ins Nest zurück. Erst dort wechseln sie zum anderen Einsatz. Baumeisterinnen beenden aktuellen Aushub und dessen Abtransport, beginnen dann keine neue Grabung und wechseln an derselben tatsächlichen Position.
- Blockierte Lieferung/Rückkehr bleibt mit Ladung und Position erhalten und als ausstehender Wechsel sichtbar. Kein Teleportieren, Löschen oder vorzeitiges Lagergutschreiben.
- Arbeiterinnen werden in ihrer tatsächlichen Darstellung weitergeführt; bei Tod verschwinden sowohl Laufzeitakteur als auch Gruppenmitglied. Königin separat, Erwachsene nie doppelt zählen.
- Ein A1–A3-Zeittakt für beide Arbeitsmodelle und Verbrauch. Übergänge finden am Ende des Intervalls statt, sodass eine zurückkehrende Sammlerin nicht im selben Intervall nochmals volle Baumeisterarbeit erhält.
- Nativer scrollbarer Gruppen-Dialog mit Tastatur-/Formularbedienung. Karte erhält keine Grab-/Kameraeingaben aus dem Dialog. Die Simulation läuft während der geöffneten Gruppenverwaltung weiter.

## Betroffene Dateien

| Datei | Änderung |
| --- | --- |
| `src/game/simulation/workforceSystem.ts` | Permanente Spezialisierung, explizite Gruppenmengen, geprüfte atomare Änderungen, Effizienz |
| `src/game/simulation/workforceSimulation.ts` | Sicherer Wechsel zwischen vorhandener Sammel-/Bauarbeit und Ruhe, gleiche Uhr/Versorgung, Tod und Momentaufnahmen |
| `src/game/simulation/gatheringSystem.ts` | Neue Auftragssperre, physischer Rückweg, individuelle Effizienz; vorhandene Ladung weiter abliefern |
| `src/game/simulation/simulationConfig.ts` | Zentraler Nutzer-Testwert 50 % |
| `src/game/scenes/WorldScene.ts` | Bestehende Baumeister anbinden, nur zugewiesene neue Arbeit, Rollenwechsel sichtbar halten, einheitliche Erwachsenenbilanz |
| `src/game/ui/WorkforcePanel.ts`, `EconomyHud.ts`, `src/style.css` | Gruppenbutton und Mengen-Dialog samt Übersicht, Status und Querformatdarstellung |
| `tests/workforce-system.test.mjs`, `workforce-simulation.test.mjs`, `gathering-system.test.mjs` | Neue Regel-, Übergangs-, Ressourcen-, Zeit- und Verbrauchsprüfungen |
| `scripts/check-economy-browser.py` | Echte Browser-Formularbedienung, sichtbare Identitäten, 50-%-Graben und abgeliefertes Material |
| `README.md`, B1-Plan, dieser Bericht | Bedienung, Umfang, Prüfungen und Stopppunkt |

## Prüfungen

- `npm test`: **95/95 einzelne Tests erfolgreich**.
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bestehende Warnung wegen JavaScript-Chunk über 500 kB bleibt.
- `git diff --check`: ohne Fehler.
- Gruppenmodell und Sammlerübergänge mit zunächst fehlgeschlagenen Tests umgesetzt. Zusätzlicher Zeitbilanzfehler beim Wechsel innerhalb eines Intervalls mit erst rotem Regressionstest behoben.
- Drei Tage ohne Umteilung ergeben gegenüber der bisherigen A3-Kolonie identische Nahrung/Wasser-Bestände und Versorgungszustände. Bestehende A4-Achttagestests aller Prioritäten bleiben erfolgreich.
- Firefox-Prüflauf erfolgreich: native Formular-Zuweisung, echte tragende Sammlerin mit abwartendem Wechsel und späterer Baugruppe; **neun eindeutige sichtbare IDs**. Danach nur fachfremde Baumeisterin aktiv: **50 ms Grabfortschritt bei 100 ms Zeitschritt**, anschließend zweite reale Baustoffladung abgeliefert. Pflegezuweisung ruht, Rückzuweisung stellt Ausgangsgruppen wieder her. A4-Prioritätsbedienung, Warnungen, Teich und Eingabetrennung bleiben erfolgreich. Screenshots von Gruppenwechsel, Ruhe und kleinem Querformat visuell geprüft.
- Browserharness wartet nun ausdrücklich auf vollständigen Szenen-/HUD-Aufbau. Der erste neue Prüflauf war dafür zu früh; kein daraus abgeleiteter Produktfehler. Kein globaler Debugzugang im Spielcode.
- Unabhängige Codeprüfung `7d68cd5..f554d02`: keine kritischen, wichtigen oder kleinen Befunde. 95/95 Tests, 10/10 Welttests und sauberer Diff unabhängig bestätigt; Code und Browserharness geprüft. Build und Firefox wurden vom implementierenden Agenten ausgeführt. Als zukünftige Testverstärkung empfohlen: tatsächliche Baumeister-Umteilung getrennt während Graben, Laden und Tragen zusätzlich im Browser prüfen; die aktuelle Modellprüfung wartet über den Adapterzustand auf Auftragsende, und der Browser prüft echten fachfremden Aushub samt Lieferung.

## Grenzen und nächster Schritt

- „Persistent“ bedeutet: Spielerzuweisung bleibt während des laufenden Spiels über Leerlauf, Quellenwechsel, Mangel und Erholung bestehen. Ein Neuladen startet weiterhin die gesamte Vorschau neu; kein vorgezogenes Savegame.
- Pflege/Kampf und zugehöriger Nachwuchs sind spätere Systeme; deshalb anfangs jeweils 0 entsprechend spezialisierte Ameisen. Eine Fremdzuweisung dorthin erzeugt keine fiktiven Aufgaben.
- Alter Abraum, fallengelassene Ladungen, vollständige Materiallagerbilanz und neue Traglast-/Aushubregeln gehören B2. Ein dadurch blockierter Übergang bleibt sichtbar, statt Daten zu verlieren.
- Im kleinen Querformat ist der Gruppen-Dialog vertikal scrollbar. Desktop-Firefox-Prüfung ersetzt keinen Test auf einem physischen Handy. Bestehender Hochformat-Hinweis bleibt erhalten.
- Unveränderter A4-Balancingbefund: dauerhafter Nahrungs-Vorrang kann vorübergehend Wasserwarnungen verursachen. B1 verändert diese Heuristik nicht.

**Nächster Schritt: B2 – Materialbilanz und Grablogik. Erst nach ausdrücklicher Freigabe.**
