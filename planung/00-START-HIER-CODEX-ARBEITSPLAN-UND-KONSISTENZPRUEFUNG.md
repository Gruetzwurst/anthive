# ANTHIVE – START HIER: zentrale Codex-Arbeitsreihenfolge und Konsistenzprüfung

**Stand: 22.10.2026.** Dies ist der **Einstiegspunkt** für Codex. Alle übrigen Dateien in `planung/` sind die detaillierte Entscheidungs- und Testwertsammlung. **Die alten Dateien nicht ignorieren, aber NICHT alle gleichzeitig implementieren.**

## 0. Verbindliche Arbeitsanweisung

1. **Zuerst lokalen Projektstand prüfen.** Das GitHub-`main` war bei der letzten Codeprüfung hinter den Änderungen in Pauls Linux-VM zurück, insbesondere bei der **Teich-Seitenansicht**. Ungepushte lokale Änderungen nicht überschreiben, nicht blind `git pull` mit erzwungenem Merge durchführen. Erst `git status`, aktuelle Branches und Differenzen prüfen, lokale Änderungen sichern, danach gezielt synchronisieren.
2. **Alle Planungsdateien lesen**, dann **in der untenstehenden Reihenfolge** in kleinen, testbaren Teilaufträgen vorgehen. Nicht jedes Dokument als eigenen Sofortauftrag interpretieren.
3. **Verbindliche Spielregeln** von **vorläufigen Balance-Testwerten** trennen. Alle Testwerte zentral konfigurierbar. Neuere ausdrückliche Nutzerbeschlüsse präzisieren frühere unverbindliche Empfehlungen oder ältere `noch offen`-Angaben.
4. Bestehende Phaser-/TypeScript-/Vite-Welt, Grafik, Teich, Grab- und Pfadfindungsmechanik soweit möglich **weiterverwenden**. Keine konkurrierenden Ressourcentypen, Uhren, Lager oder Wegfinder anlegen.
5. Vor jeder Teilaufgabe bestehende Tests prüfen; nach jeder Teilaufgabe neue Tests plus vorhandene Tests und Build ausführen, Änderungen und Ergebnisse kurz berichten. **Keinen Spielcode ohne passende Prüfung als fertig bezeichnen**.
6. **Keine eigenständigen neuen Game-Design-Beschlüsse** für noch offene Mechaniken treffen. Für technisch nötige Platzhalter klar als solche markieren.

## 1. Ausgangslage / letzter verifizierter Code-Überblick

Repo `Gruetzwurst/anthive`, Default-Branch `main`; Phaser 3.90, TypeScript, Vite. Welt ca. 320×120 Tiles à 24 px. Startnest mit Königinnenkammer, Nahrungs-/Baumateriallager und vier Brutkammern. Sieben Ameisen laufen bislang auf einer demohaften Nahrungsroute, die **keine echten Vorräte** erhöht. Baumeisterinnen können prototypisch graben und Abraum bewegen; Teich ist auf dem älteren GitHub-Stand Dekoration. **Dieser Überblick ist älter als mögliche lokale VM-Änderungen** und muss vor Implementierung durch Codeinspektion aktualisiert werden.

## 2. Arbeitsreihenfolge nach Abhängigkeit, nicht nach Dateidatum

### A – Zuerst: spielbarer Ressourcen-Kern

**A0. Sicherer Abgleich / Baseline.** Lokalen Projektstand sichern/synchronisieren, Start, Tests, Build bestätigen. Vorhandene Typen und Dateistruktur dokumentieren.

**A1. Simulation-Grundlage (entspricht „Auftrag 01“).** Eine konfigurierbare Spieluhr (vorläufig 600 Echtzeitsekunden/Spieltag), Nahrung/Wasser/Baumaterial als ressourcenlogische Typen, tatsächliche Quellenentnahme, begrenzte Quellen und Regeneration, Teich zunächst unbegrenzte Wasserquelle, getrennte Lager **pro individueller Kammer** mit eigener Kapazität/Bestand. Sichere Ressourcenoperationen und Tests. Spielgrafik zunächst unverändert.

