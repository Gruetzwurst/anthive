# ANTHIVE – D1 Speichern und Laden: Grundentscheidungen

**Verbindliche Entscheidungen vom 27.10.2026.** Planung für die nächste Entwicklungsphase D1, noch **kein Auftrag zur Umsetzung**. Vor Implementierung den aktuellen lokalen Codex-Stand und GitHub-Branches prüfen, C5 und zwischenzeitliche Bau-/Ruhekammeränderungen berücksichtigen. **Keinen Code ändern aufgrund dieses Dokuments.**

## Verbindlich beschlossen

1. **Automatisches und manuelles Speichern:** ANTHIVE soll Spielstände selbstständig regelmäßig sichern und dem Spieler zusätzlich erlauben, einen manuellen Speichervorgang auszulösen.
2. **Mehrere unabhängige Kolonien:** Spieler dürfen mehrere getrennte Kolonien anlegen, laden und fortsetzen; es gibt **keine künstlich festgelegte Anzahl von Speicherplätzen**. Die Grenze ist der tatsächlich verfügbare Speicherplatz.
3. Jede Kolonie braucht eine eigene Zuordnung, damit ein Autosave nicht versehentlich eine andere Kolonie überschreibt.
4. Das bisherige Verhalten „Seite neu laden = neue Kolonie“ soll durch das künftige Lade-/Speichersystem abgelöst werden, ohne bestehende Simulationen zu verändern.

## Speicherort – Variante B (verbindlich beschlossen am 27.10.2026)

- **Koloniespielstände zunächst lokal im jeweiligen Browser/Gerät speichern.** Kein Benutzerkonto, keine Cloud-Pflicht und kein zusätzlicher Speicherserver für D1.
- **Export:** Spieler können eine Kolonie als eigenständige **Datei herunterladen** und so außerhalb des Browser-Speichers sichern oder auf ein anderes Gerät übertragen.
- **Import:** Eine zuvor exportierte Koloniedatei kann auf demselben oder einem anderen Gerät **eingelesen und als spielbare Kolonie wiederhergestellt** werden.
- Vor einem Import Inhalt/Version/Integrität prüfen und verständliche Fehlermeldungen anzeigen; keine bestehende andere Kolonie stillschweigend überschreiben.
- Lokal gespeicherte Daten können durch Löschen von Browserdaten, private Sitzungen, Browserwechsel oder Speicherausfälle verloren gehen. **Exportdateien dienen daher als eigenständige Sicherungsmöglichkeit**, sind aber nicht automatisch eine Cloud-Sicherung.
- Technische Speicher-API (z. B. IndexedDB), Dateiformat, Exportname, Umgang mit Namenskonflikten, Importe inkompatibler Versionen und Export-/Importoberfläche werden bei der D1-Detailplanung festgelegt; Codex soll keine offenen Produktentscheidungen eigenmächtig treffen.

## Autosave und Sicherungskopien – verbindlich beschlossen am 27.10.2026

- **Autosave alle 5 realen Minuten** (nicht alle 5 Spielminuten). Die automatische Speicherung bezieht sich jeweils auf die aktuell gespielte Kolonie, ohne andere Kolonien zu überschreiben.
- **Drei automatische Sicherungskopien pro Kolonie**, zusätzlich zum jeweils aktuellen Spielstand. Dies sind Sicherungen der **einzelnen Kolonie**, keine globale Dreiergrenze für alle Spielstände.
- Ziel der Sicherungen ist die Wiederherstellung bei Problemen mit dem aktuellen Spielstand. Die verbindliche zeitlich gestaffelte Rotation ist im folgenden Abschnitt festgelegt.
- Manuelles Speichern und Export/Import bleiben wie zuvor beschlossen.
- **Zusätzlicher Speicherversuch beim Verlassen der aktiven Ansicht** ist beschlossen (Variante B): siehe eigenen Abschnitt unten. Andere zusätzliche Ereignis-Saves sind damit nicht beschlossen. Ein zuverlässiges Speichern exakt beim Schließen des Browserfensters kann technisch nicht garantiert werden.
- Alle übrigen offenen technischen Fehler- und Wiederherstellungsdetails vor der Implementierung gemeinsam entscheiden.

## Zusätzlicher Speicherauslöser – Variante B (verbindlich beschlossen am 27.10.2026)

