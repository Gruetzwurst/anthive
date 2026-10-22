# ANTHIVE – Vorläufige Testwerte: Brutphasen und Pflegeunterbesetzung

**Auswahl vom 22.10.2026:** Entwicklungsphasen **B**, Verzögerung bei Brutpflegemangel **B**.

> **WICHTIG: Diese Zahlen und die hier beschriebene konkrete Berechnung sind vorläufige, zentral veränderbare Testwerte – keine endgültigen Balancewerte.** Diese Datei ergänzt die anderen Planungsdokumente in `planung/`. Kein Spielcode wurde verändert.

## 1. Entwicklungsphasen B – Larvenphase im Mittelpunkt

Die bereits beschlossene **Gesamtentwicklung von 6 Spieltagen** nach erfolgreicher Zuweisung eines Eis zu einer spezialisierten Brutkammer wird bei normaler Pflege testweise folgendermaßen aufgeteilt:

| Entwicklungsstadium | Vorläufige Dauer | Echtzeit bei 10 Minuten pro Spieltag |
| --- | ---: | ---: |
| Ei (zugewiesen) | **1 Spieltag** | 10 Minuten |
| Larve | **3 Spieltage** | 30 Minuten |
| Puppe | **2 Spieltage** | 20 Minuten |
| Danach: erwachsene Ameise | Gesamt: **6 Spieltage** | Gesamt: 60 Minuten |

- Jedes Stadium wird einzeln simuliert: **Ei → Larve → Puppe → erwachsene Ameise**.
- **Nicht zugewiesene Eier** bleiben im Königinnen-Eierpuffer und entwickeln sich dort **nicht**.
- Eine erwachsene Ameise erhält die **dauerhafte Spezialisierung** derjenigen Brutkammer, in der sie aufgezogen wurde.
- Die sechs Spieltage und die drei Teilzeiten sind **Balancing-Testwerte**, nicht verbindliche Endwerte. Die aktuelle Tagesdauer von 600 Echtzeitsekunden ist ebenfalls vorläufig.
- Ohne genügende Pflege kann die Entwicklung länger dauern; die tabellarischen Zeiten gelten bei vollständiger Pflege und normaler Versorgung.

## 2. Pflegemangel B – proportional mit Mindestfortschritt

- Testregel: **Tatsächliche Entwicklungsgeschwindigkeit richtet sich nach dem Verhältnis vorhandener zu benötigter Brutpflege**.
- Bei **50 % Pflegeabdeckung** verläuft die Entwicklung mit **50 % der normalen Geschwindigkeit**.
- Die Entwicklungsgeschwindigkeit fällt bei Unterbesetzung aber **nie unter 25 %** des Normalwerts; nach oben bleibt sie auf die normale Geschwindigkeit von **100 %** begrenzt. Es gibt **keinen Überpflege-Bonus** allein durch überschüssige Pflegekapazität.
- Als zunächst zu testende Rechenregel: `careCoverage = availableCareCapacity / assignedBroodCount`; bei vorhandener Brut `developmentSpeedFactor = clamp(careCoverage, 0.25, 1.0)`. `availableCareCapacity = assignedNurseCount * broodPerNurse`.
- **Vorher gewählter, ebenfalls veränderbarer Testwert:** Eine Brutpflegerin betreut bis zu **10 gleichzeitig zugewiesene Bruttiere** (zugewiesene Eier + Larven + Puppen).
- Die 25%-Untergrenze bedeutet bei fehlender Pflege, dass die Brut langsam weiterentwickelt wird; **keine automatische Brutmortalität nur wegen fehlender Pflege**. Diese Spielregel bleibt unverändert.
- Bei wechselnder Pflegebesetzung die Fortschrittsgeschwindigkeit im Spiel zeitabhängig anpassen. Bereits erreichter Fortschritt darf nicht verloren gehen; keine mehrfachen Stadienwechsel durch Zeitsprünge.
- Die konkrete Verteilung von Pflege auf mehrere Brutkammern und die Zuordnung der Brutpflegerinnen zu Kammern sind **noch nicht separat entschieden**. Obige Formel ist daher eine **provisorische Testmodellierung** und nicht die endgültige Personalverteilung.

### Rechenbeispiele (nur Testmodell)