**A2. Echte Transporte.** Demo-Sammelroute durch tatsächliche erreichbare Quellen/Lager und Ladungen ersetzen. Sammlerinnen entdecken alle erreichbaren Quellen automatisch, bevorzugen schnelle Quelle und konzentrieren sich auf attraktivste; wechseln bei Erschöpfung. Nahrung/Wasser-Priorität Nahrung/Wasser/Ausgeglichen respektieren. Ressourcen zählen im Lager erst bei erfolgreicher Lieferung; keine Phantomressourcen. Wasserlager ggf. als eigener Ausbaupunkt im aktuellen Weltzustand hinzufügen, ohne vorhandene Kammern stillschweigend zu ersetzen.

**A3. Erwachsenen-Verbrauch und Mangel.** Nahrung/Wasser je Kolonie-Zeit verbrauchen; warnen, bei längerem Mangel Leistung/Eiablage reduzieren, erst spät Verluste. Entspanntes Tempo A. Erwachsenentestwerte (z. B. 1 Nahrung/Wasser/Ameise/Tag) sind **unbestätigte ursprüngliche Vorschläge**, keine endgültigen Balancezahlen. Ruhemodus ohne Kammer möglich; Versorgung möglichst testbar ohne Brutmodul.

**A4. Minimale Bedienoberfläche/Balancing.** Anzeige der getrennten Vorräte, Quellenlage, Gruppen-Sammelpriorität und Versorgungswarnungen. Tests über einige Spieltage. Eine kleine **durchgängig spielbare Wirtschafts-Schleife** herstellen.

### B – Danach: Gruppen, Arbeit und Nestbau

**B1. Arbeitsgruppen und Zuständigkeiten.** Vier dauerhafte Spezialisierungen; persistente Gruppenzuweisung; fachfremde Arbeit nur bei expliziter Spielerzuweisung und dann mit Effizienznachteil. Sammlerinnen: nur passende automatische Ersatzarbeit; sonst Ruhe mit reduziertem Verbrauch; zusätzliche Ruhekammern sparen später nochmals Ressourcen. Arbeitseinsatz und Spezialisierung sauber trennen.

**B2. Materialbilanz/Grablogik.** Bestehende Grabmechanik mit konfigurierbaren Grabzeiten und Materialerträgen integrieren. Baumaterial am Boden, getragen, in individuellen Lagern oder verbraucht; kein Verlust/Duplizieren. Baumeisterin: Testwert 5 Material/Ladung, transportiert nach voller Ladung, Restladung korrekt behandeln; voller Materiallagerbestand stoppt das Graben nicht: Abraum bleibt am Grabungsort. Alter Abraum wird grundsätzlich erst nach ausführbaren Grabaufträgen abgeholt.

**B3. Bauwarteschlange und Werkzeuge.** Freie zusammenhängende Kammer- und Tunnelzeichnung (Pinsel + Rechteck), Kammertyp bereits bei Planung, Auftrag FIFO; blockierte/pausierte Aufträge bleiben an ihrer Position und können übersprungen werden. Entfernte Kammern vorplanbar, aber bis Verbindung vorhanden blockiert; keine automatisch erzeugten Verbindungstunnel. Bauabbruch bewahrt Aushub und unverbrauchtes Material. Manueller Pausen-/Fortsetzenstatus separat. Detailanzeige per Klick und einmalige Statuswechsel-Warnungen.

**B4. Parallelbau und Einrichtung.** Mehrere Baumeisterinnen je Bauauftrag auf **verschiedenen**, erreichbaren, exklusiv reservierten Kacheln, vom Bauzugang aus. Überschüssige Baumeisterinnen helfen bei zulässigen Materialtransporten – nicht automatisch an späteren Bauaufträgen. Kammer wird erst nach vollständiger Grabung UND schrittweiser Einrichtung betriebsbereit. Kosten hängen von Fläche und Kammertyp ab. Materiallieferung zur Baustelle aus schnellsten erreichbaren Bestandslagern, ggf. mehreren; **kein vorbeugender Lager-zu-Lager-Ausgleich**. Materialmangel pausiert Einrichtung ohne Fortschrittsverlust.

**B5. Kammertypen/Kapazitäten/Freischaltung.** Nahrung-, Wasser-, Baumateriallager, zusätzliche spezialisierte Brutkammern und einfache Ruhekammern zunächst baubar. Freie zusammenhängende Form, funktionsabhängige Mindestgröße, Kapazität durch Kachelzahl × typspezifischen Testwert; keine nachträgliche Umnutzung fertiger Kammern. Spezielle Kammern später durch Koloniewachstum UND Verbesserungen; hartes Terrain kann ebenfalls Verbesserungen verlangen. Kein Einsturzsystem beschlossen.

