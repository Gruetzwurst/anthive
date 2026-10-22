# ANTHIVE – Larven-Unterversorgung und Erholung

**Entscheidungen vom 22.10.2026:** Larven-Unterversorgung **B**, Erholung nach Engpass **B**.

> Alle Zeitwerte und Entwicklungsfaktoren aus diesem Dokument sind **veränderbare Testwerte, keine endgültige Balance**. Das grundlegende Prinzip – zunächst langsamere Entwicklung, erst nach langer schwerer Unterversorgung mögliche Brutverluste – war bereits verbindlich beschlossen.

## 1. Unterversorgung B – entspannter Verlauf

Die hier gewählte vorläufige Testkurve für **anhaltenden tatsächlichen Mangel an Nahrung und/oder Wasser während der Larvenphase** lautet:

- **Erster Spieltag mit Unterversorgung:** Warnphase. Zunächst keine zusätzliche Verlangsamung allein aus dieser Mangelsituation. Ein bestehender Pflegepersonalmangel kann die Entwicklung unabhängig davon bereits bremsen.
- **Ab dem zweiten zusammenhängenden Spieltag:** Mangel wirkt als zusätzlicher begrenzender Faktor auf die Larvenentwicklung; die Entwicklung wird langsamer.
- **Frühestens ab dem siebten zusammenhängenden Spieltag:** Bei weiterhin **schwerer** tatsächlicher Unterversorgung sind Brutverluste möglich, nicht zwingend oder sofort in voller Höhe.
- Unterbrochene und wiederhergestellte Versorgung darf nicht wie ununterbrochener Mangel behandelt werden.
- `1 Spieltag = 600 Echtzeitsekunden` ist derzeit selbst ein vorläufiger Testwert.
- Die genauen Abstufungen der verlangsamten Entwicklung, Kriterien für „schwer“ und die Höhe/Wahrscheinlichkeit späterer Brutverluste sind **noch offen**. Keinen erfundenen festen Schadensprozentsatz als Entscheidung implementieren.
- Der Verlauf soll für die Kolonie **entspannt und rechtzeitig erkennbar** bleiben.

**Wichtig:** Diese Mangelfristen gelten für die **Larvenversorgung**, nicht pauschal identisch für Königin, adulte Ameisen oder Brutpflegemangel. Bereits vorher beschlossen: Zu wenige Brutpflegerinnen verlängern die Entwicklung, **töten die Brut allein dadurch aber nicht automatisch**.

## 2. Erholung B – über einen Spieltag

- Sobald die tatsächliche Larvenversorgung mit **Nahrung und Wasser** wieder ausreichend ist, normalisiert sich der **durch Ressourcenmangel entstandene Entwicklungsabschlag schrittweise im Verlauf eines Spieltags**.
- Bereits erreichter Entwicklungsfortschritt geht nicht verloren.
- Die Erholung hat **keine dauerhafte Zusatzstrafe**, wenn die Versorgung stabil wiederhergestellt ist.
- Bei erneutem Mangel kann ein neuer Unterversorgungszeitraum beginnen. Die präzise Behandlung kurzer Unterbrechungen innerhalb eines Spieltags bleibt ein Implementierungs-/Testdetail; keine manipulierbare sofortige Rücksetzung bei nur minimaler Lieferung vorsehen.
- Vorliegender Pflegepersonalmangel bleibt als eigenständige Ursache einer Verlangsamung bestehen, auch wenn die Larven wieder ausreichend Nahrung und Wasser erhalten.

## 3. Bestehende Regeln und Testparameter (unverändert)

