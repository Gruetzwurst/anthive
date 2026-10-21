# ANTHIVE – Intelligente Sammel- und Transportlogik

**Verbindliche Entscheidungen vom 21.10.2026.** Ergänzt die vorhandenen Dokumente im Ordner `planung/`.

## Beschlossen

### 1. Lagerwahl B – effiziente automatische Zielwahl
- Sammlerinnen wählen selbstständig ein **erreichbares Lager des passenden Ressourcentyps mit freier Kapazität**.
- Berücksichtige für die Wahl **möglichst kurze Transportwege**, **Auslastung** und **verbleibenden Lagerplatz**. Nicht zwingend das geometrisch nächstgelegene Lager.
- Der Spieler muss für einzelne Ameisen keine Lager bestimmen.
- Die exakte Gewichtung von Entfernung, Belegung und Kapazität ist noch nicht festgelegt; als testbare und konfigurierbare Heuristik entwickeln.

### 2. Volle Lager B – andere sinnvolle Tätigkeiten
- Wenn **alle passenden Lager voll** sind, sammeln Ameisen nicht sinnlos weiter.
- Sie wechseln **vorübergehend zu einer anderen sinnvollen Tätigkeit**, soweit eine zugelassene und durchführbare Aufgabe existiert.
- Sobald passender Lagerplatz wieder zur Verfügung steht, soll die automatische Arbeitsplanung sie wieder fürs Sammeln berücksichtigen.
- Dies ist eine temporäre Reaktion, **keine dauerhafte Änderung der Gruppen- oder Spezialisierungszuweisung**.
- Welche Ausweichtätigkeiten konkret zugelassen sind und welche Priorität diese haben, ist noch zu entscheiden. Keine unerlaubten Berufswechsel ohne Effizienzregeln einführen.

### 3. Erschöpfte Quellen A – automatisch wechseln
- Ist eine Ressource erschöpft, suchen Sammlerinnen selbstständig eine **andere erreichbare Quelle des benötigten Ressourcentyps**.
- Keine Einzelanweisungen und kein verpflichtendes Warten an der erschöpften Quelle.
- Die erschöpfte Quelle regeneriert gemäß bestehenden Regeln und kann später erneut benutzt werden.
- Wenn *keine* Alternative existiert, keine Ressource aus dem Nichts erzeugen: warten oder zulässige andere Aufgaben annehmen und Versorgungsproblem sichtbar machen; die genaue Arbeitsreihenfolge ist noch offen.

## Bestehende Regeln, die weiter gelten
- Automatische Erkennung **aller erreichbaren** Ressourcenquellen, ohne Pflicht-Erkundung oder manuelle Quellfreigabe.
- Automatische Sammelaufteilung nach Bedarf und Spieler-Priorität Nahrung / Wasser / Ausgeglichen.
- Getrennte Nahrungs- und Wasserlager; jede Kammer hat begrenzte Kapazität; mehrere Kammern je Ressourcentyp sind baubar.
- Nahrung wird erst bei realer Ablieferung gutgeschrieben; keine Verdoppelung bei Abbruch, Lagerwechsel oder Überfüllung.
- Teich ist vorläufig unbegrenzte Wasserquelle; kleinere Quellen begrenzt; Nahrung regeneriert und benötigt nach Übernutzung Ruhe.
- Bei Gefahr fliehen Sammlerinnen möglichst, verteidigen sich bei direktem Angriff. Gefahrensystem gehört **nicht** in den ersten Ressourcenauftrag.
- Spezialisierungen sind dauerhaft, aktuelle Aufgaben können wechseln; fachfremde Arbeit mit Effizienznachteil. Keine Einzelsteuerung.

## Umsetzungsvorschlag für Codex (Reihenfolge beachten)

**Auftrag 01:** Ressourcen-Grundlogik mit Uhr, Quellen, **individuellen Lagerkammern**, Kapazitäten und Tests. Keine KI-Bewegungen oder UI.

**Auftrag 02:** Auf Grundlage der bestehenden Pfadfindung automatisch eine erreichbare Quelle und ein geeignetes Lager wählen; passende Lagertypen und freie Kapazität berücksichtigen. Bei erschöpfter Quelle alternative Quelle finden; bei vollem Lager auf erlaubte Alternativaufgabe reagieren. Transport und tatsächliche Ablieferung mit Tests absichern.

**Später bei Gruppen- und Aufgabensystem:** konkrete zulässige Ausweichaufgaben nach Spezialisierung und Zuweisung festlegen. Keine pauschal sofortige Implementierung fremder Tätigkeiten.

Vor Entwicklungsstart **aktuelle lokale VM-Änderungen mit GitHub abgleichen** – GitHub `main` enthält ggf. noch eine ältere Teichdarstellung.

## Notwendige Tests
1. Zwei passende Lager: wähle ein erreichbares mit Platz anhand der dokumentierten Effizienzregel.
2. Näheres Lager voll: anderes geeignetes Lager wählen.
3. Kein geeignetes Lager frei: keine weiteren Ressourcen aufnehmen; sinnvolle erlaubte Alternativaufgabe, sobald Aufgabenlogik existiert.
4. Lager wird unterwegs voll: alternative Ablieferung oder sicherer Wartezustand ohne Verlust/Duplizierung.
5. Nahrungsquelle erschöpft: erreichbare Alternative wird gesucht und genutzt.
6. Keine weitere Quelle: keine künstliche Entnahme, definierter Leerlaufzustand.
7. Weg zu Quelle/Lager blockiert: nur tatsächlich erreichbare Ziele berücksichtigen.
8. Prioritäten und dauerhafte Gruppenzuweisungen bleiben erhalten.

## Für spätere Planung offen
- Welche **Ausweichaufgaben** sind erlaubt, wenn die Lager voll sind?
- Wie priorisieren Ameisen mögliche Sammelziele bei mehreren Quellen (Distanz, Menge, Regeneration, Risiko)?
- Was passiert, wenn sämtliche Sammelquellen aktuell leer sind?
- Details der Laufweg-/Transportauslastungs-Heuristik.

**Dokumentation בלבד; keine Änderungen am Spielcode.**
