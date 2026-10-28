# ANTHIVE – D2: Natürliche Kolonieentwicklung, Berufsverbesserungen und mehrere Königinnen

**Stand: 28.10.2026. STATUS: DESIGNPLANUNG – KEINE CODEFREIGABE.**
Dieses Dokument hält die Gespräche und ausdrücklichen Entscheidungen des Spielers fest. **Nichts aus D2 ungefragt implementieren.** Die bestehende Implementierung (C1–C4) und C5-Wachstumstests zuerst prüfen; D1 (Speichern/Laden) ist separat geplant und bleibt in der priorisierten Reihenfolge vor D2. Bestehende Kolonien, Welt, Zoom und Oberflächenbau nicht verändern.

## 1. Grundprinzipien – beschlossen

- Keine abstrakten Forschungspunkte, kein Forschungswährungs-/Materialverbrauch, keine künstlichen Wartezeiten nach erfüllten Bedingungen.
- Normale Berufsverbesserungen gelten **für alle Ameisen der jeweiligen Spezialisierung**, sofort und dauerhaft bei Erreichen der Voraussetzung. Keine Einzelameisen-Upgrades.
- Koloniegröße ist der Haupt-Meilenstein. Freigeschaltete Fortschritte bleiben bei späterem Bevölkerungsrückgang erhalten; für den Meilenstein zählt die höchste bisher erreichte Koloniegröße. Mehrere Kolonien haben getrennte Fortschritte.
- Vier dauerhafte Spezialisierungen: Sammlerinnen, Baumeisterinnen, Brutpflegerinnen, Kämpferinnen. Keine Pflicht zu gleich großen Gruppen. Die spezifische Anzahl einer Berufsgruppe schaltet keine Verbesserung frei.
- **Arbeitsfremde Tätigkeit bleibt bei 50 % Effizienz** im Vergleich zur aktuell entwickelten Fachberufsleistung, einschließlich zukünftiger Verbesserungen. Keine doppelte 50-%-Strafe auf mehrere Leistungsgrößen, die unbeabsichtigt 25 % oder weniger effektive Produktivität ergibt. Welche exakte Leistung (Tempo/Traglast) beim Wechsel des Arbeitseinsatzes verwendet wird, bedarf technisch eindeutiger Regeln und Tests; Transport-/Bruchteilrundung darf keine Ressourcen erzeugen. Bei Grabkraft darf fachfremder Einsatz nicht wegen halbierter Berechtigungsstufe tiefe Schichten blockieren; 50 % betrifft Arbeitseffizienz, nicht die grundsätzliche Freigabe.
- Normale Entwicklung von späteren **optionalen Schlüsselentwicklungen** trennen: später besondere Arbeitsweisen statt weiterer Prozentwerte; langfristig alle erforschbar, aber begrenzte gleichzeitig aktive mächtige Entwicklungen als bislang diskutiertes, **noch nicht final beschlossenes** Konzept.
- **Transportketten** als mögliche spätere Schlüsselentwicklung für große Kolonien vormerken. Noch keine konkrete Mechanik/Umsetzung beschlossen.

## 2. Welt / Fortschritt durch Grabkraft – beschlossenes Ziel

