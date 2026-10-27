# ANTHIVE – D1 Codex-Arbeitspakete: Speichern, Laden, Spielstände

**Stand: 27.10.2026 | Status: PLANUNG – KEINE CODEFREIGABE.** Dies ist eine umsetzungsnahe Arbeitszerlegung, **kein Auftrag, die Arbeiten jetzt auszuführen**. Verbindliche Produktregeln stehen in [D1-Grundentscheidungen](2026-10-27-d1-speichern-und-laden-grundentscheidungen.md). Bei Abweichungen ist dieses Grundsatzdokument maßgeblich.

## ZUERST – Pflicht-Abgleich in der Linux-VM

1. Im lokalen Projekt `git status`, `git branch -a`, `git log -5 --oneline` und ungesicherte Änderungen prüfen; keine Dateien überschreiben und kein ungefragtes Merge/Reset.
2. Nicht von `main` als aktuellem Implementierungsstand ausgehen: Codex-Arbeit liegt/lag auf `codex/a1-...`, `codex/b1-...`, `codex/c1-...` bis `codex/c4-brood-shortage`, dazu `codex/visible-queen-and-brood`. **Aktuellen lokalen und Remote-Branch prüfen; kein blinder Branchwechsel**.
3. Prüfen, ob **C5 integrierte Wachstumstests** abgeschlossen und grün sind. **D1 erst nach C5 und ausdrücklicher Nutzerfreigabe** implementieren.
4. Post-C5-Planungen lesen und Konflikte markieren: `planung/2026-10-26-ruhekammern-nach-c5.md`, `planung/2026-10-26-kammervorlagen-klein-mittel-gross-und-freies-bauen.md`, `planung/2026-10-26-visueller-kammerstil-und-offene-baugrenzen.md`. D1-Snapshot muss mit späteren Kammer-/Ruhe-Updates erweiterbar sein; **deren Umsetzung nicht ungefragt in D1 einschließen**.
5. Ist-Zustand der Simulation und der bestehenden Tests inventarisieren. Anforderungen und offene Punkte **zuerst dokumentieren**, dann nach gesonderter Freigabe jeweils nur **ein Paket** implementieren.

## Verbindliche Produktregeln: nicht umentscheiden

- Browserlokale Spielstände, **ohne Cloud/Account**; **Datei-Export und Datei-Import** zum externen Sichern und Gerätewechsel.
- Mehrere voneinander unabhängige Kolonien, **keine künstliche Slotgrenze**, jede mit eindeutiger ID.
- **Manuell speichern** und **Autosave alle 5 realen Minuten aktiver Kolonie-Spielzeit**.
- Zusätzlich **best-effort Speicherversuch beim Tab-Verbergen/App-Hintergrundwechsel**; browserbedingt keine Garantie.
- **3 automatische Backups je Kolonie zusätzlich zum Hauptstand**; Aktualisierung im Abstand von **15 / 60 / 180 Minuten aktiver Spielzeit**, mit gestaffelter Behandlung gleichzeitig fälliger Kopien. Diese Zahlen sind **Erneuerungsrhythmen, nicht garantierte Altersabstände**. Inaktives/pausiertes Spiel zählt nicht; Zähler bleiben nach Neustart bestehen.
- Beschädigter Spielstand: gültige Backups mit tatsächlichen Zeitstempeln anbieten. **Manuelle Wiederherstellung jederzeit** in der Kolonieverwaltung, mit Bestätigung, möglichst sicherer Kopie des vorherigen gültigen Zustands. Nie ein stilles Zurücksetzen.
- Start **immer ins Hauptmenü**; letzte Kolonie vorausgewählt, **Ein-Klick-Fortsetzen**, alternative Auswahl/Neugründung/Verwaltung.
- Kolonie frei benennen und jederzeit umbenennen; Standardsortierung **zuletzt gespielt zuerst**; Name, Spieltag, Ameisenzahl, letzter erfolgreicher Speicherzeitpunkt und Backupstatus anzeigen.
- Löschung: **zuerst optionalen Export anbieten**, erst nach bewusster Bestätigung Kolonie + lokale Backups löschen; kein Papierkorb, keine Auswirkungen auf andere Kolonien.
- Import mit gleichem Namen: **als neue Kolonie mit neuem Namen** (sicherer Standard) oder **bewusst ausgewählte bestehende Kolonie ersetzen**, zusätzliche Bestätigung und Exportangebot; keine automatische Überschreibung.
- Speicher voll/unbeschreibbar: **warnen**, Export/Verwaltung/Platzfreigabe anbieten, **niemals automatisch Kolonien oder Backups löschen**.
- Alte Save-Versionen **nach Möglichkeit sicher migrieren**, alte intakte Version bis nach erfolgreicher Migration erhalten; ununterstützte Version melden, nichts stillschweigend löschen.
- Sonderfälle: alle Kopien defekt -> externe Datei importieren; gelöschte Browserdaten -> Import oder neue Kolonie; zu wenig Platz für sicheren Restore -> Export anbieten/ggf. abbrechen; dieselbe Kolonie in mehreren Tabs -> **nur ein Schreiber**; inkompatibler Import verändert kein Original.

