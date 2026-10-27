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

## Ergänzung vom 27.10.2026 – sichtbarer Einrichtungsfortschritt (verbindlich)

- Der Spieler wählt den **Funktionskammertyp bereits im bestehenden Baumenü**; der Kammertyp ist im bestehenden Bauplan gespeichert. Es ist **keine neue automatische Erkennung** frei gezeichneter Räume notwendig. Auch für freie Formen bestimmt der vorhandene Kammertyp die Darstellung.
- **Während Baumeisterinnen eine fertig ausgegrabene Kammer tatsächlich mit Baumaterial einrichten, wird die typbezogene Einrichtung nach und nach sichtbar.** Ein vollständig ausgehobener, aber noch nicht eingerichteter Raum bleibt ein erkennbarer Rohbau. Keine schlagartige vollständige Umwandlung erst bei Bauabschluss.
- Der sichtbare Fortschritt muss an den **echten, vorhandenen Einrichtungsfortschritt** gekoppelt sein. Keine rein zeitgesteuerten Dekorationen, keine erfundenen Materialien oder Fertigstellungsprozente. Pausierte, blockierte oder nicht versorgte Aufträge dürfen optisch nicht weitergebaut werden.
- Wände/Boden/Ränder und charakteristische, natürliche Grundausstattung sollen modular über die tatsächlich geplante Kachelfläche funktionieren: **gleiche Darstellungslogik für Quadratvorlagen und frei gezeichnete, unregelmäßige zusammenhängende Räume**. Einzigartige Komplettgrafiken für jede mögliche Kammergeometrie sind nicht erforderlich.
- Zwischen **unfertiger Einrichtung** und **aktiver Funktion** besteht ein wichtiger Unterschied: Der Raum darf schon teilweise ausgestattet aussehen, **liefert aber erst nach vollständiger Einrichtung seine Kapazität und Funktion**, wie bereits beschlossen.
- **Grundausstattung** macht fertiggestellte, noch leere Kammern erkennbar; tatsächliche Nahrung-/Wasser-/Materialhaufen und belegte Ruhe-/Brutplätze entsprechen nach Fertigstellung den wirklichen Beständen/Individuen. Keine Phantomressourcen für die Optik.
- Modulare Einrichtung soll Zugänge, Wege und Ameisen nicht optisch verdecken. Bei freier Kammerform werden geeignete Innen-, Rand- und Eingangskacheln entsprechend berücksichtigt.
- Noch offen: konkrete Grafikassets, Zwischenstufen/Animationen und Detailregeln der modularen Dekorplatzierung. Sie sind **keine Freigabe**, Änderungen am Spielcode oder Grafiken jetzt vorzunehmen.
- Spätere Prüfung durch Codex: Einrichtung 0/teilweise/voll, pausiert/blockiert, freie ungewöhnliche Kammerformen, keine Kapazität vor Abschluss, danach korrekte echte Lagerbestände/Belegung; Tests und Build.


## Ergänzung vom 27.10.2026 – eindeutige Abstandswarnung in der Bauvorschau

**Verbindlicher Nutzerbeschluss:** Kann eine neue Funktionskammer wegen des Mindestabstands von **zwei Kacheln – seitlich wie diagonal** nicht an einer Position platziert werden, muss das **bereits während der Platzierung** verständlich angezeigt werden.

- Die Vorschau kennzeichnet den Bauplan **deutlich als nicht platzierbar** (z. B. rot), solange der Abstand zu bestehenden, geplanten oder im Bau befindlichen Funktionskammern unterschritten wird.
- Zusätzlich ist **der betroffene Konfliktbereich / die zu nahe liegende Kammer** visuell zu markieren, sodass der Spieler erkennen kann, **wo** der erforderliche Zwischenraum fehlt – nicht nur ein rotes Gesamtsymbol.
- Eine kurze deutschsprachige Meldung erklärt die konkrete Ursache, z. B. **„Nicht baubar: Mindestens 2 Kacheln Abstand zu anderen Kammern erforderlich.“**
- Auch **diagonal** zu nahe Platzierungen müssen zuverlässig angezeigt und blockiert werden.
- Zwischenliegende Tunnel bzw. offene Kacheln sind erlaubt: Die Warnung hängt **ausschließlich von den tatsächlichen Kammerflächen** ab, nicht davon, ob im Zwischenraum Erde oder ein Gang liegt.
- Beim Verschieben oder freien Nachzeichnen der Vorschau soll die Rückmeldung aktualisiert werden. Sobald der Abstand stimmt, verschwindet die Warnung; danach ist der Plan hinsichtlich der Abstandsregel bestätigbar.
- Bei diesem Abstandskonflikt darf kein ungültiger Bauauftrag in die Warteschlange gelangen. Bestehende Bauaufträge und alte Startkammern werden durch die neue Vorschau nicht rückwirkend geändert.
- **Spätere Abnahmeprüfungen:** seitlicher und diagonaler Abstand bei 0/1/2 dazwischenliegenden Kacheln; gleicher/anderer Kammertyp; Vorlage und freier Modus; geplante/halbfertige/fertige Nachbarkammer; Tunnel zwischen Kammern; Warnung bei Verstoß und Verschwinden nach Korrektur.
- **Nur Planung:** erst nach C5 und ausdrücklicher Freigabe an Codex zur Umsetzung; keine Code- oder Grafikänderung jetzt.
