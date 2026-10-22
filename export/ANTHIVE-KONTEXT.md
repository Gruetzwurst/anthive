# ANTHIVE – Kontext für die Weiterplanung

Stand: 21. Oktober 2026, UTC. Übergabe zur Planung am Handy.

Dieses Dokument beschreibt den lokalen Projektstand nach der Umsetzung des Teichs in Seitenansicht. **„Umgesetzt“ bedeutet im Prototyp vorhanden, nicht als endgültige Spielmechanik fertig.** Konzeptregeln, Vorschauwerte und offene Ideen sind getrennt aufgeführt. Diese Datei enthält Kontext; zum Weiterentwickeln wird zusätzlich das Projekt benötigt.

## 1. Spielidee und verbindliche Richtung

ANTHIVE soll ein mobilfreundliches 2D-Pixelart-Koloniespiel werden. Ameisen erledigen Routinearbeiten selbstständig. Der Spieler bestimmt Ziele, Prioritäten, Arbeitsverteilung und Nestentwicklung.

- **Seitenansicht wie bei Terraria**, mit Oberfläche, Erdschichten, Tunneln und Kammern. Terraria ist eine visuelle Inspiration; keine Originalgrafiken oder anderen Originalinhalte übernehmen.
- Bunte, kontrastreiche Pixelwelt. Ameisen und wichtige Zustände müssen gut erkennbar bleiben.
- **Querformat, 16:9.** Im Hochformat erscheint ein Drehhinweis; es gibt keine automatische Ausrichtungssperre.
- Zuerst Browser-Spiel, möglicherweise später eine iOS-App.
- Für den MVP sind kein Backend, Login, Multiplayer, Werbung oder kostenpflichtige Dienste vorgesehen.
- Prototypzahlen sind keine endgültige Balance. Offene Konzeptfragen dürfen nicht stillschweigend entschieden werden.

## 2. Was bereits umgesetzt ist

### Welt und Darstellung

- Generierte Startkarte: **320 × 120 Kacheln mit je 24 × 24 Pixeln**, insgesamt 7680 × 2880 Weltpixel. Die endgültige Weltgröße bleibt offen.
- 640 × 360 logische Spielfläche, im Browser unter Beibehaltung des Seitenverhältnisses skaliert.
- Verschiebbare Kamera; die Welt ist größer als der sichtbare Ausschnitt.
- Oberflächenhöhen, Gras-/Erdoberkanten und fünf Bodenschichten: Oberboden, kompakte Erde, Lehm, Steinschicht, Tiefengestein.
- Eigene Bodengrafiken werden als Phaser-Tilemap dargestellt. Varianten, Schichtübergänge, Wandkanten und Tunnel-Ecken sind eingebunden. Der gemeinsame Atlas wird beim Start aus vorhandenen PNGs zusammengesetzt.
- Oberflächenkacheln wechseln zwischen zwei freigegebenen Varianten. Eine Pixelmaske entfernt den Bildhintergrund oberhalb der Graskontur.
- Verbundenes Startnest mit Königinnenkammer, Futterlager, separatem Baustofflager und vier beschrifteten Brutkammern.
- Wald, Blumenwiesen, Berge, Baumstumpf, Ruinen, Wachturm, Wurzeln, Mineral-/Gold-/Kristallvorkommen, Pilze und Fossil sind sichtbare Dekorationen. Sie haben noch keine eigene Ressourcen- oder Gefahrenmechanik.

### Ameisen und Nahrung: sichtbare Demo

- Sieben einfache animierte Ameisen pendeln zwischen einer oberirdischen Futterquelle und dem Futterlager.
- Sichtbare Futterladung auf dem Rückweg zum Lager.
- **Das ist eine feste Demonstrationsroute, noch kein vollständiges Sammel- und Versorgungssystem.** Daraus entstehen noch keine belastbare Vorratswirtschaft, Verbrauchsrechnung oder Hungerkrise.

### Graben und Baustofftransport