**B6. Tunnelverkehr/Performance.** Ameisen alle sichtbar; Engstellen verlangsamen, blockieren aber nicht dauerhaft. Erwartet schnellste erreichbare Route inklusive Auslastung; Verkehrsmodelle effizient pro Tunnelbereich statt vollständig paarweise Ameisenkollision. Vorhandenen Wegfinder integrieren. Der fortgeschrittene Verkehrsalgorithmus darf nicht A1/A2 blockieren: zuerst schlichte funktionsfähige Pfade, später Auslastung.

### C – Danach: Königin/Brut/Wachstum

**C1. Königin + Eierpuffer.** Königin legt autonom (Testwert 5 Eier/Spieltag bei guter Versorgung). Spieler weist Eier auf vier spezialisierte Brutkammern zu; nicht zugewiesene Eier bleiben in der Königinnenkammer ohne Entwicklungsfortschritt. Puffer maximal 50 Eier als Testwert, schrittweise Drosselung bei hohem Füllstand, bei voller Kapazität Eiablagepause. Keine automatische Eierzuweisung.

**C2. Brutstadien/Pflege.** Ei → Larve → Puppe → erwachsene Ameise, je Stadium eigener Fortschritt; vorläufig 1/3/2 Spieltage, zusammen 6. Brutkammern mit 20 Tiles Minimum und 2 Brutplätzen/Tile als Testwert. 10 Bruttiere je Brutpflegerin testweise; Pflegeunterdeckung verlangsamt auf 25–100 % (bei 50 % Abdeckung: 50 %), verursacht für sich alleine **keinen Bruttod**. Geborene Ameisen erhalten dauerhafte Kammer-Spezialisierung.

**C3. Echte Larvenversorgung.** Nur **Larven** konsumieren direkt Nahrung und Wasser (Testwert 0,5 + 0,5 pro Larve/Spieltag). Brutpflegerinnen bringen reale Lieferungen aus Lagern in kleine, getrennte Vorräte je Brutkammer (Testwerte: für 2 Spieltage, Nachfüllen ab 50 %, Ladung bis 5 Einheiten einer Ressource). Eier und Puppen direkt 0. Transporte/Bestände/Verbrauch exakt einmal buchen.

**C4. Larven-Mangel/Erholung.** Erster Spieltag Warnung ohne zusätzlichen ressourcenbedingten Entwicklungsabschlag, ab zweitem Spieltag Verlangsamung entsprechend schlechterer Deckung (mindestens 25 %), frühestens ab siebtem Spieltag **schwerer anhaltender** Unterversorgung mögliche Verluste. Schrittweise Erholung des Ressourcenfaktors über einen Spieltag. Die Prozentzahl, Mangelgrenzen und Verlustquoten sind teils noch technische Platzhalter, keine endgültigen Spielregeln.

**C5. Wachstum testen.** Königin, Eierpuffer, Brutplatz, tatsächliche Pflegezuweisung, Lager, Transport, Nahrung/Wasser, Gruppenzahlen und Erwachsenenverbrauch über zahlreiche Spieltage integriert testen. Keine exponentielle, ungebremste Vermehrung allein durch Simulationstakt.

### D – Viel später
Kämpfe/Flucht/Selbstverteidigung, Spezialmaterialien, verbesserte Forschung/Freischaltungen, Königinnenwechsel/Nachfolge, Erweiterungen für lange Koloniegeschichte. Bereits beschlossen: Sammlerinnen fliehen bei Gefahr, dürfen sich bei direktem Angriff verteidigen. Dies ist **kein Auftrag, jetzt Kampfcode zu schreiben**.

## 3. Konsistenzprüfung – konkrete Fundstellen, Abhängigkeiten und Entscheidungen

Die folgenden Punkte sind **nicht automatisch harte Widersprüche**. Trenne fehlende Zahlen, technische Spannungen und echte Reihenfolgeabhängigkeiten.

