# ANTHIVE – Baumaterialtransport und Abholung von Abraum

**Verbindliche Nutzerentscheidungen vom 22.10.2026.** Ergänzt die Planungsdokumente im Ordner `planung/`. **Kein Spielcode geändert.**

## Beschluss 1: Transportzeitpunkt B – bei voller Ladung
- Eine Baumeisterin gräbt weiter und sammelt verwertbares Material, bis ihre **Tragkapazität erreicht** ist. Dann transportiert sie die Ladung in ein geeignetes erreichbares Baumateriallager und setzt ihre Arbeit fort.
- Aktueller **konfigurierbarer Testwert** für die Tragkapazität: **5 Baumaterialeinheiten** je Baumeisterin. Die Zahl ist nicht als endgültige Balance festgelegt.
- Falls der aktuelle Grabauftrag endet, ein Auftrag unterbrochen wird oder nicht mehr genug Material für eine volle Ladung anfällt, muss die **Teilladung sicher behandelt** werden, statt sie zu verlieren. Genaue Übergabepunkte technisch sinnvoll definieren.
- Material zählt erst nach tatsächlicher Einlagerung zum Lagerbestand. Nie Material bei Grabung, Transport und Einlagerung mehrfach verbuchen.
- Bei vollem Materiallager gilt der frühere Beschluss: Graben darf weitergehen und überschüssiges Material bleibt nachvollziehbar am Grabungsort liegen. Bei Lagerwechsel/teilweiser Kapazität kein Verlust oder Duplizieren.

## Beschluss 2: Abholung zurückgelassenen Abraums B – nach Grabaufträgen
- **Offene ausführbare Grabaufträge haben Vorrang** vor dem Aufräumen/Abtransport liegengebliebener Abraumhaufen.
- **Erst wenn keine Grabaufträge mehr anstehen**, kümmern sich Baumeisterinnen um das zurückgelassene Material, sofern ein erreichbares Lager Platz hat.
- Blockierte, derzeit **nicht ausführbare** Aufträge sollen nicht dazu führen, dass Baumeisterinnen dauerhaft untätig bleiben, obwohl Material abgeholt werden könnte: Die bestehende Regel zum vorübergehenden Überspringen blockierter Bauaufträge berücksichtigen. Ob ein aufwendiger Einrichtungsauftrag als 'Grabauftrag' zählt, ist gesondert zu behandeln; keine stillschweigende Neudefinition.
- Abraum bleibt bis zur Abholung als **konkrete Menge am Ort** erhalten und blockiert nicht automatisch Wege.
- Sobald später neue ausführbare Grabaufträge hinzukommen, haben diese wieder Vorrang vor dem routinemäßigen Abholen alter Abraumhaufen.
- **Hinweis für Spielbarkeit:** Diese Priorität kann bei ununterbrochenen neuen Grabaufträgen zu lange liegenbleibendem Abraum führen. Als Konsequenz des gewählten Designs dokumentieren, nicht ohne Entscheidung durch eine andere Priorität ersetzen.

## Bezug auf vorhandene Entscheidungen
- Baumaterialgewinn je tatsächlich entfernter Kachel (**vorläufige Testwerte**): lockere Erde 1, kompakte Erde 2, Lehm 3, Stein 4.
- Grabzeiten je Kachel bei einer Baumeisterin (**vorläufige Testwerte**): 6, 12, 18 und 30 Sekunden für diese vier Materialien.
- Getrennte, kapazitätsbegrenzte Baumateriallager; mehrere Kammern erlaubt.
- Bauaufträge grundsätzlich FIFO; blockierte Aufträge dürfen vorübergehend übersprungen werden.
- Bauplan: frei zusammenhängende Form, Typ bei Planung, Aushub vor Einrichtung; nur fertig eingerichtete Kammern haben Funktion.
- Spieler steuert keine Einzelameisen.

## Codex – Umsetzung nach priorisierten Ressourcen-Grundaufträgen
1. Vorher **lokale VM-Dateien mit GitHub vergleichen/synchronisieren**; neuere lokale Welt-/Teichänderungen nicht überschreiben.
2. Bereits vorhandene Graben-/Schutttransportmechanik weiterverwenden; Material in den getrennten Zuständen **am Grabungsort / getragen / eingelagert / verbraucht** korrekt nachverfolgen.
3. Transport auslösen, wenn die **konfigurierbare Tragkapazität** erreicht ist; Teilmengen bei Aufgabenabschluss/Unterbrechung ohne Verlust behandeln.
4. Liegengebliebenen Abraum nur nachrangig abholen, wenn keine **ausführbaren** Grabaufträge vorhanden sind und Lagerplatz verfügbar ist.
5. Keine Materialduplikation bei mehreren Ameisen, abgebrochenen Aufträgen, teilweise vollen Lagern oder unterbrochenen Transporten.
6. Das bestehende Bauauftragssystem bei späterer Erweiterung testen, statt gleichzeitig alle Bau-, Brut- und Forschungsmechaniken neu zu implementieren.

## Testfälle
- Bei 4 von 5 Einheiten: weitergraben, sofern ausführbar; bei 5: Transport beginnen.
- 4er-Teilladung am Auftragsende bleibt erhalten und wird sicher abgewickelt.
- Ablieferung nur bei tatsächlicher freier Lagerkapazität, keine Überfüllung.
- Voller Baumaterialspeicher: Überschuss bleibt am Grabungsort, Graben geht weiter.
- Ausführbarer Grabauftrag vorhanden: routinemäßiges Aufräumen alten Abraums wartet.
- Keine ausführbaren Grabaufträge mehr: gelagerter Abraum wird abgeholt, soweit möglich.
- Nur blockierte Aufträge: Abraumabholung darf möglich bleiben.
- Mehrere Baumeisterinnen können weder dieselbe Ladung noch denselben Abraumhaufen doppelt verbuchen.

## Nächste noch offene Planungsfragen
- Wie verteilen sich mehrere Baumeisterinnen auf *denselben* Grabauftrag?
- Wie wird verhindert, dass sie dieselbe Kachel doppelt bearbeiten?
- Wie stark beschleunigen zusätzliche Baumeisterinnen die Arbeit und welche räumlichen Grenzen gelten?

**Status: verbindliche Logistikregeln, Tragkapazität 5 weiterhin Testwert; keine Implementierung in diesem Commit.**
