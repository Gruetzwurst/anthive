# ANTHIVE – Vorläufige Testwerte: Eiablage, Eierpuffer und Brutpflege

**Auswahl vom 22.10.2026:** Eiablagerate **A**, Eierpufferkapazität **B**, Pflegekapazität pro Brutpflegerin **B**.

> **Alle drei Zahlen sind veränderbare Testwerte, keine endgültig festgelegten Balancewerte.** Zentral konfigurieren und in einer späteren spielbaren Simulation prüfen. Dieses Dokument ergänzt alle vorherigen Planungsdateien im Ordner `planung/`; keine Codeänderung.

## Gewählte Testwerte

| Parameter | Testwert | Bedingung |
| --- | ---: | --- |
| Eiablagerate der Königin | **5 Eier pro Spieltag** (Option A) | Gute Versorgung, ausreichend Platz, keine weiteren Einschränkungen |
| Kapazität des Eierpuffers in der Königinnenkammer | **50 unzugewiesene Eier** (Option B) | Feste Testobergrenze, später balancierbar |
| Pflegekapazität je Brutpflegerin | **10 Bruttiere gleichzeitig** (Option B) | Zählt zugewiesene Eier, Larven und Puppen |

Die früher gewählte Testzeit bleibt **1 Spieltag = 600 Echtzeitsekunden = 10 Minuten**. Deshalb entspricht die nominelle Rate bei durchgehend guten Bedingungen **5 Eiern pro 10 Minuten**. Die zuvor gewählte vollständige Entwicklungsdauer beträgt **vorläufig 6 Spieltage = 60 Minuten ab Zuweisung** bei ausreichender Pflege.

### Rechenbeispiel (nur Veranschaulichung)

Über sechs Spieltage legt die Königin bei unvermindert guter Versorgung und ohne Pufferbegrenzung rechnerisch **30 Eier**. Wenn diese 30 Eier alle sofort einer Brutkammer zugewiesen würden, würden für **30 gleichzeitig betreute Bruttiere** zunächst **3 Brutpflegerinnen** bei der Testkapazität von 10 pro Pflegerin benötigt. Bereits schlüpfende Ameisen, zeitversetzte Eiablage, freie Brutplätze, Pflegeunterbesetzung und Ressourcensituation können den tatsächlichen Bedarf verändern.

## Unveränderte verbindliche Designentscheidungen

- Königin legt **automatisch**, beeinflusst vom Zustand der Kolonie, Eier. Spieler verteilt Eier auf die **vier spezialisierten Brutkammertypen** (Sammlerinnen, Baumeisterinnen, Kämpferinnen, Brutpflegerinnen); damit wird die spätere dauerhafte Spezialisierung bestimmt.
- Nicht zugewiesene Eier bleiben in der **Königinnenkammer** und entwickeln sich dort **nicht weiter**. Erst Zuweisung zu einer betriebsbereiten Brutkammer startet die Entwicklung.
- Brutstadien werden einzeln simuliert: **Ei → Larve → Puppe → erwachsene Ameise**.
- Auch bei vollen Brutkammern kann die Königin zunächst weiterhin Eier legen, sofern im Eierpuffer Platz ist.
- Mit zunehmendem Pufferfüllstand **verlangsamt sich die Eiablage schrittweise**; bei vollständig ausgeschöpften 50 Testplätzen **pausiert** sie. **Die genaue Drosselkurve ist noch nicht entschieden**, keine feste Schwelle oder Form ohne Kennzeichnung als technischen Testparameter erfinden.
- Eine zu kleine Zahl an Brutpflegerinnen **verlangsamt die Entwicklung**, führt allein deshalb aber **nicht automatisch zu Brutsterben**.
- Mangel an Nahrung/Wasser beeinflusst die Eiablage entsprechend dem bereits gewählten **entspannten Überlebensmodell** (anfangs Warnungen, später sinkende Leistung/Eiablage, erst nach längerem Mangel mögliche Sterblichkeit). Pflege- und Versorgungsfaktoren sauber kombinieren, nicht doppelt bestrafen ohne festgelegte Regel.
- Brutkammer: vorläufig **20 Kacheln Mindestfläche** und **2 Brutplätze pro nutzbarer Kachel**; bei Minimalgröße daher **40 Brutplätze**. Diese Werte sind ebenfalls **veränderbare Testparameter**. Nur vollständig eingerichtete und erreichbare Kammern stellen Brutplätze bereit.

