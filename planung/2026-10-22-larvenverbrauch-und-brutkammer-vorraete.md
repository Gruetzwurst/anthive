# ANTHIVE – Larvenverbrauch und Vorräte in Brutkammern

**Beschlüsse vom 22.10.2026:** Larvenverbrauch **B als vorläufiger Testwert**, Vorratshaltung in Brutkammern **B als verbindliche Spielregel**.

> Diese Datei ergänzt die bisherigen Planungsdateien in `planung/`. **Sie verändert keinen Spielcode.** Verbindliche Mechaniken und konfigurierbare Zahlen ausdrücklich getrennt behandeln.

## 1. Vorläufige Testwerte – Larvenverbrauch B

| Entwicklungsstadium | Nahrung je Individuum und Spieltag | Wasser je Individuum und Spieltag |
| --- | ---: | ---: |
| Ei (zugewiesen oder nicht zugewiesen) | **0** | **0** |
| **Larve** | **0,5** | **0,5** |
| Puppe | **0** | **0** |

- Der Wert **0,5 Nahrung und 0,5 Wasser pro Larve je Spieltag** ist ausdrücklich **vorläufig und zentral konfigurierbar**. Nicht als endgültig balancierten Wert in den Code streuen.
- Bereits **verbindlich beschlossen**: nur Larven benötigen direkt Nahrung und Wasser. Eier und Puppen haben keinen direkten Brut-Ressourcenverbrauch. Königin, Brutpflegerinnen und andere erwachsene Ameisen benötigen weiterhin ihre separate allgemeine Versorgung.
- **Rechenbeispiel:** 10 Larven benötigen testweise insgesamt 5 Nahrung und 5 Wasser pro Spieltag. 40 Larven benötigen 20 Nahrung und 20 Wasser pro Spieltag.
- Ein Spieltag dauert derzeit testweise 600 Echtzeitsekunden. Die Entwicklung dauert testweise 1 Spieltag Ei, 3 Larve, 2 Puppe. Bei normaler Versorgung benötigt eine einzelne Larve während ihrer dreitägigen Larvenphase testweise insgesamt 1,5 Nahrung und 1,5 Wasser.
- Bruchteile müssen korrekt abgerechnet werden (z. B. Fließkomma-/Fixed-Point- oder akkumulierte Teilbeträge), damit aus 0,5 nicht versehentlich 0 oder 1 wird.
- Der spätere Entwicklungs-/Verbrauchs-Takt muss sich nach der gemeinsamen Spieluhr richten; keinen zusätzlichen separaten Echtzeit-Timer erfinden.

## 2. Verbindliche Spielregel – Vorratshaltung in Brutkammern B

- Jede **betriebsbereite spezialisierte Brutkammer** darf **kleine, begrenzte Vorräte an Nahrung und Wasser** für ihre eigene Larvenversorgung besitzen.
- **Brutpflegerinnen** holen beide Ressourcen aus den jeweiligen Lagerkammern, transportieren sie tatsächlich zur Brutkammer und **füllen die dortigen kleinen Vorräte selbstständig wieder auf**.
- Vorräte in Brutkammern sind **keine unbegrenzten oder allgemeinen Nahrung-/Wasserlager**; sie dienen der ortsnahen Versorgung der Larven. Es gelten getrennte Bestände und getrennte Obergrenzen für Nahrung und Wasser.
- Der Larvenverbrauch erfolgt aus dem **tatsächlich angelieferten Bestand der jeweiligen Brutkammer**, nicht aus einem abstrakt überall verfügbaren Kolonielager. Beim Entnehmen aus einem Lager und Einlagern in der Brutkammer keine doppelten Bestände erzeugen; beim Verbrauchen nur einmal abziehen.
- Bei kleinen Lieferverzögerungen kann die Brut ihren Vorrat nutzen, bevor ein echter Nahrungs-/Wassermangel einsetzt.
- Hat eine Kammer gerade keine Larven, entsteht aus ihr **kein fiktiver Larvenverbrauch**; wie viel dann vorsorglich eingelagert werden darf, ist noch als logische Nachfüllregel zu konkretisieren.
- Die **Vorratsgröße, Nachfüllschwelle, Tragmenge einer Brutpflegerin** und Auswahl des Quelllagers sind **noch nicht entschieden**; erst im nächsten Planungsabschnitt Testwerte festlegen.
- Eine nicht ausgegrabene oder nicht eingerichtete Brutkammer besitzt **noch keine funktionsfähigen Vorratsplätze**.
- Bei unzureichender tatsächlicher Versorgung wird die Entwicklung zunächst verlangsamt; **erst nach längerem schwerem Mangel** drohen Brutverluste. Genaue Schwellen bleiben offen. **Zu wenige Brutpflegerinnen allein** verlangsamen die Entwicklung, töten die Brut nicht automatisch.

