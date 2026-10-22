# ANTHIVE – Eierverteilung, volle Brutkammern und Brutpflege

**Verbindliche Nutzerentscheidungen vom 22.10.2026:** Nicht zugewiesene Eier **B**, volle Brutkammern **B**, Einfluss der Brutpflege **B**. Ergänzung zum Planungsordner `planung/`. **Keine Spielcodeänderung.**

## 1. Nicht zugewiesene Eier B – vorübergehend in Königinnenkammer sammeln
- Die Königin legt ihre Eier **selbstständig**, abhängig vom Zustand der Kolonie. Das ist bereits entschieden und wird nicht neu aufgerollt.
- **Nicht zugewiesene Eier dürfen zunächst in der Königinnenkammer verbleiben**.
- Die **Entwicklung beginnt erst nach der Zuordnung zu einer spezialisierten Brutkammer**.
- Der Spieler entscheidet über die Zuordnung der Eier. **Keine automatische Verteilung nach Zeitablauf**, solange nicht separat beschlossen.
- Die Eier müssen nicht sofort beim Legen verteilt werden. Die Anzahl gelagerter Eier darf später an die verfügbare Kapazität der Königinnenkammer gebunden werden.
- Eier dürfen bei Zuweisung oder mehrfachen Interaktionen weder dupliziert werden noch verschwinden.

## 2. Volle Brutkammern B – Eiablage mit Puffer
- Wenn alle spezialisierten Brutkammern voll sind, **legt die Königin zunächst weiter Eier**, solange in der **Königinnenkammer noch Platz für nicht zugewiesene Eier** vorhanden ist.
- **Dieser Puffer hat eine endliche Kapazität**; die genaue Grenze und das Verhalten bei vollständig erschöpftem Puffer müssen noch abgestimmt werden. Nicht unbegrenzt Eier anhäufen.
- Der Spieler kann **zusätzliche Brutkammern** bauen, um später weitere Eier den entsprechenden Spezialisierungen zuzuordnen.
- Bestehende Regeln bleiben: vier dauerhafte Spezialisierungen (Sammlerinnen, Baumeisterinnen, Kämpferinnen, Brutpflegerinnen); Brutkammer wird bei Planung einer Spezialisierung zugeordnet, fertiger Kammertyp wird nicht umgewidmet.
- Brutkammern haben **typspezifische Mindestgrößen** und ihre Brutkapazität wächst mit nutzbarer Fläche. Aktuelle **veränderbare Testwerte**: 20 Kacheln Mindestfläche für jede spezialisierte Brutkammer; 2 Brutplätze je nutzbarer Kachel. Diese Zahlen sind nicht final.
- Nur **fertige, eingerichtete und erreichbare** Brutkammern bieten Platz. Vorherige unvollständige Baupläne schaffen keine Kapazität.

## 3. Brutpflege B – Pflege beeinflusst Entwicklungsgeschwindigkeit
- **Ausreichend Brutpflege** ermöglicht die normale Entwicklung der zugewiesenen Eier und späterer Brut.
- **Fehlen Brutpflegerinnen oder reichen sie nicht aus**, verlängert sich die Entwicklungszeit.
- **Nicht beschlossen:** generelle Sterblichkeit der Brut allein durch fehlende Pflege (Option C). Das entspannte Überlebenstempo und die allgemeinen Ressourcenmangelregeln bleiben bestehen; mögliche andere Todesursachen sind davon separat zu behandeln.
- Wie viele Brutpflegerinnen für welche Anzahl Brut benötigt werden und wie stark Entwicklungszeiten bei Unterbesetzung verlängert werden, sind **noch offene Balanceparameter**, zentral konfigurierbar.
- Pflege beeinflusst **erst zugewiesene, sich entwickelnde Brut**; nicht zugewiesene Eier im Königinnenpuffer entwickeln sich bis zur Zuweisung nicht.
- Spielergesteuerte Gruppenzuweisungen und dauerhafte Spezialisierung bleiben erhalten; keine Einzelsteuerung.

