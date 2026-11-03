# C5 – integrierte Wachstumstests

Stand: 27.10.2026. Ausgangspunkt `99b2767`, Branch
`codex/c4-brood-shortage`, vor Beginn sauber und mit dem aktuellen
GitHub-Entwicklungsbranch identisch. Nutzerauftrag: Stand prüfen und nächsten
Schritt ausführen. Keine Spielcode-, Balance- oder Grafikänderungen.

## Prüfumfang

`tests/growth-integration.test.mjs` verwendet die echte Startwelt,
WorkforceSimulation, zwei reale Baumeisterinnen, die bestehende 600-Sekunden-Uhr,
Verkehr, natürliche Eiablage, reale Eiertransporte und echte Larvenlieferungen.
Keine direkt erzeugten Eier und kein deaktivierter Eiertransport. Explizite
Testvorräte: je 540 Nahrung/Wasser in den vorhandenen individuellen Lagern;
die Startbedingungen des Spiels werden dadurch nicht verändert.

- Zwölf Spieltage natürliche Eiablage bis zu erwachsenen Ameisen aller vier
  Spezialisierungen; geborene Pflegerinnen arbeiten in der bestehenden Engine.
  Keine Verluste bei dieser Versorgung, höchstens fünf neue Eier je Spieltag.
- 25 Spieltage ohne Pflege füllen den begrenzten 50-Eier-Puffer. Wartende Eier
  entwickeln sich nicht und der volle Puffer stoppt die Eiablage. Danach acht
  Spieltage mit drei explizit zugewiesenen fachfremden Pflegerinnen: reale
  Transporte und Larvenentwicklung laufen wieder; Kapazität 15 und großer
  Rückstau begrenzen das Pflegetempo auf 25 %.
- Acht Spieltage in Tagesaufrufen und zehnsekündigen Aufrufen ergeben dieselben
  Eier, Ameisen, Lager und Transportbilanzen. Beide benutzen weiterhin die
  bestehende interne 0,1-Sekunden-Schrittweite. Pause über weitere 20 Spieltage
  verändert die geprüften Zustände nicht; danach läuft dieselbe Uhr weiter.
- Drei Spieltage Aufbau, acht Tage unzugängliche Nahrung-/Wasserlager und drei
  Tage Wiederherstellung prüfen Unterversorgung, gebremste/gestoppte Eiablage,
  reale Erwachsenenverluste, erhaltene Brutidentitäten und Versorgungserholung.
- An jedem Tagesende: eindeutige IDs, Individuenbilanz, begrenzte Kammerbelegung,
  keine Entwicklung vor Eierankunft, Lagergrenzen und konservierte
  Larvenlieferungen. Beobachtung der originalen Erwachsenenverbrauchsmethode
  prüft tatsächliche Abbuchungen gegen die jeweils übergebene aktive/ruhende
  Population einschließlich Geburten. Die übergebene Population muss zugleich
  exakt allen lebenden Arbeiterinnen und einer Königin entsprechen; ein
  Verbrauchsschritt mit Neugeborenen wird ausdrücklich nachgewiesen.
  Schritte mit Verlustereignis werden bei
  dieser vereinfachten Verbrauchsgleichung ausgelassen.

## Erkenntnisse und Grenzen

Die erste Testannahme „Geburten acht Tage nach Auflösung des vollen Puffers mit
nur drei fachfremden Pflegerinnen“ war falsch. Diagnose: 15 Pflegekapazität,
64 Larven, Faktor 25 %, volle Ressourcenversorgung, keine Verluste. Der Test
prüft nun den tatsächlich beschlossenen Pflegeengpass. Kein Spielcodefix nötig. Eine weitere zu strenge Testannahme wurde korrigiert:
Die Zahl lebender Neugeborener kann nach Erwachsenenverlusten kleiner als die
Gesamtzahl bisheriger Geburten sein; die Gesamtindividuenbilanz bleibt exakt.

Dies sind Modellintegrationstests mit echter Wegfindung, keine erneute
Browser-/Grafikabnahme und kein Beleg für endgültig ausgewogene Startvorräte.
Bestehende C4-Tests decken detaillierte Larvenverluste und MIN(Pflege,Ressourcen)
ab. C5 ergänzt den durchgehenden Kolonieablauf. Baustellen werden hier nicht
neu angelegt; die vorhandenen Bau- und Kapazitätstests bleiben Teil der Gesamtsuite.

## Verifikation

Ausgangsbasis: 225/225 Tests erfolgreich. Abschluss:

- `npm test`: **229/229 erfolgreich**, davon vier neue C5-Prüfungen,
  Gesamtdauer ca. 72 Sekunden. Log `/tmp/anthive-c5-suite.log`.
- `npm run test:world`: **10/10 erfolgreich**.
- `npm run build`: erfolgreich; bekannte Bundlewarnung über 500 kB bleibt.
- `git diff --check`: sauber.
- Gezielter Versorgungsausfalltest nach Korrektur der Testannahme ebenfalls grün.

**C5 abgeschlossen.** Änderungen bleiben lokal zur Durchsicht; kein Commit,
Push oder Merge. Spielcode, Grafik und Balancewerte unverändert.

Unabhängige Prüfung: Eine wichtige Prüflücke (Populationszahl beim
Erwachsenenverbrauch) wurde geschlossen. Außerdem wird erneute Eiablage nach
Wiederherstellung jetzt gegen den Stand unmittelbar vor der Wiederherstellung
geprüft. Keine zurückgestellten Befunde.

## Danach

D1.0: Dateninventar, Zustandsverantwortlichkeiten, Referenzen/IDs und einen
versionierten Speichervertrag dokumentieren. D1-Implementierung erst nach
separater ausdrücklicher Freigabe. Ruhekammern, Vorlagen, Abstand und sichtbare
Einrichtung bleiben separate Post-C5-Arbeitspakete.