- Nur **Larven** benötigen direkt Nahrung und Wasser; Eier und Puppen verbrauchen im Brutsystem direkt jeweils **0**.
- Pro Larve und Spieltag derzeit vorläufig **0,5 Nahrung + 0,5 Wasser**.
- **Brutpflegerinnen** liefern tatsächlich Nahrung/Wasser aus Lagerkammern zu **kleinen getrennten Vorräten je betriebsbereiter Brutkammer**. Direkte Phantomabbuchungen aus globalen Lagern verboten.
- Zielvorrat pro Brutkammer derzeit **2 Spieltage** nach aktueller Larvenzahl, Nachfüllen ab **50 % Rest**, eine Brutpflegerin trägt vorläufig **5 Einheiten einer Ressource** je Lieferung. Alles veränderbare Testwerte.
- Entwicklung **Ei → Larve → Puppe → erwachsene Ameise**, vorläufig **1 + 3 + 2 = 6 Spieltage** ab Zuordnung eines Eis zur spezialisierten Brutkammer.
- Pflegekapazität derzeit vorläufig **10 Bruttiere je Brutpflegerin**. Bei Personal-Unterbesetzung beträgt die Entwicklungsgeschwindigkeit testweise zwischen **25 und 100 %** des Normaltempos. Pflegemangel und tatsächlicher Futtermangel sind getrennte Zustände; keine ungewollte doppelte Bestrafung.
- Larvenmangel kann bei langer schwerer Unterversorgung Brutverlust verursachen; **Pflegepersonal-Unterbesetzung allein nicht**.
- Allgemeines Kolonie-Überlebenstempo A (entspannt), separate Versorgung der Königin und Adulten sowie Kolonie-Eiablage bleiben bestehen.

## 4. Codex-Aufgaben und Testfälle – später im Brut-Arbeitspaket

**Reihenfolge:** Zuerst lokalen, ggf. neueren VM-Stand mit GitHub sicher abgleichen (besonders ungesicherte Teichgestaltung). Danach die bereits priorisierten Entwicklungsaufträge: Ressourcen-Grundlage, echte Sammeltransporte, Verbrauch, Arbeitsgruppen; Brut erst darauf aufbauen. **Nicht alle Planungsdokumente gleichzeitig implementieren.**

Für das spätere Brut-/Larvenmodul:

1. Tatsächliche Versorgungsdeckung pro Brutkammer aus real angelieferten Vorräten und aktuellem Bedarf messen. Nahrung und Wasser getrennt prüfen; bei Mangel einer der beiden Ressourcen kein vollständiger Versorgungszustand.
2. Zusammenhängende Unterversorgung in Spielzeit verlässlich verfolgen und Warnung an die jeweilige Brutkammer ausgeben, ohne jedes Simulationsupdate dieselbe Meldung zu wiederholen.
3. Bei Beginn der Unterversorgung Warnphase von einem Spieltag; ab Tag 2 sinkt die Entwicklungsgeschwindigkeit durch Nahrung-/Wassermangel; frühes Brutsterben verhindern.
4. Mögliche Brutverluste **frühestens ab Spieltag 7 anhaltenden schweren Mangels**, mit separat später festzulegenden Risiken und Schwellen.
5. Nach wiederhergestellter Versorgung den ressourcenbezogenen Entwicklungsfaktor im Verlauf **eines Spieltags** auf normal zurückführen; Personalpflegefaktor eigenständig berücksichtigen.
6. Keine doppelten Brutverluste, keinen mehrfachen Entwicklungsabschluss und keine Ressourcenverdopplung bei Zeitsprüngen, Teil-Lieferungen oder wechselnder Larvenzahl.
7. Entwicklung darf bereits erworbene Fortschritte bei kurzzeitigem Mangel nicht verlieren.

**Akzeptanztests:** Warnung in erster Unterversorgungsphase; keine ressourcenbedingte Verlangsamung vor Ablauf des ersten Spieltags; Verlangsamung ab Tag 2; keine Verluste vor Tag 7; frühestens nach ausreichend langer schwerer Unterversorgung mögliche Verluste; schrittweise Erholung über einen Spieltag; 50 %-Pflegeabdeckung verlangsamt die Brut unabhängig vom Ressourcenmangel; vorhandene kleine Brutkammervorräte verhindern einen falschen Mangel während Lieferverzögerung.

## 5. Noch offen / nächste sinnvolle Planung

- **Exakter Entwicklungsfaktor** bei nicht ausreichend versorgten Larven, inklusive Umgang mit teilweise gedecktem Bedarf.
- Schweregradkriterium für „schweren“ Mangel und konkrete, sanfte Brutverlustquote ab Tag 7 (als Testwerte).
- Kurze Ausfälle zwischen zwei Lieferungen und faire Rücksetz-/Erholungsregel.
- **Gesamtprüfung der vielen Planungsdokumente** auf technische Widersprüche, Abhängigkeiten und eine realistische, priorisierte Codex-Arbeitsreihenfolge.
