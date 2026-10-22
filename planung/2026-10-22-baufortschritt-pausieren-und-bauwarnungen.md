# ANTHIVE – Baufortschritt, manuelles Pausieren und Bauwarnungen

**Verbindliche Nutzerentscheidungen vom 22.10.2026:** Baufortschrittsanzeige **B**, manuelles Pausieren **B**, Benachrichtigungen bei Bauproblemen **B**.

Dieses Dokument ergänzt die 23 vorherigen Dokumente im GitHub-Ordner `planung/`. Es ist Planung; **kein Spielcode wurde durch diesen Eintrag verändert**.

## 1. Baufortschrittsanzeige B – Zustand an Baustelle, Details beim Anklicken

- Jede Baustelle erhält in der Spielwelt einen **klar erkennbaren Status**, ohne permanent alle Zahlen einzublenden.
- Wenn der Spieler die Baustelle auswählt/anklickt, sieht er **Grabfortschritt**, **Einrichtungsfortschritt** und **benötigtes bzw. noch fehlendes Baumaterial**.
- Fortschritt muss zwischen **geplant, ausgraben, einrichten, betriebsbereit** sowie blockiert/pausiert unterscheiden.
- Die Darstellung soll für spätere Touch-Bedienung ausgelegt sein.
- Es wurde **nicht** beschlossen, dass die zentrale Bauliste die einzige Fortschrittsanzeige sein soll (Option C), oder dass überall dauerhaft ein großer Balken zu sehen ist (Option A). Eine zusätzliche Übersicht ist nicht grundsätzlich verboten, aber nicht Teil dieser Entscheidung.

## 2. Manuelles Pausieren B – pro Auftrag

- Spieler kann **einzelne Bauaufträge pausieren** und anschließend fortsetzen.
- Dabei bleiben **der gesamte bisherige Fortschritt, die ursprüngliche Position in der FIFO-Auftragsreihenfolge und vorhandene Materialien** erhalten.
- Pausierte Aufträge dürfen keine neue Grab- oder Einrichtungsarbeit starten. Schon begonnene Ameisenaktionen und getragene Materialien müssen sicher zu Ende geführt bzw. unterbrechungsfest verwaltet werden, ohne Ressourcen zu verdoppeln oder zu vernichten.
- Ein pausierter Auftrag blockiert **nicht** pauschal alle nachfolgenden ausführbaren Aufträge; er bleibt an seiner ursprünglichen Listenposition und kann nach Fortsetzung unter Beachtung der bisherigen FIFO-/Blockaderegeln wieder Vorrang erhalten.
- **Pausieren ist nicht Abbrechen**: Ein bereits beschlossener Abbruch beendet den Auftrag, lässt den Aushub bestehen und bewahrt unverbrauchte Materialien. Bei Pausieren bleibt derselbe Auftrag fortsetzbar.
- Der Spieler darf über Pausieren/Weiterführen entscheiden, ohne die feste Spezialisierung einzelner Ameisen ändern zu müssen.

## 3. Bauproblem-Benachrichtigungen B – Symbol plus einmalige kurze Meldung

- Bauprobleme wie **fehlendes Baumaterial** oder **unerreichbare bzw. noch gesperrte Bauflächen** erhalten einen erkennbaren Status bzw. ein Symbol an der Baustelle.
- Bei **neu auftretenden Problemen** erscheint zusätzlich eine kurze, verständliche Benachrichtigung, z. B. „Wasserlager: Baumaterial fehlt“.
- **Keine wiederkehrende Benachrichtigungsflut** für denselben unverändert ungelösten Zustand. Bei einem neuen Problem oder nach Behebung und erneutem Auftreten darf wieder sinnvoll benachrichtigt werden.
- Die genauen Symbole, Darstellungsdauer, Prioritäten und ein mögliches Benachrichtigungsprotokoll sind **noch nicht verbindlich entschieden**.
- Eine vom Spieler **bewusst pausierte** Baustelle ist nicht automatisch ein Fehler; keine unnötige Warnung nur wegen manueller Pause.

## Zusammenspiel mit bereits beschlossenen Systemen

