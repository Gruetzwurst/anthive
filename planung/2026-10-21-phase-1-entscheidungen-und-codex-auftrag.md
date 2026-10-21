# ANTHIVE – Beschlüsse und Codex-Auftrag (21.10.2026)

> **Status:** Planungsdokument. Noch nicht implementiert. Dieses Dokument enthält die in der Unterhaltung bestätigten Entscheidungen und die nächsten Arbeitsschritte. Keine bestehenden Spielmechaniken ungefragt überschreiben.

## 1. Bereits festgelegtes Spielkonzept

- Browserbasiertes 2D-Pixelart-Kolonie- und Überlebensspiel mit Seitenansicht.
- Keine Einzelsteuerung von Ameisen: Ameisen arbeiten autonom; Spieler verwaltet Gruppen und Arbeitsaufträge. Gruppenzuweisungen bleiben bestehen, bis sie geändert werden.
- Vier **dauerhafte Spezialisierungen**: Sammlerinnen, Baumeisterinnen, Kämpferinnen, Brutpflegerinnen. Spezialisierung wird durch die Brutkammer bestimmt, der ein Ei zugewiesen wird. Andere Aufgaben sind möglich, aber weniger effizient. **Spezialisierung und aktueller Arbeitseinsatz sind verschieden.**
- Königin legt Eier **automatisch**; der Spieler verteilt Eier auf die vier Brutkammern. Eiablage hängt vom Zustand der Kolonie ab. Details wie Entwicklungsgeschwindigkeit sind noch offen.
- Sammlerinnen teilen sich nach Bedarf automatisch zwischen Nahrung und Wasser auf. Spieler legt die Anzahl und Priorität **Nahrung / Wasser / Ausgeglichen** fest.
- Nahrung und Wasser werden gesammelt, gelagert und verbraucht. Baumaterial entsteht primär durch Graben; seltene Spezialmaterialien sind für spätere Verbesserungen vorgesehen.
- Keine zusätzliche Bodenfeuchtigkeitssimulation.
- Langfristig: Königinnenwechsel mit besonderer Nachfolgekammer; bisherige Königinnenkammer kann zum Grab werden. **Nicht Teil von Phase 1.**

## 2. In dieser Unterhaltung verbindlich beschlossen

1. **Nahrungs-Regeneration B:** Nahrungsquellen sind endlich, regenerieren sich langsam und brauchen nach starker Ausbeutung eine Erholungsphase.
2. **Wasser B:** Der Teich liefert zunächst unbegrenzt Wasser; kleinere Wasserstellen sind begrenzt und können regenerieren. Unbegrenzt bedeutet **nicht** sofort im Lager: Ameisen müssen Wasser transportieren.
3. **Ressourcenmangel B:** Erst sinken Arbeitsleistung und Eiablage, bei längerem Mangel droht Sterblichkeit; deutliche Warnungen und Erholungsmöglichkeiten.
4. **Überlebenstempo A (entspannt):** Mehrere Spieltage Unterversorgung, bevor ernsthafte Gefahren und Verluste eintreten.
5. **Spieltag:** vorläufig **10 Minuten = 600 Sekunden Echtzeit**, zentral konfigurierbar. Spielzeit soll später auch Brut und andere Prozesse steuern.

### Vorläufig vorgeschlagene Testwerte – NICHT endgültig beschlossen

Diese Zahlen stammen aus dem Planungsentwurf und müssen im Spiel getestet und angepasst werden:

- Testkolonie: 20 Arbeiterinnen + 1 Königin; Startlager Nahrung 100, Wasser 100.
- Verbrauch als anfängliche Rechengröße: 1 Nahrung und 1 Wasser je Ameise und Spieltag; Königin separat berücksichtigen.
- Transportmenge: 5 Einheiten pro erfolgreicher Lieferung.
- Nahrungsquelle: Kapazität 200, Regeneration 20 pro Spieltag, nach Erschöpfung 2 Spieltage Erholung.
- Unterversorgung (zusammenhängende Tage, Testmodell):
  - Tage 1–2: Warnung, noch kein Leistungsverlust.
  - Tage 3–4: Arbeitsleistung 85 %, Eiablage 75 %.
  - Tage 5–6: Arbeitsleistung 65 %, Eiablage pausiert.
  - Ab Tag 7: langsamer Beginn möglicher Sterblichkeit, bei fortdauerndem Mangel zunehmende Verluste.
- Nahrung und Wasser getrennt beobachten, negative Auswirkungen nicht doppelt addieren: schwerere Mangelstufe zählt.
- Nach wiederhergestellter Versorgung schrittweise Erholung.
- Entfernung zur Quelle beeinflusst Transportdauer (geplante Regel, noch nicht detailliert balanciert).

**Wichtig:** Die festen Zahlen und Schwellen sind **Testvorschläge**, nicht vom Nutzer einzeln bestätigte finale Balancingentscheidungen. Alles zentral konfigurierbar halten.

## 3. Bekannter Projektstand und Synchronisationshinweis

Repository: `Gruetzwurst/anthive`, Branch `main`.