1. **FIFO vs. temporärer Bypass vs. manuelle Pause:** FIFO bleibt Grundpriorität; tatsächlich blockierte oder ausdrücklich pausierte Aufträge werden **nicht gelöscht und behalten ihren Rang**, dürfen aber solange übersprungen werden. Nach Entblockung/Entpause gilt wieder die frühere Position. Laufende Arbeit an zulässigen späteren Aufträgen nicht unkontrolliert mitten in einer atomaren Aktion abbrechen. Technischer Scheduler mit eindeutigen Status erforderlich.
2. **Volles Baumateriallager vs. Abraumtransport:** Weitergraben erlaubt, Überschuss am Grabungsort. Alte Abraumhaufen normalerweise erst nach ausführbaren Grabaufträgen abholen. Überschüssige Baumeisterinnen beim aktuellen Auftrag dürfen sinnvolle laufende Materialtransporte durchführen, aber diese Erlaubnis **hebt die priorisierte Abholung alten Abraums nicht pauschal auf**. Kein Materialverlust, keine Wegblockade durch Haufen, sofern nicht später beschlossen.
3. **Nur passende Ersatzaufgaben vs. fachfremder Arbeitseinsatz:** Automatische Sammlerinnen-Fallbacks sind nur passende Tätigkeiten; **vom Spieler explizit** zugewiesene fachfremde Arbeit ist mit Effizienznachteil möglich. Kein Widerspruch, getrennte Ursachen.
4. **Schnellste Nahrungsquelle vs. Quellenregeneration:** Sammlerinnen konzentrieren sich absichtlich auf schnelle/ergiebige Quellen und **schonen sie nicht aktiv**. Übernutzung/Erholungszeit sind beabsichtigte Risiken. Kein unaufgeforderter Nachhaltigkeitsmodus.
5. **Mehrere Lager vs. kein Materialausgleich:** Intelligente **Ablieferung und Entnahme** aus mehreren individuellen Kammern sind beschlossen, jedoch **keine vorsorgliche Lager-zu-Lager-Umverteilung**. Keine globalen, grenzenlos verfügbaren virtuellen Vorräte.
6. **Brutpflege-Faktor vs. Nahrung/Wasser-Faktor:** Beide können gleichzeitig unter 100 % liegen. **Wie sie mathematisch kombiniert werden, wurde nicht abschließend entschieden.** Multiplikation erzeugt potenziell deutlich stärkere Strafen als der entspannte Spielansatz, `min()` modelliert nur den größten Engpass. **Für C4 als offene Entscheidung markieren statt stillschweigend festlegen**.
7. **Larvenmangel ab 7. Tag vs. 3-tägige Larvenphase:** Bei voller Versorgung dauert die Larvenphase nur **3 Spieltage**. Bei Unterversorgung kann sie sich jedoch stark verlängern (Mindestfortschritt 25 % -> bis ca. 12 Tage unter konstant extremer Unterversorgung, ohne Anlauf-/Erholungseffekte). Somit ist ein Verlust erst ab Tag 7 **nicht logisch ausgeschlossen**, aber ggf. selten. **Mit Simulation testen**, keine Schwelle ohne Nutzerentscheid eigenmächtig verkürzen.
8. **Material-Bootstrap:** Eine Kammer mit 12 Kacheln lockerer Erde liefert bei den Testwerten **12 Baumaterial**, benötigt aber als Lager **24 Einheiten** Einrichtung. Diese Wirtschaft benötigt vorhandene Startbestände, anderen Aushub, zusätzliche Grabungen oder Materialgewinn in härteren Schichten. **Der Startbestand muss vor Aktivierung der Bauwirtschaft positiv und spielbar sein.** Das ist kein automatischer Widerspruch, aber ein Balancing-Risiko.
9. **Nahrungsquelle vs. Startkolonie-Verbrauch:** Die alten, noch nicht bestätigten Testvorschläge (**eine regenerierende Quelle mit 20 Nahrung/Spieltag** und **20 Arbeiterinnen plus Königin** bei je 1 Nahrung/Tag) ergeben bereits rechnerisch mindestens **21 Einheiten Tagesbedarf**, zuzüglich späterer Larven. Ohne Vorräte, weitere Quellen oder weitere Einstellung dauerhaft defizitär. **Nicht unbesehen als balancierten Spielstart übernehmen**.
10. **Aktuelle GitHub-Welt vs. geplante Wasserlogistik:** Älterer GitHub-Code kennt Teich als Dekoration und kein echtes Wasserlager. Das Ressourcensystem muss erst an reale Quelle, erreichbare Routen und betriebsbereite getrennte Wasserlager angeschlossen werden. **Lokale VM-Fassung vorher ansehen.**
11. **Ruhemodus vs. Ruhekammer:** Allgemeines Ruhen ohne Kammer bleibt erlaubt und spart etwas Verbrauch; **optional** sparen Ruhekammern zusätzlich. Kammern sind kein Zwang.
12. **Frühere „noch offen“-Angaben in älteren Dateien** können durch später datierte klare Entscheidungen bereits beantwortet sein (z. B. Brutstadien, Lagergrößen, Warnungen, Lager-/Bauverhalten). **Neueste explizite Entscheidung gewinnt**, wenn sie die frühere offene Frage direkt behandelt. Ältere Dateien nicht als gleichzeitigen widersprechenden Auftrag lesen.
13. **Balancewerte vs. Mechaniken:** Beispiel: `6 Sekunden lockere Erde`, `5 Baumaterial/Ladung`, `1/3/2 Entwicklungstage`, `5 Eier/Spieltag`, `0,5 Nahrung/Wasser je Larve`, `50-Eier-Puffer`, `25%-Mindesttempo` sind **Testwerte**; autonome Arbeitsweise, getrennte Lager, Stadienfolge, Nur-Larven-Direktverbrauch, FIFO etc. sind **beschlossene Regeln**.
14. **Leistungsfähigkeit:** 500+ sichtbare Ameisen plus Pfadfindung und Verkehrsbelastung erfordern inkrementelle Arbeit/Abstraktion, keine globale Vollsuche und keine Physik-Kollision jedes Paares pro Frame. Performance-Optimierung nach überprüfbarem Kern, nicht als Vorwand, Ameisen unsichtbar zu machen.