## 4. Zusammenhang mit anderen festgelegten Regeln
- Die Eiablage ist automatisch und hängt von der Kolonieversorgung ab. Bei Ressourcenmangel verlangsamt sich zuerst die Arbeit und Eiablage, erst nach mehreren Tagen kann Sterblichkeit einsetzen; **entspanntes Überlebenstempo A**.
- Spieltag ist vorläufig **10 Minuten = 600 Echtzeitsekunden**, zentral konfigurierbar.
- Nahrung und Wasser werden separat gesammelt, gelagert und verbraucht.
- Brutkammern werden wie andere Kammern frei geplant, dann ausgegraben und mit Baumaterial eingerichtet, bevor sie nutzbar sind.
- Es gibt bereits vier Brutkammern im bekannten Startnest; die exakten Verhältnisse im aktuelleren lokalen VM-Stand müssen vor Codeänderungen geprüft werden.

## 5. Codex – Priorisierung und technische Anforderungen
1. **Vor jeglichem Spielcode-Eingriff lokalen VM-Stand und GitHub abgleichen**, insbesondere noch nicht gepushte Teich-/Weltänderungen erhalten.
2. Die vorrangige Reihenfolge weiterhin beachten: erst Ressourcen-Grundlage und echte Transporte, Verbrauch, Gruppen-/Aufgabenmodell, danach vollständige Königinnen- und Brutsimulation.
3. Für die spätere Brutsimulation getrennte Zustände modellieren: `unassignedEggs` in der Königinnenkammer (ohne Entwicklungsfortschritt) und `assignedBrood` je spezialisierter Brutkammer (mit Entwicklungsfortschritt und Pflegebedarf).
4. Die Eieranzahl muss beim Übertragen **atomar** zwischen Königinnenpuffer und Brutkammer verschoben werden, unter Beachtung freier Plätze.
5. Die Koloniezustandsfaktoren für Eiablage und Pflege nachprüfbar und zentral konfigurierbar halten.
6. Vorerst keine willkürliche automatische Eierverteilung, keine neue Mikromanagement-Steuerung und keinen pauschalen Brutverlust durch Pflegepersonalmangel hinzufügen.
7. Kein Komplettumbau der bestehenden Welt oder visuellen Brutkammern als Teil des ersten Ressourcenauftrags.

## 6. Akzeptanztests für eine spätere Brutimplementierung
- Königin legt automatisch Eier bis zur möglichen Kapazitätsgrenze und abhängig von Versorgung.
- Nicht zugewiesene Eier im Königinnenpuffer sammeln **keine Entwicklungszeit**.
- Spieler weist Eier einer spezialisierten Brutkammer zu: Menge sinkt im Puffer und steigt in der gewählten Kammer, ohne Verlust oder Verdopplung.
- Volle spezialisierte Brutkammern: keine Zuweisung über Kapazität hinaus; Eiablage läuft im freien Puffer weiter.
- Zusätzliche betriebsbereite Brutkammern schaffen neue Brutplätze und ermöglichen Zuweisungen.
- Ausreichende Pflege: normale Entwicklungszeit; zu wenig Pflege: längere Entwicklungszeit, nicht automatisch Brutsterben.
- Ressourcenmangel beeinflusst die automatische Eiablage gemäß bereits beschlossenem entspanntem Modell.
- Zuweisung zur Sammlerinnen-Brutkammer erzeugt später Sammlerinnen, analog für drei andere Spezialisierungen.

## 7. Offene nächste Entscheidungen – nicht stillschweigend vorwegnehmen
- Entwicklungsstufen **Ei → Larve → Puppe → erwachsene Ameise**: Dauer und ob jede Stufe einzeln simuliert werden soll.
- Kapazität des unzugewiesenen Eierpuffers in Königinnenkammer und Verhalten, wenn **auch dieser voll** ist.
- Pflegepersonalbedarf pro Brutmenge und Zeitverzögerung bei Unterversorgung.
- Wie die Spieleroberfläche zur Zuordnung von Eiern gestaltet wird (Gruppenmengen statt Einzel-Eierklicks).
- Exakte Eiablagerate und Effekte der Kolonieversorgung.

**Diese Datei dokumentiert die bestätigten Regeln. Alle nicht genannten Zahlen und Sonderfälle sind weiterhin offen.**
