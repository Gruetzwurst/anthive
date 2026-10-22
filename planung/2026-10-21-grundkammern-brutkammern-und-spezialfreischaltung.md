# ANTHIVE – Grundkammern, zusätzliche Brutkammern und Freischaltungen

**Verbindliche Entscheidungen vom 21.10.2026.** Ergänzung zu den anderen Unterlagen im Ordner `planung/`. Dieses Dokument hält Designentscheidungen fest und verändert keinen Spielcode.

## Beschluss 1: Baubare Grundkammern C – erweiterte Grundversorgung

Zu Spielbeginn darf der Spieler bauen:
- **Nahrungslagerkammern**;
- **Wasserlagerkammern**;
- **Baumateriallagerkammern**;
- **zusätzliche spezialisierte Brutkammern** (siehe Beschluss 2);
- **einfache Ruhekammern für Arbeiterinnen**.

Diese Grundkammern benötigen keine spätere Spezialkammer-Freischaltung, müssen aber normale Bauvoraussetzungen erfüllen (erreichbarer Bauplatz, grabbares Terrain, Material und typspezifische Mindestgröße). Die vorhandene Königinnenkammer bleibt ein bestehender besonderer Raum; aus diesem Beschluss folgt **nicht**, dass beliebig viele Königinnenkammern zu Spielbeginn baubar wären.

**Wichtig:** Die Ruhekammer ist als neue baubare Kammerart beschlossen. Ihre genaue Funktion, Kapazität und die Frage, ob ruhende Ameisen zwingend eine Ruhekammer benötigen, sind noch **nicht festgelegt**. Frühere Entscheidung bleibt: Haben Ameisen keine passende Arbeit, wechseln sie in einen Ruhemodus mit reduziertem Verbrauch.

## Beschluss 2: Zusätzliche Brutkammern A – Spezialisierung durch Kammer

- Jede zusätzlich geplante Brutkammer wird **schon während der Planung genau einer von vier dauerhaften Spezialisierungen zugeordnet**:
  1. Sammlerinnen,
  2. Baumeisterinnen,
  3. Kämpferinnen,
  4. Brutpflegerinnen.
- Die Königin legt Eier automatisch; der Spieler verteilt Eier auf spezialisierte Brutkammern. **Der gewählte Brutkammertyp bestimmt die spätere Spezialisierung** der Ameisen.
- Dies passt zur früheren Regel: **Spezialisierung bleibt dauerhaft**, aktuelle Arbeitseinsätze kann der Spieler gruppenweise ändern, fachfremd mit Effizienznachteil.
- Fertige Kammern können gemäß früherer Entscheidung **nicht in einen anderen Kammertyp umgewidmet** werden. Eine Brutkammer-Spezialisierung ist folglich nach Fertigstellung nicht einfach austauschbar.
- Größere Brutkammern können **mehr Brut aufnehmen**, ohne automatisch Arbeitsgeschwindigkeit oder Effizienz zu erhöhen.

## Beschluss 3: Spezialkammer-Freischaltung C – Kombination

- Für spezielle Kammerarten können **sowohl Koloniewachstum (z. B. Koloniegröße) als auch Verbesserungen/Forschung** Freischaltvoraussetzungen bilden.
- Nicht ausschließlich Ameisenzahl und nicht ausschließlich Forschung.
- Die konkreten Spezialkammerarten, Schwellen, Forschungspunkte, Reihenfolge und Kosten sind **noch offen**. Keine nicht beschlossenen Zahlen als finale Anforderungen codieren.
- Grundkammern aus Beschluss 1 stehen von Beginn an zur Verfügung.

## Unveränderte Beschlüsse zum Nestbau

- Freie, aber **zusammenhängende** Kammerformen; Pinsel und Rechteck kombinierbar.
- Kammertyp wird schon **beim Planen** gewählt; fertiggestellte Kammern sind **nicht umnutzbar**.
- Funktionsabhängige Mindestgrößen; größere Kammern bieten mehr passende Kapazität und verursachen höhere material-/typabhängige Einrichtungskosten.
- Bauablauf: planen -> ausgraben -> mit Baumaterial einrichten -> betriebsbereit; vor Fertigstellung **keine** aktive Lager-/Brutkapazität.
- Baumeisterinnen erledigen Aufträge grundsätzlich in Erstellungsreihenfolge (FIFO); unerreichbare/gesperrte Aufträge dürfen vorübergehend übersprungen werden, bleiben aber erhalten.
- Entfernte Kammern dürfen vorgeplant, aber erst bei vorhandener Erreichbarkeit bearbeitet werden.
- Abbruch: ausgegrabene Bereiche bleiben; unverbrauchtes Material wird nicht vernichtet.
- Unterschiedliche Erdschichten beeinflussen Grabdauer und ggf. Freischaltung; kein beschlossener Einsturzmechanismus.

## Umsetzungshinweise für Codex

1. **Vor Programmierarbeit lokalen VM-Stand mit GitHub prüfen/synchronisieren.** Lokale, noch nicht veröffentlichte Welt-/Teichänderungen keinesfalls überschreiben.
2. Zuerst die bereits priorisierten Ressourcen-Aufträge abschließen. Erst danach neue Kammerbauoberfläche, weitere Brut- und Ruhefunktionen bauen.
3. Bei Kammerarten-Konfiguration `buildableFromStart`, `minArea`, `unlocks`, `capacityByArea` und `furnishingCost` als mögliche Erweiterungspunkte berücksichtigen, ohne alle Werte oder Forschungssysteme sofort zu implementieren.
4. **Ruhekammer vorläufig als geplanten Kammertyp behandeln**; bisherige allgemeine Ruhe-/Leerlaufmechanik nicht ohne ausdrückliche Entscheidung durch die Kammerpflicht ersetzen.
5. Für Brutkammern die vier Spezialisierungen als unveränderliches Planungsmerkmal abbilden und die vorhandenen vier Brutkammern im Projektzustand beachten.
6. Keine neue Königinnen- oder Kampfsimulation aus diesem Beschluss ableiten.

## Tests für spätere Bau-/Koloniephasen

- Nahrung-, Wasser-, Baumateriallager, zusätzliche spezialisierte Brut- und einfache Ruhekammern sind zu Beginn im Bausystem auswählbar.
- Spezialkammer ist gesperrt, bis ihre kombinierten Bedingungen erfüllt sind.
- Brutkammer verlangt beim Planen eine der vier Spezialisierungen; der Typ bleibt nach Fertigstellung unverändert.
- Größere fertige Brutkammer hat höhere Brutkapazität; unfertige nicht.
- Grundkammer benötigt dennoch passenden Baugrund, Verbindung, Einrichtung und Mindestfläche.
- Leerlaufende Ameise kann auch ohne fertiges neues Ruhekammer-System sicher behandelt werden, bis dessen konkrete Wirkung entschieden und umgesetzt ist.

## Nächste offene Entscheidungen

- Welche Rolle übernimmt die **Ruhekammer** im bereits beschlossenen allgemeinen Ruhemodus?
- Welche ersten **Mindestgrößen und Kapazitätswerte** sollen als Testwerte verwendet werden?
- Welche speziellen Kammerarten sollen überhaupt später existieren und welche Wachstums-/Verbesserungsanforderungen gelten?

**Keine stillschweigenden neuen Spielregeln ergänzen.**
