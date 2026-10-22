# ANTHIVE – Vorläufige Testwerte: Basis-Grabzeit und Transportkapazität

**Beschluss vom 22.10.2026.** Nutzer wählte **Basis-Grabzeit B** sowie **Transportkapazität der Baumeisterinnen B**.

> **Beide Zahlen sind ausdrücklich veränderbare Testwerte, keine endgültigen Balancingregeln.** Diese Datei gehört zu den Planungsdokumenten im Ordner `planung/` und ist keine Aufforderung, alle beschriebenen Systeme zugleich zu bauen.

## 1. Basis-Grabzeit B: 6 Sekunden je Kachel lockerer Erde

- Für **eine Baumeisterin** dauert das Ausgraben einer Kachel lockerer Erde zunächst **6 Sekunden** reine Grabzeit.
- Vorläufig bereits festgelegte Grabdauer-Multiplikatoren bleiben bestehen:

| Erdmaterial | Zeitfaktor | Reine Grabzeit je Kachel (1 Baumeisterin, vorläufig) |
|---|---:|---:|
| Lockere Erde | 1× | 6 Sekunden |
| Kompakte Erde | 2× | 12 Sekunden |
| Lehm | 3× | 18 Sekunden |
| Stein | 5× | 30 Sekunden |

- Für die tiefste Gesteinsschicht wurde **noch kein eigener Zeitfaktor festgelegt**. Die tatsächlichen Material-/Schichtbezeichnungen des Projekts prüfen; keine fest codierte Zuordnung erfinden.
- Angegebene Zeiten sind reine Arbeitszeiten **ohne** Laufwege, Abraumtransport, Wartezeiten, Einrichtung, Pausen, Gruppenstärke oder spätere Verbesserungen.
- Nicht freigeschalteter Untergrund bleibt weiterhin ungrabbbar, bis entsprechende Verbesserung vorhanden ist. Ein definierter Zeitmultiplikator ersetzt keine Freischaltvoraussetzung.

## 2. Materialtransport B: 5 Einheiten je Ladung

- Eine **Baumeisterin trägt vorläufig höchstens 5 Einheiten Baumaterial pro Transport**.
- Teilbeladene Transporte mit weniger als 5 Einheiten sind zulässig.
- Material ist erst dann im Lagerbestand, wenn es **tatsächlich angeliefert** und dort innerhalb der freien Kapazität eingebucht wurde.
- Bereits beschlossen: Baumateriallager sind pro Kammer kapazitätsbegrenzt; mehrere Lagerkammern möglich. Bei vollem Lager wird überschüssiger Abraum am Grabungsort zurückgelassen und kann später abgeholt werden; Graben darf weitergehen.
- Die 5-Einheiten-Testkapazität sagt **nichts** über Tragkapazitäten anderer Spezialisierungen für Nahrung/Wasser aus. Diese separat konfigurieren.

## 3. Beispiel zur Veranschaulichung (nicht als eigener Beschluss)

Eine Baumeisterin gräbt 20 Kacheln lockere Erde: **20 × 6 = 120 Sekunden** reine Grabzeit. Nach bereits gewähltem testweisem Materialertrag von **1 Einheit lockerer Erde je Kachel** fallen **20 Einheiten Baumaterial** an; für dessen Transport wären bei vollständig gefüllten 5er-Ladungen **mindestens vier Transportladungen** erforderlich. Laufzeiten, Lagerfüllstand und Einrichtung sind noch nicht mitgerechnet.

## 4. Verknüpfung mit den übrigen Planungsentscheidungen

- Grab- und Materialertragswerte je Kachel: lockere Erde 1 Material, kompakte Erde 2, Lehm 3, Stein 4 (ebenfalls **Testwerte**).
- Einrichtungskosten je nutzbarer Kachel: Nahrung-/Wasser-/Baumateriallager 2, Brutkammer 3, Ruhekammer 2 (ebenfalls **Testwerte**).
- Funktionale Kammern sind erst nach Aushub, Einrichtung und Erreichbarkeit nutzbar.
- Baupläne entstehen durch Pinsel oder Rechteck; freie zusammenhängende Formen sind zulässig, Typ bei Planung festgelegt und nach Fertigstellung nicht umwidmbar.
- Bauaufträge grundsätzlich FIFO, blockierte vorübergehend überspringbar.
- Keine zusätzlichen Spielregeln zur Abholpriorität oder zum Grab-/Transportrollenwechsel aus diesen Zahlen ableiten: **nächster offener Designpunkt**.

## 5. Hinweise für Codex

1. **Vor Codeänderungen lokalen VM-Stand mit GitHub synchronisieren**, ohne noch nicht gepushte Welt-/Teicharbeit zu verlieren.
2. Vorhandene Grabmechanik und Terrain-/Materialtypen inspizieren, Werte zentral konfigurierbar integrieren; keine konkurrierende Simulationslogik schaffen.
3. Die vorläufige Basis-Grabzeit auf den vorhandenen Arbeitsfortschritt übertragen, ohne Lauf-/Transportzeiten als Grabzeit zu zählen.
4. Materialtransport auf maximal 5 Einheiten begrenzen; Teilmengen und eine bereits gestartete Lieferung sauber behandeln.
5. Tests: 6/12/18/30 Sekunden bei den bekannten Materialien (ohne Wegzeiten); genau einmaliger Ertrag pro vollständig abgegrabener Kachel; Ladung von maximal 5 Einheiten; Teilladungen; keine Überfüllung, Doppelbuchung oder Materialverluste beim Übergang zwischen Baustelle, Transport und Lager.
6. **Priorisierung beibehalten:** zuerst Ressourcenbasis; dann Sammeltransporte; Grabzeit-/Baulogik in einem gesonderten, späteren Arbeitspaket. Nicht automatisch alles mit Auftrag 01 erledigen.

## 6. Nächste offene Entscheidung

Wann wird liegengebliebenes Baumaterial abgeholt und wann hat weiteres Graben Vorrang? Auch Umgang mit restlicher Ladung bei vollem Lager und konkretes Verhalten bei nur teilweise nutzbaren Transportwegen sorgfältig planen.

**Status: dokumentierte veränderbare Testwerte. Kein Spielcode geändert.**
