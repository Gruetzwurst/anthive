# ANTHIVE – Gemeinsame Wirkung von Brutpflegemangel und Ressourcenmangel

**Verbindliche Beschlüsse vom 22.10.2026:** Kombination **A** und getrennte Erholung **A**. Dieses Dokument präzisiert frühere Planungsdateien. Spielcode wird nicht verändert.

## 1. Kombination A: Der stärkere Engpass zählt

Wenn bei derselben Brut gleichzeitig zu wenige Brutpflegerinnen **und** zu wenig Nahrung oder Wasser vorhanden sind, bestimmt **der stärkere Entwicklungsengpass** das tatsächliche Entwicklungstempo. **Die Faktoren werden weder multipliziert noch addiert.**

- Der Pflegefaktor wird aus dem tatsächlichen Verhältnis von Pflegekapazität zur betreuten Brut berechnet.
- Der ressourcenbedingte Faktor wird anhand der tatsächlich gedeckten Larvenversorgung berechnet. Entscheidend ist die **schlechter gedeckte** Ressource (Nahrung oder Wasser), ohne Nahrung und Wasser doppelt zu bestrafen.
- Verbindliche Kombination: `gesamtFaktor = min(pflegeFaktor, ressourcenFaktor)`.
- Bei **50 % Pflege** und **50 % gedecktem Ressourcenbedarf** ist das Gesamtentwicklungstempo **50 %**, nicht 25 %.
- Bei **25 % Pflege** und **80 % Ressourcen** beträgt das Gesamtentwicklungstempo **25 %**.
- Bei ausreichend Pflege und Ressourcen: 100 %.
- Die früher beschlossene **Warnphase** für Larven-Unterversorgung gilt weiter: Am ersten zusammenhängenden Spieltag entsteht noch **kein zusätzlicher Ressourcenfaktor-Abschlag**. Ein bereits bestehender Pflegepersonalmangel wirkt währenddessen trotzdem.
- Die jeweiligen Mindestgeschwindigkeiten sind weiterhin **veränderbare Testwerte**: Pflegefaktor zwischen 25 % und 100 %, Ressourcenfaktor nach Warnphase zwischen 25 % und 100 %. Die Auswahl von `min` statt Multiplikation/Addition ist die **verbindliche Regel**.
- Für Ei- und Puppenstadium existiert kein direkter Nahrung-/Wasserverbrauch. Der Ressourcenabschlag betrifft den tatsächlichen Larvenmangel, nicht einen erfundenen Bedarf in anderen Stadien.

## 2. Erholung A: Ursachen getrennt behandeln

- Bei wieder ausreichender Nahrung **und** ausreichendem Wasser erholt sich der **ressourcenbedingte** Entwicklungsfaktor schrittweise innerhalb des bereits gewählten **einen Spieltags** (dieser Zeitraum ist ein **vorläufiger Testwert**).
- Wenn weiterhin zu wenige Brutpflegerinnen arbeiten, **bleibt der Pflegefaktor reduziert**.
- Sobald genügend Pflegerinnen zugewiesen sind, verbessert sich deren Pflegefaktor gemäß der vorhandenen Pflegeabdeckung, unabhängig von einer noch laufenden ressourcenbedingten Erholung.
- Der Gesamtfaktor wird weiter als Minimum beider aktuell gültigen Faktoren berechnet.
- Keine dauerhaften zusätzlichen Schäden allein durch vorherige Verzögerung und kein Verlust bereits erreichten Entwicklungsfortschritts.
- Bei anhaltend schwerem Larven-Nahrungs-/Wassermangel sind **frühestens ab dem siebten Mangel-Spieltag mögliche Brutverluste** vorgesehen. Das ist eine **separate** Mangel-/Sterblichkeitsregel; Pflegemangel allein führt nach wie vor nicht zu Bruttod. Kriterien und Verlustquoten bleiben offen.
- Ressourcen-/Pflegeursachen dürfen nicht in einem einzigen unspezifischen `underSupplied`-Status verschwinden. Die Benutzeroberfläche soll den tatsächlichen Engpass erkennen lassen.

## 3. Bestehende Testkonfiguration (unverändert)

- Spieltag: 600 Echtzeitsekunden.
- Brutentwicklung nach Zuweisung: 1 Spieltag Ei, 3 Larve, 2 Puppe.
- Pflegekapazität: 10 zugewiesene Bruttiere pro Brutpflegerin; Pflegefaktor testweise `clamp(pflegeAbdeckung, 0.25, 1)`.
- Larvenbedarf: 0,5 Nahrung + 0,5 Wasser pro Larve und Spieltag; Eier/Puppen direkt 0.
- Brutpflegerinnen liefern Nahrung und Wasser tatsächlich in die begrenzten Kammerreserven; Zielvorrat für zwei Spieltage, Nachfüllschwelle 50 %, Transport 5 Einheiten einer Ressource je Fahrt.
- Larven-Unterversorgung: erster Tag Warnung, ab Tag 2 verlangsamt, frühestens ab Tag 7 schweren Mangels mögliche Verluste; Erholung des Ressourcenfaktors über einen Spieltag.
- Ressourcenseitiger Testfaktor nach Warnphase: `max(0.25, min(nahrungsDeckung, wasserDeckung))`.
- Unterschied zwischen unterbesetzten Pflegerinnen und tatsächlichem Futtermangel stets erhalten.

## 4. Tests für Codex in der späteren Brutphase

1. Pflege 50 %, Ressourcen 50 % nach Warnphase → 50 % Tempo.
2. Pflege 80 %, Ressourcen 25 % → 25 % Tempo.
3. Pflege 25 %, Ressourcen 100 % → 25 % Tempo.
4. Pflege 100 %, Ressourcen 100 % → 100 % Tempo.
5. Erster Larven-Mangeltag mit 100 % Pflege → zunächst 100 % Tempo aus diesen Faktoren, aber Warnung.
6. Nahrung erholt sich, Wasser bleibt knapp → Ressourcenfaktor weiterhin eingeschränkt.
7. Nahrung/Wasser wieder gedeckt, Pflege nur 50 % → Ressourceneffekt verschwindet über einen Spieltag; Pflege begrenzt weiter auf 50 %.
8. Pflege wiederhergestellt, Larvenversorgung weiterhin mangelhaft → Ressourcenfaktor begrenzt weiterhin.
9. Pflegeunterbesetzung ohne Nahrungs-/Wassermangel verursacht **allein** keine Brutsterblichkeit.
10. Zeitfortschritt und Wiederherstellung verändern keinen abgeschlossenen Entwicklungsstand rückwirkend und erzeugen keine doppelten Geburten.

## 5. Codex-Reihenfolge

Diese Regel ist Teil der **späteren Königin-/Brutsimulation**, nicht des ersten Ressourcen-Grundauftrags. Vor Codeänderungen lokalen VM-Stand sicher mit GitHub abgleichen (lokal möglicherweise neuere Teichgrafik). Keine pauschale Komplettimplementierung aller Planungsdateien.

**Status:** Dokumentation verbindlicher Spielregeln plus klar gekennzeichneter vorläufiger Zahlen.