- **Zusätzlich zum regulären Autosave alle fünf Minuten** soll ANTHIVE versuchen, die aktuell aktive Kolonie zu speichern, sobald der Browser-Tab **verborgen/verlassen** wird oder die App **in den Hintergrund** wechselt.
- Der Speicherversuch ist **best effort**, ausdrücklich **keine Garantie**: Browser, mobile Betriebssysteme und abruptes Schließen/Abstürzen können das vollständige Ausführen verhindern.
- Nach Möglichkeit beim Wechsel in den Hintergrund einen bereits vorbereiteten konsistenten Simulationssnapshot sichern; keine Zusage, dass asynchrone Speicheroperationen vor Beendigung zuverlässig fertig werden.
- Ein Hintergrund-Speicherversuch darf **nur die aktive Kolonie** betreffen, nie unabsichtlich andere Kolonien verändern, und darf **die letzten gültigen Spielstände/Backups nicht beschädigen**. Fehlschlag darf nicht als erfolgreiche Sicherung dargestellt werden.
- Die **15-/60-/180-Minuten-Backup-Rotation** bleibt an aktive Spielzeit gebunden; durch einen Tabwechsel allein werden Backups nicht vorzeitig alle erneuert.
- Keine weiteren ereignisbezogenen Speicherauslöser, etwa nach Bauabschluss oder Königinnenwechsel, durch diese Entscheidung eingeführt.
- Spätere Prüfungen: Tabwechsel, App-Hintergrund, mehrfaches schnelles Verbergen, paralleler Fünf-Minuten-Autosave, Browserabbruch, Pause und Koloniewechsel; kein Überschreiben fremder Kolonien und keine doppelte/korrupten Speicheroperationen.

## Wiederherstellung – Variante C (verbindlich beschlossen am 27.10.2026)

- **Kombination aus Fehlerwiederherstellung und manueller Auswahl:** Erkennt ANTHIVE beim Laden einen beschädigten/unbrauchbaren aktuellen Spielstand, informiert es den Spieler und **bietet die verfügbaren, als gültig erkannten Sicherungen mit Datum/Uhrzeit zur Auswahl an**. Kein stillschweigendes automatisches Zurücksetzen.
- **Jederzeitiger manueller Zugriff:** Auch ohne Fehler darf der Spieler über die Kolonieverwaltung die vorhandenen älteren Sicherungsstände seiner Kolonie aufrufen und bei Bedarf wiederherstellen.
- **Bewusste Bestätigung vor dem Zurücksetzen:** Vor dem tatsächlichen Wiederherstellen zeigt ANTHIVE klar, dass dadurch Fortschritt seit der gewählten Sicherung verloren gehen könnte. Eine Wiederherstellung darf nicht versehentlich durch bloßes Ansehen der Sicherung ausgelöst werden.
- **Aktuellen Zustand möglichst schützen:** Wenn der gegenwärtige Spielstand noch lesbar und gültig ist, soll vor der Wiederherstellung möglichst eine separate, klar erkennbare Sicherheitskopie angeboten bzw. angelegt werden; ein beschädigter Stand darf nicht als vertrauenswürdige Kopie ausgegeben werden. Die genaue technische Strategie und ihr Verhalten bei knappem Speicher sind noch offen.
- **Keine Kolonieverwechslung:** Wiederherstellung ist nur innerhalb der ausgewählten Kolonie vorgesehen und darf andere Kolonien nicht verändern.
- Die **drei automatischen Sicherungskopien pro Kolonie** bleiben beschlossen; Zeitstaffelung und Rotation sind im folgenden Abschnitt definiert.

## Rotation – Variante B: zeitlich gestaffelte Sicherungen (verbindlich beschlossen am 27.10.2026)

**Aktueller Hauptspielstand:** Autosave alle **5 Minuten realer aktiver Spielzeit**. Dazu drei getrennte Backup-Plätze **je Kolonie** mit unterschiedlichen Aktualisierungsrhythmen:

| Sicherung | Erneuern nach jeweils | Zweck |
| --- | --- | --- |
| Backup 1 (kurzfristig) | **15 Minuten** aktiver Spielzeit | Jüngere Rückfallversion |
| Backup 2 (mittelfristig) | **60 Minuten** aktiver Spielzeit | Deutlich seltener überschrieben |
| Backup 3 (langfristig) | **180 Minuten** aktiver Spielzeit | Ältere Rückfallmöglichkeit |

