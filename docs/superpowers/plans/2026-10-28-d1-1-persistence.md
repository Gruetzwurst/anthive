# D1.1 Implementierungsplan

> Ausführung: superpowers:executing-plans; bestehende lokale Änderungen erhalten.

**Ziel:** Vollständiger Snapshot, isoliertes Wiederherstellen und atomare lokale Koloniespeicherung.
**Spec:** ../../2026-10-28-D1.0-DATENINVENTAR-UND-SPEICHERVERTRAG.md
**Architektur:** Explizite Zustandsschnittstellen der vorhandenen Systeme; reine JSON-Kodierung mit Map-Unterstützung; isolierte Koloniesitzung und IndexedDB-Repository.
**Technik:** TypeScript, IndexedDB, node:test, Firefox.

## Grenzen

Nur D1.1. Kein Autosave/Backup, Menü, Exportdialog, Commit oder Push.
Ruling: Im bestehenden Feature-Checkout arbeiten: Der autorisierte Stand umfasst uncommittete C5-/Spielteständerungen, ein neuer HEAD-Worktree würde diese auslassen. Rückfallarchiv liegt unter /tmp; kein Branchwechsel.
Ruling: Benutzeroberfläche folgt D1.2/D1.3; D1.1 stellt testbare Speicher-/Ladeschnittstellen bereit.

## Aufgaben

- [x] 1. Vollständige explizite exportState/restoreState-Schnittstellen und isolierte createColonySession/captureColony/restoreColony. Tests zuerst rot: Roundtrip plus gleicher Weiterlauf, keine Start-Duplikate, getrennte Welten.
- [x] 2. Versionierte Serialisierung und Validierung. Tests zuerst rot: defekte Werte/Referenzen/Versionen/Materialbilanzen zurückweisen, Original unverändert.
- [x] 3. IndexedDB ColonyRepository save/load/list mit Revisionen und atomarem Commit. Browserprüfungen: Reload, mehrere Kolonien, veraltete Revision/Abbruch erhält Hauptstand.
- [x] 4. Gesamttests, Build, unabhängige Abschlussprüfung und Ergebnisbericht.

## Prüffokus

Laufende Ei-/Ressourcen-/Materialtransporte, gebuchte Ruheplätze, Teilbau, Erholung,
fehlende Felder, beschädigte Jobs und Isolation zweier Kolonien. Keine Offlinezeit.

## Fortschritt

Baseline D1.0: 268 Tests und Build erfolgreich. Noch kein Produktcode für D1.1.

Task 1–3: complete; gezielte Modelltests 13/13 erfolgreich; Browserprüfung erfolgreich.
Ruling: Map-/Set-Tags und kanonisch ausgelassene undefined-Felder statt eines
Objektgraph-Codecs; Ei-/Orderidentität explizit rekonstruieren. Geringere Komplexität;
neue geteilte Referenzen müssen künftig ausdrücklich im Vertrag aufgenommen werden.
Ruling: Regelprofil 1 streng validieren statt unbekannte Konfigurationen zu laden;
verhindert stille Umbalancierung, erfordert bei Regeländerung explizite Migration.
Final review: unabhängiger Reviewer; fehlende Pflichtreferenzen und Quotenprüfung
reproduziert und per Regressionstest rot/grün behoben; keine offenen wichtigen Befunde.

D1.1 abgeschlossen: npm test 281/281, Build und Browser erfolgreich. Nutzer hat Fortsetzung mit D1.2 autorisiert.
