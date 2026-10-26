# ANTHIVE – Optionale Kammergrößenvorlagen neben freier Gestaltung

**Verbindlicher Nutzerbeschluss, 26.10.2026. Umsetzung durch Codex nach C5 und nach Abgleich des neuesten Entwicklungsstands. Kein Codeänderungsauftrag an den Assistenten in diesem Schritt.**

## Beschluss
- Für die bisherigen baubaren Funktionskammern stehen bei der Planung vier Alternativen zur Auswahl: **Klein, Mittel, Groß, Frei**.
- Die Vorlage **Klein** hat exakt die bisher festgelegte **Mindestfläche** des jeweiligen Kammertyps. **Mittel** hat genau **2 × Klein**, **Groß** genau **4 × Klein** (Verdopplung jeweils des Flächenwerts, nicht der Seitenlängen).
- **Frei** behält sämtliche bisherigen Möglichkeiten, insbesondere zusammenhängende Formen mit Pinsel und Rechteckwerkzeug und bestehender Mindestflächenprüfung.
- Vorlagen liefern lediglich eine vorab ausgefüllte Kachelauswahl in der bestehenden Bauplan-Logik. Sie sind **keine eigenen Sonderräume**, haben keine zusätzlichen Effizienzboni und nutzen dieselben Regeln für Erreichbarkeit, Kosten, Betrieb, Kapazität und unveränderliche Raumfunktion.
- Tunnel bleiben frei planbar; für Königinnenkammern ist bislang keine Mindestfläche beschlossen und darum **keine** Größenvorlage aus dieser Tabelle abzuleiten.

## Flächen je Vorlage (Anzahl Kacheln)

| Funktionskammer | Klein | Mittel | Groß |
| --- | ---: | ---: | ---: |
| Nahrungslager | 12 | 24 | 48 |
| Wasserlager | 12 | 24 | 48 |
| Baumateriallager | 12 | 24 | 48 |
| Ruhekammer | 16 | 32 | 64 |
| Brutkammer Sammlerinnen | 20 | 40 | 80 |
| Brutkammer Baumeisterinnen | 20 | 40 | 80 |
| Brutkammer Kämpferinnen | 20 | 40 | 80 |
| Brutkammer Brutpflegerinnen | 20 | 40 | 80 |

## Technischer Auftrag an Codex (nach C5)
1. Aktuellen lokalen Zustand und GitHub-Branches sichern/abgleichen; Umsetzung erst nach ausdrücklicher Freigabe und ohne vorhandene Grafik, Brunnen/Teich oder Gameplay zu überschreiben.
2. UI zur Auswahl Klein/Mittel/Groß/Frei je Funktionskammertyp; die Vorlagen müssen vor Platzierung eine Vorschau mit belegten Kacheln anzeigen. Größe und tatsächliche Kapazität anzeigen.
3. Eine zusammenhängende, zur Platzierung verschiebbare Vorschau je Größenoption anbieten; **die Vorlagen sollen nach dem neuesten Nutzerbeschluss quadratisch sein**. Exakte Seitenlängen müssen noch festgelegt werden, weil die Flächen 12, 20 und deren Verdopplungen keine perfekten Quadratzahlen sind. Codex soll diesen Konflikt nicht eigenmächtig entscheiden. Vorlagen intern aus existierenden Planungszellen erstellen und an denselben Validierungs-/FIFO-Bauprozess übergeben.
4. Keine Lockerung der bisherigen Erreichbarkeits-, Mindestgrößen-, Ressourcen- oder Einrichtungsanforderungen. Freie Bauweise unverändert.
5. Tests: korrektes Flächenverhältnis 1:2:4; alle Kammertypen; identische Kosten/Kapazitäten für gleiche Flächen in Vorlage und Freihand; Platzierungskonflikte; dieselben Bau-/Betriebsregeln; Browserbedienung und bestehende Tests/Build.

## Visuelle Unterscheidung – als nächster Designpunkt, noch kein Grafikbeschluss
Nutzer wünscht künftig **eigene Grafiken** zur Unterscheidung der Funktionskammern von großen frei ausgegrabenen Hohlräumen. Zu klären: Gestaltung fertiger Kammern (eindeutige Ausstattung/Füllstände/Brut/Ruheaktivität), Erkennbarkeit geplanter/halb fertiger Räume, optional dezente Raumumrandung und Symbole. Noch keine endgültige Raumgrafik oder fixe Formgestaltung beschlossen. Keine künstliche Beschränkung des Bergabbaus festgelegt.

## Bestehende Regeln bleiben erhalten
- Typ bei Bauplanung festgelegt; keine spätere Umwidmung.
- Funktionsfähigkeit erst nach vollständigem Ausgraben und Einrichten.
- Individuelle Kapazität pro nutzbarer Kachel, zusätzliche Fläche kostet mehr Baumaterial.
- Bestehende Ruhekammer-Automatik mit Verbrauchsfaktoren 100/80/50 % ist separater beschlossener Schritt nach C5, siehe `planung/2026-10-26-ruhekammern-nach-c5.md`.

**Status:** Größen und paralleler Freimodus verbindlich beschlossen und zur späteren Implementierung vorgesehen; Quadratische Vorlagen als neuester Gestaltungsbeschluss; konkrete Seitenlängen und mögliche Anpassung der Flächenwerte sind noch zu entscheiden.


## Neuester Beschluss: Quadratische Vorlagen (26.10.2026)

Der Spieler hat die vorangehende Festlegung auf **allgemeine Rechtecke ausdrücklich verworfen**: Die drei Bauvorlagen **Klein, Mittel und Groß sollen Quadrate** sein, also gleich viele Kacheln in Breite und Höhe. Keine länglichen 3×4-, 4×6- oder 4×5-Vorlagen und keine Drehfunktion nötig. **Freie Gestaltung** mit Pinsel und Rechteck bleibt unverändert.

**Noch aufzulösender Zahlenkonflikt:** Die zuvor beschlossenen exakten Vorlagenflächen sind bei Lagern 12/24/48, bei Brutkammern 20/40/80 und bei Ruhekammern 16/32/64. Quadrate können aber nur ganzzahlige Flächen 1, 4, 9, 16, 25, 36, 49, 64 usw. haben. Daher kann ein dreistufiges System aus exakten Quadraten die älteren Flächen und die exakte Flächenverdopplung *nicht gleichzeitig* einhalten. Die vorhandenen Mindestflächen 12/16/20, Kapazitäten pro Kachel und Maximalflächen 96/128/160 bleiben bis zur gemeinsamen Klärung unverändert; **Codex darf die Zahlen nicht stillschweigend ändern**.

**Nächste Planungsentscheidung:** quadratische konkrete Seitenlängen und daraus folgende Vorlagenflächen vereinbaren. Erst danach den Bauvorlagenauftrag technisch umsetzen. Keine Code- oder Grafikänderung durch diese Dokumentation.