| Pflegeabdeckung | Geschwindigkeit | Effektive Gesamtdauer bei konstanter Abdeckung |
| --- | ---: | ---: |
| 100 % oder mehr | 100 % | 6 Spieltage |
| 75 % | 75 % | 8 Spieltage |
| 50 % | 50 % | 12 Spieltage |
| 25 % oder weniger | 25 % | 24 Spieltage |

Die Zeitangaben ergeben sich bei konstanter Unterbesetzung; im tatsächlichen Spiel kann die Besetzung wechseln.

## 3. Unveränderte, bereits festgelegte Entscheidungen

- Königin legt **automatisch** Eier je nach Koloniezustand; Spieler **weist Eier spezialisierten Brutkammern zu**.
- Vorläufige Eiablagerate **5 Eier/Spieltag** bei guter Versorgung; Eierpuffer der Königin **50 unzugewiesene Eier**; langsamere Eiablage bei zunehmend vollem Puffer, Pause bei 100 %.
- Ein nicht zugewiesenes Ei reift nicht heran.
- Vier dauerhafte Spezialisierungen: Sammlerinnen, Baumeisterinnen, Kämpferinnen, Brutpflegerinnen.
- Für die Brut wird nur eine **vollständig ausgegrabene, eingerichtete und erreichbare** spezialisierte Brutkammer verwendet; Start-Testwerte **20 Kacheln Minimum und 2 Plätze/Kachel** (40 Plätze in einer Minimal-Kammer).
- Bei fehlender Pflege verlängert sich die Entwicklungszeit, die Brut stirbt dadurch **nicht automatisch**.
- Ressourcenmangel beeinflusst die Kolonie erst schrittweise gemäß **entspanntem Überlebenstempo A**; Pflegeeinflüsse und Ernährungsfolgen nicht unkontrolliert doppelt bestrafen.
- Ein Spieltag dauert aktuell testweise **10 Echtzeitminuten**.

## 4. Codex – Reihenfolge und Tests

1. **Vor Implementierungsbeginn lokalen VM-Stand und GitHub abgleichen**, insbesondere lokale neuere Teich-/Weltänderungen schützen.
2. Die bestehende Aufgabenreihenfolge aus der ersten Planungsdatei einhalten: Ressourcen und Transporte vor umfassender Königin-/Brutlogik. Nicht allein aufgrund dieser Datei alle späteren Systeme gleichzeitig umsetzen.
3. Wenn die Brutsimulation ansteht: Stadien und Dauer aus zentraler Konfiguration beziehen und individuelle oder gleichartige gebündelte Brut ohne doppelte Geburten simulieren.
4. Zugewiesene Brut beginnt bei Ei-Stadium mit `progress=0`; Eier im Königinnenpuffer erhalten keinen Entwicklungsfortschritt.
5. Entwicklungsfortschritt anhand `elapsedGameTime * developmentSpeedFactor` erhöhen; Stadienwechsel korrekt auch bei großen Zeitschritten durchlaufen und dabei die jeweiligen konfigurierten Etappendauern beachten.
6. Vorhandene Pflegekapazität vs. tatsächlich belegte Brutplätze prüfen. Die konkrete Personalzuordnung zu Kammern später separat entscheiden.
7. Prüfen: 1/3/2 Tage ergeben genau 6; konstante Pflegeabdeckungen 100 % / 75 % / 50 % / <=25 % führen testweise zu 6 / 8 / 12 / 24 Spieltagen; Überbesetzung beschleunigt nicht über normal; kein Tod nur durch Pflegepersonalmangel.
8. Unterschiedliche Simulationsupdate-Größen dürfen keine andersartigen Ergebnisse oder mehrfachen Geburten verursachen.

## 5. Nächster Planungsbereich (noch nicht beschlossen)

**Nahrungs- und Wasserverbrauch der Brut:**
- Verbrauchen Eier, Larven und Puppen jeweils gleich viel oder unterschiedlich?
- Werden Nahrung und Wasser direkt aus Lagern als Kolonieverbrauch gebucht oder müssen Brutpflegerinnen Ressourcen zuerst in die Brutkammern tragen?
- Welche Testmengen pro Stadium und Spieltag sind für das entspannt ausgelegte Überlebenssystem geeignet?

**Status: dokumentierte Wahl von Testwerten; Spielcode nicht verändert.**
