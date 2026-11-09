# Anthive starten und fortsetzen

Projekt: `/home/paul/Desktop/anthive`.

**Aktueller Stand09.11.2026: D2.7 technisch abgenommen.**363/363 Tests, Build,
Browserprüfungen und unabhängiger Review erfolgreich. Zwei Korrekturen lokal:
Pflegerinnen bleiben nicht mehr auf winzigen Königinnen-Nachlieferungen hängen;
Ameisenkörper teilen vorgezeichnete Texturen statt ständig gleicher Vektoren.
Eiertransport und Wachstum laufen damit wieder, Bedarf/Brutzeiten unverändert.
Bei1000 Arbeiterinnen im Browser-Stresstest bei200% Zoom149→26ms Render-Median;
keine Zusage für echte iPhone-Bildraten. Lastproben150/500/1000 mit3/4/5
Königinnen und identischem Reload erfolgreich. Echte iPhone-Prüfung noch offen.
Bericht: `docs/D2.7-TECHNISCHE-GESAMTABNAHME-ERGEBNIS.md`.

**Aktuelle Arbeitsbasis: main, Übernahme am09.11.2026 freigegeben.** D2.7
(Quelle05cebbf) mit dem bisherigen GitHub-main (b08a64d) zusammengeführt.
Dadurch bleiben auch die bereits dort vorhandenen iPhone-Safe-Area-/Viewport-
und Dokument-Scroll-Anpassungen erhalten. Spielmodelle und Tests entsprechen
weiter dem geprüften D2.7-Stand; die Styles vereinen beide Entwicklungsstände.
363/363 Tests des zusammengeführten Stands, Build, Browser und Review grün.
GitHub Pages veröffentlicht nach dem main-Push unter demselben Spiel-Link.
Aktuellen Commit/Veröffentlichungsstatus über git log/git status und Actions
prüfen. Alte Entwicklungsbranches bleiben als Historie erhalten.
Bericht: `docs/2026-11-09-MAIN-INTEGRATION.md`.
Die folgenden älteren Abschnitte sind Verlauf; deren „lokal“- und „nächster
Schritt“-Angaben werden durch diesen aktuellen Kopfstand ersetzt.

```bash
cd /home/paul/Desktop/anthive
./start-anthive.sh
```

Im Browser: http://localhost:5173/ (VM-Netz: http://10.0.2.15:5173/).
Der Server braucht keinen aktiven Chat und das Spiel keine Chat-Tokens.
Nach Terminal-/VM-Neustart gegebenenfalls mit obigem Befehl wieder starten und
das Terminal offen lassen. Das Skript verwendet immer Port5173. Ist dieser
bereits belegt, zuerst die obige Adresse öffnen; keinen anderen Port wählen,
denn lokale Browser-Spielstände gehören zur jeweiligen Adresse. Browser-Spielstände bleiben lokal; wichtige
Kolonien zusätzlich über Export als Datei sichern.

Stand am 03.11.2026: D1.1–D1.5 abgeschlossen, einschließlich Formatmigration,
Originalschutz und Export bei Speicherfehlern.
Ergebnis: docs/D1.5-MIGRATION-ROBUSTHEIT-ERGEBNIS.md.
Gesamttests:304/304 erfolgreich; Build und Browserprüfungen für Migration,
Import/Wiederherstellung, Speicherfehler sowie Autosave/Backups/Zwei-Tab-Schutz erfolgreich.
Branch: `codex/c4-brood-shortage`, GitHub: `Gruetzwurst/anthive`.
Der bisherige Feature-Stand wurde als Commit `35beeb2` auf GitHub gesichert;
die Abschlussdokumentation folgt als eigener Commit. Kein Reset/Branchwechsel.

Nach D1.5: gemeldetes Ruckeln bei47 Ameisen untersucht. Der statische
Geländeuntergrund wird nun abschnittsweise nur innerhalb der Kamera gezeichnet
und beim ersten Besuch aufgebaut. Details und Messwerte:
`docs/2026-11-03-PERFORMANCE-SICHTBARES-GELAENDE.md`.
Diese Performance-Anpassung liegt zunächst lokal.

Spieltest: Darstellung besser. Anlauf nach Laden etwa1–2 Sekunden; vereinbart
vorerst zurückgestellt. Ursache nicht durch Scriptgröße belegt.