**Wichtig zur Bedeutung:** Die Werte **15/60/180 Minuten sind Aktualisierungsintervalle der Backup-Plätze**, **nicht** das garantierte Alter einer Sicherung relativ zum aktuellen Stand. Direkt nach dem jeweiligen Erneuern ist diese Kopie neu; kurz vor der nächsten Erneuerung entsprechend älter. Anzeige in der Kolonieverwaltung mit *tatsächlichem Erstellungszeitpunkt*, nicht irreführend als „genau vor 3 Stunden“.

**Zeit- und Rotationsregeln:**
1. Zeit läuft ausschließlich während **aktiven Spielens dieser Kolonie**. Geschlossener Browser, pausiertes Spiel und Wechsel in eine andere Kolonie erhöhen den Backup-Zähler der ungespielten/pausierten Kolonie nicht. Offline verstrichene Zeit erzeugt keine nachträgliche Sicherungsserie.
2. Jede Kolonie besitzt ihre eigenen Zeitstände und drei voneinander getrennte Backup-Plätze. Die längeren Intervalle werden über Sitzungen fortgeführt, auch nach Browserneustart; **kein Zurücksetzen des Intervallzählers beim bloßen Neuladen**.
3. Beim Erreichen eines Backup-Intervalls wird der betreffende Platz mit einem **nach erfolgreicher Speicherung geprüften, vollständigen Snapshot** aktualisiert. Solange kein neuer gültiger Snapshot geschrieben werden konnte, bleibt die vorherige gültige Kopie erhalten; der Vorgang gilt als fehlgeschlagen und wird verständlich gemeldet.
4. Fällt die Fälligkeit mehrerer Backup-Plätze auf denselben Zeitpunkt (z. B. Minute 180), **dürfen sie nicht alle mit demselben Snapshot überschrieben werden**. Den länger zurückreichenden Platz beim Fälligkeitspunkt priorisieren, andere fällige Plätze frühestens bei späteren erfolgreichen Autosaves nachholen, damit mindestens ein zeitlicher Abstand entsteht. Falls nötig diese Nachholung weiter staffeln. Kein neuer Schreibvorgang darf alle drei Kopien gleichzeitig durch denselben Zustand ersetzen.
5. Beim **erstmaligen Speichern einer neuen Kolonie** wird ein Hauptspielstand angelegt. Die drei Backups dürfen zunächst noch fehlen; sie werden zu den jeweiligen Intervallzeiten erstmals gefüllt. UI zeigt fehlende Sicherungen als „Noch nicht erstellt“ statt erfundener Versionen.
6. Manuelles Speichern aktualisiert den Hauptspielstand, **rotiert nicht automatisch alle drei Backup-Plätze**. Datei-Export/Import bleibt eine getrennte Nutzeraktion.
7. Wiederherstellen einer älteren Kopie soll die Backup-Plätze nicht sofort mit dem wiederhergestellten Zustand überschreiben. Alte gültige Rückfallpunkte nach Möglichkeit schützen und einen manuell bestätigten Restore sicher abwickeln; genaue Schutzkopie-Strategie bei knappem Speicher separat festlegen.
8. Technische Speicherung möglichst atomar/versioniert und mit Integritätsprüfung ausführen. Beim Überschreiben eines Backup-Platzes nur die **jeweils vorige Version dieses Platzes** ersetzen und erst nach erfolgreicher Validierung freigeben. Keine andere Kolonie verändern.

**Spätere Tests:** 5-minütige Autosaves, erste 15-/60-/180-Minuten-Fälligkeit, gestaffelte spätere Erneuerungen, simultane Fälligkeiten (Minute 180, 360), Neustart nach 175 Minuten, Spielpause/Tab ohne aktive Kolonie, Koloniewechsel, mangelnder Speicher, fehlgeschlagene/unterbrochene Schreibvorgänge, manuelles Speichern, datentreue Wiederherstellung und Isolation mehrerer Kolonien.

**Noch nicht beschlossen:** weitere besondere Autosave-Auslöser über Tab-Verbergen/App-Hintergrund hinaus, genaues Verhalten bei Browser-Speichermangel und Konflikten, Format/Integritätsverfahren und UI-Details. Diese dürfen nicht stillschweigend als neue Produktentscheidungen vorweggenommen werden.

## Startmenü – Variante B (verbindlich beschlossen am 27.10.2026)