## 4. Offene Fragen, die vor der jeweiligen Phase geklärt werden sollten

**Für A / ersten spielbaren Prototyp:**
- Abweichungen zwischen GitHub und lokaler VM und genaue vorhandene Verknüpfungen von Quelle/Teich/Lager.
- Grundlegende Startbedingungen (brauchbare Lager/Quellen, tragfähiger Anfangsvorrat).
- Initiale Zahlen für Verbrauch/Quellregeneration und welche technisch notwendigen Defaults als **Testwerte** gelten.

**Für B:**
- Anfangszustand von fertigen Grundkammern und Baumaterial, sodass der Bau sich nicht selbst blockiert.
- Konkreter Übergang bei pausiertem vs. blockiertem Auftrag (atomare Aktion), technische UI-Abläufe.
- Bestehende Grav-/Transport- und Wegfindungsstrukturen inspizieren.

**Für C:**
- Kombination von Pflege- und Larvenversorgungsfaktor.
- Mangeldefinition („schwer“), spätere Sterblichkeits-/Erholungsbalancingwerte.
- Pflegezuweisung zwischen mehreren Brutkammern und Verbrauchs-/Lieferpriorität.
- Details der Eierpuffer-Drosselkurve sowie Ei-Zuweisungs-UI.

**Für D:** Forschung, Freischaltzahlen, Kampfschaden, Königinnenwechsel und andere langfristige Systeme nicht für den ersten Prototyp voraussetzen.

## 5. Was Codex morgen konkret tun soll

**Nicht**: „Setze alle Dateien im Ordner auf einmal um.“

**Sondern**:
1. Lies `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md` und alle übrigen `planung/*.md`; ordne jede Aussage in **verbindliche Regel / vorläufiger Testwert / offener Punkt** ein.
2. Prüfe den lokalen VM-Projektstand samt Git-Differenzen und sichere lokale Arbeit.
3. Erstelle/aktualisiere eine kurze Task-Checkliste entlang der Reihenfolge A0–D.
4. Beginne **nur mit A1** (nach A0): Ressourcen- und Uhr-Grundlage mit Tests, ohne UI oder Weltgrafik umzubauen. Führe Build/Tests aus.
5. Melde Ergebnis und nötige offene Fragen, statt auf eigene Faust B/C/D in einem einzigen riesigen Patch umzusetzen.

## 6. Prüfumfang und Ehrlichkeit

Diese Prüfung basiert auf den in der Unterhaltung erstellten Entscheidungen, dem erneuten Abruf zentraler GitHub-Planungsdateien sowie dem vorher eingesehenen GitHub-Codeüberblick. Sie ist eine **Design-/Abhängigkeitsprüfung**, **kein aktueller vollständiger Audit aller lokalen VM-Dateien** und kein Beleg, dass die geplanten Systeme bereits implementiert sind.

**Grundsatz:** Spieler entscheidet Designfragen; Codex implementiert kleine Aufgaben mit Tests. Bestehende Arbeit nicht überschreiben.
