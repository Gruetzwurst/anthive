# ANTHIVE – Visueller Kammerstil, Maximalflächen und Abstand

**Verbindliche Planungsbeschlüsse vom 26.10.2026.** Keine Code- oder Grafikänderung. Umsetzung erst nach C5 mit erneuter Freigabe.

## Visueller Kammerstil – zwei Entscheidungen B

1. **Ausgewogen und natürlich:** Eingerichtete Funktionsräume werden hauptsächlich über Inhalt, Ausstattung und Nutzung sichtbar; dazu kommen dezente Unterschiede bei Boden, Rändern und Wänden. Keine grellen Funktionsfarben oder unpassenden menschlichen Möbel.
2. **Brutkammern leicht unterscheidbar:** Die vier Spezialisierungen teilen sich eine gemeinsame natürliche Brutgestaltung, erhalten aber dezente Symbole/Muster/Akzente für Sammlerinnen, Baumeisterinnen, Kämpferinnen und Brutpflegerinnen.
3. Ein nur ausgegrabener Hohlraum ist keine fertige Funktionskammer. Geplant / im Bau / fertig aber leer / fertig und benutzt sollen nachvollziehbar unterscheidbar sein. Inhalte und Belegung dürfen sich dynamisch darstellen. Konkrete Grafiken sind noch zu gestalten.

## Maximalfläche je einzelner Kammer – Größensystem C

**Maximum = 2 × Kachelfläche der großen quadratischen Vorlage.** Die Auswahl Klein/Mittel/Groß/Frei und die verbindlichen Seitenmaße stehen auch in `planung/2026-10-26-kammervorlagen-klein-mittel-gross-und-freies-bauen.md`.

| Kammertyp | Klein | Mittel | Groß | Maximum pro frei gestalteter Kammer |
| --- | ---: | ---: | ---: | ---: |
| Nahrungslager | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128 Kacheln** |
| Wasserlager | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128 Kacheln** |
| Baumateriallager | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128 Kacheln** |
| Ruhekammer | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128 Kacheln** |
| Brutkammern (alle vier Spezialisierungen) | 5×5 = 25 | 7×7 = 49 | 9×9 = 81 | **162 Kacheln** |

Diese Tabelle ersetzt ältere Vorlagenflächen (12/24/48, 16/32/64, 20/40/80) und Maxima (96/128/160) als **Vorlagen- und Obergrenzenfestlegungen**. Die alten freien **Mindestflächen** bleiben bei 12 Kacheln für Lager, 16 für Ruhekammern und 20 für Brutkammern. Kosten und Kapazitäten werden weiterhin anhand der **wirklichen Kachelfläche** berechnet. Für die Königinnenkammer wurde keine neue baubare Vorlage oder Maximalgröße festgelegt.

Größere frei gezeichnete Kammern bis zum Maximum bleiben erlaubt; darüber ist eine **separate neue Kammer** nötig. Die Anzahl der Kammern ist nicht begrenzt. Vorhandene Startkammern dürfen nicht rückwirkend unbrauchbar werden.

## Verbindlicher Kammerabstand

- Zwischen den **Kachelflächen beliebiger zwei Funktionskammern** müssen **zwei ganze Kachelpositionen Zwischenraum** liegen, sowohl seitlich als auch diagonal/an Ecken. Dies gilt auch zwischen zwei Kammern gleichen Typs.
- Die Zwischenflächen dürfen **Erde, vorhandene offene Kacheln oder Tunnel** sein. **Keine Pflicht zu einer Erdwand**. Tunnel dürfen die Kammern verbinden und zählen nicht selbst als Funktionskammer.
- Technisch für jedes Paar `(x1,y1)` und `(x2,y2)` aus zwei unterschiedlichen Kammern: `max(abs(x1-x2), abs(y1-y2)) >= 3`. Damit dürfen Kammerflächen nicht unmittelbar benachbart oder nur durch eine Kachel getrennt sein, auch diagonal.
- Gegen geplante, im Bau befindliche und betriebsbereite Kammern prüfen. Zwei bereits vorhandene, zuvor zulässige Startkammern werden nicht nachträglich umgebaut oder deaktiviert.
- Reine Tunnel können frei durch den Abstand verlaufen; spätere Tunnelgrabung verbindet Kammern nicht automatisch zu einer Funktionskammer.

## Abgrenzung und spätere Tests

Maximalfläche und Abstand schützen die Lesbarkeit und begrenzen einzelne Funktionsräume, **nicht** die Menge an neutralen ausgegrabenen Hohlräumen oder die Anzahl separat eingerichteter Kammern. Kein pauschales Verbot, den Berg großflächig auszugraben.

Tests für Freihand und Vorlagen: alle Maße und Maxima, diagonale sowie seitliche Null-/Ein-/Zwei-Kachel-Abstände, geplante und fertige Räume, Tunnelzugänge, korrekte Material- und Kapazitätsbilanz, existierende Startkammern.

**Status:** Visueller Stil B/B, Größensystem C, Maxima und Abstand beschlossen. Konkrete Kunstassets offen. Keine Codex-Implementierung ohne spätere Freigabe.