D2.0-Bestandsabgleich erledigt:
`docs/2026-11-03-D2.0-BESTAND-UND-ABGLEICH.md`.
Die aktuelle D2-Planung wurde aus GitHub übernommen. Nutzerentscheidung:
gesamte erwachsene Kolonie inklusive Königinnen zählt, Brut nicht.
D2.1 implementiert: Höchststand, gemeinsame Stufen50/150/250/500,
Gruppenfenster-Anzeige und Schema3 mit Migration1/2 sowie Originalschutz.
Backuprestore bewahrt lokale Meilensteine auch bei beschädigter Hauptpayload;
Import als neue Kolonie/ausdrücklicher Ersatz übernehmen die Quellenhistorie.
Ergebnis: `docs/D2.1-KOLONIEFORTSCHRITT-ERGEBNIS.md`.
Abnahme abgeschlossen:311/311 Tests, Build, beide Altformat-Migrationen,
Fortschritts-/Restore-/Import-Browserprüfungen erfolgreich. Änderungen weiterhin
lokal, noch nicht gepusht. Unabhängiger Review ohne wichtige Befunde.

D2.2 implementiert: fünf terrainbasierte Grabfreigaben und stufenweise
schnellere Grabung/Einrichtung. Schema4 migriert die bisherigen1/2/3-Stände
mit Originalschutz. Neuer Status statt manuellem Test-Grabkraftschalter.
Ergebnis: `docs/D2.2-BAUMEISTERINNEN-ERGEBNIS.md`.
Abnahme abgeschlossen:319/319 Gesamttests,49 gezielte Modell-/Persistenztests,
5 Arbeitsübergabetests, Build und Browsermigrationen/aktive Baustelle/Hauptmenü
erfolgreich. Kurzer unabhängiger Review ohne wichtige Befunde.

D2.3 implementiert: Sammlerinnen5/7/9/12/15 Traglast und78/84/91/98/105px/s.
Fachfremde Arbeit einmaliger50%-Zeitfaktor bei voller Traglast. Bestehende
Reservierungen/Ladungen werden bei Upgrade nicht vergrößert. Schema5 migriert
Formate1–4 mit Originalschutz und Prüfung alter Lastgrenzen vor der Anhebung.
Sammelwerte stehen im Gruppenfenster.
Ergebnis: `docs/D2.3-SAMMLERINNEN-ERGEBNIS.md`.
Abnahme abgeschlossen:327/327 Gesamttests,58 gezielte Tests, Build und
Browsermigration/aktive Transporte/Fortschritts-Restore erfolgreich.
Unabhängiger Review ohne wichtige Befunde. Änderungen weiterhin lokal.

D2.4 implementiert: Pflegeplätze10/11/12/13/15, Versorgungstraglast5/6/8/10/12,
Tempo unverändert78px/s. Nutzer hat6 Minuten normale Brutentwicklung erneut
bestätigt; Eiablage bleibt120s. Schema6 migriert Formate1–5 mit Originalschutz;
gültige15er-Sammlerinnenladungen aus Schema5 bleiben erhalten, alte übergroße
Pflegeladungen werden vor Anhebung des Limits abgewiesen.
Ergebnis: `docs/D2.4-BRUTPFLEGE-ERGEBNIS.md`.
Abnahme abgeschlossen:335/335 Gesamttests,66 gezielte Tests, Build,
Browsermigration/aktive Pflege/Peak-Restore erfolgreich. Review ohne wichtige
Befunde. Änderungen weiterhin lokal.

D2.5 implementiert: Königinnenkammer ab Höchststand50/150/500/1000 für insgesamt
2/3/4/5 Plätze,11×4 oder frei ab44 Kacheln, bestätigte Kosten3Material/Kachel.
Angenommene Aufträge reservieren Plätze; echte Einrichtung und exklusiver
Eiertransport von der Startkönigin bis in die Kammer. Schema7 mit Royal-
Erzeugungsmarker und Schutz bei Migration1–6. Noch keine zusätzliche erwachsene
Königin; Paket endet mit angekommenem Königinnen-Ei.
Ergebnis: `docs/D2.5-KOENIGINNENKAMMER-EI-ERGEBNIS.md`.
18 gezielte Königinnen-/Platzierungstests,42 Persistenztests, Build und Browser-
Migrationen/echte Bauoberfläche/aktiver Träger/Ankunft-Reload erfolgreich.
Abnahme abgeschlossen:348/348 Gesamttests,18 gezielte Königinnen-/
Platzierungstests,42 Persistenztests,4 Planungstests, Build und Browser-
Migration1–6/Bau/Eiträger/Ankunft erfolgreich. Alle Änderungen weiterhin lokal.

Neuer Nutzerbeschluss04.11.2026: zweiten Königinnenplatz als Spieltest bereits
bei50 Koloniemitgliedern (inkl. Königin) zusätzlich freigeben; bei150/500/1000
folgen weitere Plätze. Insgesamt sind damit2/3/4/5 Königinnen möglich.
Tests für49/50/149/150 sowie höhere Schwellen ergänzt. Keine spontane Königin;
der bestehende Kammer-/Eiertransportablauf gilt weiter.
Korrektur:50 kommt zusätzlich zu150/500/1000 hinzu.13 Königinnenregressionen
und Build erneut erfolgreich; vorheriger Stand348/348 Gesamttests und
Browserablauf bei50 erfolgreich. Bericht:
`docs/2026-11-04-ZWEITER-KOENIGINNENPLATZ-AB-50.md`. Änderungen lokal.

