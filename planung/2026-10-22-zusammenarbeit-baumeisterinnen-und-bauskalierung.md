# ANTHIVE – Gemeinsame Bauarbeiten, Kachelbelegung und Skalierung

**Verbindliche Entscheidungen vom 22.10.2026:** Zusammenarbeit der Baumeisterinnen **B**, gleichzeitige Arbeit an einer Kachel **B**, Skalierung der Baugeschwindigkeit **B**. Ergänzung zum vorhandenen Planungsordner `planung/`.

## Verbindliche Beschlüsse

### 1. Zusammenarbeit B – gemeinsam an einem Bauauftrag
- **Mehrere Baumeisterinnen bearbeiten denselben Bauauftrag gleichzeitig**, wenn dafür unterschiedliche ausführbare und erreichbare Kacheln zur Verfügung stehen.
- Die Spielersteuerung erfolgt über Gruppen und Bauaufträge, **nicht** durch Einzelsteuerung.
- Eine Baustelle wird nicht künstlich auf genau eine Baumeisterin begrenzt; feste manuell erstellte Bautrupps sind nicht zwingend.

### 2. Dieselbe Kachel B – genau eine Baumeisterin
- An **einer konkreten Kachel arbeitet höchstens eine Baumeisterin zur gleichen Zeit**.
- Weitere Baumeisterinnen wählen andere freie, zugängliche Kacheln derselben Baustelle oder warten/übernehmen entsprechend den bereits festgelegten Auftragsregeln eine verfügbare Tätigkeit.
- Kacheln benötigen eine eindeutige **Arbeitsplatzreservierung bzw. Zuordnung**, damit dieselbe Kachel nicht doppelt abgegraben, doppelt vergütet oder mehrfach Baumaterial daraus erzeugt werden kann.
- Nach Abschluss, Arbeitsunterbrechung, Unterbrechung des Auftrags oder nicht mehr erreichbarem Arbeitsfeld muss die Reservierung sauber freigegeben werden.

### 3. Skalierung B – räumlich begrenzt
- Mehr gleichzeitig arbeitende Baumeisterinnen beschleunigen das Graben **nur, solange genügend gleichzeitig zugängliche, freie Arbeitskacheln vorhanden sind**.
- Es gibt **keinen grundsätzlich vorgeschriebenen globalen Effizienzverlust für große Bautrupps**. Die realen räumlichen Einschränkungen und laufenden Transportaufgaben begrenzen den Durchsatz.
- Ein kleiner Engpass mit einer erreichbaren Arbeitskachel kann daher nicht von vielen Ameisen parallel abgegraben werden; eine breite Baustelle kann mehrere gleichzeitig beschäftigen.
- Die Basis-Grabzeit von **6 Sekunden pro Kachel lockerer Erde** sowie 2× für kompakte Erde, 3× für Lehm und 5× für Stein sind **vorläufige, veränderbare Testwerte** und beziehen sich auf eine arbeitende Baumeisterin je Kachel, **ohne Weg-/Transportzeiten**.
- Die Tragkapazität **5 Materialeinheiten** je Baumeisterin ist ebenfalls ein **veränderbarer Testwert**.

## Zusammenspiel mit früheren Entscheidungen
- **Bauwarteschlange FIFO** nach Auftragserstellung; momentan blockierte Aufträge vorübergehend überspringen, ohne sie zu löschen. Ein gemeinsamer Bauauftrag darf mehrere Baumeisterinnen auf verschiedene Kacheln verteilen, ohne die Reihenfolge eigenmächtig umzusortieren.
- Bei frei geplanten Kammern und Tunneln müssen nur **tatsächlich erreichbare** Kacheln bearbeitet werden. Keine automatische Verbindung zu entfernten Baustellen.
- Harte/gesperrte Erdschichten respektieren: nicht freigeschaltete Felder sind aktuell nicht grabbar.
- Baumaterial wird pro **tatsächlich ausgehobener Kachel genau einmal** erzeugt, mit separat konfigurierbarem Materialertrag.
- Baumaterial wird bei voller Ladung transportiert; überschüssiges Material bleibt bei vollem Lager am Grabungsort und wird erst nachrangig abgeholt, wenn keine ausführbaren Grabaufträge mehr anstehen.
- Kammern sind erst nach **Ausgraben und Einrichtung** mit Baumaterial funktionsfähig.
- Bestehende lokale VM-Arbeit kann GitHub `main` voraus sein; vor Codeänderungen lokalen Stand prüfen und synchronisieren, besonders neuere Teichgrafik.

## Codex – Umsetzung erst im passenden Bau-Arbeitspaket
1. Zuerst bereits priorisierte Ressourcen-Grundlage und Transporte bauen; **keine pauschale gleichzeitige Implementierung aller Planungsdokumente**.
2. Bestehende Grab-/Pfadfindungslogik inspizieren und erweitern, statt parallele Systeme einzuführen.
3. Pro laufendem Auftrag Kandidatenkacheln auf **aktuelle Erreichbarkeit, Grabvoraussetzung und Nichtreservierung** prüfen; verfügbare Ameisen bekommen jeweils **verschiedene Kacheln**.
4. Zustandswechsel `frei -> reserviert -> bearbeitet/frei` robust gegen mehrere Updates, Wegabbruch, Auftragsabbruch und temporäre Sperren machen.
5. Keine doppelte Materialgutschrift, kein negativer Grabfortschritt, keine mehrfach entfernte Kachel.
6. Neue Kacheln werden ggf. erst **nach Entfernen vorgelagerter Felder erreichbar**; sie dürfen nicht durch Arbeiter in unzugänglichen Bereichen angesprungen werden.
7. Performance bei Hunderten Ameisen beachten: Zuordnung effizient und nicht jeden Frame durch globale Vollsuche realisieren. Konkrete Optimierung ist technischer Entwurf, keine neue Spielentscheidung.

## Akzeptanztests
- 2+ Baumeisterinnen, 2+ erreichbare grabfähige Kacheln: paralleler Fortschritt auf **verschiedenen** Kacheln.
- 5 Baumeisterinnen, nur 1 zugängliche Kachel: nur 1 gräbt; kein fünfmal schnellerer Aushub.
- Zwei Ameisen erhalten niemals zeitgleich dieselbe Kachelreservierung.
- Unterbrechung/Abbruch macht Reservierung wieder frei; keine ewig gesperrten Arbeitsstellen.
- Vollendete Kachel wird nur einmal entfernt und erzeugt nur einmal ihren konfigurierten Materialertrag.
- Hinter liegende, anfangs unerreichbare Kachel wird erst nach Herstellung des Zugangs freigegeben.
- FIFO und vorübergehendes Überspringen tatsächlich blockierter Aufträge bleiben korrekt.
- Verschiedene Bodenhärten behalten die bereits beschlossenen Grabzeitfaktoren.

## Noch offen, nicht als Beschluss behandeln
- **Wie wählen Baumeisterinnen einzelne Arbeitskacheln aus?** (z. B. nächste erreichbare, strukturierter Abbau von Zugang her).
- **Wie soll Enge im Tunnelnetz** die Annäherung und den Transport beeinflussen (nur Weglänge, Stau, andere Regeln)?
- Verhalten von Arbeiterinnen, wenn nicht genug erreichbare Arbeitskacheln existieren.
- Eine genaue visuelle Darstellung der Arbeitsstellen und der Baumeisterinnen.

**Status: neue Planungsdatei; keine Änderung am Spielcode.**
