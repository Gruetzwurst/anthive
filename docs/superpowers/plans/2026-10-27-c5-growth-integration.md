# C5 – integrierte Wachstumstests

Ziel: Bestehende C1–C4-Simulation über zahlreiche Spieltage prüfen. Grundlage:
`planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md`, Abschnitt C5.
Nutzerauftrag vom 27.10.: aktuellen Stand kontrollieren und nächsten Schritt ausführen.

Umsetzung direkt in dieser Sitzung, sparsam ohne parallele Implementierer.
Es werden Tests und Ergebnisdokumentation ergänzt, keine neuen Spielmechaniken.

- [x] Vorhandene Tests als Ausgangsbasis ausführen.
- [x] `tests/growth-integration.test.mjs`: reale Welt, gemeinsame Uhr, natürliche
  Eiablage und echte Eier-/Larvenversorgung, alle Spezialisierungen und
  Ressourcen-/Individuenbilanzen über mindestens zwölf Spieltage prüfen.
- [x] Fehlende Pflege über zahlreiche Tage: voller Eierpuffer, keine Geburt,
  kein Fortschritt wartender Eier; Wiederaufnahme mit tatsächlichen Pflegerinnen
  und messbarem Pflegeengpass. Versorgungsausfall und Erholung zusätzlich prüfen.
- [x] Pause ohne Veränderungen und Vergleich gleich langer Zeitschritte prüfen.
- [x] Gesamttests, Welttests und Build ausführen; Ergebnisse und Grenzen in
  `docs/C5-WACHSTUM-ERGEBNIS.md` und README festhalten.

Tests verwenden explizite Testvorräte, keine zusätzlichen Produktionsressourcen.
Fehler zuerst reproduzieren und Ursache prüfen; erforderliche Spielcodekorrekturen
separat ausweisen. Keine D1-, Ruhekammer- oder Bauvorlagenimplementierung.