- Beim Öffnen von ANTHIVE erscheint **zunächst das Hauptmenü**, nicht automatisch die laufende Spielsimulation.
- Die **zuletzt gespielte Kolonie** wird im Hauptmenü erkennbar **vorausgewählt**; mit **einem Klick** auf „Letzte Kolonie fortsetzen“ wird ihr aktueller Spielstand geladen.
- Der Spieler darf alternativ **eine andere gespeicherte Kolonie auswählen**, **eine neue Kolonie gründen** oder **die Kolonieverwaltung öffnen**.
- Die Vorauswahl ist nur eine Komfortfunktion: Sie darf **keinen Speicherstand automatisch laden, überschreiben oder verändern**, ehe der Spieler eine Aktion auslöst.
- Wenn keine zuletzt gespielte Kolonie existiert, gelöscht wurde oder ihr Spielstand unbrauchbar ist, darf der Schnellstart nicht irreführend aktiv sein; stattdessen verständliche Auswahl/Neugründung bzw. die bereits beschlossene Wiederherstellungsauswahl anbieten.
- **Geplanter, noch nicht im Detail beschlossener Entwurf für die Kolonieverwaltung:** Übersicht vieler Kolonien mit Name, zuletzt gespielt, Spieltag, Ameisenzahl und Speicherstatus; Auswahl/Laden; Umbenennen; Export; Import; drei Backups mit Datum und Wiederherstellung; Löschen mit Bestätigung. Konkrete UI, Sortierung und Lösch-/Namenskonfliktregeln noch gemeinsam festlegen.
- **Ausschließlich Planung**, keine Änderungen am Spielcode, keine Implementierungsfreigabe.

## Kolonie löschen – Variante B (verbindlich beschlossen am 27.10.2026)

- In der Kolonieverwaltung gibt es für jede Kolonie eine bewusst gewählte Aktion **„Kolonie löschen“**, nicht als leicht versehentlich auslösbare Standardaktion.
- **Vor dem endgültigen Löschen** fragt ANTHIVE ausdrücklich, ob der Spieler die betroffene Kolonie **zuerst als Datei exportieren** möchte. Dieser Export ist ein **Angebot**, keine Pflicht.
- Drei klare Wege: **„Erst exportieren“**, **„Ohne Export löschen“** und **„Abbrechen“**. Das tatsächliche Löschen verlangt zusätzlich eine eindeutige bewusste Bestätigung; der Koloniename muss dabei sichtbar sein.
- **Bei „Erst exportieren“ wird nicht unmittelbar gelöscht.** Die Anwendung darf erst nach einer eindeutigen erneuten Löschbestätigung fortfahren; ein erfolgreich ausgelöster Browserdownload ist nicht immer gleichbedeutend damit, dass der Nutzer die Datei langfristig gesichert hat. Dieser Sachverhalt muss verständlich kommuniziert werden. Falls der Export fehlschlägt, darf deshalb kein automatisches Löschen stattfinden.
- Bei endgültiger Bestätigung werden **die betreffende Kolonie einschließlich ihrer lokal gespeicherten drei Sicherungskopien** gelöscht, damit Speicher freigegeben wird. Eine extern heruntergeladene Exportdatei wird dabei nicht verändert.
- Das Löschen darf **keine andere Kolonie** oder deren Sicherungen berühren. War die gelöschte Kolonie der zuletzt gespielte Stand, wird die Schnellstart-Vorauswahl passend bereinigt.
- **Kein Papierkorb vorgesehen**; auch keine automatische Wiederherstellung nach endgültiger Löschung, wenn vorher kein Export erfolgt ist. Der Spieler wird eindeutig auf den dauerhaften Verlust hingewiesen.
- Noch offen: exakte Buttontexte und grafische Gestaltung sowie das Speicherfehlerverhalten beim endgültigen Löschvorgang. **Keinen Spielcode ändern.**

## Namenskonflikte beim Import – Variante B (verbindlich beschlossen am 27.10.2026)

