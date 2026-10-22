# ANTHIVE – Arbeitskachel-Reihenfolge und überschüssige Baumeisterinnen

**Verbindliche Beschlüsse vom 22.10.2026.** Ergänzt die bisherigen Planungsunterlagen in `planung/`, insbesondere `2026-10-22-zusammenarbeit-baumeisterinnen-und-bauskalierung.md`.

## Beschluss 1: Reihenfolge der Arbeitskacheln B – vom Zugang aus

- Baumeisterinnen arbeiten sich **vom zugänglichen Eingang / Rand einer Baustelle aus schrittweise in den geplanten Bereich hinein**.
- Dadurch werden innere Kacheln erst bearbeitet, wenn ihre Erreichbarkeit durch zuvor entfernte Kacheln hergestellt ist.
- Nur **aktuell erreichbare und grabfähige, nicht bereits reservierte** Arbeitskacheln dürfen vergeben werden.
- Mehrere Baumeisterinnen können **verschiedene** verfügbare Kacheln desselben Bauauftrags gleichzeitig bearbeiten; **höchstens eine Ameise pro Kachel**.
- Nicht automatisch die leichteste Erdschicht oder ausschließlich die jeweils nächste Kachel unabhängig vom Bauzugang bevorzugen.
- Bei mehreren möglichen Zugängen/Baustellenrändern muss die Auswahl deterministisch und nachvollziehbar erfolgen; genaue Tie-Breaker sind technische, noch nicht beschlossene Details.
- Ungrabbarer Untergrund bleibt bis zu den bereits vorgesehenen Verbesserungen gesperrt; blockierte Aufträge bleiben in der Warteschlange und dürfen temporär übersprungen werden.

## Beschluss 2: Überschüssige Baumeisterinnen C – Materialtransporte

- Wenn **an der aktuell bearbeiteten Baustelle nicht genügend gleichzeitig erreichbare und freie Grabkacheln** existieren, übernehmen überschüssige Baumeisterinnen **sinnvolle vorhandene Materialtransporte**.
- Dafür müssen sie **keinen späteren Bauauftrag beginnen**: Die beschlossene Grundreihenfolge der Bauaufträge (FIFO) bleibt erhalten.
- Materialtransporte können beispielsweise vorhandenes Baumaterial zu einem passenden Lager bzw. bei tatsächlichem Bedarf an den laufenden Bauort bringen, soweit diese Logistik vorgesehen und ausführbar ist.
- Keine Transportaufträge künstlich erzeugen, wenn kein Material bzw. kein geeigneter Zielort existiert. Für Leerlauf ohne sinnvollen Transport ist noch kein gesondertes Verhalten für Baumeisterinnen hier beschlossen; allgemeine Ruheentscheidung für Ameisen beachten.
- **Tragkapazität 5 Einheiten Baumaterial** ist nur ein zentral änderbarer Testwert.
- Die schon beschlossene Regel **„alten, liegengebliebenen Abraum erst abholen, wenn keine ausführbaren Grabaufträge mehr anstehen“ bleibt bestehen**. Der neue Beschluss C ist keine pauschale Aufhebung dieser Priorität: Überschüssige Ameisen erledigen vorrangig Materialtransporte, die mit dem aktiven Bauablauf vereinbar sind. Ob die Abholung alten Abraums in einer konkreten Situation dazu zählt, muss an der bestehenden Prioritätsregel gemessen werden.
- Bei wieder frei werdender Grabkachel können Baumeisterinnen nach sicherem Abschluss/Unterbrechung ihrer Transportarbeit zur laufenden Baustelle zurückkehren.

## Bereits beschlossene übergreifende Regeln

