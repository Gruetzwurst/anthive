# A3 – Erwachsenenverbrauch und Mangel

Basis: `0fb3f5d` (A2), isolierter Branch `codex/a3-adult-sustenance`.
Autorität: sämtliche Dateien in `planung/`, insbesondere Startdatei und Phase-1-Entscheidungen. Nutzerfreigabe A3 und ausdrücklich 5 % Arbeiterinnenverlust pro weiterem Mangeltag ab Tag 7 (22.10.2026). Stopp vor A4.

## Umfang und Entscheidungen

Verbrauch aus tatsächlich erreichbaren betriebsbereiten Einzellagern. Nahrung/Wasser getrennt; schlechterer Faktor zählt. Eine gemeinsame Uhr für Transport, Verbrauch und Regeneration. Tatsächliche vorhandene Bevölkerung (7 Sammlerinnen, 2 Baumeisterinnen, 1 separat gezählte Königin), keine ungeprüfte Startkolonie mit 20 Arbeiterinnen. Ruhe ohne Kammer. Eiablagefaktor nur vorbereiten, keine Brut implementieren.

Zentrale vorläufige Testwerte: 1 Nahrung und Wasser je aktiver Arbeiterin/Tag; Königin separat je 1; ruhend 80 % Verbrauch; 2 Tage Warnphase, danach 85 % Arbeit/75 % Eiablage; nach 4 Tagen 65 % Arbeit/0 % Eiablage; nach 6 vollständigen Tagen 5 % Verlust/Tag. Fractionale Verluste ansammeln statt mindestens einer Toten/Tag. Königin von Arbeiterinnenverlust ausgenommen.

Ruling: Erwachsenen-Erholung testweise 1 vollständig versorgter Tag, Ruhesparen testweise 20 % — genaue Werte offen, zentral einstellbar; Risiko bei anderem gewünschten Balancing: Werte ändern. Eine kurze Lieferung verbessert Faktoren anteilig, setzt anhaltenden Mangel erst nach vollständiger Erholung zurück.

## Schritte

1. RED: Tests für tatsächlichen Verbrauch, Ruhe/Königin, getrennte Mangelstufen, Erholung, Tag-7-Schwelle und Verlustquote; danach reines AdultSupplySystem und Konfiguration implementieren.
2. RED: Leistungsfaktor, Entfernung realer Arbeiterinnen samt Ladung und integrierte Uhr/Pause testen; danach Transportsystem und Kolonieadapter ergänzen. Bestehende A2-Schnittstelle bleibt kompatibel.
3. Szene anbinden: tatsächliche Baumeisterinnen mitbilanzieren, Arbeiten verlangsamen, Verlust darstellen und Ladung am Boden erhalten, klare Mangelwarnung. Keine neue Grafik/Teichänderung, kein A4-HUD.
4. Gesamttests, bestehende Welttests und Build; Browserprüfung für Transporte, Graben und Teich. Frische unabhängige Review des gesamten A3-Diffs; wichtige Befunde mit RED→GREEN beheben. Ergebnisbericht, Commit und Sicherung des Featurebranches; Stopp vor A4.

## Review Focus

Prüfe Verbrauch nur aus nutzbaren Lagern, keine Vorabgutschrift aus Ladungen/Quellen; Verlustquote nicht bei gleichzeitigem Mangel verdoppelt; keine frühen Verluste; Königin nicht als Arbeiterin entfernen; kleine Populationen und große Zeitschritte; getrennte Erholung und kurze Lieferungen; echte Arbeitsverlangsamung und Pause; tote Trägerinnen behalten Ressourcenbilanz; keine späteren Systeme oder Grafikänderungen.

## Ausführungsprotokoll

- Vorprüfung: Branch sauber, A2 gesichert und remote vorhanden. Schnittstellen für Lagerentnahme, Uhr, Sammlerinnen und vorhandene Bauarbeiter geprüft.
