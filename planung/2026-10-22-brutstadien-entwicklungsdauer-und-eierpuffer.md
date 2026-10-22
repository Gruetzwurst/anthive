# ANTHIVE – Brutstadien, Entwicklungsdauer und voller Eierpuffer

**Verbindliche Entscheidungen vom 22.10.2026:** Entwicklungsstadien **B**, Entwicklungsdauer **B als veränderbarer Testwert**, Verhalten bei vollem Eierpuffer **B**. Ergänzt die vorherigen Dateien in `planung/`, besonders `2026-10-22-eierverteilung-brutkapazitaet-und-pflege.md`.

> **Unterscheidung:** Die Entwicklungsstadien und das Verhalten bei vollem Eierpuffer sind verbindliche Designregeln. Die Dauer von sechs Spieltagen ist ausdrücklich ein **vorläufiger, zentral konfigurierbarer Balancewert**, keine endgültige Spielzeit.

## Verbindliche Regel 1: Vollständige, einzeln simulierte Entwicklungsstadien (B)

- Die Brut durchläuft **Ei → Larve → Puppe → erwachsene Ameise**.
- **Jedes Stadium wird einzeln simuliert**, mit eigenem Zustand und Fortschritt.
- Die **Entwicklung beginnt erst, wenn ein Ei vom Spieler einer betriebsbereiten spezialisierten Brutkammer zugewiesen wurde**. Nicht zugewiesene Eier verbleiben ohne Entwicklungsfortschritt in der Königinnenkammer.
- Die Brutkammer bestimmt die **dauerhafte Spezialisierung** der später erwachsenen Ameise: Sammlerin, Baumeisterin, Kämpferin oder Brutpflegerin.
- Nur nach Ausgraben und Einrichtung betriebsbereite Brutkammern bieten Plätze; die Kapazität pro Kachel richtet sich nach den bisher festgelegten konfigurierbaren Testwerten.
- Der Einfluss mangelnder Brutpflege bleibt wie zuvor beschlossen: **Entwicklung verlangsamt sich**, aber fehlendes Personal bedeutet **nicht automatisch**, dass die Brut daran stirbt.
- Wie sich die Gesamtzeit auf Ei-, Larven- und Puppenstadium verteilt, ist **noch offen**. Keine prozentuale Stadienverteilung ungefragt als verbindlich festlegen.

## Vorläufiger Testwert 2: Entwicklungsdauer B (6 Spieltage)

- Vollständige Entwicklung **ab Zuweisung zu einer Brutkammer bis zur erwachsenen Ameise: vorläufig sechs Spieltage** bei ausreichender Versorgung und Brutpflege.
- Ein Spieltag dauert nach früherem vorläufigen Wert **600 Echtzeitsekunden = 10 Minuten**.
- Damit dauert die vollständige Entwicklung derzeit testweise **60 Minuten Echtzeit** bei normaler Spielgeschwindigkeit, ohne Pausierung oder Zeitbeschleunigung.
- Die Entwicklungszeit verlängert sich bei unzureichender Brutpflege nach der bereits festgelegten Regel; **genauer Verzögerungsfaktor noch offen**.
- Alle Zeitangaben zentral konfigurierbar halten und nicht verstreut in Animation, Spieluhr und Brutlogik fest codieren.

## Verbindliche Regel 3: Voller Eierpuffer B – zunehmende Drosselung

- Die Königin legt grundsätzlich **selbstständig Eier**. Eiablage hängt unter anderem vom Zustand der Kolonie ab.
- Wenn die **Königinnenkammer mit unzugewiesenen Eiern zunehmend gefüllt** ist, **sinkt die Eiablagerate schrittweise**.
- **Bei vollständig ausgeschöpfter Eierpuffer-Kapazität pausiert die Eiablage**, bis wieder Platz frei ist.
- Dies verhindert, dass überschüssige Eier erzeugt und anschließend ohne Lagerplatz vernichtet werden.
- Das gilt zusätzlich zum früheren Beschluss: **Auch bei vollen spezialisierten Brutkammern legt die Königin weiter Eier, solange der Eierpuffer noch Platz hat**.
- Genaues Puffervolumen, Drosselungskurve und Ausgangs-Eiablagerate sind **noch nicht entschieden**. Als zentral veränderbare Testparameter planen.

## Zusammenspiel mit bereits beschlossenen Regeln

