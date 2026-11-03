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

Stand: D1.1–D1.4 abgeschlossen; D1.5 Migration/Robustheitsabnahme in Arbeit.
Plan: docs/superpowers/plans/2026-10-28-d1-5-migration.md.
Bestehenden lokalen Feature-Stand erhalten; kein Reset/Branchwechsel. Viele
Änderungen sind uncommittet. Letzter geprüfter Gesamtstand:294 Tests erfolgreich.
Checkpoint vor D1.5: `/tmp/anthive-before-d1-5-2026-10-28/`.
