# B2 – Materialbilanz und Grablogik

Basis B1 `33fbed1`, sauber und remote gesichert, Freigabe „frei“. Stopp vor B3.
Autorität: Startplan, Testwerte Baumaterialgewinn/Grabdauer/Basisgrabzeit, Transport bei voller Ladung und Abraumpriorität. Neu: Nutzer wünscht für Tiefengestein je höchster + niedrigster bekannter Wert; als 30+6=36 s und 4+1=5 Material ausdrücklich zurückgespiegelt.

## Umfang und Regeln

Zentrale Werte: lockere Erde 6 s/1 Material, kompakte Erde 12/2, Lehm 18/3, Stein 30/4, Tiefengestein 36/5. Vorhandene tiefen-/steinabhängige Grabkraft-Freischaltungen bleiben getrennt. Traglast 5, volle Ladung abliefern; Teilladung am Ende/blockierten Auftrag oder vor Gruppenwechsel abwickeln. Material entsteht genau einmal bei tatsächlicher Entfernung einer Kachel.

Konkrete Bilanz Boden + getragen + individuelle A1-Lager + verbraucht = Anfangsbestand + tatsächlicher Ertrag. Kein alter separater Baustoffzähler. A1-Lagerkapazitäten und Entnahme-/Einlagerungsfunktionen wiederverwenden. Verbrauchs-API für die Bilanz, keine vorgezogene Einrichtung oder Kostenlogik.

Volles Lager stoppt Grabung nicht: neuer Überschuss bleibt als nicht blockierende Menge am Grabungsort. Alte Haufen erst nach ausführbaren Grabaufträgen abholen. Gesperrte/unerreichbare Aufträge verhindern Abholung nicht. Bei Lagerwechsel/Teilannahme Ladungsreste behalten. Vorhandene Ladung bei Umteilung erst sicher abliefern; blockiert verbleibt der Wechsel ausstehend. Bei Tod getragenes Material am tatsächlichen Ort ablegen, Reservierung freigeben.

## Technische Umsetzung

Vorhandene Grabarbeit aus der Phaser-Szene in testbares ExcavationSystem übertragen, dieselben Kacheln, kardinale Pfadsuche, Grabkraft und linearen Aufträge verwenden. Alte Material-/Bauakteur-Implementierung danach entfernen. BuildingMaterialSystem führt Boden/Träger/Verbrauch und benutzt ausschließlich bestehende ResourceSystem-Lager. Eine Uhr über bestehenden Workforce-Baumeisteradapter; individuelle B1-Effizienz und A3-Mangel wirken weiter. Ruhend und bereit zum Gruppenwechsel unterscheiden, damit blockierte Ladungen nicht verschwinden.

Rendering liest Modelle: Baumeisterposition/Ladung, Mengenhaufen ohne Wegsperre, Lagergrafik nur bei echtem Bestand und HUD mit realer Kapazität. Bestehender Grabstrich und Grabkraft-Testschalter bleiben. Keine neuen Bauwerkzeuge, Einrichtungs-/FIFO-Statusoberfläche, Kammern oder Brut.

## Schritte

- [x] Materialbilanz TDD: reale Produktion, begrenzte Aufnahme, Teilannahme, falsche Lager, Verbraucher, Trägerverlust, Kopien und Massenerhaltung.
- [x] Grabarbeit TDD: Zeiten/Erträge/Freischaltung, genau einmal, volle/Teilladung, volles Lager und nicht blockierende Haufen, Nachrang alter Haufen, blockierte Pfade, mehrere Arbeiter, Tod/Umteilung und konservierte Ressourcen.
- [x] Vorhandene Szene und B1-Adapter mit Modell verbinden, alte Zähler/Materialjobs entfernen; HUD/Renderer echte Mengen. A4-/B1-Prüfungen zielgerichtet auf aktuelle Datenquellen anpassen.
- [x] Gesamttests, Welttests, Build, Browser (reales Graben/Liefern, volle Lager/Haufen, Umteilung während Arbeitsphasen, 50 % und bestehende Bedienung/Teich), unabhängiges Review, Bericht, Commit/Push. Stopp vor B3.

## Review Focus