- Wird eine Koloniedatei importiert und existiert bereits eine lokale Kolonie **mit demselben sichtbaren Namen**, zeigt ANTHIVE einen **klaren Dialog mit bewusster Wahl** an. Es darf **keine automatische Überschreibung** stattfinden.
- **Sichere Voreinstellung:** „Als neue Kolonie importieren“ und einen **neuen Namen vergeben**. Die bestehende Kolonie bleibt mitsamt Spielstand und Sicherungen unverändert.
- **Alternative nur nach ausdrücklicher Auswahl:** „Bestehende Kolonie ersetzen“. Vor dem unwiderruflichen Ersetzen die betroffene Zielkolonie **eindeutig identifizieren**, den Verlust des bisherigen Zustands samt lokal gespeicherten Sicherungen erklären und eine **separate Bestätigung** einfordern. Eine vorherige Exportmöglichkeit als zusätzliche Absicherung anbieten.
- ANTHIVE verwendet **interne eindeutige Kolonie-IDs** zur sicheren Zuordnung. **Übereinstimmende Namen allein sind niemals ausreichender Beleg für dieselbe Kolonie**; Ersetzen muss sich auf die ausdrücklich ausgewählte Zielkolonie beziehen.
- Importdatei vor jeder Änderung **vollständig auf Lesbarkeit, Formatversion und Konsistenz prüfen**. Bei Abbruch, ungültiger Datei oder gescheitertem Import darf die vorhandene Kolonie nicht zerstört/teilweise überschrieben werden.
- Falls kein Namenskonflikt vorliegt, erfolgt der Import als eigene Kolonie, sofern die Datei gültig ist und der Speicher ausreicht. Exakte Importdialog-Gestaltung, interne Dateiformate und Versionsmigration bleiben gesondert zu planen.
- **Nur Planungsfestlegung; keine Umsetzung am Code.**

## Noch nicht entschieden – ausdrücklich nicht eigenmächtig implementieren

- Weitere zusätzliche Speicherereignisse außer dem nun beschlossenen Tab-Verbergen/App-Hintergrund (z. B. nach Bauabschluss oder großen Kolonieereignissen).
- Detailprüfung von Beschädigung/Inkompatibilität sowie Umgang mit fehlendem Speicherplatz bei Wiederherstellungen.
- Restliche Export-/Importdetails: Dateiformat, Prüfung, Dateinamen, inkompatible Versionen und Fehlerfall; **Namenskonflikt Variante B ist entschieden**.
- Detailverhalten beim Gründen einer neuen Kolonie und Darstellung/Sortierung/Lösch- und Umbenennungsregeln der Kolonieverwaltung (das grundlegende Startmenü mit Schnellstart ist beschlossen).
- Details zur Umbenennung von Kolonien und sonstige UI-Fragen; das Löschen mit optionalem Export und ausdrücklicher Bestätigung ist nun entschieden.
- Versionierung und Migration von Speicherständen nach Spielupdates.
- Verhalten bei vollem Speicher, fehlgeschlagenem Speichern und Browser-Datenschutz-/Löschvorgängen.
- Umgang mit bereits laufenden Arbeiten, Transportladungen, gebauten/geplanten Kammern, Ressourcen, Königin, Eiern, Brut, individuellen Ameisen, Arbeitsgruppen und Spieluhr, damit beim Laden keine Duplikate oder Verluste entstehen.

## Technische Leitplanken und spätere Prüfungen (kein vorweggenommener Designbeschluss)

- Speichern und Laden muss den **tatsächlichen** Zustand der Simulation wiederherstellen, nicht nur sichtbare Werte. Besonders prüfen: eindeutige IDs, Zeitfortschritt, Kammerbelegung, Reservierungen, Ressourcenbilanz, Bauaufträge und aktive Transporte.
- Ein fehlerhaftes oder unvollständiges Speichern darf vorhandene gültige Stände möglichst nicht zerstören.
- Manuelles Speichern und Autosave dürfen sich nicht gegenseitig in die Quere kommen.
- Mehrere Kolonien müssen vollständig getrennt bleiben, auch nach Neuladen des Browsers.
- Vor Codex-Auftrag offene Regeln mit dem Spieler konkretisieren; dann in kleinen getesteten Paketen implementieren.

**Status:** Automatisch + manuell, mehrere unabhängige Kolonien, lokal mit Datei-Export/-Import (B), Autosave alle 5 Minuten aktiver Echtzeit, drei gestaffelte Sicherungen je Kolonie (Aktualisierungsintervalle 15/60/180 Minuten aktiver Spielzeit) und Wiederherstellung C sowie **zusätzlicher best-effort Speicherversuch bei Tab-Verbergen/App-Hintergrund (Variante B)** verbindlich beschlossen. Startmenü Variante B (Hauptmenü mit vorausgewählter letzter Kolonie und Ein-Klick-Fortsetzen) beschlossen; **Löschen nach Variante B** (vorher optional Export anbieten, dann ausdrücklich endgültig bestätigen) beschlossen; Namenskonflikte beim Import **Variante B** (neuen Namen vergeben oder bewusst bestehende Kolonie ersetzen) beschlossen; Details zu Fehlerfällen, Dateiformat und weiteren Funktionen der Kolonieverwaltung bleiben offen. **Keinen Spielcode ändern.**
