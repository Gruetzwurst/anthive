# ANTHIVE – Ruhekammern und typspezifische Kammerkapazitäten

**Verbindliche Entscheidungen vom 21.10.2026.** Ergänzung der bisherigen Planungsunterlagen in `planung/`. Noch keine Änderung des Spielcodes.

## Beschluss 1: Ruhekammer-Funktion B – zusätzlicher Spareffekt

- **Alle Ameisen können grundsätzlich ruhen**, auch wenn sie keinen freien Platz in einer Ruhekammer haben. Der bereits beschlossene allgemeine Ruhemodus bei fehlender passender Arbeit bleibt bestehen.
- **In einer Ruhekammer** sparen ruhende Ameisen **zusätzlich Nahrung und Wasser** gegenüber einer ruhenden Ameise ohne Ruhekammer.
- Damit ist eine Ruhekammer **keine Voraussetzung** für den allgemeinen Ruhemodus, sondern eine vorteilhafte baubare Einrichtung.
- Eine Ruhekammer besitzt nur **begrenzte Plätze**; ihre Kapazität richtet sich nach ihrer nutzbaren Größe und der für Ruhekammern geltenden eigenen Kapazitätsregel (Beschluss 2).
- Ob Ruhekammern weitere Wirkungen auf Gesundheit, Heilung, Zufriedenheit, Schlafbedarf oder Fortpflanzung haben, wurde **nicht beschlossen**. Insbesondere Option C ist keine zusätzliche verbindliche Funktion.
- Exakte Verbrauchsfaktoren für aktive Ameisen, ruhende Ameisen und Ruhen **in** einer Ruhekammer sind **noch offen**. Für erste Tests separat konfigurierbar halten.

## Beschluss 2: Kammerkapazitäten B – abhängig vom Kammertyp

- Unterschiedliche Kammerarten erhalten **eigene Kapazitätswerte pro nutzbarer Kachel**.
- Bei Nahrungslagern beschreibt der Wert die lagerbaren Nahrungseinheiten; bei Wasserlagern die Wassereinheiten; bei Brutkammern die Brutplätze; bei Ruhekammern die Ruheplätze.
- Ein Baumateriallager benötigt entsprechend seiner Funktion ebenfalls einen getrennten Lagertyp/Kapazitätswert.
- Größere Kammern erhöhen die **jeweils passende Kapazität**, ohne dass daraus automatisch ein höherer Effizienz- oder Geschwindigkeitsbonus entsteht.
- Die genaue Formel (z. B. einfache Fläche mal typspezifische Rate), Mindestgrößen und konkrete Werte pro Kachel sind **noch nicht abschließend gewählt**. Die typspezifische Differenzierung ist beschlossen, nicht bestimmte Zahlen.
- Kapazität zählt nur bei **fertig ausgegrabener, mit Baumaterial eingerichteter, tatsächlich betriebsbereiter** Kammer.
- Jede Kammer behält individuelle Position, Kapazität und ggf. eigenen Bestand; mehrere Kammern desselben Typs sind möglich.
- Funktionaler Kammertyp wird **bei der Planung** gewählt und darf nach Fertigstellung **nicht umgewidmet** werden.

## Zusammenspiel mit früheren Entscheidungen

- Zu Spielbeginn baubare Kammern: Nahrungs-, Wasser- und Baumateriallager, zusätzliche spezialisierte Brutkammern, einfache Ruhekammern.
- Vier spezialisierte Brutkammern: Sammlerinnen, Baumeisterinnen, Kämpferinnen, Brutpflegerinnen. Eier werden vom Spieler auf Brutkammern verteilt und ihre Spezialisierung ergibt sich daraus.
- Kammern haben funktionsabhängige Mindestgrößen und dürfen beliebige **zusammenhängende** Formen besitzen; Pinsel und Rechteck kombinierbar.
- Einrichtungskosten richten sich nach Fläche **und** Kammerfunktion.
- Bauwarteschlange FIFO; blockierte Aufträge werden vorübergehend übersprungen, behalten ihren Platz.
- Ressourcensystem: getrennte Nahrung-/Wasserbestände, Kapazitätsgrenzen, Lagerwahl nach Weg und Auslastung; Spieltag vorläufig 600 Echtzeitsekunden.
- Keine autonome fachfremde Ersatzarbeit; ohne passende Arbeit allgemeiner Ruhemodus mit weniger Verbrauch.
- Der aktuelle VM-Stand kann neuere, noch nicht gepushte Teich-/Weltänderungen enthalten. **Vor Spielcodeänderungen lokalen Stand mit GitHub abgleichen.**

## Konkrete Entwicklungsreihenfolge für Codex

1. Erst Ressourcen-Grundsystem mit getrennten individuellen Lagerkapazitäten und automatisierten Tests (Auftrag 01).
2. Darauf Sammeltransporte und Kolonieverbrauch aufbauen. Den allgemeinen Ruhemodus als möglichen Verbrauchsfaktor vorsehen, ohne schon Ruhekammer-UI zu benötigen.
3. Nach dem Grundsystem beim Nestbau Datenmodelle für Kammerart, nutzbare Fläche, typspezifische Mindestfläche, Platzanzahl/Kapazität und Betriebszustand einbauen.
4. Beim späteren Ruhesystem ruhenden Ameisen optional einen freien Ruhekammerplatz zuweisen; nur dann zusätzlichen Verbrauchsabschlag gewähren. Ohne Platz weiter normales Ruhen erlauben.
5. Kapazitätswerte und Verbrauchsrabatte als **Testwerte** zentral konfigurieren, bis die Spielbalance gemeinsam geprüft ist.

## Vorgesehene Tests

- Ruhende Ameise ohne Ruhekammer hat reduzierten Verbrauch gegenüber aktiver Ameise.
- Ruhende Ameise mit freiem Ruhekammerplatz hat nochmals geringeren Nahrung- und Wasserverbrauch.
- Volle/fehlende Ruhekammer verhindert normalen Ruhemodus **nicht**.
- In Ruhekammer können nicht mehr Ameisen gleichzeitig einen Ruheplatz beanspruchen als die Kammer Kapazität bietet.
- Unterschiedliche Kammertypen berechnen Kapazitäten mit unterschiedlichen konfigurierbaren Raten pro Kachel.
- Größere betriebsbereite Kammer gleichen Typs -> mehr passende Kapazität.
- Unfertige Kammer liefert noch keine Lager-, Brut- oder Ruheplätze.
- Keine automatische Geschwindigkeits-/Effizienzsteigerung allein durch Kammervergrößerung.

## Als Nächstes gemeinsam zu entscheiden

- **Erste vorläufige Mindestflächen und typspezifische Kapazitäten** der Startkammern.
- Vorläufige zusätzliche Verbrauchseinsparung in Ruhekammern, ggf. erst beim detaillierten Überlebens-Balancing.
- Räumliche Validierung von Kammern und Zugriff auf freie Ruheplätze.

**Status:** Verbindliche Regeln, Zahlen noch unentschieden. Dieses Dokument ändert keine Spieldateien.