- Die Welt ist endlich; vorhandene Weltgröße, Kamera und Zoom **vorerst unverändert lassen**. Oberirdisch darf aktuell **weder gebaut noch abgebaut** werden. Die Kolonie soll weit herausgezoomt betrachtet werden können; keine neue Zoomfunktion in D2 beauftragt.
- Die fünf existierenden regulären Schichten bleiben: **Oberboden, kompakte Erde, Lehm, Steinschicht, Tiefengestein**. Einzelner gesonderter Steintyp/Steinvorkommen existiert zusätzlich.
- **Grabkraft-Freigaben nach höchster erreichter Gesamtpopulation:** Start = Oberboden; **50** = kompakte Erde; **150** = Lehm; **250** = Steinschicht; **500** = Tiefengestein.
- Die aktuellen Test-Grabkraftgrenzen im Code sind noch **rein tiefenbasiert mit 4 Graden (0–3)**, unabhängig von den 5 visuellen Bodenschichten. D2 muss später diese Zuordnung auf **fünf passend abgestimmte Freigabestufen** umstellen; Besonderheiten von Steinvorkommen/überlappenden Grenzkacheln ausdrücklich testen.
- Tiefere Zonen sollen künftig einen echten spielerischen Mehrwert/Entdeckungen bringen; konkrete Ressourcen/Vorteile **später bestimmen**, keine neuen Mineral-/Wassermechaniken jetzt erfinden.
- Tiefe soll die Kolonieentwicklung belohnen, die grundlegende Ernährung/Überlebensfähigkeit aber nicht durch einen harten Zwang zur tiefsten Zone verklemmen.

## 3. Baumeisterinnen – beschlossene Balance-Zielwerte (vor praktischen C5-/Performance-Tests)

**Grabkraft und Grabgeschwindigkeit steigen automatisch gemeinsam** bei 50/150/250/500; alle Baumeisterinnen profitieren sofort. Grabdauer-Kurve, bezogen auf bisherige Basissekunden jeder Erde:

| Erreichte Ameisen | Grabdauer-Faktor | Ersparnis |
| --- | ---: | ---: |
| Start | 1,00 | 0 % |
| 50 | 0,85 | 15 % |
| 150 | 0,65 | 35 % |
| 250 | 0,45 | 55 % |
| 500 | **0,25** | **75 %** |

**Keine künstliche Mindestgrabdauer:** Oberboden aktuell 6 s/Kachel → bei 500 Ameisen **1,5 s/Kachel**; Tiefengestein aktuell 36 s → **9 s/Kachel**. Bestehende Basissekunden aktuell: Oberboden 6, kompakte Erde 12, Lehm 18, Steinschicht 30, Tiefengestein 36; separater Stein 30. Werte sind reale derzeitige Code-Konfiguration, D2-Faktoren sind vereinbarter Balanceentwurf und ggf. später testgestützt zu korrigieren.

**Auch die Einrichtung/Bauarbeit beschleunigt sich**. Ausgangswert aktuell: 2,0 s je verbaute Materialeinheit. Gemeinsam diskutierter Stufenentwurf:

| Erreichte Ameisen | Einrichtungszeit je Materialeinheit |
| --- | ---: |
| Start | 2,0 s |
| 50 | 1,8 s |
| 150 | 1,5 s |
| 250 | 1,2 s |
| 500 | **0,8 s** |

Die 0,8 Sekunden entsprechen 60 % weniger Einrichtungsdauer als zu Beginn, **nicht** ebenfalls 75 %. Kammerkosten und reale Materialbilanz bleiben. Abraumtransport, Arbeitswege, Verkehrsengstellen und Materiallieferung bleiben echte Vorgänge; **keine automatischen Transportketten oder kostenlosen Materialtransport-Boni**. Wahrnehmbare reale Baugeschwindigkeit trotz Logistik durch C5/nachgelagerte Tests prüfen; Zahlen nicht blind extrapolieren.

## 4. Sammlerinnen – akzeptierter Balanceentwurf

Bestehende Ausgangswerte aus Code: **5 Einheiten Traglast**, **78 Pixel/s Laufgeschwindigkeit**, **0,25 s Aufnahme** und **0,25 s Abladen**. Keine zusätzliche Sammel-/Abladetempo-Steigerung vorsehen; leere und beladene Sammlerinnen bewegen sich grundsätzlich gleich schnell, außer bei bestehendem Verkehr/Unterversorgung.

| Erreichte Ameisen | Traglast Nahrung/Wasser | Grund-Laufgeschwindigkeit |
| --- | ---: | ---: |
| Start | 5 | 78 px/s |
| 50 | 7 | 84 px/s |
| 150 | 9 | 91 px/s |
| 250 | 12 | 98 px/s |
| 500 | **15** | **105 px/s** |

