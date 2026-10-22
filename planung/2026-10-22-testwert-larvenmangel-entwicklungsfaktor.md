# ANTHIVE – Testwert: Entwicklungsfaktor bei Larven-Unterversorgung

**Entscheidung vom 22.10.2026:** Option **B – proportional zur gedeckten Versorgung, mit mindestens 25 % Entwicklungstempo**. **Dies ist ein vorläufiger, zentral änderbarer Testwert, kein endgültiges Balancing.**

## Verbindliche Vorbedingungen aus früheren Entscheidungen
- Nur Larven verbrauchen im Brutsystem direkt Nahrung und Wasser. Zugewiesene Eier und Puppen verbrauchen unmittelbar je 0.
- Larvenverbrauch derzeit testweise 0,5 Nahrung und 0,5 Wasser pro Larve/Spieltag.
- Nahrung und Wasser müssen durch Brutpflegerinnen real in die getrennten Vorräte der Brutkammern geliefert worden sein.
- **1. Spieltag tatsächlicher Larvenunterversorgung:** Warnphase ohne zusätzlichen *ressourcenbedingten* Entwicklungsabschlag.
- **Ab dem 2. zusammenhängenden Spieltag** wirkt der ressourcenbedingte Abschlag.
- **Frühestens ab dem 7. zusammenhängenden Spieltag schweren Mangels** sind Verluste möglich. Genaue Schwerekriterien/Verlustquoten sind weiterhin offen.
- **Nach wiederhergestellter Versorgung** normalisiert sich der ressourcenbedingte Abschlag schrittweise innerhalb eines Spieltags.
- **Separat**: Brutpflegerinnen-Unterbesetzung reduziert das Entwicklungstempo bei 50 % Pflegekapazität auf 50 %, mindestens 25 %; *Pflegemangel allein führt nicht zu Bruttod*.

## Vorläufiger Testalgorithmus
- Pro Brutkammer/Zeitschritt Bedarf und tatsächlich aus eigenem Vorrat gedeckte Menge **für Nahrung und Wasser separat** berechnen.
- `foodCoverage = deliveredFoodForConsumption / foodDemand`, `waterCoverage = deliveredWaterForConsumption / waterDemand`, jeweils sinnvoll auf `[0,1]` begrenzen. Für Larven ohne positiven Bedarf kein Mangel.
- Für den ressourcenbezogenen Entwicklungsfaktor **die schlechtere Deckung** nutzen: `coverage = min(foodCoverage, waterCoverage)`. Dies ist ein **technischer Testvorschlag zur Vermeidung doppelter Bestrafung**, kein separat bestätigter endgültiger Formelbeschluss.
- Nach Ende der Warnphase: `shortageFactor = max(0.25, coverage)`; bei voller Versorgung = 1. Für die zeitliche Erholung über einen Spieltag den Faktor sanft zum Normalwert zurückführen.
- **Offener technischer Konflikt, vor Codex-Implementierung klären:** Wie der durch Pflegepersonalmangel verursachte Faktor und der durch Ressourcenausfall verursachte Faktor zusammenwirken (Multiplikation würde doppelt wirken, `min()` bildet den stärkeren Engpass ab). Keinen endgültigen Kombinationsoperator als Nutzerbeschluss erfinden.
- Verbrauch und Entwicklungsfortschritt müssen bei großen Zeitsprüngen, teilweisen Lieferungen und Stadienwechseln konsistent bleiben.

## Abnahmetests für das spätere Brutmodul
- Ausreichend Nahrung/Wasser: ressourcenbedingter Faktor 100 %.
- Nach voller Warnphase und 50 % Deckung: ressourcenbedingter Testfaktor 50 %.
- Nach voller Warnphase und 0 % Deckung: mindestens 25 % Fortschritt aus dem **ressourcenbezogenen** Faktor, sofern nicht eine spätere andere Regel eingreift.
- 100 % Nahrung, 50 % Wasser: 50 % Ressourcendeckung, **keine doppelte Strafe**.
- Erste Mangeltag-Warnphase: keine zusätzliche ressourcenbedingte Verlangsamung.
- Nach erneuter Vollversorgung über einen Spieltag schrittweise zu normaler Entwicklung zurückkehren.
- Pflegepersonalmangel nicht mit Nahrung/Wasser-Mangel verwechseln.

**Implementierungsreihenfolge:** Erst Ressourcen-Grundlage/Transporte/Verbrauch, danach Gruppen-/Brutmechanik. Lokale VM-Arbeit (vor allem neuere Teichgestaltung) vor Codeänderungen mit GitHub abgleichen.
