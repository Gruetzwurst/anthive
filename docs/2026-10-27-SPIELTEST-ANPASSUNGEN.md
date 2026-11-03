# Anpassungen nach Spieltest – 27.10.2026

Nutzerwünsche und bestätigte Testwerte:
- Fertige Funktionsräume zeigen auf Karte und in der Bauliste nur ihren Namen.
- Königin: ein Ei alle drei aktiven Echtzeitminuten bei voller Versorgung.
- Entwicklung: 1 Minute Ei, 3 Minuten Larve, 2 Minuten Puppe bei voller Pflege/
  Versorgung, zusätzlich reale Transportzeit. Die bestehende 600-Sekunden-Uhr
  bleibt unverändert. Pausen und Engpässe gelten weiterhin.
- Startkolonie: sieben Sammlerinnen, zwei Baumeisterinnen und zusätzlich eine
  echte spezialisierte Pflegerin. Sie trägt Eier/Versorgung und verbraucht echte
  Erwachsenenressourcen. Keine vorgefertigte Startbrut.
- Pflegeanzeige trennt Abdeckung und Kapazität: Pflegerin zehn Bruttiere,
  fachfremde Hilfe fünf. Bei kleiner Brut können beide volle Abdeckung schaffen;
  unter Druck ist der beschlossene 50-%-Effizienznachteil nachweisbar. Keine
  künstliche Begrenzung gesunder kleiner Brut trotz ausreichender Pflege.

Technisch: `PLAYABLE_COLONY_CONFIG` in `simulationConfig.ts` bündelt die aktuelle
Spielstart-Balance. `WorldScene` übergibt sie an die bestehenden Simulations-
Fabriken. Queen-/Brood-Konfiguration und Startpflege sind konfigurierbare
Parameter; bestehende sechs-Tage-Modellszenarien bleiben als Regression nutzbar.
Keine zweite Uhr oder parallele Pflege-/Geburtenverwaltung.

Prüfung: drei neue Modelltests zuerst rot, danach grün. Gesamtsuite **251/251**,
Welttests **10/10**, Build und `git diff --check` erfolgreich. Browserprüfung
`--playable-only` erfolgreich: zusätzliche Startpflegerin, natürliche erste
Eiablage nach drei Minuten, tatsächlicher Eiertransport und Geburt nach sechs
Minuten Entwicklung, erklärende Kapazitätsanzeige und fertiger Raumname auf
Karte/in Liste. Screenshot `node_modules/.cache/anthive-playable-room-label.png`.
Logs `/tmp/anthive-playable-{suite,world,build,browser}.log`.

Nur lokale Änderungen; kein Commit/Push. Nächster Schritt weiterhin D1.0.


Nachtrag: Eiablage nach weiterer Nutzerwahl auf **zwei aktive Echtzeitminuten**
verkürzt; Entwicklungszeit weiterhin sechs Minuten. Alle Raumschilder erhalten
weißen Hintergrund und dunkle Schrift. Das Start-Baustofflager zeigt den echten
Bestand; neue fertiggestellte Lager zeigen ihren individuellen Bestand und ihre
Kapazität, laufend aktualisiert. Kein globaler Bestand als Einzelraumvorrat.
Gezielte Modelltests (3/3), Build und Browserprüfung für Zeitablauf/Schilder/
Bestandsänderung; Logs `/tmp/anthive-labels-{tests,build,browser}.log`.

Korrektur nach Nutzerhinweis: Gemeint war die bisherige helle Schrift direkt
auf dem Raum, ohne Hintergrundkasten. Alle Raumnamen verwenden nun denselben
9px-Schriftstil wie Nahrung/Wasser, neue Raumnamen ebenfalls in Großschrift
und mittig am Raum. Lagerbestände bleiben erhalten.