Die Quelle hat nur ihren realen Bestand und ihre Regeneration; höhere Traglast erschafft **keine Ressourcen**. Echte Lagergrenzen, Reservierungen, Ladeströme und Verkehrsengstellen bleiben erhalten. Bei Arbeitsfremden weiter 50 % Effizienz, auf der jeweiligen aktuellen Fachleistungsbasis; **kein Verdoppeln der Effizienznachteile** durch parallele Tempo- und Laststrafen. Transport von Abraum/Baumaterial ist vom Nahrung-/Wassersammeln zu unterscheiden; keine unbedachte globale Anwendung der Sammlerwerte.

## 5. Brutpflegerinnen – aktueller Stand und noch offene Balance

Der gegenwärtige Code verwendet **10 Bruttiere pro effektiver Brutpflegerin**, 5 Einheiten Traglast bei Brutversorgung, 78 px/s Bewegung; Standardbrut: Ei **1 Tag**, Larve **3 Tage**, Puppe **2 Tage**; Versorgung der Larve je Spieltag **0,5 Nahrung und 0,5 Wasser**. Königin legt derzeit testweise **5 Eier je Spieltag** (sofern Versorgung/Puffer/Kammern es zulassen). Dieser Bestand wurde geprüft.

Diskutierter, ausdrücklich **noch nicht endgültig freigegebener** Zielentwurf für Pflegekapazität und Brutversorgungstraglast:

| Erreichte Ameisen | Max. Bruttiere/Pflegerin | Traglast |
| --- | ---: | ---: |
| Start | 10 | 5 |
| 50 | 12 | 6 |
| 150 | 15 | 8 |
| 250 | 18 | 10 |
| 500 | 20 | 12 |

Keine künstliche Beschleunigung normaler Brutentwicklung beschlossen; sechs Tage bei voller Versorgung bleiben vorerst bestehen. **C5 und künftige Mehrköniginnen-Tests müssen** prüfen, ob diese Verbesserungen tatsächlich relevant sind, wie effizient Transport/Pflege arbeitet und welche Kapazitäten nötig werden. Nur eine Königin mit 5 Eiern/Tag erzeugt unter idealen Bedingungen etwa 30 Bruttiere gleichzeitig (grobe Überschlagsrechnung), wodurch zu große Pflege-Upgrades nutzlos wirken können. Mehrere Königinnen ändern diesen Engpass.

## 6. Mehrere Königinnen – verbindliche Entscheidungen

**Spielerbeschluss:** Weitere Königinnen durch **neue Königinnenkammern** mit eigenem Königinnen-Ei heranziehen, **nicht** automatisch durch Erreichen einer Koloniegröße spawnen. Alle bisherigen Königinnen bleiben am Leben, sofern sie nicht durch bestehende, später zu definierende Todes-/Mangelregeln sterben. Kein automatisch erzwungener Königinnenwechsel.

**Maximal verfügbare gleichzeitig heranziehbare Königinnen:**
- Spielbeginn: 1 Königin.
- Ab **150 Ameisen**: 2 Königinnen.
- Ab **500 Ameisen**: 3 Königinnen.
- Ab **1.000 Ameisen**: 4 Königinnen.

Schwellen basieren auf der jemals erreichten Koloniegröße und verfallen nicht bei Bevölkerungsrückgang. Höhere Begrenzungen über 1.000 Ameisen sind noch nicht beschlossen. Königinnenanzahl-Ziel ist die Gesamtzahl lebender Königinnen, nicht Anzahl zusätzlicher Kammern. Der Spieler entscheidet über den Bau der zusätzlichen Kammer; lediglich die **Bauoption wird freigeschaltet**.

