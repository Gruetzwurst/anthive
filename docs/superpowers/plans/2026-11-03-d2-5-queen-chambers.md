# D2.5 – Königinnenkammern und besondere Eier

Inline mit Superpowers executing-plans/TDD; Design:
`docs/superpowers/specs/2026-11-03-d2-5-queen-chambers-design.md`.
3 Material/Kachel vom Nutzer bestätigt. Bestehende lokale Änderungen erhalten.

- [x] Königinnenplatz-Modell: Höchststand150/500/1000, Auftragsreservierung,
  einmaliges Ei bei betriebsbereiter Kammer; isolierte Tests zuerst rot.
- [x] Bauart queen,44-Kachel-Minimum und11×4-Vorlage in bestehender Planung,
  Kosten132, reale Einrichtung und Kapazität1. Limit im Modell und Menü.
- [x] Gemeinsame Eiertransport-Schnittstelle für normale/königliche Eier,
  echte Quellkönigin, Transport/Reservierung/Drop/Ankunft über bisherige Pflege.
- [x] Neue persistente königliche Eier und Schema7, Migration1–6 mit
  Originalschutz, strenge Querreferenzen und exklusive Träger. Keine
  Ei-Neuerzeugung durch Snapshot/Reload/Restore.
- [x] Sichtbares königliches Ei/Status der Kammer, Langfristphasen D2.6 getrennt.
- [x] Modell-/Gesamttests, Build, Browser Bau/Transport/Reload/Migration,
  kurzer Review und Ergebnis-/Fortsetzungsdokumentation.

Abnahme348/348 Gesamttests,18 gezielte Königinnen-/Platzierungstests,
42 Persistenztests und4 Planungstests erfolgreich. Build und Browser-
Migration1–6/echter Bau/aktiver Eiträger/Ankunft-Reload grün. Drei wichtige
Reviewbefunde in einem Pass rot→grün behoben (blockierte Abholung, dauerhafter
Erzeugungsnachweis, unerwartete Royal-Daten alter Formate). Ein alter Test
musste queen als nun bekannten Kostentyp behandeln. Ergebnis:
`docs/D2.5-KOENIGINNENKAMMER-EI-ERGEBNIS.md`. Änderungen lokal.
