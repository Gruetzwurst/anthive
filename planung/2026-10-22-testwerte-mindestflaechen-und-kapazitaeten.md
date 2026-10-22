# ANTHIVE – Vorläufige Testwerte für Kammermindestflächen und Kapazitäten

**Beschlossen am 22.10.2026:** Nutzer hat für die Testkonfiguration **Mindestflächen B** und **Kapazitäten pro Kachel B** ausgewählt.

> **WICHTIG: ALLE ZAHLEN IN DIESER DATEI SIND VERÄNDERBARE TESTWERTE, KEINE ENDGÜLTIGEN BALANCEWERTE.** Codex soll die Zahlen zentral konfigurierbar halten; wir prüfen sie später im spielbaren Prototyp.

## 1. Mindestflächen (Option B, Testwerte)

| Kammertyp | Mindestfläche |
| --- | ---: |
| Nahrungslager | 12 Kacheln |
| Wasserlager | 12 Kacheln |
| Baumateriallager | 12 Kacheln |
| Spezialisierte Brutkammer (alle vier Arten) | 20 Kacheln |
| Ruhekammer | 16 Kacheln |

Die Mindestfläche gilt für **zusammenhängende** Kacheln. Abweichende Größen und freie Formen sind erlaubt, solange die typabhängige Mindestfläche eingehalten wird. Für die **Königinnenkammer** wurde **kein eigener Mindestflächenwert** gewählt; keinen dieser Werte stillschweigend auf sie übertragen.

## 2. Kapazität pro nutzbarer Kachel (Option B, Testwerte)

| Kammertyp | Kapazität je Kachel | Kapazität bei gewählter Mindestfläche |
| --- | ---: | ---: |
| Nahrungslager | 10 Nahrungseinheiten | 120 |
| Wasserlager | 10 Wassereinheiten | 120 |
| Baumateriallager | 8 Baumaterialeinheiten | 96 |
| Spezialisierte Brutkammer | 2 Brutplätze | 40 |
| Ruhekammer | 2 Ruheplätze | 32 |

**Testformel:** `kapazitaet = nutzbareKacheln * typabhaengigeKapazitaetProKachel`.

Das sind abstrakte Spieleinheiten/Plätze, keine realen Gramm, Milliliter oder biologische Dichtevorgaben.

## 3. Weitergeltende verbindliche Gestaltungsregeln

- Kammertyp **bei Planung** festlegen; fertiggestellte Kammern **nicht umwidmen**.
- Pinsel- und Rechteckwerkzeug kombinierbar; frei gestaltbare **zusammenhängende** Kammerformen.
- Kammern werden erst nach **Ausgraben UND Einrichtung mit Baumaterial** nutzbar. Unfertige Kammern bieten noch keine Kapazität.
- Größere Kammern bieten **funktionsabhängig mehr Platz**, nicht pauschal bessere Arbeitseffizienz.
- Je Kammer eigene Kapazität, Position und ggf. Bestand; beliebig viele entsprechend baubare Kammern desselben Typs können Gesamtkapazität erhöhen.
- Zu Spielbeginn baubare Typen: Nahrung-, Wasser- und Baumateriallager, vier spezialisierte Brutkammern, Ruhekammern.
- Ruhemodus ohne Kammer bleibt erlaubt; Ruhekammer spart zusätzlich Nahrung und Wasser. Die Verbrauchsreduktionswerte sind noch offen.
- Bauaufträge in Erstellungsreihenfolge (FIFO); blockierte Bauaufträge können temporär übersprungen werden; weit entfernte Pläne bleiben bis zur Erreichbarkeit ungebaut.
- Einrichtungskosten sind abhängig von **Fläche und Kammertyp**; konkrete Kostenwerte sind noch zu entscheiden.
- Härtere Erdschichten verlängern Grabdauer und können Verbesserungen erfordern; Details noch offen.

## 4. Codex – Implementierung und Testumfang

1. Vor dem Programmieren **lokalen VM-Stand prüfen und mit GitHub abgleichen**; ungesicherte Teichänderungen nicht überschreiben.
2. Diesen Satz Testwerte an **zentraler, leicht änderbarer Stelle** halten. Nicht als unveränderliche Spielregeln im Kammer-Code verstreuen.
3. Im priorisierten Ressourcen-Auftrag zunächst das Modell für mehrere einzelne Lager mit endlicher Kapazität entwickeln. Später bei der Nestbau-Integration die Größe einer **betriebsbereiten** Kammer mit dem Kapazitätswert pro Kachel verbinden.
4. Im späteren Bauplan-System Mindestfläche je Typ prüfen, ohne freie zusammenhängende Formen zu verbieten.
5. Prüfen: Lager mit 12 Feldern hat 120 Nahrung bzw. Wasser, Baumateriallager 96; Brutkammer mit 20 Feldern hat 40 Brutplätze, Ruhekammer mit 16 Feldern 32 Plätze. Größere Kammern skalieren linear im vorläufigen Modell. Nicht fertiggestellte Kammern haben keine aktive Kapazität.
6. Keine Königinnenmechanik, Erschließungsforschung oder detaillierte Ruheanimation allein wegen dieser Testzahlen vorziehen.

## 5. Offene nächste Balanceentscheidungen

- Grabgeschwindigkeit nach Schicht / Materialhärte.
- Einrichtungskosten je Kachel und Sonderkosten nach Kammertyp.
- Kosten/Aufwand für eine Erweiterung, ggf. Freischaltungen.
- Verbrauchsreduzierung ruhender Ameisen innerhalb und außerhalb von Ruhekammern.

**Dieses Commit enthält nur die Planungsdatei und keine Änderung am Spielcode.**
