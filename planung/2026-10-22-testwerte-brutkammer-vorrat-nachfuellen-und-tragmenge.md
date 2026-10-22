# ANTHIVE – Testwerte für Brutkammervorräte und Brutpflegerinnen-Transporte

**Nutzerentscheidung vom 22.10.2026:** Vorratsreichweite B, Nachfüllschwelle B, Tragkapazität der Brutpflegerinnen B.

> **Alle drei Zahlen sind vorläufige, zentral veränderbare TESTWERTE – keine endgültigen Balancewerte.** Dieses Dokument ergänzt die vorangegangenen Beschlüsse unter `planung/`. Noch keine Codeänderung.

## Gewählte Testkonfiguration

| Parameter | Testwert | Bedeutung |
|---|---:|---|
| Vorratsreichweite in jeder betriebsbereiten Brutkammer | **2 Spieltage** | Nahrung und Wasser jeweils ausreichend für zwei Spieltage der aktuell vorhandenen Larven |
| Nachfüllschwelle | **50 %** | Sobald ein Ressourcenbestand der Brutkammer auf/unter die Hälfte seines Zielvorrats sinkt, können Brutpflegerinnen das Nachfüllen dieses Ressourcentyps beginnen |
| Tragkapazität je Brutpflegerin und Lieferung | **5 Einheiten** | Pro Transport maximal fünf Einheiten **Nahrung oder Wasser**, nicht fünf von jeder Ressource zugleich |

Der bereits gewählte vorläufige Larvenverbrauch beträgt **0,5 Nahrung und 0,5 Wasser je Larve und Spieltag**. Zugewiesene Eier und Puppen haben **keinen direkten Brutverbrauch**.

### Beispielrechnung

Bei **20 Larven** in einer Brutkammer:
- Tagesbedarf: **10 Nahrung und 10 Wasser**.
- Zielvorrat für zwei Spieltage: **20 Nahrung und 20 Wasser**, jeweils separate Kapazität.
- Nachfüllschwelle (50 %): **10 Nahrung** bzw. **10 Wasser**. Jede Ressource einzeln prüfen.
- Von völlig leer bis Zielvorrat werden bei fünf Einheiten Tragkapazität **vier Nahrungsladungen und vier Wasserladungen** benötigt, sofern Quelllager, Wege und Pflegerinnen verfügbar sind.

Wenn die Larvenzahl variiert, soll auch der berechnete **Zielvorrat je Ressource** mit dem Bedarf angepasst werden. Eine schrumpfende Larvenzahl löscht **nicht** bereits real eingelagerte Ressourcen; Umgang mit vorübergehend höherem Istbestand als neuem Zielwert sauber modellieren. Das Verhältnis von Zielvorrat und harter Lagerobergrenze ist ein technischer Detailpunkt – keine Ressourcen wegwerfen.

## Verbindliche Regeln aus der bisherigen Planung

- Jede betriebsbereite spezialisierte Brutkammer hat **eigene kleine Vorräte für Nahrung und Wasser**.
- **Brutpflegerinnen** transportieren die Ressourcen **tatsächlich** aus den getrennten Lagerkammern in die Brutkammern; die Larven werden aus dem dort angekommenen Bestand versorgt.
- Die Vorräte in Brutkammern sind **keine allgemeinen Ressourcenlager** und sind begrenzt.
- Eier im Königinnenpuffer entwickeln sich nicht; zugewiesene Brut durchläuft **Ei → Larve → Puppe → erwachsene Ameise**.
- Vorläufige Entwicklungszeiten: **1/3/2 Spieltage** = **6 Spieltage** ab Zuweisung; ein Spieltag dauert testweise **10 Echtzeitminuten**.
- Zu wenige Brutpflegerinnen verlangsamen die Entwicklung gemäß den früheren vorläufigen Pflegefaktoren; **fehlendes Personal allein tötet keine Brut**.
- Fehlende tatsächliche Nahrung oder Wasser führen zunächst zu verlangsamter Larvenentwicklung, **erst nach längerem schwerem Mangel zu möglichem Brutverlust**. Konkrete Fristen sind noch zu entscheiden.
- Sichere Ressourcenbilanz: Quelllager verringern sich bei realer Entnahme, transportierte Ladung bleibt getrennt nachverfolgbar, Brutkammervorrat erhöht sich **erst bei Lieferung**; Larvenverbrauch zieht nur aus diesem Bestand ab. Keine Doppelbuchung, Phantomlieferung oder Überfüllung.
- Wenn ein Brutkammervorrat die Nachfüllschwelle erreicht, heißt das **nicht**, dass trotz fehlenden Quellvorrats oder unerreichbarer Route Ressourcen erzeugt werden dürfen.
- Die allgemeine Gruppensteuerung ohne Einzelmikromanagement und die intelligente Wegwahl gelten weiter.