## 3. Unveränderte bisherige Regeln

- Automatische Eiablage der Königin; Zuweisung von Eiern auf die vier spezialisierten Brutkammertypen durch den Spieler.
- Nicht zugewiesene Eier reifen im Königinnenpuffer nicht heran.
- Brutstadien: Ei → Larve → Puppe → erwachsene Ameise; derzeitige Testdauern 1/3/2 Spieltage.
- Testwerte: 5 Eier/Spieltag, Königinnen-Eierpuffer 50, eine Brutpflegerin betreut 10 Bruttiere; 25–100 % Entwicklungsgeschwindigkeit bei Pflegeunterbesetzung.
- Brutkammergrößen und -kapazitäten bleiben unverändert: vorläufig 20 Kacheln Minimum, 2 Brutplätze je nutzbarer Kachel; funktionsfähig erst nach Einrichtung.
- Nahrung und Wasser in getrennten, endlich großen Lagerkammern, mehrere Lager möglich. Wegwahl nach erwarteter Dauer und Tunnelbelastung.
- Entspanntes Überlebenstempo und Warnungen bei Engpässen.

## 4. Codex – Umsetzung später und in Reihenfolge

1. Zuerst die **lokale VM-Version sicher mit GitHub abgleichen**, insbesondere unveröffentlichte Teich-/Weltänderungen nicht überschreiben.
2. Die priorisierte Reihenfolge aus der ersten Planungsdatei respektieren: Ressourcen/Spieluhr/Lager → echte Sammlertransporte → Verbrauch/Gruppenverwaltung → Königin und Brut. **Nicht alle Planungsdateien in einem einzigen Durchgang implementieren.**
3. Wenn die Brutversorgung ansteht, pro betriebsbereiter Brutkammer `foodStock`, `waterStock` sowie getrennte konfigurierbare Kapazitäten vorsehen.
4. Der Bedarf wird anhand der **aktuellen Zahl von Larven** und der konfigurierten Verbrauchswerte berechnet. Eier/Puppen zählen für direkten Verbrauch nicht dazu.
5. Nur durch echte Brutpflegerinnen-Transporte wird der Vorrat einer Kammer erhöht; Lager, unterwegs befindliche Ladung, Kammerbestand und verbrauchte Menge korrekt verbuchen.
6. Vor dem Verbrauch fehlende Ressourcen als tatsächlichen Versorgungsmangel erkennen, mit schrittweisen Folgen entsprechend den später festzulegenden Schwellen.
7. Keine unabhängigen Spieluhren, beliebigen neuen Lagerarten oder fiktiven Vorratsgutschriften anlegen.

## 5. Vorgeschlagene spätere Tests

- 10 Larven verbrauchen in einem Spieltag bei voller Versorgung **5 Nahrung und 5 Wasser** aus dem Bestand ihrer Brutkammer.
- 10 Eier oder 10 Puppen verbrauchen **0 Nahrung und 0 Wasser** direkt.
- Brutkammer-Nachfüllung erfolgt nur durch tatsächliche Lieferung; Lagerbestand sinkt bei Entnahme, Brutkammervorrat steigt bei Ankunft, kein Doppelzählen.
- Kleine nachfüllbare Vorräte werden nie über ihre Kapazitätsgrenze hinaus gefüllt.
- Bei Lieferverzögerung mit vorhandenem Vorrat entsteht kein künstlicher Mangel; bei tatsächlich leerem Vorrat wird Mangel erkannt.
- Einzelne Brutkammern haben getrennte Vorräte; Lieferungen in Kammer A füllen nicht automatisch Kammer B.
- Bruchteilsverbrauch und größere Zeitsprünge liefern konsistente Ergebnisse.
- Nur vollständig ausgebaute und eingerichtete Kammern können versorgt werden.

## 6. Nächste offene Planungsfragen

1. **Wie viel Nahrung und Wasser soll eine Brutkammer bevorraten?** (z. B. Vorrat für 1, 2 oder 3 Spieltage anhand aktueller Larvenzahl.)
2. **Wann sollen Brutpflegerinnen automatisch nachfüllen?** (z. B. unter einem bestimmten Füllstand oder für eine Reichweite in Spieltagen.)
3. **Wie viele Nahrung-/Wassereinheiten können Brutpflegerinnen pro Lieferung tragen?** (zentral änderbarer Testwert.)

**Status: Entscheidungen dokumentiert; kein Spielcode geändert.**