- Zwei Vorschauameisen repräsentieren die Baumeistergruppe.
- Vom offenen Tunnel in den Boden ziehen erzeugt einen geraden Grabauftrag.
- Baumeisterinnen laufen flüssig über verbundene offene Tunnel zu erreichbaren Grabstellen; feste Erde wird nicht einfach durchquert.
- Nur diagonale Berührung genügt nicht für einen begehbaren Tunnel.
- Tiefere Bereiche brauchen mehr Zeit und eine höhere Test-Grabkraft. Ein Knopf schaltet vorläufige Teststufen durch; auch ein Steinbereich wird berücksichtigt.
- Eine abgebaute Kachel wird zunächst durch einen sichtbaren Erdhaufen blockiert.
- Die grabende Ameise nimmt genau diese Ladung auf. Erst dann wird die Kachel begehbar und der Weg kann weiter ausgegraben werden.
- Danach trägt sie die Ladung ins separate Baustofflager. Dessen Zähler steigt erst bei Ankunft.
- Das Lager zeigt einen großen statischen Haufen und einen veränderlichen Zähler; keine dauerhaft aufgestapelten Einzelblöcke.
- Mehrere Ameisen können arbeiten, soweit freie Wege und erreichbare Aufträge das erlauben.
- **Noch keine Zuweisungsoberfläche für Helfer aus anderen Gruppen.** Auch eine umfassende Bauwirtschaft fehlt.

### Neuester Schritt: Teich direkt in der Map

Die frühere ovale Teichdekoration vermittelte eine Vogelperspektive. Der Nutzer hat klargestellt: In dieser Seitenansicht sieht man eine Wasserfläche im Bodenschnitt, keine von oben betrachtete Uferellipse.

Jetzt umgesetzt:

- Waagerechter Wasserspiegel über die gesamte Breite.
- Stufige Bodenmulde, zur Mitte tiefer.
- Bisherige Grasdarstellung im Inneren der Mulde wird optisch überzeichnet.
- Blaues Wasser mit dunklerem Tiefenbereich, heller Oberfläche und kleinen horizontalen Lichtstreifen.
- Die umgebenden Bodentexturen bilden die sichtbaren Erdwände und den Teichboden.
- Optionaler Link `?view=pond` setzt die Startkamera direkt auf den Teich; ohne Parameter bleibt die normale Startansicht.

**Grenze:** Der Teich ist bislang ausschließlich eine Darstellung. Die zugrunde liegenden Weltkacheln werden nicht ausgehöhlt; Wasser verändert weder Kollision noch Graben oder Wegfindung. Es gibt keine Wassersimulation und noch keine Wasserentnahme.

Die separate Datei `assets/prototypes/world-tile-expansion/pond-preview.html` zeigt noch die frühere Ellipsen-/Uferkachelstudie. **Sie ist überholt und nicht das aktuelle Zielbild.** Runde Uferstücke aus Vogelperspektive werden für den seitlichen Teich nicht benötigt. Die aktuelle Teichansicht verwendet diese alte Uferkachel nicht.

## 3. Bedienung und Vorschau

- Auf Erde oder Himmel ziehen: Kamera bewegen.
- In einem offenen Tunnel beginnen und in Erde ziehen: Grabauftrag.
- „GRABKRAFT · TEST“: vorläufige Grabstufe wechseln.
- Die Vorschau im breiten Browserfenster öffnen. Bei höherem als breitem Fenster blendet die Seite das Spiel zugunsten des Querformat-Hinweises aus.
- Der Nutzer möchte Änderungen **in der vollständigen Map im Browser beurteilen**, möglichst mit Kamera direkt an der geänderten Stelle. Separate Grafikproben allein genügen dafür nicht.

Lokaler Start im Projektordner:

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Danach:

- Normale Map: `http://127.0.0.1:5173/`
- Direkt zum Teich: `http://127.0.0.1:5173/?view=pond`

**Am Handy:** `127.0.0.1` bezeichnet das Handy selbst, nicht den Entwicklungsrechner. Die obigen Links funktionieren dort nicht automatisch. Für eine Vorschau im selben Netzwerk muss Vite auf einer erreichbaren Schnittstelle laufen, z. B. `npm run dev -- --host 0.0.0.0`, und die Netzwerkadresse des Entwicklungsrechners bzw. der VM verwendet werden. VM-Netzwerk, Firewall und iPhone-Zugriff sind noch nicht verifiziert. Eine öffentliche Vorschauseite wurde in dieser Sitzung nicht veröffentlicht.

## 4. Technischer Aufbau

Stack: **TypeScript, Phaser 3.90, Vite 8.3**, npm-Lockdatei. Kein Backend. Für die Tests wird Node mit TypeScript-Stripping benötigt; zuletzt lief Node 24.22.0. Das README nennt Node 20.19+ bzw. 22.12+ für den Build, für die Weltprüfungen Node 22.12+.