**Ablauf:**
1. Ein Meilenstein schaltet den Bau **einer weiteren** Königinnenkammer innerhalb des erlaubten Maximums frei.
2. Baumeisterinnen graben die Kammer und richten sie **vollständig** nach bestehenden Regeln ein; unvollständig eingerichtete oder unerreichbare Kammer ist nicht betriebsbereit.
3. Eine bestehende Königin produziert ein **besonderes Königinnen-Ei**; eine Brutpflegerin holt es wie normalen Nachwuchs ab und trägt es in die neue Königinnenkammer (kein spontanes Ei aus dem Nichts, kein Spawn der neuen Königin).
4. Die Königinnenbrut entwickelt sich **in dieser neuen Königinnenkammer** zu einer Königin, mit Pflege und realer Versorgung.
5. Nach Entwicklung übernimmt die neue Königin die Kammer und beginnt unter den bestehenden Versorgungs-/Pufferbedingungen Eier zu legen.
6. **Alle Königinnen verhalten sich bzgl. normaler Eiablage wie die ursprüngliche:** Ihre normalen Eier werden **in der jeweiligen Königinnenkammer gelegt**, danach holen Brutpflegerinnen diese ab und transportieren sie zu den **spezialisierten Brutkammern**. Keine normale Brutentwicklung im Königinnenraum. Automatische Zuteilung über Spieler-Prozentquoten für vier Berufsgruppen und sinnvolle Verteilung auf betriebsbereite Brutkammern unverändert erhalten.
7. Pro zu besetzender zusätzlicher Königinnenkammer nur **ein** aktiver Königinnen-Nachwuchs; überzählige parallele Heranziehung und Überschreiten des Kolonie-Königinnenlimits verhindern. Kein Verlust/Mehrfachschreiben von Eiern durch mehrere parallele Pflegerinnen.

**Besondere Entwicklungszeit und Kosten (verbindlich):**

| Brut | Ei | Larve | Puppe | Gesamt | Nahrung je Larventag | Wasser je Larventag |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Gewöhnliche Arbeiterin | 1 Spieltag | 3 Spieltage | 2 Spieltage | **6 Spieltage** | 0,5 | 0,5 |
| Neue Königin | **2 Spieltage** | **6 Spieltage** | **4 Spieltage** | **12 Spieltage** | **1** | **1** |

Nur Larven verbrauchen Nahrung/Wasser direkt. Eine Königinnenlarve benötigt während ihrer Larvenzeit **6 Nahrung + 6 Wasser**, verglichen mit **1,5 + 1,5** für eine normale Arbeiterinnenlarve unter idealen Bedingungen: 4-facher Gesamtverbrauch je Ressource in der Larvenphase. Die Versorgung muss über **physisch transportierte** Vorräte erfolgen; keine zusätzlichen magischen Ressourcen. Bestehendes Pflege-/Mangelverhalten (einschließlich Minimum von Pflege- und Ressourcenfaktor, Warn-/Erholungsregeln) grundsätzlich wiederverwenden; für königliche Brut ist die genaue Sonderbehandlung von Pflegekapazität und gravierenden Engpässen **vor Implementierung zu klären**. Keine automatische Soforttötung nach kurzem Engpass; langfristige schwere Unterversorgung darf nach expliziter Balanceprüfung Folgen haben.

