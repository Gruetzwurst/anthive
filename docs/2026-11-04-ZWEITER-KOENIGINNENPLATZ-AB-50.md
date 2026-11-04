# Zusätzlicher Königinnenplatz ab50

Nutzer möchte früher eine zweite Königin testen, da sich das Wachstum bei50
bremsend anfühlt. Der Platz bei50 kommt zusätzlich zu den bisherigen Schwellen
150/500/1000 hinzu. Insgesamt: Start1, ab50 zwei, ab150 drei, ab500 vier,
ab1000 fünf Königinnenplätze einschließlich Startkönigin.
Die ursprüngliche Umsetzung hatte150 durch50 ersetzt; diese Fehlinterpretation
ist korrigiert. Freischaltungen bleiben bei Rückgang erhalten.

Zentrale Limitberechnung, Baufehlermeldung und Bauauswahl sind angepasst.
Das Speicherformat bleibt7; bisher gültige Spielstände bleiben gültig.
Weitere Königinnen benötigen weiterhin bewussten Kammerbau und Einrichtung.

Korrekturprüfung: Grenzwerttest zunächst erwartungsgemäß fehlgeschlagen,
danach13/13 Königinnenprüfungen erfolgreich, einschließlich Auftragsreservierung.
Build und Diffprüfung erfolgreich. Logs:
`/tmp/anthive-queen-extra50-red.log`, `/tmp/anthive-queen-extra50-green.log`,
`/tmp/anthive-queen-extra50-build.log`.
Für diese kleine Korrektur wurde die vollständige Suite nicht erneut ausgeführt;
der vorherige Stand bestand348/348 Tests und die Browserprüfung bei50.
Änderungen lokal.

Für den tatsächlichen Wachstumseffekt fehlt noch D2.6. Dafür gelten die
bestätigten12 Minuten königliche Entwicklung und2 Pflegeplätze je königlicher Brut.
