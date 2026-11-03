# Nahrungsnetz, freie Baumeisterinnen und Startbeschriftung – 27.10.2026

Nutzerauftrag: Versorgung größerer Kolonien (400 Ameisen, 150–200 Sammlerinnen),
mehrere Nahrungsvorkommen mit Auswahl/Ausweichen, unbeschäftigte Baumeisterinnen
beginnen den nächsten ausführbaren Auftrag, Namen auch in Startkammern sichtbar.

## Nahrung

Eine einzelne Quelle mit 60 Nachschub reicht nicht für 400 aktive Erwachsene:
allein Arbeiterinnen + Königin benötigen derzeit 401 Einheiten/Spieltag, dazu
kommen Larven. Ruhe reduziert den tatsächlichen Erwachsenenbedarf.

Die Spielwelt besitzt nun zwölf individuelle Nahrungsvorkommen, je 1.000
Vorrat und 60 Nachschub/Spieltag (insgesamt maximal 720). In der aktuellen
Startwelt sind neun davon vom Nest erreichbar, entsprechend maximal 540
Nachschub/Tag; weitere Wege erschließen die übrigen Quellen. Abstände, Weg-
und Lieferzeiten sowie Verkehr werden durch die vorhandene Sammellogik
berücksichtigt. Erschöpfte Quellen werden nicht weiter reserviert; andere
Quellen können verwendet werden. Kein erfundener globaler Nahrungsvorrat.
Alle Vorkommen sind auf der Karte markiert; erschöpfte behalten ihre Umrandung.

Technisch: `createStartingWorld({additionalFoodSources:true})` für die reale
Spielwelt (`startingWorld`). Bestehende isolierte Modellszenarien können weiter
die ursprüngliche Einzelquelle verwenden. Ressourcenadapter erzeugt bereits
pro Quelle einen eigenen Zustand mit ID, Vorrat und Regeneration.

Zwei Versorgungsmodelle mit 400 aktiven Erwachsenen + Königin und 150 bzw. 200
real transportierenden Sammlerinnen laufen jeweils zehn Spieltage. Die nächste
Quelle wird ausdrücklich leer gestartet; tatsächliches Ausweichen während
ihrer Erholung wird geprüft. Szenario hat flache erreichbare Wege mit realen
Laufdistanzen, Ladungen, Entnahmen, Regeneration und Verbrauch, in Zehn-Sekunden-
Intervallen. Vorräte bleiben verfügbar, Arbeitsfaktor voll, keine Erwachsenen-
verluste. Dies ist ein Logistik-/Bilanztest, keine 400-Ameisen-FPS-Abnahme oder
Garantie für beliebige Lager-/Weg-/Brutkonfigurationen.

## Bauaufträge

Neue ausdrückliche Nutzerentscheidung ersetzt die frühere strikte Einzel-
baustellenregel: Ältere Aufträge behalten Vorrang für freie ausführbare Arbeit.
Sind deren erreichbare Arbeitskacheln bereits reserviert oder kann die einzelne
Ameise dort gerade nichts tun, sucht sie beim nächsten Auftrag weiter.
Gilt für Aushub, Einrichtung und Versorgung. Laufende atomare Arbeit und echte
Materialladungen bleiben sicher. Keine Doppelreservierungen, keine pauschale
Zweiergrenze. Parallelität hängt von Arbeitspersonal und freien Fronten ab.
Pause/Abbruch/Blockaden bleiben wirksam. Bestehende Tests der früheren Regel
wurden ausdrücklich an diese neue Entscheidung angepasst.

## Beschriftung

Die Starttexte waren vorhanden, wurden aber von den neuen Raumflächen übermalt.
Sie liegen jetzt auf Ebene 7 oberhalb der Einrichtung. Größe/Zoomverhalten und
Lagerbestände bleiben erhalten. Auch Namen der vier Start-Brutkammern sichtbar.

## Prüfung

Neue Tests zuerst rot. 27 fokussierte Bau-/Nahrungsprüfungen erfolgreich,
einschließlich beider 400-Erwachsenen-Szenarien. Build und Diffcheck grün.
Unabhängige gezielte Prüfung: keine wichtigen/kritischen Befunde.
Browser `--food-network-only`: zwölf Quellen, neun erreichbare mit 540/Tag,
vier tatsächlich zugewiesene Baumeisterinnen an vier unabhängigen Aufträgen,
sichtbare Startbeschriftung; Screenshot visuell geprüft.
Logs `/tmp/anthive-multi-work-green.log`, `/tmp/anthive-food-network-browser.log`.
**267/267 Gesamttests erfolgreich**, Build, Diffcheck und abschließende
Browserprüfung grün. Die Prüfung der Sammler-Optimierung fand ebenfalls keine
wichtigen/kritischen Probleme. Überschüssige Sammlerinnen durchsuchen keine
Quellen, wenn freie Lagerplätze bereits vollständig durch reale Ladungen
reserviert sind; passende Regression zuerst rot, danach grün.
Gesamtlog `/tmp/anthive-food-parallel-final.log` (Prozessstatus 0). Keine Commits/Pushes.
