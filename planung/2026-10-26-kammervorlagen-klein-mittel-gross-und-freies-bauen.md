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
3. Eine zusammenhängende, zur Platzierung verschiebbare Vorschau je Größenoption anbieten; genaue Form/Seitenverhältnisse der Vorlagen **noch nicht festgelegt** (nicht eigenmächtig endgültige Grafikformen beschließen). Vorlagen intern aus existierenden Planungszellen erstellen und an denselben Validierungs-/FIFO-Bauprozess übergeben.
4. Keine Lockerung der bisherigen Erreichbarkeits-, Mindestgrößen-, Ressourcen- oder Einrichtungsanforderungen. Freie Bauweise unverändert.
5. Tests: korrektes Flächenverhältnis 1:2:4; alle Kammertypen; identische Kosten/Kapazitäten für gleiche Flächen in Vorlage und Freihand; Platzierungskonflikte; dieselben Bau-/Betriebsregeln; Browserbedienung und bestehende Tests/Build.

## Visuelle Unterscheidung – als nächster Designpunkt, noch kein Grafikbeschluss
Nutzer wünscht künftig **eigene Grafiken** zur Unterscheidung der Funktionskammern von großen frei ausgegrabenen Hohlräumen. Zu klären: Gestaltung fertiger Kammern (eindeutige Ausstattung/Füllstände/Brut/Ruheaktivität), Erkennbarkeit geplanter/halb fertiger Räume, optional dezente Raumumrandung und Symbole. Noch keine endgültige Raumgrafik oder fixe Formgestaltung beschlossen. Keine künstliche Beschränkung des Bergabbaus festgelegt.

## Bestehende Regeln bleiben erhalten
- Typ bei Bauplanung festgelegt; keine spätere Umwidmung.
- Funktionsfähigkeit erst nach vollständigem Ausgraben und Einrichten.
- Individuelle Kapazität pro nutzbarer Kachel, zusätzliche Fläche kostet mehr Baumaterial.
- Bestehende Ruhekammer-Automatik mit Verbrauchsfaktoren 100/80/50 % ist separater beschlossener Schritt nach C5, siehe `planung/2026-10-26-ruhekammern-nach-c5.md`.

**Status:** Größen und paralleler Freimodus verbindlich beschlossen und zur späteren Implementierung vorgesehen; Vorlage-Geometrie und Raumgrafiken noch gemeinsam zu konkretisieren.
