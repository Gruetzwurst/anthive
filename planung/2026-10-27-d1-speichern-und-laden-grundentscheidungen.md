# ANTHIVE – D1 Speichern und Laden: Grundentscheidungen

**Verbindliche Entscheidungen vom 27.10.2026.** Planung für die nächste Entwicklungsphase D1, noch **kein Auftrag zur Umsetzung**. Vor Implementierung den aktuellen lokalen Codex-Stand und GitHub-Branches prüfen, C5 und zwischenzeitliche Bau-/Ruhekammeränderungen berücksichtigen. **Keinen Code ändern aufgrund dieses Dokuments.**

## Verbindlich beschlossen

1. **Automatisches und manuelles Speichern:** ANTHIVE soll Spielstände selbstständig regelmäßig sichern und dem Spieler zusätzlich erlauben, einen manuellen Speichervorgang auszulösen.
2. **Mehrere unabhängige Kolonien:** Spieler dürfen mehrere getrennte Kolonien anlegen, laden und fortsetzen; es gibt **keine künstlich festgelegte Anzahl von Speicherplätzen**. Die Grenze ist der tatsächlich verfügbare Speicherplatz.
3. Jede Kolonie braucht eine eigene Zuordnung, damit ein Autosave nicht versehentlich eine andere Kolonie überschreibt.
4. Das bisherige Verhalten „Seite neu laden = neue Kolonie“ soll durch das künftige Lade-/Speichersystem abgelöst werden, ohne bestehende Simulationen zu verändern.

## Noch nicht entschieden – ausdrücklich nicht eigenmächtig implementieren

- Speicherort: nur lokal im Browser, optionale Cloud-Anbindung oder spätere Synchronisierung.
- Automatisches Speicherintervall und welche Ereignisse zusätzlich speichern.
- Art und Anzahl von Sicherungskopien, Wiederherstellungsstrategie bei beschädigten oder inkompatiblen Spielständen.
- Export/Import und Übertragbarkeit zwischen Geräten.
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

**Status:** Automatisch + manuell sowie mehrere unabhängige Kolonien ohne feste Slotzahl sind verbindlich beschlossen; alle übrigen Details bleiben zur weiteren gemeinsamen Planung offen.
