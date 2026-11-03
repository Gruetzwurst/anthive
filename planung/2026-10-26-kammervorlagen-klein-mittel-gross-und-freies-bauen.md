# ANTHIVE – Quadratische Bauvorlagen und freie Kammergestaltung

**Verbindlicher Beschluss vom 26.10.2026: Größensystem C.** Geplanter Codex-Auftrag für **nach C5**; vorher Entwicklungsstand prüfen und ausdrückliche Umsetzungsfreigabe einholen. **Jetzt ausschließlich Dokumentation, keine Spielcode- oder Grafikänderung.**

## Beschlossene Auswahl beim Kammerbau

- Je baubarem Funktionskammertyp stehen **Klein / Mittel / Groß / Frei** zur Verfügung.
- Die drei Vorlagen sind **Quadrate**; Seitenlängen sind verbindlich nach Kammerart festgelegt. Die ältere Idee der exakten Flächenverdopplung von Klein zu Mittel und Mittel zu Groß ist **aufgehoben**.
- **Frei** bleibt vollständig erhalten: beliebige zusammenhängende Kammerformen mit Pinsel und Rechteckwerkzeug, solange bisherige Mindestflächen, maximal zulässige Fläche und die Zwei-Kachel-Abstandsregel eingehalten werden.
- Vorlagen sind lediglich vorgewählte Kachelflächen und verwenden dieselbe bestehende Bauplanung, Kosten-, Kapazitäts-, Erreichbarkeits- und Einrichtungslogik. Keine Sonderboni für Vorlagen.
- Tunnel bleiben frei planbar. Für die Königinnenkammer ist keine neue frei baubare Vorlage/Mindestfläche beschlossen.

## Verbindliche Maße und Maximalflächen

| Funktionskammer | Bestehende Mindestfläche (Frei) | Klein | Mittel | Groß | Maximum pro Kammer (Frei) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Nahrungslager | 12 | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128** |
| Wasserlager | 12 | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128** |
| Baumateriallager | 12 | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128** |
| Ruhekammer | 16 | 4×4 = 16 | 6×6 = 36 | 8×8 = 64 | **128** |
| Brutkammer – Sammlerinnen | 20 | 5×5 = 25 | 7×7 = 49 | 9×9 = 81 | **162** |
| Brutkammer – Baumeisterinnen | 20 | 5×5 = 25 | 7×7 = 49 | 9×9 = 81 | **162** |
| Brutkammer – Kämpferinnen | 20 | 5×5 = 25 | 7×7 = 49 | 9×9 = 81 | **162** |
| Brutkammer – Brutpflegerinnen | 20 | 5×5 = 25 | 7×7 = 49 | 9×9 = 81 | **162** |

**Maximum = zweimal tatsächliche Fläche der großen Vorlage.** Dies begrenzt die Größe **einer einzelnen Kammer**, nicht die Anzahl von Kammern eines Typs. Über dem Maximum muss eine eigenständige neue Kammer entstehen. Die älteren Werte für Vorlagen 12/24/48, 16/32/64 und 20/40/80 sowie ältere Maxima 96/128/160 sind durch diese Tabelle ersetzt, **soweit sie Vorlagen/Maximalflächen betreffen**. Bestehende Mindestflächen für **Frei** bleiben 12/16/20, ebenso bestehende Kapazitätsraten und Kosten je tatsächlich genutzter Kachel.

## Weitere verbindliche Bauregeln

- Zwischen **je zwei Funktionskammerflächen** bleiben mindestens zwei ganze Kacheln Zwischenraum, **auch diagonal**. Der Zwischenraum darf Erdreich oder ausgehobenen Tunnel enthalten; keine dauerhafte Erdwand vorgeschrieben. Details: `planung/2026-10-26-visueller-kammerstil-und-offene-baugrenzen.md`.
- Kammertyp wird bei der Planung festgelegt, nach Fertigstellung keine Umwidmung.
- Nur fertig ausgegrabene **und** eingerichtete Kammern liefern Funktion/Kapazität; jede zusätzliche Kachel verursacht die bestehenden entsprechenden Baukosten.
- Bestehende Ruhekammerregeln 100/80/50 % sowie automatische Platzsuche werden als **separater Schritt nach C5** umgesetzt: `planung/2026-10-26-ruhekammern-nach-c5.md`.
- Vorhandene Startkammern nicht rückwirkend ungültig machen.

## Konkreter Codex-Auftrag für später

1. Vor Änderungen den lokalen Entwicklungsstand mit den Codex-Branches abgleichen und vorhandene Änderungen sichern. **Nicht während C5 implementieren; ausdrückliche Freigabe abwarten.**
2. Größenauswahl Klein/Mittel/Groß/Frei, schwebende quadratische Vorschau, Positionierung und Anzeige von Fläche und daraus folgender Kapazität anbieten.
3. Vorgegebene Quadrate als exakt die oben definierten Kachelauswahlen erzeugen und an die bestehende Bauplanvalidierung und FIFO-Bauwarteschlange übergeben; keine parallele Sonder-Bauengine.
4. Freies Zeichnen behalten, aber Mindest- und Maximalfläche und Kammerrandabstand prüfen. Eine Platzierung mit Verstoß verständlich markieren; bestehende Kammern, Tunnel und Erreichbarkeit respektieren.
5. **Tests:** alle drei Maße pro Kammerart; Fläche und Kapazität; gleiche Kosten/Kapazitäten bei gleicher freier Fläche; exakt 128/162 erlaubt, 129/163 abgelehnt; Abstand seitlich und diagonal, Hindernisse, Tunnelverbindungen, Bau- und Betriebsvoraussetzungen; kompletter Testlauf und Build.

## Visualisierung

Beschlossene Richtung: natürliche eingerichtete Räume mit dezenten Boden-/Randdetails und sichtbaren typischen Inhalten und Nutzungszuständen; vier Brutkammertypen optisch leicht unterscheidbar. Konkrete Assets noch offen. Siehe `planung/2026-10-26-visueller-kammerstil-und-offene-baugrenzen.md`.

**Status:** Größensystem C und alle Tabellenwerte beschlossen, nur Planung dokumentiert; Code und Grafiken unverändert.
