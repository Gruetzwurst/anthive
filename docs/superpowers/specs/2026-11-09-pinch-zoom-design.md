# Zwei-Finger-Zoom

Nutzerauftrag: Zuerst Zwei-Finger-Zoom umsetzen; Baumenü und Interface danach gemeinsam planen.

Zwei Finger auf der Karte ändern den Zoom um ihren Mittelpunkt. Bestehende Stufen 25/50/100/200 Prozent und Zoomknöpfe bleiben erhalten. Kontinuierlicher Zoom wäre flüssiger, würde aber die früher beobachteten Linien und unscharfen Zwischenstufen zurückbringen. Daher bestehende scharfe Stufen verwenden; dies ist eine Implementierungsentscheidung.

Bei Beginn einer Geste laufende, noch nicht übernommene Zeichnung verwerfen; bereits übernommene Entwurfsflächen behalten. Bis zum Loslassen aller Finger weder zeichnen noch Baustellen anklicken. Bedienelemente und Dialoge starten keine Zoomgeste. Touchcancel und Szenenwechsel müssen die Geste sauber beenden.

Prüfung: Abstand, Richtungswechsel, Entprellung, Skalierung der Canvas-Koordinaten, Sperre bei verbleibendem Finger, Listener-Abbau sowie Browserprüfung mit zwei tatsächlichen WebDriver-Touchzeigern. Keine Änderungen an Spielregeln oder Speicherung.
