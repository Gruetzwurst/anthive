# D1.4 – Dateiimport und Wiederherstellung

> Ausführung mit superpowers:executing-plans, TDD und abschließendem Review.

**Spec:** ../../2026-10-28-D1.0-DATENINVENTAR-UND-SPEICHERVERTRAG.md
**Nutzerentscheidung:** Nur mit zusätzlicher Sicherheitskopie des bisherigen
GÜLTIGEN Stands wiederherstellen/ersetzen. Bei zu wenig Speicher abbrechen und
Export/Verwaltung anbieten. Ungültiger Hauptstand kann keine gültige Kopie bilden;
vorhandene gültige Sicherungen bleiben beim Restore unberührt.
**Ziel:** Gültige Dateien als neue Kolonie oder bewusst ausgewählten Ersatz
importieren; vorhandene gültige Backups jederzeit nach Bestätigung zurückspielen.

## Architektur und Entscheidungen

Reine Snapshot-Vorbereitung trennt Gameplay von ID-/Speicherhistorie.
Neue Importe: eigene UUID, Revision0, neue lokale Sicherungsrhythmen.
Restore: lokale ID/Name und bekannte aktive Speicherzeit behalten, Hauptrevision
fortsetzen; Autosave frühestens nach fünf weiteren aktiven Minuten. Drei
bestehende Backupslots und ihre Zeitstempel bleiben unverändert.
Ersetzen: Ziel-ID behalten, importierten Namen/Zustand übernehmen, automatische
Backupslots neu beginnen; Zielzeit bleibt monoton. Klarer Verlusthinweis,
Exportangebot und separate endgültige Bestätigung.

Vor jedem destruktiven Vorgang einen gültigen aktuellen Stand samt Prüfsumme in
separatem Recovery-Store erhalten. Jede Kopie hat eine neue ID, keine automatische
Löschung/Überschreibung älterer Kopien. Kopien sind sichtbar/exportierbar und
wiederherstellbar. Kolonielöschung entfernt auch diese zugehörigen Kopien.
IndexedDB-Version3 ergänzt Payload-/Metadatenstores mit Kolonieindex; Kopie,
Hauptstand und Metadaten schreiben atomar unter Web-Lock und Revisionsprüfung.
32MiB Dateigrenze vor dem Einlesen und gleicher Byte-Grenzwert beim Export.
Keine automatischen Migrationen unbekannter Formate (D1.5).

- [x] 1. Import-/Restore-Vorbereitung und Formatprüfung; Tests zuerst rot.
- [x] 2. Atomare Repository-Operationen, Recovery-Kopien, Abbruch/Quota/CAS/Lock.
- [x] 3. Datei-Auswahl, Namenskonflikt, Ersetzen-Dialog und Backup-/Kopien-Restore
im bestehenden Menü; keine zusätzliche Design-/Assetgenerierung.
- [x] 4. Modell-/Browserprüfungen, Gesamttests, Build, unabhängiger Review.

## Prüffokus

Ungültige/zu große Dateien ändern nichts; gleiche Namen/IDs überschreiben nichts
ungefragt. Keine Restore-Backup-Rotation, keine Offlinezeit, kein Verlust bei
Quota/Abbruch. Fehler und Abbruch verändern keine fremde Kolonie.

## Ledger

Task1: neue Modelltests3/3 grün; gezielter Persistenzlauf26/26 grün.
Task2: Browser copy-failure atomic, Restore/Recovery, CAS, fremde Kopien und
beschädigter Hauptstand grün. Unabhängiger Review: Ersatz bei kaputtem Hauptstand
hätte gültige Backups gelöscht; Browserregression rot/grün, Ersatz jetzt gesperrt.
Task3: UI ungültige Datei, gleicher Name, neue ID, Restore/Ersetzen samt
Abbruch und Quota-Pfad grün. Sicherheitskopien sichtbar/exportierbar/ladbar.
Ruling: Beschädigte Ziele zuerst wiederherstellen oder als neue Kolonie
importieren; kein Ersatz ohne gültigen schützbaren Hauptstand. Verhindert den
Verlust noch brauchbarer alter Backups, verlangt bei Defekt einen Zwischenschritt.
Ruling: Alle expliziten Sicherheitskopien behalten statt alten Schutzstand
überschreiben. Benötigt mehr Speicher; bei Quota expliziter Abbruch wie beschlossen.
Ruling: Bei neuem Import neue lokale Timer; bei Restore bekannte lokale Timer
behalten und frühestens fünf aktive Minuten bis zum nächsten Autosave. Keine
unbekannte Offlinezeit ergänzen. Bei defektem Payload vorhandene validierte
Timer-/Backupstände verwenden.

D1.4 abgeschlossen:294/294 Tests, Build und Browserprüfungen erfolgreich. Nächstes Paket D1.5; kein Commit/Push.