## Arbeitspaket D1.0 – Bestandsaufnahme und Speichervertrag (nur planen, bevor Code beginnt)

**Auftrag:** Bestehende Datenhaltung, Tick-/Spielzeit, aktuelle Spielobjekte und IDs erfassen. Ein konsistentes Modell für einen Snapshot beschreiben, getrennt von Renderer und Speicher-Backend. Keine zweite konkurrierende Welt/Uhr/Ressourcenverwaltung.

**Checkliste für das zu speichernde Modell (tatsächliche Namen aus Code ermitteln):** Spieltag/Uhrzeit, Weltseed & veränderte Tiles/Grabstatus/Teich, Kammer-Typ und Zellmenge, Bauplanung/FIFO/Blockaden/Einrichtungsfortschritt, Lager je Kammer & Ressourcenquellen, Materialhaufen/Ladungen/Reservierungen, Ameisen-IDs/Positionen/Spezialisierungen/Arbeitsgruppen/Zustände/Wege soweit erforderlich, Königin/Eierpuffer/Zielanteile, Brut-IDs/Stadien/Pflege-/Larvenbestände/Mangel-/Erholungszähler, Verbrauch, aktuelle Aufgaben und geplante Warteschlangen; ggf. RNG-Zustand. Spätere neue Mechaniken erweiterbar.

**Abnahme:** Dateninventar mit Verantwortlichkeiten; dokumentierte Invarianten (keine Phantomressourcen, duplizierte Ameisen oder doppelte Aufträge), Save-Schema-Version und Migrationsstrategie als Konzept; offene Fragen getrennt von fixen Nutzerbeschlüssen. **Keine Codeimplementierung ohne Freigabe.**

## Arbeitspaket D1.1 – Snapshot, lokale Persistenz und Laden

**Abhängigkeit:** D1.0. **Umsetzung erst nach Freigabe.**

- Eine kanonische, versionierte Snapshot-Serialisierung inklusive ID- und Referenzprüfung.
- Browserlokales Speichern (z. B. IndexedDB als **technischer Vorschlag**, keine vorher festgelegte API), strikt je `colonyId`; Speichern atomar/fehlerfest, unveränderter zuletzt gültiger Stand bei Abbruch.
- Laden und Wiederaufbau derselben Simulation inklusive laufender Transporte und Bauaufträge; keine unkontrollierte Doppelsimulation, keine versehentliche Zeitnachholung.
- Kolonie erzeugen, identifizieren, laden, isolieren, Metadaten sicher pflegen.

**Tests:** Save→Reload→Load über komplexe Brut-, Ressourcen-, Bau- und Transportzustände, Zahlen/IDs/Bilanzen unverändert; zwei unabhängige Kolonien; ungültige Daten erkennen; Wiederherstellung nach abruptem Speicherabbruch.

## Arbeitspaket D1.2 – Autosave, manuelles Speichern, Backups und Tab-Schutz

**Abhängigkeit:** D1.1.

- Nach 5 aktiven Echtzeitminuten Hauptsnapshot; manuelle Speicherung jederzeit.
- Beim Verbergen/Hintergrundwechsel best-effort zusätzlichen Hauptsnapshot anstoßen, ohne mehrere konkurrierende Schreibvorgänge.
- 3 **getrennte** Backup-Slots je Kolonie, Fälligkeit nach **15/60/180 aktiven Echtzeitminuten** je Slot, über Sessions fortgesetzte Timer, kein Offline-Nachholen.
- Bei gleichzeitiger Fälligkeit **zeitlich staffeln**, älteren/langfristigen Platz priorisieren; **nicht alle drei mit demselben Snapshot überschreiben**. Sicherungen mit tatsächlich geschriebenem Datum/Zeitstempel kennzeichnen.
- Sicherungsrotation darf beim Restore, Tabwechsel oder manuellen Save nicht unbemerkt alle Kopien ersetzen.
- Pro Kolonie ein schreibender Tab, weitere Tabs informieren; Race Conditions und Lock-Verlust sicher handhaben.

**Tests:** 5/15/60/180 min; Kollision bei Minute 180 und 360; Pause/Tabwechsel/Browserneustart; parallele Saves; zwei Tabs gleicher Kolonie; mehrere Kolonien; Quota-Fehler; niemals gültiges Backup durch beschädigte Daten ersetzen.

## Arbeitspaket D1.3 – Startmenü und Kolonieverwaltung

**Abhängigkeit:** D1.1 (Backup-Metadaten D1.2).

- Hauptmenü erscheint beim Start. Letzte Kolonie vorausgewählt; Fortsetzen in einem Klick, wenn gültig.
- Neue Kolonie mit frei wählbarem Namen; Umbenennen ohne neue ID; Übersicht sortiert nach zuletzt gespielt.
- Pro Kolonie Name, Tag, Ameisenzahl, **Zeitpunkt des letzten erfolgreichen Speicherns**, verfügbare Sicherungen; Aktionen: Fortsetzen, Umbenennen, Exportieren, Sicherungen, Löschen.
- Löschen bietet **vorher Export** an, verlangt separate finale Bestätigung, löscht nur die gewählte Kolonie und zugehörige lokale Backups. Keine einseitigen Löschungen bei voller Kapazität.
- Große Listen effizient und zugänglich halten, ohne künstliche Kolonienbegrenzung.

