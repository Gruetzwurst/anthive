# C2 – Brutstadien und Pflege

Stand: 26.10.2026. Freigabe „frei“. Basis C1 `2590169`, sauber und mit GitHub identisch. Branch `codex/c2-brood-development`. Stopp vor C3.

## Änderungen / Dateien

- `src/game/simulation/queenSystem.ts`: vorhandenes individuelles Eiermodell um Ei → Larve → Puppe → erwachsene Ameise erweitert. Ereignisweise gemeinsame Zeitachse für Eiablage und Stadiengrenzen; neue Eier erhalten keine Zeit vor ihrer Zuweisung. Einmalige Geburtsereignisse bewahren ID, Kammerposition und dauerhafte Spezialisierung. Erwachsene geben Brutplätze frei, wartende Eier werden nachgezogen und beginnen bei null. Bilanz: gelegt = Puffer + lebende zugewiesene Brut + geschlüpft.
- `simulationConfig.ts`: zentrale beschlossene Testwerte: 1/3/2 Spieltage; 10 Bruttiere je effektiver Pflegerin; Pflegefaktor zwischen 25 und 100 %. Überpflege gibt keinen Bonus, fehlende Pflege verursacht keinen Bruttod.
- `workforceSimulation.ts`: nur für Pflege zugewiesene und nach abgeschlossenem Wechsel verfügbare Kräfte zählen. Fremdleistung 50 % bleibt erhalten. Pflege ist bei vorhandener erreichbarer Brut tatsächliche Arbeit mit entsprechendem Erwachsenenverbrauch. Keine passende Brut → Ruhe. Geborene Ameisen gelangen genau einmal in ihre native Arbeitsgruppe und die vorhandene Sammel-/Bau-/Ruhelogik.
- `colonySimulation.ts`, `scenes/WorldScene.ts`: gemeinsame Uhr, A3-Leistung, reale Brutkammerpositionen und Geburtsereignisse an die vorhandenen Systeme angeschlossen. Neue Erwachsene zählen ab dem folgenden Simulationsschritt zum Erwachsenenbedarf und bleiben einzeln sichtbar. Niedrige A3-Arbeitsleistung reduziert verfügbare Pflegekapazität; sie wird nicht nochmals direkt auf den Entwicklungsfaktor multipliziert.
- `ui/WorkforcePanel.ts`: Stadienzahlen, geschlüpfte Ameisen und aktuelles Pflegetempo; Belegung je Kammer nach Eiern/Larven/Puppen. C1-Quotensteuerung bleibt erhalten.
- `tests/brood-development.test.mjs`, `tests/brood-workforce.test.mjs`: zwölf neue Prüfungen. Bestehende `queen-eggs.test.mjs` auf die bewusst erweiterte Bilanz einschließlich erwachsener Tiere angepasst; Quotentreue über alle Identitäten statt nur noch lebende Brut geprüft.
- `scripts/check-economy-browser.py`: neuer gezielter Schalter `--brood-only`; historischer C1-Check erlaubt jetzt Entwicklungsfortschritt zugewiesener Eier.

## Prüfung

- Neue Entwicklungs- und Integrationsprüfungen zuerst rot, danach grün. Normales Tempo ergibt 6 Tage, 75/50/25-%-Pflege ergibt 8/12/24 Tage. Keine Doppelgeburten, kein Überpflegebonus oder Tod allein durch Pflegemangel. Große/kleine Updates stimmen überein; Puffer und unzugängliche Kammern erhalten Fortschritt korrekt.
- Tatsächlicher Gruppenwechsel während laufender Arbeit zählt erst nach Abschluss zur Pflege; sieben fachfremde Kräfte liefern 35 Pflegekapazität. Vier Geburten gehen an vier native Gruppen, erscheinen am Kammerort und erhöhen den nachfolgenden Erwachsenenverbrauch korrekt.
- Ein vollständiger `npm test`-Lauf: **193/193 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**. `npm run build`: erfolgreich. Bekannte Chunk-Warnung über 500 kB bleibt. Diffcheck sauber.
- Firefox mit realer Gruppenbedienung und für den Test gefüllten Startlagern: neun fachfremde Pflegekräfte → Kapazität 45; tatsächliche 1/3/2-Stadienwechsel eines zugewiesenen Testjahrgangs; **vier Geburten, 13 einzeln sichtbare Arbeiterinnen**, richtige Spezialisierungen, keine Duplikate, exakte Brutbilanz. Mobile Anzeige und Teich geprüft.
- Eigenprüfung ohne Zusatzagenten. Logs `/tmp/anthive-c2-*.log`; Screenshots `node_modules/.cache/anthive-c2-*.png`. Ein vollständiger Prüf-/Buildlauf; keine unnötigen Wiederholungen.

## Grenzen und offene Punkte

- Pflege ist das dokumentierte provisorische **gemeinsame Kapazitätsmodell** für erreichbare Brut. Noch keine räumliche Pflegerinnenverteilung oder Pflegewege je Kammer. Der bestehende Rückweg beim Gruppenwechsel wird weiterhin tatsächlich ausgeführt. Unzugängliche Kammern bewahren ihre Brut und pausieren Entwicklung; kein neuer Abriss-/Einsturzmechanismus.
- **Larven verbrauchen in C2 noch keine Nahrung oder Wasser.** Reale Kammerbestände und Fütterungstransporte folgen C3. Ressourcenmangel der Larven und Kombination `min(Pflege, Ressourcen)` folgen C4; keine verfrühte provisorische Mangelstrafe.
- Das reine Königinnenmodell liefert Geburtsereignisse; die vollständige Workforce-Simulation übernimmt sie. Direkte Modellnutzer können Ereignisse separat abholen.
- Stadien werden als Daten und Kammerbelegung angezeigt; keine neue Brutgrafik hinzugefügt. Langfristiges Wachstum/Leistung bei großen Kolonien folgt C5. Kein Savegame ergänzt.

**Nächster geplanter Schritt: C3 – echte Larvenversorgung und Kammer-Vorräte. Erst nach Freigabe.**