Bekannter Stand auf GitHub bei letzter Prüfung:
- Phaser 3 / TypeScript / Vite; Welt 320×120 Tiles à 24 px.
- Startnest, Gelände und Dekorationen; ein Nahrungsquellen-Datensatz.
- Sieben Ameisen mit animierter Nahrungsroute **ohne echten Lagerzuwachs**.
- Zwei Bauameisen mit prototypischem Graben/Schutttransport.
- Noch keine vollständige Ressourcenwirtschaft, kein Wassertransport, kein Verbrauch, keine Gruppenverwaltung.
- Vorhandene Ressourcentypen in `src/game/world/worldTypes.ts`; `WorldScene.ts` enthält bisherige Demo-Bewegung.
- **Lokale VM enthält neuere, noch nicht gepushte Teich-/Seitenansichtsänderungen.** GitHub-`main` ist in diesem Bereich veraltet. Vor Implementierung **lokale Änderungen prüfen und mit GitHub synchronisieren**. Keinesfalls alte GitHub-Grafik über den lokalen Stand legen.

## 4. Entwicklungsreihenfolge

**Phase 1 – Ressourcen und Versorgung**
1. **Auftrag 01:** Testbare Ressourcen-Grundlage mit zentraler Spieluhr, Lagern, Quellen, Entnahme, Regeneration und Erholung; noch ohne UI oder Verbrauch.
2. **Auftrag 02:** Echte Sammeltransporte (Nahrung/Wasser) statt Demo-Schleife; Lagergutschrift erst bei Anlieferung.
3. **Auftrag 03:** Regelmäßiger Verbrauch und entspanntes Mangel-/Erholungssystem. Fortpflanzungs-Multiplikator vorbereiten, aber Königinnenmechanik noch nicht bauen.
4. **Auftrag 04:** Ressourcenanzeige, Sammelprioritäten und erste Balancingtests.

**Phase 2:** Gruppenverwaltung und Arbeitsaufträge, Spezialisierung vs. Arbeitseinsatz, Effizienz.
**Phase 3:** Königin, Eier, Brutkammern, Wachstum.
**Später:** Kämpfe/Bedrohungen, Forschung, Spezialmaterialien, Königinnenwechsel. Speichern/Laden früh architektonisch mitdenken.

## 5. Codex – nächster konkreter Auftrag (01)

> Arbeite im bestehenden ANTHIVE-Projekt. Prüfe zuerst den **aktuellen lokalen Stand** und die vorhandene Projektstruktur. Stelle sicher, dass die lokalen Änderungen (insbesondere Teich) nicht überschrieben werden.
>
> **Ziel:** Eine von Phaser getrennte, unabhängig testbare Grundlage der Ressourcenwirtschaft.
>
> 1. Vorhandene Ressourcentypen und Hilfsfunktionen prüfen und wiederverwenden; keine parallelen, widersprüchlichen Systeme schaffen.
> 2. Eine zentrale, konfigurierbare Spieluhr erstellen: 600 Echtzeitsekunden = 1 Spieltag. Tageswechsel und größere Zeitsprünge korrekt behandeln.
> 3. Nahrung und Wasser als getrennte Lagerbestände mit sicheren Funktionen für Entnahme und Einlagerung modellieren; keine negativen Bestände.
> 4. Endliche Nahrungsquellen mit Maximalbestand, aktueller Menge, langsamer Regeneration und Erholungsphase nach Erschöpfung implementieren.
> 5. Teich als unbegrenzte Wasserquelle; kleinere Wasserquellen als begrenzte, regenerierende Quellen modellieren.
> 6. Balancewerte zentral und leicht veränderbar ablegen; Vorschlagswerte aus Abschnitt 2 als **Startwerte** verwenden, soweit nötig.
> 7. Automatisierte Tests schreiben; bestehende Tests und Build ausführen.
> 8. Zum Schluss kurz auflisten: geänderte Dateien, Tests/Build-Ergebnisse, noch offene Punkte.
>
> **Nicht in Auftrag 01:** UI, neue Ameisenbewegungen, Sammelanimationen, Ressourcenverbrauch, Königin, Brut, Änderungen an Weltgrafik, Teichgestaltung oder Grabmechanik.
>
> **Technischer Vorschlag (Dateinamen flexibel):** `src/game/simulation/gameClock.ts`, `resourceTypes.ts`, `resourceSystem.ts`, `simulationConfig.ts`. An vorhandene Projektarchitektur anpassen.

### Mindesttests für Auftrag 01

- 600 Sekunden ergeben genau einen Spieltag.
- Aus Quelle mit 200 Einheiten 5 entnehmen -> 195.
- Aus Quelle mit 3 Einheiten höchstens 3 entnehmen, nie negative Menge.
- Erschöpfung startet Erholungsphase; anschließend Regeneration.
- Regeneration überschreitet nicht die Quellenkapazität.
- Unbegrenzte Teichquelle wird durch Entnahme nicht kleiner.
- Einlagern von Wasser verändert nicht den Nahrungsvorrat.
- Große Zeitsprünge liefern korrekte Tageswechsel und Regeneration.
- Bestehende Tests und Build bleiben erfolgreich.

**Abnahmekriterium:** Ressourcenlogik und Tests funktionieren; der bisherige Prototyp startet unverändert.

## 6. Noch nicht entschieden – nicht stillschweigend als Beschluss behandeln

- Finale Verbrauchsraten, Sammelkapazitäten, Regenerationsgeschwindigkeiten, Mangel-Schwellen und genaue Erholungsdauer.
- Entwicklung der Brut, Behandlung nicht zugeteilter Eier, genaue Nachfolge-Königinnenregeln.
- Genaue Ausgestaltung von kleineren Wasserstellen, verschiedenen Nahrungsarten, Jahreszeiten und Quellen-Entfernungsbalance.

**Arbeitsregel:** Erst einen kleinen, spielbaren Kreislauf bauen, dann anhand von Tests und Spielerfahrung balancieren. Keine bereits getroffenen Grundsatzentscheidungen erneut aufrollen.