**Tests:** Leere Liste, eine/mehrere Kolonien, letzte Kolonie gelöscht/defekt, sortierte Darstellung, Umbenennen ohne Überschreiben, bestätigtes/abgebrochenes Löschen, fehlgeschlagener Export beim Löschdialog.

## Arbeitspaket D1.4 – Export, Import und Wiederherstellung

**Abhängigkeit:** D1.1–D1.3.

- Kompletten validierten Kolonie-Snapshot **als Datei exportieren**, mit nachvollziehbarem Namen und Formatversion.
- Dateien einlesen, Validierung vor Schreiben, bei Namenskonflikten Nutzerwahl: neu importieren/neuer Name oder ausdrücklich eine gewählte Kolonie ersetzen (Exportangebot, weitere Bestätigung).
- Alle vorhandenen, **gültigen** Backups mit echten Zeitstempeln über die Kolonieverwaltung verfügbar; manueller Restore auch ohne Defekt, mit Warnung vor Fortschrittsverlust.
- Vor Restore nach Möglichkeit intakten aktuellen Zustand gesondert schützen; bei mangelndem Speicher nicht destruktiv überschreiben.
- Alle defekt -> Import anbieten; gelöschte Daten -> Import/neue Kolonie; fremde Kolonien nie betroffen.

**Tests:** Export→Import auf frischem Browser, erneuter Import, Namenskonflikt-Neuanlage und bewusstes Ersetzen, korrupte Dateien, unvollständige Exporte, fehlender Speicher, Restore mehrerer Backup-Zeitpunkte, Abbruch und Fehlermeldungen.

## Arbeitspaket D1.5 – Versionen, Migration, Robustheit, Gesamttests

**Abhängigkeit:** D1.1–D1.4.

- Versionierung und sichere unterstützte Migration alter gültiger Saves/Exportdateien; alter gültiger Stand bleibt bis erfolgreich validierter und persistierter Migration geschützt.
- Ungültige/zu alte/nicht unterstützte Formate mit hilfreicher Meldung zurückweisen, Original und bestehende Kolonien unangetastet lassen.
- Speicher voll: keine automatischen Backup-/Kolonielöschungen; Export/Verwaltung anbieten, Fehlschlag und Erfolg korrekt kommunizieren.
- Fehlerpfade für Abbruch während Save, Restore, Löschung, Import, Migration; Mehrtab-Konflikte, längeres Spielen mit vielen Ameisen; Zeit- und Speicherperformance prüfen.
- Vor Abschluss **alle bisherigen Tests und Build** ausführen, zusätzliche Integrationstests und Bericht zu Ergebnis, Grenzen, offenen Risiken. Keine Fertigmeldung bei nur teilweise funktionierendem Save/Load.

## Lieferstandard JE ARBEITSPAKET

- **Vor Start:** Branch, sauberen/gesicherten lokalen Stand, Abhängigkeiten und betroffene Dateien nennen.
- **Nur dieses Paket** nach ausdrücklicher Freigabe umsetzen. Kein neues Gameplay, kein unbestellter UI-Komplettumbau, keine Änderungen an anderen Modulen ohne klare Begründung.
- **Danach:** geänderte Dateien, Tests + Build mit Ergebnissen, simulierte Save/Load- und Fehlerfälle, offene Punkte und konkreten nächsten Paketvorschlag berichten.
- **Code nicht ohne Nutzerfreigabe mergen oder pushen**, sofern nicht ausdrücklich für den konkreten Schritt autorisiert. Keine vorhandenen lokalen Änderungen überschreiben.

## Vor der späteren Implementierung noch zu spezifizieren

- Technisch notwendige und sichere Defaults: internes Dateiformat, Dateinamen-/Zeichenregeln, Kolonienamen-Maximallänge, genaue Fehlerdialoge und Regeln für den Schutz einer zusätzlichen Kopie bei knapper Speicherkapazität.
- Bei Entscheidungsfragen, die Auswirkungen auf den Spieler haben, **erst Rückfrage**, nicht eigene Regeln erfinden.
- **Wichtige Designprüfung:** Backups mit 15/60/180-Minuten-*Aktualisierungen* gewährleisten nicht ständig einen exakt 3 Stunden alten Wiederherstellungspunkt. Nicht mit garantierter Langzeithistorie verwechseln; falls später gewünscht, separat entscheiden.
- Aktive Post-C5-Planungen zur Kammergestaltung/Abstandsprüfung/Ruhekammerbelegung **separat** umsetzen und darauf achten, dass neue Daten in D1-Schema aufgenommen werden.

**AKTUELLER STATUS:** D1 umsetzungsbereit **als Arbeitsplanung**, nicht als Codeauftrag. Aktiver nächster Spielimplementierungsschritt vor D1: **C5 prüfen und abschließen**. 