- Bauaufträge grundsätzlich **in Erstellungsreihenfolge (FIFO)**; derzeit unerreichbare/blockierte Aufträge dürfen vorübergehend übersprungen werden, behalten ihren Platz.
- Pinsel und Rechteck erstellen frei gestaltete, **zusammenhängende** Kammerformen; **Kammertyp bei Planung**; fertiggestellte Kammern dürfen **nicht umgenutzt** werden.
- Ablauf: Planung -> Ausgraben -> schrittweise Einrichtung mit Baumaterial -> betriebsbereit. **Unfertige Kammern haben noch keine funktionale Kapazität.**
- Materialmangel lässt die Einrichtung pausieren, ohne bisher verbrauchtes Material oder Fortschritt rückgängig zu machen.
- Materiallieferungen können aus mehreren geeigneten Lagern kommen; keine automatische Umverteilung zwischen Lagerkammern.
- Bereits ausgegrabene Flächen bleiben nach Bauabbruch erhalten; unverbrauchtes Material bleibt erhalten.
- Unterschiedliche Erdschichten, Grabzeiten, Materialerträge, Kammerflächen und Baukosten liegen teilweise als **veränderbare Testwerte** in anderen Planungsdateien.

## Hinweise für Codex – Entwicklungsreihenfolge unbedingt erhalten

1. **Vor jeder Spielcode-Änderung** lokalen VM-Stand prüfen und mit GitHub abgleichen. Insbesondere mögliche lokal neuere Teich-/Weltdateien nicht überschreiben.
2. Erst die priorisierten Aufträge der Ressourcenwirtschaft (Uhr/Bestände/Quellen/Tests, echte Transporte, Verbrauch, UI) fertigstellen. Die gesamte Bau-UI ist **nicht** Teil des ersten Ressourcenauftrags.
3. Im späteren Nestbau-Modul Aufträge mit stabiler ID, ursprünglicher Reihenfolge, Grabfortschritt, Einrichtungsfortschritt, Materialbedarf und expliziten Statusfeldern modellieren (z. B. `geplant`, `inArbeit`, `blockiert`, `manuellPausiert`, `abgeschlossen`, `abgebrochen`). Nicht jede Pause mit Materialmangel gleichsetzen.
4. Pausieren/Fortsetzen als unterbrechungsfeste Zustandsübergänge implementieren. Keine Fortschritts-/Materialverluste und kein dauerhaft reservierter Arbeits-Tile.
5. Eine kompakte Statusdarstellung pro Baustelle und eine Detailansicht bei Auswahl ergänzen, einschließlich aktuellem Materialstand und Restbedarf.
6. Benachrichtigungen **zustandswechselbasiert** erzeugen, nicht bei jedem Simulationsupdate wiederholen.
7. Bestehendes Bau-/Grabverhalten und Verkehrs-/Pfadfindung weiterverwenden, keine überstürzte Komplettneufassung.

## Akzeptanztests für später

- Angelegte Baustelle zeigt einen Status; beim Anklicken sind Aushub- und Einrichtungsfortschritt sowie Materialbedarf getrennt sichtbar.
- Manuell pausierter Auftrag stoppt neue Arbeit, verliert keine Fortschritte und kann später fortgesetzt werden.
- Beim Fortsetzen bleibt die ursprüngliche FIFO-Reihenfolge erhalten. Nachfolgende Aufträge werden während einer Pause nicht grundlos gesperrt.
- Pause beim Graben oder Transport erzeugt keine doppelt gewonnenen/angelieferten Materialien, keine verlorenen Ladungen und keine dauerhaft reservierten Kacheln.
- Materialmangel pausiert eine Einrichtung; nach neuem Vorrat geht es an derselben Stelle weiter.
- Ein neues Bauproblem erzeugt eine verständliche Meldung; derselbe unveränderte Fehler löst keine Meldung pro Frame/Tag aus.
- Eine bewusste Pause erzeugt nicht unnötig die Fehlermeldung „Baustelle blockiert“.
- Eine fertiggestellte Kammer aktiviert ihre Funktion genau einmal.

## Weiterer Plan

**Bausystem in der Konzeption zunächst abgeschlossen**: Nicht weiter in immer feinere Baumikroentscheidungen verzetteln. Als nächstes größeres Thema **Koloniewachstum: automatische Eiablage, Eierverteilung, Brutversorgung und Nachwuchs** gemeinsam planen. Die schon beschlossenen vier dauerhaften Spezialisierungen und Brutkammerzuweisungen dabei nicht erneut zur Auswahl stellen.

**Noch offen in diesem Themenfeld (für spätere Implementierung, keine blockierenden Grundsatzfragen):** konkrete UI-Gestaltung, Meldungsdauer und Statussymbole.