D2.6 umgesetzt am04.11.2026: königliche Brut entwickelt sich nach Ankunft
in12 Echtzeitminuten(2/6/4) bei voller Pflege/Versorgung, bindet2 Pflegeplätze,
benötigt doppelte tägliche Larvenressourcen und stirbt bei Mangel nicht.
Erwachsene Königinnen legen am eigenen Kammerort normale Eier alle120 Sekunden,
mit eigenem Puffer/Fortschritt und gemeinsamen Berufsquoten. Bevölkerung,
Erwachsenenversorgung und Höchststand zählen alle erwachsenen Königinnen.
Schema8 migriert1–7 mit bisherigem atomarem Originalschutz. Bericht:
`docs/D2.6-KOENIGINNEN-AUFZUCHT-ERGEBNIS.md`.
Browser Aufzucht/Eiablage/Transport/Reload sowie Migration1/2/7 erfolgreich;
19 gezielte Tests und Build erfolgreich; abschließender Gesamtlauf359/359
erfolgreich,0 Fehler/übersprungen (ca.297 Sekunden).
Ein zusätzlicher Modellcheck bestätigt5 erwachsene Königinnen und5 Eiursprünge.

Nächster Schritt D2.7: integrierte Langzeit-/Skalierungsprüfung und Balance mit
bis zu5 Königinnen. Langfristiger50-Pflegerinnen-Wunsch ist bei aktueller
Eiablage/Brutdauer nicht belegt; keine künstlichen Pflichtjobs erfinden.
Performance/D2.0–D2.6 liegen weiterhin lokal, in diesem Auftrag nicht gepusht.


GitHub-Sicherung am04.11.2026 ausdrücklich beauftragt: sämtliche Änderungen
seit D1.5 einschließlich Performance/D2.0–D2.6, Tests und Dokumentation werden
zusammen auf `codex/c4-brood-shortage` gesichert. Die Hinweise „lokal“ in den
vorherigen Paketberichten beschreiben deren damaligen Abschlussstand.
Aktuellen Commit und Synchronisierung über `git log -1` und `git status -sb`
prüfen; letzter vollständiger Testlauf359/359, Build und Browserprüfung grün.

Neue lokale Ergänzung nach GitHub-Commit1402314: individuelle Countdown-/
Pufferanzeige bei jeder erwachsenen Königin.7 gezielte Tests, Build und Browser
inklusive beider Labels erfolgreich. Noch nicht committet/gepusht. Bericht:
`docs/2026-11-04-KOENIGINNEN-COUNTDOWNS.md`.
Königinnenversorgung durch Pflegerinnen und höherer Verbrauch sind aktuell nur
Nutzerideen zur Diskussion; noch keine Balance-/Versorgungsänderung umgesetzt.

Weitere Nutzerfreigabe04.11.2026 umgesetzt: echte Königinnenversorgung durch
Pflegerinnen, je5 Nahrung und5 Wasser/Spieltag, privater Vorrat je10. Fehlende
Ressource pausiert individuelle Eiablage. Keine Doppelabbuchung aus globalem
Lager, keine Gratisvorräte bei Migration1–8 nach Schema9. Neuere Freigabe ersetzt
den vorherigen Diskussionsstatus. Technische Prüfung/9 Persistenztests/Build
und unabhängiger Review erfolgreich; auf zusätzliche Balancetests und den
vollständigen Gesamtlauf gemäß Nutzerwunsch verzichtet. Neuer Stand lokal,
noch nicht gepusht. Bericht: `docs/2026-11-04-KOENIGINNEN-VERSORGUNG.md`.
Browserprüfung für den neuen Versorgungsstand ebenfalls erfolgreich, inklusive
beider Countdown-Anzeigen, Aufzucht/eigener Eiablage/Transport und Reload.

Öffentliche Handy-Testseite vom Nutzer freigegeben:
https://gruetzwurst.github.io/anthive/ (Querformat). Pages-Actions-Workflow in
`.github/workflows/pages.yml` veröffentlicht aktuelle Pushes auf dem Featurebranch
oder main; main wird dafür nicht zusammengeführt/umgestellt. Build-Basispfad
nur im Deployment /anthive/, lokale Entwicklung weiter /. Lokale und öffentliche
Browser-Spielstände sind getrennt; bestehende Kolonien über Export/Import übertragen.
