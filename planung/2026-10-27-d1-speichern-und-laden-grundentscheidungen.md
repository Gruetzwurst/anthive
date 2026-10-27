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
- Ziel der Sicherungen ist die Wiederherstellung bei Problemen mit dem aktuellen Spielstand. **Noch nicht entschieden** ist, wie und wann die drei Kopien aktualisiert bzw. rotiert werden. Insbesondere ist nicht automatisch beschlossen, alle drei bei jedem Fünf-Minuten-Autosave neu zu überschreiben.
- Manuelles Speichern und Export/Import bleiben wie zuvor beschlossen.
- Ob zusätzlich beim Verbergen des Tabs, bei wichtigen Ereignissen oder beim Beenden gespeichert wird, ist **noch offen**. Ein zuverlässiges Speichern exakt beim Schließen des Browserfensters kann technisch nicht garantiert werden.
- Alle noch offenen Wiederherstellungs- und Sicherungsregeln vor der Implementierung gemeinsam entscheiden.

## Noch nicht entschieden – ausdrücklich nicht eigenmächtig implementieren

- Zusätzliche Autosave-Auslöser außer dem festen 5-Minuten-Intervall (z. B. Tabwechsel, bestimmte Spielereignisse).
- Rotation und Aktualisierungszeitpunkte der drei Sicherungskopien; Wiederherstellungsstrategie bei beschädigten oder inkompatiblen Spielständen.
- Detailverhalten von Export/Import: Dateiformat, Prüfung, Dateinamen, Konfliktbehandlung und Fehlerfall (Grundfunktion bereits beschlossen).
- Start-/Kolonieauswahl und das Verhalten beim Starten einer neuen Kolonie.
- Löschen/Umbenennen von Kolonien und eventuelle Warn- oder Bestätigungsschritte.
- Versionierung und Migration von Speicherständen nach Spielupdates.
- Verhalten bei vollem Speicher, fehlgeschlagenem Speichern und Browser-Datenschutz-/Löschvorgängen.
- Umgang mit bereits laufenden Arbeiten, Transportladungen, gebauten/geplanten Kammern, Ressourcen, Königin, Eiern, Brut, individuellen Ameisen, Arbeitsgruppen und Spieluhr, damit beim Laden keine Duplikate oder Verluste entstehen.

## Technische Leitplanken und spätere Prüfungen (kein vorweggenommener Designbeschluss)

- Speichern und Laden muss den **tatsächlichen** Zustand der Simulation wiederherstellen, nicht nur sichtbare Werte. Besonders prüfen: eindeutige IDs, Zeitfortschritt, Kammerbelegung, Reservierungen, Ressourcenbilanz, Bauaufträge und aktive Transporte.
- Ein fehlerhaftes oder unvollständiges Speichern darf vorhandene gültige Stände möglichst nicht zerstören.
- Manuelles Speichern und Autosave dürfen sich nicht gegenseitig in die Quere kommen.
- Mehrere Kolonien müssen vollständig getrennt bleiben, auch nach Neuladen des Browsers.
- Vor Codex-Auftrag offene Regeln mit dem Spieler konkretisieren; dann in kleinen getesteten Paketen implementieren.

**Status:** Automatisch + manuell, mehrere unabhängige Kolonien ohne feste Slotzahl, lokales Speichern mit Datei-Export/-Import (Variante B), **Autosave alle 5 realen Minuten** und **drei automatische Sicherungskopien pro Kolonie** verbindlich beschlossen. Rotation und Wiederherstellung sind noch zu planen. **Keinen Spielcode ändern.**