- Gruppenverwaltung statt Einzelsteuerung; dauerhaft festgelegte Spezialisierungen, Spieler bestimmt Arbeitseinsatz.
- Pro Grabkachel maximal eine arbeitende Baumeisterin; parallel auf unterschiedlichen Kacheln; Beschleunigung nur bei genügend erreichbaren Arbeitsflächen.
- Arbeitskacheln erhalten eindeutige Reservierungen; Material pro tatsächlich ausgegrabener Kachel genau einmal.
- Graben: vom Spieler eingezeichnete, zusammenhängende Kachelflächen; Pinsel und Rechteck kombinierbar; Funktion der Kammer bei Planung festlegen.
- Bauaufträge werden in Erstellungsreihenfolge bearbeitet; unerreichbare Aufträge bleiben gespeichert und dürfen vorübergehend übersprungen werden.
- Baumaterialgewinn, Grabzeiten und Tragkapazität sind veränderbare Testwerte. Bei vollem Lager darf weitergegraben werden, überschüssiges Material bleibt am Ort.
- Erst ausgegrabene **und** eingerichtete Kammern sind nutzbar.

## Umsetzungshinweise für Codex – im späteren Nestbau-Arbeitspaket

1. **Zuerst lokalen VM-Stand prüfen und mit GitHub synchronisieren**, besonders noch nicht gepushte Teich-/Weltänderungen schützen.
2. Im bereits vorhandenen Grab- und Pathfinding-System den vom Zugang fortschreitenden Aushub als **Erreichbarkeits-/Priorisierungsregel** vorsehen, ohne Terrain-Teleportation.
3. Bauauftrag und Arbeitskachelreservierungen so verwalten, dass je Kachel höchstens eine Ameise arbeitet. Beim Entfernen einer Kachel neue zugängliche Randkacheln prüfen.
4. Reicht die Grabfront nicht für alle Baumeisterinnen, noch freie Ameisen bevorzugt für zulässige Materialtransporte rund um die laufende Arbeit berücksichtigen; keinen weiteren Bauauftrag allein wegen dieser Überbelegung starten.
5. Bereits beschlossene Logistikpriorität für **alten Abraum** nicht übergehen. Arbeits-/Transportaufträge nur mit realen Ressourcen und Zielkapazitäten erstellen; keine Doppelbuchung oder Verlust.
6. Bei wieder frei werdender Grabfront laufende Transporte sicher behandeln, damit keine Ladungen verschwinden.
7. Diese Erweiterung **nicht** in den ersten Ressourcen-Basisauftrag von Codex hineinpressen. Dokumente entsprechend der bereits festgelegten Entwicklungsreihenfolge abarbeiten.

## Vorgeschlagene Tests

- Ein tiefer Raum wird schrittweise ab seiner zugänglichen Grenze geöffnet, nicht im unerreichbaren Inneren begonnen.
- Mehrere Baumeisterinnen bearbeiten verschiedene erreichbare Kacheln parallel, aber niemals dieselbe Kachel.
- Nur eine zugängliche Kachel und vier Baumeisterinnen: eine gräbt, die anderen dürfen tatsächlich mögliche Materialtransporte erledigen.
- Keine verfügbaren Materialtransporte: keine erfundenen Lieferungen oder Ressourcen.
- Zusätzliche Baumeisterinnen starten nicht nur wegen Grabfront-Enge ungefragt spätere Bauaufträge.
- Nach neuen freien Arbeitskacheln können Baumeisterinnen wieder an der vorgesehenen Baustelle arbeiten.
- Grabreihenfolge, FIFO/Blockaderegel, Materialertrag, Lagergrenzen und Abraum-Abholpriorität bleiben konsistent.

## Nächste offene Planung

- Was sollen **enge Tunnel und Gegenverkehr** für Transportdauer und Wegfindung bedeuten?
- Sollen Ameisen bei gleichzeitig verfügbaren Routen automatisch Ausweichwege bevorzugen?
- Wie soll Transportverkehr bei mehreren Hundert Ameisen performant simuliert werden (Abstraktion vs. genaue Kollision)?

**Diese Datei dokumentiert Entscheidungen; es wurde kein Spielcode geändert.**
