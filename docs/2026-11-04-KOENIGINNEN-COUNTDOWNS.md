# Individuelle Eiablage-Anzeige für alle Königinnen

Nutzer wünscht die bisherige Zeitanzeige auch an zusätzlichen Königinnen.
BroodRenderer zeigt jetzt je erwachsener Königin denselben Textstil, aber deren
individuellen nächsten Ei-Termin und Puffer am jeweiligen Kammerort. Der zuvor
bei der Startkönigin gezeigte globale früheste Termin ist damit ebenfalls
korrigiert. Voller Puffer oder unerreichbare Kammer pausiert nur deren Anzeige.
Beschriftungen werden bei Szenenende/fehlenden Königinnen aufgeräumt.

Keine Änderung an Simulation, Speicherformat oder Verbrauch. Zwei neue Tests
zuerst rot, danach7/7 Anzeige-/Lebenszyklustests grün; Build erfolgreich.
Firefox-Spieltest inklusive zwei Labels am jeweils eigenen Königinnenort,
Aufzucht, Eiablage, Transport und Erwachsenen-Reload erfolgreich.
Logs: /tmp/anthive-queen-labels-{red,green,build,browser}.log.
Neue Ergänzung lokal, noch nicht committet/gepusht.

Offene Nutzeridee, noch keine Umsetzungsfreigabe: erwachsene Königinnen durch
echte Pflegerinnenlieferungen versorgen und deren Verbrauch eventuell erhöhen.
Aktuell1 Nahrung+1 Wasser je Spieltag/Königin. Vorschlag: physische Versorgung
mit privatem Kammervorrat und Mangelwirkung auf Eiablage zuerst, separater
moderater Verbrauchstest anschließend. Keine neuen Todesregeln beschlossen.