## Hinweise für die spätere Codex-Implementierung

1. Vor Spielcodeänderungen unbedingt **aktuelle lokale VM-Version mit GitHub abgleichen** (insbesondere lokal möglicherweise neuerer Teich); nicht versehentlich ältere Dateien darüber schreiben.
2. Der priorisierte Ablauf bleibt: **Ressourcen-Grundlage → echte Sammeltransporte → Verbrauch → Gruppen-/Arbeitssystem → Königin/Brut**. Dieses Dokument löst noch keine sofortige Implementierung aller Systeme aus.
3. `eggsPerGameDay=5`, `queenEggBufferCapacity=50`, `broodUnitsPerNurse=10` (Beispielnamen) zentral als Testwerte konfigurieren.
4. Eierpuffer und Brutkammerbelegung getrennt speichern und beim Zuweisen **ohne Verlust oder doppelte Zählung** aktualisieren. Unzugewiesene Eier nicht zum Pflegebedarf rechnen.
5. Eiablagerate im Verhältnis zum Spieltag und der Versorgung fortschreiben, dabei auch untertägige Updates und große Zeitsprünge konsistent behandeln.
6. Bei vollem Puffer niemals über die Kapazität hinaus Eier erzeugen. Bei nahezu vollem Puffer die **bereits beschlossene schrittweise Drosselung** anwenden; konkrete Kurve erst beim Balancing auswählen.
7. Die Zahl betreubarer Bruttiere aus Zahl **tatsächlich pflegender** Brutpflegerinnen und dem konfigurierten Wert von 10 berechnen; unterbesetzte Pflege verlangsamt später das individuelle/gesamte Entwicklungstempo.

## Spätere Akzeptanztests

- Bei guter Versorgung und genügend Platz entstehen im Test **5 Eier pro Spieltag**; bei voller Pufferkapazität **0**.
- Anzahl unzugewiesener Eier überschreitet nie **50**. Nahe der Puffergrenze liegt die Rate unter dem Normalwert.
- Unzugewiesene Eier entwickeln sich nicht; zugewiesene Eier entwickeln sich über alle vier Stadien.
- Genau 10 gleichzeitig betreute Bruttiere können bei voller Pflegezuweisung durch 1 Brutpflegerin regulär gepflegt werden; 11 überschreiten die Testkapazität.
- 30 zugewiesene Bruttiere und 3 tatsächlich eingesetzte Brutpflegerinnen sind bei den Testwerten ausreichend versorgt.
- Unterbesetzung verlängert die Entwicklung, ohne allein dadurch automatisch Eier/Larven/Puppen zu töten.
- Ressourcengüte, Brutkammergröße und Zuordnung werden berücksichtigt; bei mehrfachen Updates/Zeitsprüngen keine doppelte Eiablage.

## Nächste offene Entscheidungen

1. **Aufteilung der sechs Spieltage** auf Ei-, Larven- und Puppenstadium.
2. **Ausmaß der Verzögerung** bei zu wenigen Brutpflegerinnen; ggf. Verhältnis nach Pflegeabdeckung.
3. Bedarf von Nahrung/Wasser für Brut je Stadium und wo diese Ressourcen verbraucht werden; keine unbeschlossenen fixen Werte voraussetzen.

**Status: Alle drei Zahlen ausdrücklich vorläufig; keine Spielcodeänderung.**