Massenerhaltung in Boden/Träger/Lager/Verbrauch bei Teilannahme, Tod und Rollenwechsel; kein Ertrag vor Kachelentfernung oder mehrfach pro Kachel; echte Laufwege/Ankunft; 5er-Limit und 4er-Teilladung; Graben trotz vollem/unerreichbarem Lager und ungehinderte offene Kachel; Vorrang ausführbarer Grabung vor altem Abraum; gesperrte Aufträge lassen Aufräumen zu; B1-Ruhe/Wechsel ohne Verlust oder doppelte Erwachsenenbilanz; dieselbe Uhr und 50-%-Leistung; keine B3/B4-Systeme.

## Protokoll

- B1 sauber und mit GitHub synchron, Fetch ohne neue Änderungen. Material-/Transportplanung einschließlich neuester Abraum-Priorität eingelesen. Tiefengestein-Testwerte vom Nutzer abgeleitet und vor Umsetzung zurückgespiegelt.

- Materialmodell und Grabsystem jeweils erst mit fehlenden Modulen rot, anschließend grün. Adapter-Fabrik und sichere Umteilung mit echten Grabjobs rot → grün. Zusätzliche bestehende Randfälle: zweites Lager bei zwischenzeitlich vollem Ziellager und kombinierte Mangel-/Fremdleistungsfaktoren mit großem/gerahmtem Zeitschritt.
- Zwischenstand: 114/114 Gesamttests, 10/10 Welttests und Build grün. Zwei zusätzliche Randfalltests ebenfalls grün (116 insgesamt erwartet). Browser: erster neuer Voll-Lager-Test zeigte nur offene Kammern als Ziel; Testkoordinaten anhand tatsächlicher Welt geprüft und auf feste Erde korrigiert. Kein Produktcode dafür verändert.

- Unabhängiges Gesamt-Review `33fbed1..83270b1`: ein wichtiger Befund, keine kritischen/kleinen und keine ausgesparten Designentscheidungen. Sinkende Test-Grabkraft hält bereits laufende, nun gesperrte Jobs fest. Regression zuerst rot reproduziert; Korrektur gibt Job/Reservierung frei und bewahrt den wartenden Auftrag, sodass andere Arbeit, Abraum und Gruppenwechsel möglich werden.

- Final: fixed Grabkraft-Absenkung hält aktiven Job fest — Regression „lowering test grade releases blocked active digging for executable work, cleanup and reassignment“ RED→GREEN; suite 117/117, Welt 10/10, Build und Diffcheck grün. Auftrag bleibt erhalten. Keine Minor-Befunde und keine Rulings.
- Browserbilanz tatsächlich bestätigt: Produktion 5 = Lager 2 + Boden 3 bei vollem Lager; danach Produktion 5 = Lager 3 + Verbrauch 2, Boden/getragen 0. Anschließende Touch-Dialog-Zustandsprüfung schwankte unter Last; Harness wartet nun auf beobachtbaren offenen Dialog. Vollständiger Schlusslauf folgt.

- Touch-Diagnose: Desktop-Firefox hatte `inputTouch=false` (Manager null), DOM-Touches erreichten Phaser nicht. Reine Zustandswartezeit behebt das nicht. Isoliertes Browserprofil jetzt mit `dom.w3c_touch_events.enabled=1` und `dom.maxtouchpoints.testing.value=1` vor Boot; gezielter Lauf zeigt echte Phaser-Touchunterstützung und beide Bedienungen erfolgreich. Gesamtharness prüft dies ausdrücklich. Keine Produktänderung und keine neue Designentscheidung.

- Abschluss: 117/117 Tests, 10/10 Welttests, Build und Diffcheck erfolgreich. Vollständiger Firefox-Lauf mit echter Touch-Erkennung/-Verarbeitung erfolgreich: A4/B1/B2, Vorräte, Bilanz, Voll-Lager-Weitergrabung, Bodenabholung, Gruppen, 50 % und Teich. Aktuelle Teich-/Querformat-Screenshots visuell geprüft. Reviewbefund mit rotem Regressionstest behoben; keine offenen Befunde. Stopppunkt B3 bleibt bestehen.
