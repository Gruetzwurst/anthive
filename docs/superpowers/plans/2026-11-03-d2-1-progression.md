# D2.1 – Koloniehöchststand und Berufsstufen

> Umsetzung mit superpowers:executing-plans und test-driven-development.

Beschlossen: Alle lebenden Arbeiterinnen plus Königinnen zählen; Brut nicht.
Aktuell existiert genau eine erwachsene Königin. Fortschritt bleibt bei
Bevölkerungsrückgang erhalten und gehört zur jeweiligen Kolonie. D2.1 ändert
keine Arbeitsboni, Brutzeiten, Baugrenzen oder Eiablage.

- [x] Regressionen zuerst: Schwellen50/150/250/500, Rückgang, Geburten,
  getrennte Kolonien, Save-Roundtrip und alte Saves.
- [x] Kleines Fortschrittsmodell an bestehende Geburten/Simulation anbinden;
  nur Höchststand speichern, Berufsstufe daraus ableiten.
- [x] Schema3 und explizite Migration1→2→3; aus alten Saves nur die aktuelle
  erwachsene Population ableiten. Originalschutz auf beide Altformate erweitern.
- [x] Fortschritt im vorhandenen Gruppenfenster zeigen, ohne Berufsboni zu
  versprechen. Import als neue Kolonie übernimmt den Quellenfortschritt;
  Wiederherstellung derselben Kolonie bewahrt ihren bereits erreichten Höchststand.
  Bewusstes Ersetzen übernimmt den neuen Quellenstand samt Fortschritt.
- [x] Gesamttests, Build, Migration-/Import-/Fortschritts-Browserprüfung,
  kurzer unabhängiger Review und Fortsetzungsdokumentation.

Kein Branchwechsel; vorhandene lokale Performancekorrektur erhalten.

Abnahme:311/311 Gesamttests,7/7 Fortschrittsmodelltests, Build, Schema1/2-
Browsermigration, Fortschritts-/Restore-/Import-UI erfolgreich. Unabhängiger
Review ohne kritische/wichtige Befunde. Ergebnisbericht:
`docs/D2.1-KOLONIEFORTSCHRITT-ERGEBNIS.md`. Keine Berufsboni vorweggenommen.