| Datei/Ordner | Aufgabe |
| --- | --- |
| `src/main.ts` | Einstieg, Styles und Phaser-Start |
| `src/game/config.ts` | Spielkonfiguration, 640 × 360, Pixelart, FIT-Skalierung |
| `src/game/scenes/WorldScene.ts` | Aktive Spielszene: Darstellung, Kamera, Eingaben, Ameisen, Grabaufträge, Wege und Transport |
| `src/game/world/worldTypes.ts` | Typen für Gelände, Kachelzustände, Ressourcen, Dekoration und Landmarken |
| `src/game/world/worldGenerator.ts` | Kartengröße, Oberflächenhöhen, Bodenschichten, Startnest und Dekorationen |
| `src/game/world/worldMap.ts` | Zugriff auf die Startwelt und gemeinsame Exporte für die Szene |
| `src/game/world/terrainDefinitions.ts`, `terrainPalette.ts` | Geländeeigenschaften und Farben |
| `src/game/world/worldTileArtLayout.ts` | Auswahl von Grafikframes, Übergängen, Wänden und Ecken |
| `src/game/world/worldTileArtRenderer.ts` | Laden/Zusammensetzen der Atlanten, Tilemap und lokale Grafikupdates beim Graben |
| `src/game/world/worldSurfaceMask.ts` | Freistellen der Oberflächenpixel oberhalb des Grases |
| `src/game/world/worldDecorationRenderer.ts` | Landschaftsdekorationen einschließlich des neuen seitlichen Teichs |
| `src/game/world/pondProfile.ts` | Rein visuelles Teichprofil aus örtlichen Oberflächenhöhen |
| `assets/prototypes/world-tile-sample/` | Ursprüngliche Kachelmuster |
| `assets/prototypes/world-tile-expansion/` | Weitere Kacheln/Atlanten, Grafikproben und Entwicklungsnotizen |
| `tests/` | Welt-, Grafiklayout- und Teichprofilprüfungen |
| `docs/superpowers/` | Frühere Entwürfe und Implementierungspläne; teils historische Zwischenstände |
| `versions/` | Kopien älterer Arbeitsstände; keine aktuellen Spielmodule |
| `inbox/` | Eingebrachte Projektunterlagen |
| `export/` | Dateien zur manuellen Mitnahme; keine automatische Synchronisation |

Gelände, Kachelzustand, Ressourcen und Dekorationen sind als Daten getrennt. Kachelzustände sind `unknown`, `discovered`, `open`, `rubble`. **Die Typen allein ergeben noch keine funktionierende Aufdeckungsmechanik:** Der Untergrund ist in der Vorschau derzeit sichtbar. Viele Abläufe liegen noch gemeinsam in `WorldScene.ts`; die vollständige Trennung von Simulation, Eingabe und Darstellung ist noch nicht erreicht.

## 5. Bekannte Probleme und Grenzen

- Kein Speichern/Laden. Änderungen und Baustoffbestand bleiben nicht über einen Neustart erhalten.
- Keine spielbare Königinnen-, Eier-, Brut- oder Generationensimulation. Kammerbeschriftungen sind kein Nachweis solcher Funktionen.
- Keine echte Nahrung-/Wasserwirtschaft, Verbrauchsrechnung, Lagerkapazität oder Knappheitswarnung.
- Keine Gruppenregler, vollständigen Spezialisierungen, automatischen fremden Transporthelfer oder Fortschrittsfreischaltungen.
- Unbekannter Untergrund wird noch nicht verborgen; Erkundung und dauerhafte Aufdeckung fehlen.
- Grabkraftknopf und Tiefenbänder sind Testhilfen. Eigene endgültige Härteregeln für jede Bodenart sind nicht festgelegt.
- Der Teich ist nur optisch; Darstellung und feste Weltkacheln stimmen dort noch nicht als Simulation überein.
- Der Teich benutzt derzeit einfache farbige Pixel-Flächen. Seine gestufte Form und Anschlüsse an unterschiedlich hohe Ufer müssen noch vom Nutzer beurteilt werden.
- Dekorative Mineralien, Pilze usw. sind noch nicht abbaubar oder nutzbar.
- Mobile Gesten, Zielgrößen, Safe Areas und die Trennung zwischen Kamerawischen und Grabaufträgen brauchen Gerätetests. Kein Pinch-Zoom umgesetzt.
- Kein direktes Abbrechen/Entfernen von Grabaufträgen als fertige Bedienfunktion belegt.
- Wiederholungen und harte Anschlüsse der Bodengrafiken können auffallen; Grafikqualität ist noch Prototypstand.
- Vite meldet beim Build einen großen JavaScript-Chunk über 500 kB. Der Build gelingt; Optimierung für mobile Ladezeit ist noch offen.
- Keine verifizierte iPhone-Vorschau oder öffentliche Veröffentlichung. Eine lokale Browserprüfung ersetzt keinen Gerätetest.

