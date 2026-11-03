# Anthive starten und fortsetzen

Projekt: `/home/paul/Desktop/anthive`.

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

Nächster sinnvoller Schritt: eigener Spieltest der Speicherverwaltung
(Kolonie spielen, speichern, neu laden, exportieren und als neue Kolonie
importieren). Danach das nächste Arbeitspaket anhand der aktuellen Planung
festlegen; D1.5 muss nicht erneut implementiert werden.
