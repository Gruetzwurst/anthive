# ANTHIVE – Vorläufige Testwerte: Grabdauer und Einrichtungskosten

**Beschluss vom 22.10.2026.** Der Spieler hat **Einfluss der Erdschichten auf die Grabdauer B** und **Einrichtungskosten B** gewählt.

> **Status: veränderbare TESTWERTE, keine endgültigen Balancewerte.** Alle Werte zentral konfigurierbar halten und nach spielbaren Tests anpassen. Diese Datei ergänzt die bestehenden Beschlüsse im Ordner `planung/`; sie ändert keinen Spielcode.

## 1. Relative Grabdauer – Option B (mittel)

Die Dauer, die eine Baumeisterin für dieselbe abbaubare Fläche benötigt, wird gegenüber **lockerer Erde = 1,0×** multipliziert:

| Erdmaterial | Dauer-Multiplikator |
| --- | ---: |
| Lockere Erde (Referenz) | 1× |
| Kompakte Erde | 2× |
| Lehm | 3× |
| Stein | 5× |

**Nicht beschlossen:** Absolute Dauer je Kachel; Multiplikator für die tiefste Felsschicht / Tiefengestein. Die vorhandene Welt enthält fünf Erdschichten; tiefstes Gestein nicht kommentarlos dem normalen Steinwert gleichsetzen. Vorhandene Terrain-/Grabhärten und Projektstruktur prüfen und die Testwerte dort passend anknüpfen, ohne ein zweites widersprüchliches System zu erzeugen.

Die früher beschlossene **Freischaltpflicht für bestimmte harte Untergründe** bleibt bestehen: Ein noch gesperrtes Feld darf **trotz vorhandenem Zeitmultiplikator** nicht ausgegraben werden. Kein Einsturzsystem hinzufügen.

## 2. Einrichtungskosten – Option B (mittel)

Vorläufiger Bedarf an Baumaterial für die **Einrichtung** bereits ausgegrabener Kammern:

| Kammertyp | Materialeinheiten je nutzbarer Kachel |
| --- | ---: |
| Nahrungslager | 2 |
| Wasserlager | 2 |
| Baumateriallager | 2 |
| Brutkammer (jede der vier Spezialisierungen) | 3 |
| Ruhekammer | 2 |

**Testformel:** `einrichtungskosten = nutzbareKacheln × materialProKachel[kammertyp]`.

### Beispielkosten bei den bereits gewählten Mindestflächen B

| Kammertyp | Mindestfläche (Testwert) | Einrichtungskosten (Testwert) |
| --- | ---: | ---: |
| Nahrungslager | 12 Kacheln | 24 Material |
| Wasserlager | 12 Kacheln | 24 Material |
| Baumateriallager | 12 Kacheln | 24 Material |
| Brutkammer | 20 Kacheln | 60 Material |
| Ruhekammer | 16 Kacheln | 32 Material |

Weitere spezielle Kammern können später andere Materialien benötigen; deren Kosten sind **noch offen**. Die Königinnenkammer hat hier **keinen beschlossenen Testkostensatz**. Zahlen nicht als endgültige biologische oder physikalische Werte ausgeben.

## 3. Regeln, die unverändert gelten

- Spieler gestaltet freie, **zusammenhängende** Kammerformen mit Pinsel und Rechteck; Kammertyp wird **bei Planung** festgelegt und kann nach Fertigstellung **nicht umgewidmet** werden.
- Bauauftrag: planen → ausgraben → mit Baumaterial einrichten → erst dann nutzen.
- Bauaufträge FIFO, bei vorübergehender Sperre/Unzugänglichkeit überspringen und später fortsetzen; gesperrtes Terrain erfordert vorher Freischaltung.
- Ausbaukosten hängen von **Fläche und Kammertyp** ab. Fertige große Kammern bieten funktionsabhängig mehr Kapazität, keinen pauschalen Effizienzbonus.
- Abbruch lässt ausgegrabene Felder stehen und vernichtet kein unverbrauchtes Material.
- Bereits beschlossenes separates Materiallager mit endlicher Kammerkapazität beachten.
- Baumaterial wird überwiegend beim Graben gewonnen; die **konkrete Menge pro Terrainfeld und deren mögliche Umwandlung/Nutzbarkeit sind noch nicht entschieden**.
- Zeitbasis: 600 Echtzeitsekunden pro Spieltag als vorläufige globale Einstellung.

## 4. Umsetzungshinweise für Codex

1. **Vor Änderungen** lokalen VM-Stand (insbesondere lokale Teich-/Weltänderungen) mit GitHub abgleichen; nie ältere GitHub-Darstellungen über lokale Neuigkeiten schreiben.
2. Diese Parameter in zentraler Konfiguration halten; Terrain-Typen und Härte-/Abbauinformationen aus existierenden Dateien wiederverwenden.
3. Ressourcen-Grundsystem und Transport zunächst wie zuvor priorisiert umsetzen; Nestbauausbau später in gesondertem Paket.
4. Freischaltbedingungen vom reinen Zeitmultiplikator trennen; nicht freigeschaltete Felder bleiben unabbaubar.
5. Einrichtungsmaterial erst bei tatsächlichem Verbrauch abrechnen; kein kostenloses Einrichten, keine doppelten Abbuchungen beim Unterbrechen/Fortsetzen.
6. Automatisierte Tests: Multiplikator-Tabelle; Sperren trotz Multiplikator; Kosten für alle fünf Kammergruppen bei Mindestfläche; lineare Kosten bei größerer Fläche; unverbrauchtes Material nach Bauabbruch nicht vernichten; keine Kosten für bloß geplante Kammer als bereits verbraucht verbuchen.

## 5. Nächste offene Planungsfragen

- **Baumaterialgewinn pro ausgegrabenem Feld**, ggf. Unterschied je Erdmaterial.
- Ob sämtlicher Aushub als Baumaterial zählt oder manche Materialien nur Abraum sind.
- Wie Materialien zum Lager transportiert werden und wie mit vollem Baumateriallager umgegangen wird.
- Absolute Grabzeit für lockere Erde und tiefe Felsstufe; konkrete Freischaltwerte.

**Diese Datei ist nur Dokumentation.**