## 6. Konzeptvorgaben – noch nicht fertig implementiert

Zentrale Konzeptquelle: `inbox/ANTHIVE_Gesamtdokument_Entwicklung_Codex_v3.docx`. Diese Datei fasst ältere Unterlagen zusammen. Die jüngste Teichkorrektur aus der Sitzung ergänzt sie. Bei Konflikten zwischen älteren Studien und dieser Korrektur gilt die Seitenansicht.

Im Konzept vorgesehen:

- Vier Spezialisierungen: Sammlerinnen, Baumeisterinnen, Kämpferinnen, Pflegerinnen. Spezialisierung und aktuelle Aufgabe bleiben getrennt.
- Gruppenregler verteilen vorhandene Ameisen; keine Doppelbelegung. Zuteilungen bleiben bis zur manuellen Änderung bestehen.
- Vorläufig: Nicht anderweitig zugeteilte Ameisen helfen automatisch beim Transport. Fremde Transporthelfer ersetzen keine Facharbeit.
- Nahrung und Wasser sind getrennte Vorräte. Automatische Beschaffung soll Bedarf und voraussichtliche Vorratsdauer berücksichtigen.
- Baustoff entsteht beim Graben; besondere Materialien dienen konkreten Verbesserungen statt als Universalwährung.
- Unbekannter Untergrund, beim Graben angrenzende Aufdeckung auch diagonal; genaue Reichweite offen.
- Vorläufig: Fortschritt über kumulativ erfolgreich aufgezogene Ameisen je Spezialisierung, getrennt vom aktuellen lebenden Bestand. Verluste nehmen Freischaltungen nicht zurück.
- Königin legt Eier; manuelle Zuteilung zu spezialisierten Brutkammern bestimmt die Rolle. Pflege und Entwicklung sollen gruppenbasiert ablaufen.
- Lokales automatisches Speichern/Laden, versioniertes Speicherformat, Fehlerbehandlung und kein Offline-Fortschritt.
- Nahrungsknappheit als erste echte Krise mit rechtzeitigen, handlungsorientierten Warnungen.

Der Konzept-Startbestand **1 Königin, 5 allgemeine Arbeiterinnen, 10 Nahrung, 3 Eier** ist noch nicht der tatsächlich simulierte Prototyp-Startbestand. Die sieben Futterdemo-Ameisen und zwei Baumeisterinnen sind Vorschaufiguren und keine endgültige Startbalance.

## 7. Offene Ideen und Entscheidungen

Nicht als beschlossene Implementierungsaufträge behandeln:

- Endgültige Weltgröße, Produktions-/Verbrauchsraten, Traglast, Geschwindigkeiten, Lagergrenzen und Fortschrittsschwellen.
- Exakte Gruppenaufgaben und Regler; automatische Restmenge für Transport oder eigener Transportregler?
- Vorrang direkter Befehle gegenüber Gruppenreglern und Automatik.
- Aufdeckungsradius und seine Abhängigkeit von Fortschritt, Gruppengröße oder Boden.
- Besondere Materialien, Verteilung, Baukosten und konkrete Verbesserungslinien.
- Eizuteilung/Umverteilung, Brutzeiten, Königinnenlebensdauer, Nachfolge und Vorteile neuer Nestbereiche.
- Ob und wann der optische Teich eine echte Geländemulde, Wasserquelle und Hindernis wird. Dazu ist eine eigene Spielregelentscheidung nötig; das reine Aussehen legt sie nicht fest.
- Später: Kämpfe, Wetter, Jahreszeiten, andere Insekten, Einsturz oder Überflutung. Keine dieser Mechaniken ist aktuell fertig; sie gehören nicht in den ersten Kernschritt.

## 8. Nächste Schritte für die Weiterplanung

**Unmittelbar aus der Sitzung:** Die neue Teichansicht in der vollständigen Map ansehen und Rückmeldung zu Form, Tiefe, Farbe und Übergängen geben. Es liegt noch keine abschließende Nutzerfreigabe ihres Aussehens vor. Die frühere Arbeit an runden Uferkacheln nicht fortsetzen.

