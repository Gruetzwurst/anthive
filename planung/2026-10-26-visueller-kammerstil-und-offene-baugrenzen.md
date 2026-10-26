# ANTHIVE – Visueller Kammerstil und Prüfung von Baugrenzen

**Beschlossene Gestaltungsentscheidungen vom 26.10.2026.** Planung, keine Code- oder Grafikänderung.

## Zwei verbindliche Gestaltungsentscheidungen (beide Variante B)

1. **Ausgewogene Raumerkennbarkeit:** Funktionskammern werden primär durch tatsächliche Einrichtung, Inhalt und Nutzung unterscheidbar; hinzu kommen dezente Unterschiede an Boden, Rand und Wand. Keine aufdringlichen künstlichen Farbblöcke oder menschlich wirkenden Möbel. Neutrale Hohlräume bleiben neutral, geplante und unfertige Räume sind als solche kenntlich.
2. **Brutkammern leicht unterscheidbar:** Die vier Spezialisierungen teilen eine gemeinsame natürliche Brutkammer-Gestaltung; dezente Symbole, Muster oder Akzente unterscheiden Sammlerinnen-, Baumeisterinnen-, Kämpferinnen- und Brutpflegerinnen-Brutkammern. Keine stark abweichenden Fantasie-Räume.
3. Ziel: unterscheidbare Einrichtungen und nach aktuellem Lagerbestand bzw. Belegung visuell veränderliche Inhalte. Weitere konkrete Kunst-/Grafikformen sind noch auszuarbeiten; **keine Grafiken erzeugen oder Spielcode anpassen**.

## Verbindliche Bauregeln: Maximalgröße und Kammerabstand

**Nutzerbeschluss vom 26.10.2026.** Gilt für die Planung **neuer Funktionskammern**; die bereits existierenden Startkammern sollen dadurch nicht nachträglich unbrauchbar werden. Bestehende Raumfunktionen, freie Tunnel und fertiggestellte Räume bleiben unangetastet.

### Maximalflächen

Für jede Funktionskammer gilt: **Maximum = 2 × Flächengröße der Vorlage „Groß“ = 8 × bisherige Mindestfläche.** Darüber hinaus muss der Spieler **eine neue, eigenständige Funktionskammer** planen. Das ist **keine Obergrenze für die Anzahl von Kammern** gleichen Typs.

| Funktionskammer | Klein | Mittel | Groß | Maximum je einzelner Kammer |
| --- | ---: | ---: | ---: | ---: |
| Nahrungslager | 12 | 24 | 48 | **96** |
| Wasserlager | 12 | 24 | 48 | **96** |
| Baumateriallager | 12 | 24 | 48 | **96** |
| Ruhekammer | 16 | 32 | 64 | **128** |
| Brutkammer Sammlerinnen | 20 | 40 | 80 | **160** |
| Brutkammer Baumeisterinnen | 20 | 40 | 80 | **160** |
| Brutkammer Kämpferinnen | 20 | 40 | 80 | **160** |
| Brutkammer Brutpflegerinnen | 20 | 40 | 80 | **160** |

Angaben in **Kacheln**, nicht Seitenlängen. Vorlagen bleiben optional; die freie zusammenhängende Formgestaltung bleibt bis zum typabhängigen Maximum erhalten. Bei Überschreitung soll die Bauvorschau verständlich anzeigen, warum der Bauplan nicht bestätigt werden kann. Für die Königinnenkammer wurde noch keine Mindestfläche oder reguläre baubare Vorlage beschlossen; nicht eigenmächtig ein Maximum aus der Tabelle ableiten.

### Abstand zwischen Funktionskammern

- **Zwischen den belegten Kachelflächen zweier verschiedener Funktionskammern müssen mindestens zwei ganze Kacheln Zwischenraum liegen.** Dies gilt **seitlich und diagonal/an Ecken**.
- Maßgeblich ist die Lage der Kammerflächen, **nicht** der Untergrundzustand: Erde, leere Fläche und bereits ausgehobene **Gänge/Tunnel** dürfen die beiden Zwischenkacheln ausfüllen. **Keine verpflichtende Erdwand**.
- Eine eindeutige technische Interpretation bei quadratischen Kacheln: Für **jedes** Kachelpaar aus unterschiedlichen Kammern muss `max(abs(dx), abs(dy)) >= 3` gelten, wobei `dx,dy` die Differenz der Kachelkoordinaten sind. Damit bleiben auch an Ecken zwei Kachelpositionen frei; diagonale Berührung oder nur eine diagonale Zwischenkachel ist unzulässig.
- Reine Tunnelkacheln gelten **nicht** als Funktionskammer-Flächen und dürfen durch den Abstand führen und die Räume zugänglich machen.
- Regel für **alle** neu geplanten Funktionskammern unabhängig von ihrer Funktion (auch zwei Kammern desselben Typs), nicht nur zwischen verschiedenen Kammertypen.
- Prüfung bereits bei Platzierung/Bestätigung gegen geplante, im Bau befindliche und fertiggestellte Kammerflächen; keine Umgehung durch späteres Ausgraben des Zwischenraums als Tunnel. Ein Gang im Zwischenraum macht aus zwei Kammern nicht automatisch eine einzige Kammer.

### Grenzen und Umsetzung

- Diese beiden Grenzen schützen **Größe einzelner Funktionskammern** und die **Lesbarkeit des Nests**; sie verhindern **nicht**, dass der Spieler einen großen Bergbereich als neutrale Tunnel/Hohlräume ausgräbt oder viele getrennte Kammern baut. Das ist ausdrücklich kein Grund für eine neue globale Aushubgrenze.
- Keine willkürliche Erhöhung oder Verringerung der Kammerkapazität. Kapazitäten und Baumaterialkosten bleiben flächenbasiert. Größere Kammern erfordern entsprechend mehr Einrichtungsmaterial.
- Bei einer späteren Codex-Umsetzung Tests für genau anliegende, eine Kachel getrennte, zwei Kacheln getrennte und diagonal benachbarte Kammern; alle Raumarten und freie Formen, Vorlagen, bestehende Kammern und Tunnelzugänge abdecken.
- **Jetzt nur planen, noch keine Code- oder Grafikänderung.** Nach C5 und ausdrücklicher Implementierungsfreigabe den lokalen und GitHub-Stand vor Umsetzung prüfen.

## Status

**Visueller Stil B/B, Maximalflächen und Kammerabstand von zwei Kacheln einschließlich Diagonalen verbindlich beschlossen.** Konkrete Kunstassets und geometrische Vorlagenformen bleiben gesondert auszuarbeiten.
