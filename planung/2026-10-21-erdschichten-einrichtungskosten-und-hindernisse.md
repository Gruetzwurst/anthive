# ANTHIVE – Erdschichten, Einrichtungskosten und Hindernisse

**Verbindliche Nutzerentscheidungen vom 21. Oktober 2026.** Diese Datei ergänzt die bestehenden Beschlüsse im GitHub-Ordner `planung/`. Sie ersetzt keine bestehenden Bau-, Ressourcen- oder Grabregeln.

## Entscheidung 1: Einfluss der Erdschichten B – Grabdauer und Fähigkeiten

- Unterschiedliche Erdschichten haben **unterschiedliche Grabdauer** bzw. Grabaufwände.
- Härtere oder tiefere Schichten können **bestimmte Verbesserungen oder Werkzeuge** erfordern, bevor Ameisen dort graben können.
- Hiermit wurde **kein Einsturz- oder Tunnelrisikosystem** beschlossen.
- Bereits im Spiel vorhandene Erdschichten, Materialhärte und Grabmechanik möglichst wiederverwenden; keine konkurrierende Härtesimulation schaffen.
- Konkrete Schwellen, Grabzeiten, Werkzeuge und Verbesserungsstufen sind **noch nicht entschieden** und zunächst zentral konfigurierbare Testwerte.

## Entscheidung 2: Einrichtungskosten B – Kammerfläche und Funktion

- Die **Einrichtungskosten** einer Kammer steigen mit ihrer Größe bzw. Fläche.
- Der **Kammertyp** beeinflusst darüber hinaus die Kosten: Spezielle Kammern können weitere Materialien oder zusätzlichen Aufwand benötigen.
- Das ändert nichts am Ablauf **Planung (Typ festlegen) -> Ausgraben -> Einrichten -> nutzbar**.
- Größere Lagerkammern bieten mehr Kapazität, kosten aber auch mehr Material. Jede Kammer hat eine eigene begrenzte Kapazität; Nahrung und Wasser werden separat gelagert.
- Konkrete Kostenformeln, Materialsorten und Mindestflächen pro Kammertyp sind **noch nicht entschieden**. Für den ersten Prototyp mit wenigen zentral konfigurierbaren Werten beginnen; besondere Materialien erst einführen, wenn deren Beschaffung existiert.

## Entscheidung 3: Hindernisse B – vorübergehend gesperrt

- Manche Felder oder Bereiche sind **aktuell nicht grabbar**, weil notwendige Verbesserungen noch fehlen.
- Sie werden **später durch geeignete Fortschritte oder Verbesserungen freischaltbar**; es sind nicht pauschal dauerhaft unüberwindbare Naturhindernisse vorgesehen.
- Gesperrte Felder dürfen nicht entgegen ihren Voraussetzungen gegraben werden. Der Spieler soll den Grund der Sperre erkennen können.
- Das vorab beschlossene FIFO-Auftragssystem gilt weiter: Ein blockierter Bauauftrag **bleibt erhalten**, darf **vorübergehend übersprungen** werden und wird nach Behebung des Hindernisses wieder aufgegriffen.
- Technisch zwischen **aktuell gesperrtem Terrain** und **vorübergehend unerreichbarem Bauauftrag** unterscheiden, soweit nötig; beide dürfen keinen Projektstillstand verursachen.

## Zusammenspiel mit vorhandenen Bauentscheidungen

- Freie Tunnel- und Kammergestaltung auf Tile-Raster, Pinsel **und** Rechteck.
- Bauaufträge grundsätzlich in Erstellungsreihenfolge, blockierte überspringbar ohne Löschen.
- Funktionale Kammern erhalten ihren **Kammertyp bereits bei der Planung**; fertiggestellte Kammern können **nicht** in andere Typen umgewidmet werden.
- Flexible Kammergrößen; größere Räume haben höheren Nutzen und Einrichtungsaufwand.
- Baumeisterinnen graben autonom und transportieren vorhandenes Aushub-/Baumaterial.
- Kein Einzelmikromanagement der Ameisen.
- Umsetzung gestuft: zuerst Ressourcen-Grundlage und Tests, dann Sammeltransporte, später Bauplaner/Einrichtung und Verbesserungen.

## Codex-Hinweise für die Umsetzung

1. Vor Codeänderungen **lokale VM-Änderungen mit GitHub abgleichen**, insbesondere die neuere Teichgestaltung.
2. Die bereits vorhandenen Terrain- und Grabdaten prüfen. Für jeden grabbaren Tile-Typ ggf. Grabaufwand und eine optionale Freischaltvoraussetzung konfigurieren, ohne bestehende Regeln zu duplizieren.
3. Baupläne für gesperrte Felder dürfen erstellt werden, sollen aber als **blockiert/noch nicht verfügbar** erkennbar sein. Ob und wie weit die Markierung schon vor einer Freischaltung erlaubt ist, muss noch im UI geprüft werden.
4. Kosten einer Kammer anhand von **Fläche und Kammertyp** bestimmen; nur fertig eingerichtete Kammern sind funktional.
5. Tests vorsehen: härterer Boden benötigt mehr Arbeit; gesperrter Tile lässt sich ohne Voraussetzung nicht ausgraben; nach Freischaltung kann ein blockierter Auftrag fortgesetzt werden; größere bzw. spezialisierte Kammern kosten mehr; keine Materialien doppelt verbuchen.
6. **Kein Einsturzsystem** und keine unbegründeten dauerhaft undurchdringlichen Materialien einführen.

## Noch offen

- Konkrete Grabaufwände und Freischaltungen pro Erdschicht.
- Wie Verbesserungen erforscht/freigeschaltet werden.
- Exakte Einrichtungskosten pro Kammertyp und Flächeneinheit.
- Mindestgrößen, zulässige Kammerformen und Bauabbruch-Regeln.

**Status: dokumentierte Entscheidungen, kein Spielcode geändert.**