**Empfohlene Reihenfolge, noch kein pauschaler Umsetzungsauftrag:**

1. Teichdarstellung nach Sichtprüfung abschließen und den aktuellen lokalen Stand auf GitHub sichern.
2. Einen nächsten Kernschritt festlegen: echte Kolonie-/Nahrungswerte mit Sammeln, Einlagern, Verbrauch und verständlichem HUD, anstelle der reinen Futterdemo.
3. Mobile Bedienung am echten Gerät prüfen und Kamera/Grabgesten zuverlässig unterscheiden.
4. Versioniertes Speichern/Laden einschließlich Weltänderungen, Aufträgen, Vorräten und späterer Aufdeckung umsetzen.
5. Aufdeckung und einfache Autonomie ergänzen; danach Spezialisierungen und Gruppenverwaltung schrittweise ausbauen.
6. Brut, Königinnen-Nachfolge und Generationen erst nach einem stabilen Kernprototyp vertiefen.

Die Reihenfolge ab Punkt 2 ist eine Planungsempfehlung aus den vorhandenen MVP-Unterlagen. Welche Aufgabe tatsächlich als Nächstes beauftragt wird, entscheidet der Nutzer.

## 9. GitHub- und Prüfstand zur Übergabe

- Projektordner: `/home/paul/Desktop/anthive`.
- Repository: https://github.com/Gruetzwurst/anthive, lokaler Branch `main`.
- Zu Beginn dieser Sitzung wurden lokaler Stand und GitHub-`main` direkt verglichen: identischer Commit `41c59b60bacf3c2bbec70295128b41d2c2059844` („Initialer Anthive-Stand“).
- **Seitdem wurden die Teicharbeiten nicht committet oder hochgeladen.** Nicht davon ausgehen, dass GitHub bereits die aktuelle Teichansicht oder diese Übergabedatei enthält. Vor einer Fortsetzung Git-Status und Remote erneut prüfen.
- Lokale Änderungen: `src/game/scenes/WorldScene.ts`, `src/game/world/worldDecorationRenderer.ts`, `assets/prototypes/world-tile-expansion/README.md`.
- Neue Dateien aus den Teicharbeiten: `src/game/world/pondProfile.ts`, `tests/pond-profile.test.mjs`, `assets/prototypes/world-tile-expansion/pond-preview.html`.
- Zusätzlich kommt diese Übergabedatei mit einer Kopie unter `export/` hinzu.
- `node_modules/` und `dist/` sind bewusst ignoriert und werden nicht hochgeladen.

Zuletzt nach der Teichänderung tatsächlich geprüft:

```sh
npm run build
node --experimental-strip-types --test tests/*.test.mjs
git diff --check
```

Build erfolgreich, alle drei Testdateien erfolgreich, keine Whitespace-Fehler. Der Build enthält die genannte Chunkgrößen-Warnung. Die Teichdarstellung wurde zusätzlich nach vollständigem Laden in Firefox per Bildschirmaufnahme geprüft. Keine iPhone-Prüfung und keine umfassenden Tests aller Ameisenabläufe behaupten. `npm run test:world` prüft allein die Weltgrundlage, nicht sämtliche Testdateien.

## 10. Starttext für einen neuen Planungschat am Handy

> Wir planen ANTHIVE weiter: ein mobiles 2D-Pixelart-Ameisenkoloniespiel in Terraria-inspirierter Seitenansicht und 16:9-Querformat. Bitte lies diese Übergabe und trenne implementierten Prototyp, Konzeptvorgaben und offene Ideen. Der lokale Prototyp hat eine große Kachelwelt, Kamera, Nestkammern, Futtertransportdemo sowie Graben mit Erdhaufen und tatsächlichem Baustofftransport. Neu ist ein rein optischer Teich im seitlichen Bodenschnitt mit waagerechtem Wasser und stufigem Grund. Die alte ovale Teichstudie ist verworfen. Speichern, echte Versorgung, Aufdeckung, Spezialisierungen und Brut fehlen noch. Die jüngsten Teichänderungen liegen lokal und sind noch nicht auf GitHub. Ich möchte zunächst weiterplanen; offene Balancewerte nicht endgültig festlegen und keine Funktionen als fertig annehmen, nur weil sie im Konzept stehen.