## Umsetzungshinweise für Codex – priorisierte Reihenfolge

1. **Vor allen Spielcodeänderungen den aktuellen lokalen VM-Stand prüfen und mit GitHub abgleichen**; nicht gepushte Welt-/Teicharbeit nicht überschreiben.
2. **Erst** den bestehenden priorisierten Entwicklungsplan abarbeiten: Ressourcenbasis mit zentraler Uhr und Lagerzuständen, echte Sammeltransporte, Verbrauch, Gruppen-/Arbeitszuweisungen; **danach** die Königin-/Brutversorgung in separaten testbaren Schritten.
3. Im späteren Brutmodul pro betriebsbereiter Kammer: getrennte lokale Nahrung-/Wasserbestände, aktuelle Larvenzahl, daraus abgeleiteter Zielvorrat und Nachfüllschwelle.
4. Pro Ressourcentyp eigenständige Nachfüllentscheidung. Laufende und reservierte Liefermengen berücksichtigen, damit mehrere Brutpflegerinnen denselben Fehlbestand nicht mehrfach bestellen.
5. Transporte mit konfigurierbarer Kapazität von **5 Einheiten je Fahrt**, Teilmengen zulassen. Keine gemischte Ladung ohne eigenen späteren Beschluss.
6. Bei Änderung der Larvenzahl Zielvorräte neu berechnen, aber Istbestände nicht kommentarlos vernichten.
7. Fehlendes Futter/Wasser von bloß fehlender Pflegezeit sauber trennen. Schweren dauerhaften Larvenmangel erst gemäß den später festgelegten Warn-/Verlustschwellen behandeln.

## Akzeptanztests für später

- 20 Larven -> 10 Nahrung und 10 Wasser Tagesbedarf; Zielvorräte je 20; Schwelle je 10.
- Nahrung bei 10/20 löst Nachfüllbedarf **nur für Nahrung** aus, wenn Wasser noch über seiner Schwelle liegt.
- Eine Brutpflegerin transportiert maximal 5 Einheiten **einer Ressource** pro Lieferung; Teilladungen möglich.
- Bei zwei gleichzeitigen Pflegerinnen wird der Fehlbestand unter Berücksichtigung bereits reservierter/unterwegs befindlicher Ladungen nicht doppelt aufgefüllt.
- Lagerentnahme, Transport, Ankunft und Larvenverbrauch erhalten dieselbe Gesamtressourcenbilanz; keine frei erzeugten Einheiten.
- Sinkt die Larvenzahl, bleibt ein bereits real vorhandener überschüssiger Brutkammervorrat erhalten.
- Leere Quelllager/gesperrte Wege verursachen echten Lieferausfall, nicht Phantomvorräte.
- Nur Larven verbrauchen unmittelbar; Eier und Puppen verbrauchen 0 eigene Einheiten.

## Als nächstes zu entscheiden

- Wie lange darf eine **Larven-Unterversorgung** anhalten, bevor die Entwicklung gebremst wird und wann besteht Todesgefahr?
- Wie schnell erholt sich die Brut nach wiederhergestellter Versorgung?
- Wie warnen wir den Spieler rechtzeitig, ohne die Oberfläche mit Meldungen zu überladen?

**Status: Drei veränderbare Testwerte dokumentiert, Spielcode unverändert.**
