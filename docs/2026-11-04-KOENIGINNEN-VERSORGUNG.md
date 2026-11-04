# Physische Königinnenversorgung

Nutzer freigegeben: Pflegerinnen müssen Nahrung/Wasser zu jeder erwachsenen
Königin bringen; je5 Nahrung und5 Wasser pro Spieltag. Bei maximal5 Königinnen
also25 je Ressource/Spieltag. Keine zusätzlichen Balance-/Langzeittests gewünscht.

Bestehende reale Pflegerinnenlogistik liefert an private Königinnenvorräte:
10 Nahrung und10 Wasser Kapazität (Reserve2 Spieltage), Nachlieferung ab50%.
Neue Vorräte starten leer. Nur dieser Vorrat versorgt die jeweilige Königin;
keine zusätzliche Abbuchung im allgemeinen Erwachsenenverbrauch. Fehlt eine
Ressource, pausiert nur deren Eiablage, erreichtes Eiablageguthaben bleibt.
Unerreichbare Königinnen verbrauchen vorhandenen lokalen Vorrat weiter, erhalten
keine neuen Lieferungen und pausieren ihre Eiablage. Keine neue Todesregel.
Normale Brut und königliche Aufzucht bleiben bei ihren bisherigen Pflege-/
Mangelregeln und Entwicklungszeiten.

Alle Königinnen zeigen individuelle Countdown-/Pufferanzeige und darunter
Nahrungs-/Wasservorrat. Gruppenansicht zeigt Vorräte/Bedarf bei mehreren
Königinnen. Lieferungen zählen als echte Pflegearbeit, keine künstlichen Jobs.

Schema9 migriert1–8 mit bestehendem Originalschutz: keine Gratisvorräte,
kein rückwirkender Verbrauch, bestehende Königinnen/Brut/Träger bleiben erhalten.
Die bisherige globale AdultSupply-Konfiguration ist als Legacy-Modell erhalten;
im spielbaren Modell wird dort queens=0 gezählt. Tatsächlicher Königinnenbedarf
steht zentral in QUEEN_SUPPLY_CONFIG und wird ausschließlich lokal verbraucht.

Technische Prüfung: reale Lieferung,5/Tag-Verbrauch, keine Doppelabbuchung,
Eiablage, exakter Reload, Migration8→9 ohne Änderung des Originals erfolgreich.
9 vorhandene technische Persistenz-/Lebenszyklustests erfolgreich, einschließlich
Schema7 und zusätzlicher erwachsener Königinnen aus Schema8; Build erfolgreich.
Unabhängiger Read-only-Review ohne wichtige Befunde. Keine Balancesimulation
und kein erneuter vollständiger Gesamttest ausgeführt.
Logs: /tmp/anthive-queen-feeding-{technical,persistence,build,browser}.log.
Neue Ergänzung einschließlich Countdown-Anpassung zunächst lokal, nicht gepusht.

Abschluss: Browserprüfung ebenfalls erfolgreich – beide individuellen Anzeigen,
reale Pflegeversorgung, Aufzucht, Eiablage am eigenen Ort, normaler Eiertransport,
aktiver Träger-/Ankunft-/Erwachsenen-Reload. Ein dabei gefundener verzögert
angelegter interner Versorgungseintrag wurde in syncRooms vorgezogen, damit
Rendern keinen nachträglichen Unterschied zum gespeicherten Stand erzeugt.
Erneut9/9 technische Persistenztests und Build grün. Diffprüfung sauber.