**Devil's Advocate / Tests zwingend:**
- Wachstum wird durch zusätzliche 5 Eier/Tag pro Königin stark beschleunigt; mathematische 10/15/20 Eier/Tag sind **theoretische Maxima**, nicht zugesicherte reale Raten.
- Königinnen brauchen eigenständige, persistente Identitäten/Zustände/Kammerzuordnung/Eierpuffer; D1-Save-Schema muss spätere Erweiterung erlauben. Mehrere Königinnen dürfen Eier/Ressourcen nicht verdoppeln oder gegenseitig Reservierungen zerstören.
- Herkunft und Auslösung des besonderen Eis im normalen Eierpuffer/bei besetztem Eierpuffer, Auswahl der spendenden Königin und Zeitpunkt der Initiierung sind **noch offen**. Die Königin muss das Ei legen, die Pflegerin transportiert es; keine automatische unbegrenzte Königinnenproduktion.
- Lage, minimale Fläche und genaue Baukosten neuer Königinnenkammern sind **offen**; bestehende Königinnenkammer als Vorbild, keine willkürlichen Zahlen ergänzen.
- Bei vollem Brutkammerbestand oder mangelnder Pflege darf das System nicht weiter unbegrenzt Nachwuchs erzeugen; bereits implementierte Pufferdrosselung und Mangelregeln auf jede Königin sicher anwenden.
- Was bei Tod einer Königin, unbetreibbarer Königinnenkammer, Abbruch eines königlichen Brutauftrags, Kammerzerstörung oder Rückgang der Population geschieht, ist teilweise **offen** (erreichte Freischaltungen bleiben jedoch).
- Simulationen für 150/500/1.000 Ameisen, 1–4 Königinnen und ressourcenbedingte Engpässe: echte Spieltage bis zu den Schwellen, Versorgung, freie Kammern, Brutpflege, Verlustkurven und langfristige Performance messen, nicht bloß annehmen.

## 7. Kämpferinnen und spätere Schlüsselentwicklungen – nicht D2 ohne gesonderten Beschluss konkretisieren

- Kämpferinnen-Upgrades (Schaden, Widerstand, Reaktion, Sicherheit) erst zusammen mit konkretisiertem Kampf-/Gefahrensystem verlässlich balancieren; keine erfundenen Werte.
- Mögliche strategische Entwicklungen (Versorgungsnetz, Transportketten, Großbaustellen, Intensivbrut, Nestverteidigung usw.) sind **Konzeptideen**, keine bereits implementierbaren D2-Anforderungen. Die Idee „alle langfristig erlernbar, aber nur wenige gleichzeitig aktive Schlüsselentwicklungen“ ist eine **offene Detailentscheidung**.
- Bereits beschlossene 50-%-Effizienz bei arbeitsfremden Tätigkeiten nicht aushebeln.

## 8. Entwicklungsreihenfolge, Technik und Abnahme

- **Keine Codefreigabe durch dieses Dokument.** Lokalen Branch, nicht nur GitHub-main, zuerst prüfen; C5 muss integriert geprüft sein. D1 Speichern/Laden ist separat vorher geplant; D2 darf nicht versehentlich D1 vorwegnehmen oder ungesicherte lokale Arbeit überschreiben.
- Bei späterer Umsetzung in kleinen Paketen: D2.0 Bestands-/Balancing-/Save-Schema-Prüfung; D2.1 Koloniehöchststand und gemeinsame Berufsstufen; D2.2 Grabkraft/Grabdauer/Bauzeit und Schichtgrenzen; D2.3 Sammlerinnen-Transportverbesserungen und 50-%-Regel; D2.4 Brutpflegerinnen nach C5 erneut balancieren; D2.5 Königinnenkammer und besonderes Ei; D2.6 mehrere Königinnen/eigene Eierpuffer/Bruttransport; D2.7 integrierte Tests/Performance/Speichern-Laden.
- Nach Änderungen alle vorhandenen Tests und Build ausführen. Prüfungen: Schwellen nur einmal freischalten; gleichzeitig alle Fachameisen auf Stand; arbeitsfremde Leistung korrekt einmal halbieren; kein Ressourcengewinn/-verlust; sperrbare Bodenschichten; Funktion aller vier Königinnen; richtige Entwicklungszeit und Larvenversorgung; Ein-/Ausgabe von Eiern in ihren jeweiligen Kammern; Lade-/Speicher-/Import-Stabilität.
- **Kein Code, keine neuen Schichten, keine neue Oberflächenbauweise und keine geänderte Kamera in dieser Planungsphase.**
