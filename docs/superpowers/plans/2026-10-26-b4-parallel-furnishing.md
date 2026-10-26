# B4 – Parallelbau und Einrichtung

Basis: B3 56b253e, sauber und per GitHub identisch bestätigt. Freigabe „sparsam weiter“. Keine zusätzlichen Agenten. Ziel: bestehendes Grabmodell um parallele, exklusiv reservierte Frontkacheln und tatsächliche Baustellenversorgung/Einrichtung ergänzen. Stopp vor B5.

Verbindlich: FIFO mit Bypass echter Blockaden; keine spätere Baustelle nur wegen belegter Front. Kosten 2 Material/Kachel Lager/Ruhe, 3 Brut; vollständiger Aushub vor Einrichtung. Echte Lagerentnahme, getragene Ladung, Baustellenvorrat und tatsächlicher Verbrauch getrennt; keine Lager-Ausgleichstransporte. Materialmangel bewahrt Fortschritt. Pause/Abbruch/Tod sichern Ladungen und geben Reservierungen frei. Fertigmeldung genau einmal.

Neue Nutzer-Testwerte: 24 Material im vorhandenen Startlager, 2 Sekunden je tatsächlich verbauter Einheit bei 100 %; zentral änderbar. Wege, 5er-Traglast, Mangel und 50-%-Fremdleistung weiterverwenden. Baustellen wählen passende Lager nach tatsächlicher Wegdauer; fortgeschrittene Tunnelauslastung bleibt B6. Keine zweite Uhr und kein zweiter Wegfinder.

Abgrenzung: B4 markiert vollständig eingerichtete Kammern und meldet Fertigstellung. Funktions-/Kapazitätsaktivierung, Mindestflächen und Freischaltungen verbleiben gemäß B3-Übergabe bei B5; keine halbfertigen/zu kleinen Lager aktivieren. UI zeigt tatsächlichen Einrichtungsfortschritt und Bestand statt bisheriger Vorschau-Nullen.

- [x] Gezielte Tests zuerst rot: parallele Front und Engpass/FIFO; echte Materialkette und Massenerhaltung; 9/24 + 15 fortsetzen; schnellstes/mehrere Lager, keine vorsorgliche Umlagerung; Pause, Abbruch, Tod, Reservierungen; Zeit-/Fremdleistung und einmalige Fertigstellung.
- [x] Bestehende Materialbilanz um Baustellenvorräte, reale Entnahme und Verbrauch erweitern. Vorhandenen Scheduler/Details anschließen; historische Tests nur an bewusst neue B4-Zustände anpassen.
- [x] Ein kompletter Testlauf und Build am Ende; gezielter Browsercheck für neue B4-Funktionen und vorhandene Darstellung. Nur kurze Logauszüge. Eigenprüfung, Bericht, Commit/Push, Stopp vor B5.