- Spieler verteilt Eier aktiv auf die vier **spezialisierten** Brutkammerarten; **keine automatische Umverteilung** nicht zugewiesener Eier.
- Fertige Brutkammern haben bei der gewählten vorläufigen Mindestfläche von **20 Kacheln** und **2 Brutplätzen je Kachel** beispielhaft **40 Brutplätze**; diese Zahlen sind **veränderbare Testwerte**, nicht endgültig.
- Brutpflegerinnen sind für Entwicklung wichtig; Mangel verlängert die Entwicklung.
- Ressourcenknappheit führt im zuvor gewählten **entspannten Überlebenstempo** zunächst zu Warnungen und verringerter Arbeitsleistung/Eiablage, später erst zu möglichen Verlusten.
- Zu Spielbeginn existieren im bekannten Prototyp vier spezialisierte Brutkammern; neue spezialisierte Brutkammern sind grundsätzlich baubar.
- Die Existenz einer besonderen Königinnenkammer, späterer Königinnenwechsel und besondere Folgeköniginnenregeln werden durch diese Datei nicht verändert.

## Codex-Plan – erst nach vorrangigen Ressourcen- und Gruppenfunktionen

1. **Vor Eingriffen in Spielcode den aktuellen VM-Stand mit GitHub abgleichen**, insbesondere nicht gepushte Änderungen an Teich/Welt schützen.
2. Zuerst vorhandene priorisierte Ressourcenaufträge aus `planung/2026-10-21-phase-1-entscheidungen-und-codex-auftrag.md` umsetzen. Brut-/Königinnenmechaniken danach in **getrennten, überprüfbaren Arbeitspaketen**.
3. Je Brutdatensatz Phase (`egg`, `larva`, `pupa`, `adult`), zuständige Brutkammer/Spezialisierung und Entwicklungsfortschritt verlässlich abbilden. Interne Batch-Optimierungen sind möglich, aber die Phasen müssen semantisch erhalten bleiben.
4. Entwicklungszeit beginnt **erst nach erfolgreicher Zuweisung**, niemals im Königinnenpuffer. Stadienwechsel nur einmal durchführen; keine mehrfach erzeugten erwachsenen Ameisen.
5. Gesamt-Entwicklungszeit als Konfiguration `6 * secondsPerGameDay` (oder äquivalente Spielzeit) behandeln; Stadien-Verteilung später abstimmen.
6. Eierpuffer mit **endlicher Kapazität**; Eiablagerate bei Annäherung ans Limit schrittweise reduzieren und bei voller Kapazität auf 0 setzen. Keine doppelten oder verlorenen Eier beim Zuweisen.
7. Mangel an Brutpflege bremst nur die Entwicklung entsprechend späteren Testwerten; nicht ohne Beschluss eine automatische Brutmortalität implementieren.
8. Die Ressourcen-, Bau- und Wege-Mechaniken nicht ungefragt gleichzeitig neu schreiben.

## Vorgesehene Tests

- Nicht zugewiesenes Ei verbleibt im Königinnenpuffer, ohne Fortschritt in irgendeinem Entwicklungsstadium.
- Zugewiesenes Ei folgt der Reihenfolge Ei → Larve → Puppe → erwachsene Ameise; jede Übergangsphase genau einmal.
- Bei vollständiger Pflege/normaler Versorgung erreicht die Brut nach insgesamt 6 konfigurierbaren Spieltagen die erwachsene Phase.
- Weniger Brutpflegerinnen verlangsamen die Entwicklung gegenüber dem normalen Wert, ohne automatisch Brutsterben auszulösen.
- Neue erwachsene Ameise erhält die Spezialisierung der Brutkammer.
- Eierpuffer nahe voll: Eiablagerate sinkt; vollständig voll: es werden keine neuen Eier erzeugt.
- Eier werden einer Brutkammer zugewiesen: Königinnenpuffer sinkt exakt um die tatsächlich transferierte Menge, Brutbelegung steigt entsprechend; keine Doppelzählung.
- Wenn alle Brutkammern voll und noch Pufferplatz vorhanden ist, kann die Königin weiter Eier legen, mit möglicher Pufferdrosselung.
- Spielzeit-Zeitsprünge, pausierte Simulation und mehrere Stadienübergänge liefern konsistente Ergebnisse.

## Nächste offene Designentscheidungen

- Vorläufige **Eiablagerate** bei guter Versorgung.
- Vorläufige **Kapazität** für unzugewiesene Eier in der Königinnenkammer.
- Anzahl betreubarer Brutplätze **pro Brutpflegerin** und Verzögerung bei Unterbesetzung.
- Verteilung der sechs Spieltage auf Ei-, Larven- und Puppenstadium und konkrete Ressourcenbedarfe je Stadium.

**Status:** Designbeschlüsse und klar gekennzeichnete Testwerte; diese Datei verändert keinen Spielcode.
