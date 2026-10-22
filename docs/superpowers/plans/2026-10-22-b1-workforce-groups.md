# B1 – Arbeitsgruppen und Zuständigkeiten

Basis: A4 `7d68cd5`, sauber und remote gesichert. Nutzerfreigabe „frei“; ausdrücklicher Testwert **50 % Leistung bei fachfremder Arbeit**. Ausschließlich B1, Stopp vor B2.

## Regeln und Entwurf

Vier unveränderliche Spezialisierungen gathering/building/care/combat; davon getrennt dauerhaft bis zur nächsten Spieleränderung zugewiesene Arbeitsgruppe (dieselben vier oder rest). Keine Einzelsteuerung: Gruppenmenge einer Spezialisierung aus einer Arbeitsgruppe in eine andere verschieben. Bestehende neun Arbeiterinnen bleiben erhalten (7 Sammel-, 2 Bauspezialistinnen), keine zusätzlichen Pflege-/Kampfameisen oder Brut. Allgemeines Ruhen bleibt ohne Kammer erlaubt und nutzt A3-Verbrauchsrabatt. Kein Savegame vorziehen: Zuweisung bleibt im laufenden Spiel bestehen.

Fachfremder Arbeitseinsatz ausschließlich explizit, mit konfigurierbaren 50 % Leistung. Automatische Sammelalternativen bleiben passende Quellen/Ressourcen/Transporte; kein eigenmächtiger Berufswechsel. Der Einsatz kann blockiert sein und trotzdem zugewiesen bleiben. Pflege/Kampf werden als mangels implementierter Aufgaben ruhend ausgewiesen, ohne spätere Systeme vorwegzunehmen.

Sichere Übergänge: Sammlerinnen nehmen nach Umteilung keine neue Ladung auf, liefern vorhandene Ladung ab und laufen über vorhandene Wege ins Nest zurück. Laufende Baumeisterinnen schließen ihren aktuellen Aushub samt Abtransport ab und beginnen danach keinen neuen. Wechsel erfolgt an derselben realen Position im Nest, ohne Teleportation oder Ladungsverlust. Ein blockierter Transport bleibt mit Ladung und ausgewiesenem ausstehendem Wechsel bestehen. Gleiche IDs und Spezialisierungen in allen Laufzeitdarstellungen.

Technik: reines WorkforceSystem für Spezialisierung/Zuweisung; createWorkforceSimulation integriert vorhandene A1–A3-Uhr, Sammler und bisherigen Baumeisteradapter. Keine parallele Ressourcenbilanz oder zweite Uhr. Materialbilanz bleibt B2. Existierende Sammlerbewegung um Auftragssperre/Rückweg und individuelle Effizienz ergänzen. Gruppen-Dialog mit nativen Auswahlfeldern/Anzahl und Übersicht; über HUD öffnen, beim Schließen Karte frei, keine Grabeingaben durch Formular. Ressourcenpanel unverändert verfügbar außerhalb des Dialogs.

## Schritte

- [x] Registry-TDD: vier Spezialisierungen, Gruppenmenge, atomare Eingabeprüfung, unveränderliche Spezialisierung, explizite Fremdzuweisung/50-%-Faktor, Tod und geschützte Snapshots.
- [x] Sammler-TDD: keine neuen Pickups nach Umteilung, bestehende Ladung real abgeben, physischer Rückweg, blockierte Rückwege und 50-%-Leistung ohne Ressourcenverlust.
- [x] Integration: Baumeisteradapter, Parken/Ruhen, sichtbare Rollenwechsel, Verbrauch und Tod genau einmal, ausstehende Wechsel/automatische passende Wiederaufnahme. Tests zuerst für echte Gruppenübergänge und Ressourcenbilanz.
- [x] Gruppenbedienung: native Mengensteuerung und Übersicht, HUD-Schalter, klare Spezialisierung/Einsatz/Ruhe/Wechselanzeige. Browser-Prüfung für echte Bedienung, sichere Ladungs-/Bauübergänge, funktionierende A4-Bedienung/Graben/Teich und kleine Querformatansicht.
- [x] Vollständige Tests, Welttests, Build, unabhängiges Review; Ergebnisbericht, Commit/Push auf Featurebranch, Stopp vor B2.

## Review Focus

Keine eigenmächtige Fremdzuweisung oder Spezialisierungsänderung; dieselben neun IDs über Wechsel/Tod; keine doppelte Erwachsenenbilanz; kein verschwundenes/dupliziertes Transportgut; blockierte Übergänge sichtbar; Rückweg tatsächlich begehbar statt Teleport; eigene/50-%-Leistung mit Mangel korrekt; begonnene Aushub-/Abraumaktionen abschließen; Ruhe ohne Kammer spart Verbrauch; UI steuert Mengen statt einzelne Ameisen; keine B2-/Brut-/Kampfimplementierung.

## Protokoll

- A4 sauber und mit GitHub synchron; Fetch ohne neue Änderungen. Aktuelle Gruppen-/Ersatzarbeits-/Ruheregeln geprüft. Nutzer hat offenen Fremdleistungswert mit 50 % beantwortet.

- Registry-Tests zunächst rot (fehlendes Modul), danach 3/3 grün. Sammler-Wechsel-/Rückweg-/Effizienztests zunächst rot (fehlende Methoden), danach 15/15 grün.
- Integrierte Gruppenübergänge zunächst rot (fehlender Adapter), danach grün. Zusätzlicher Zeitbilanz-Regressionsfall zeigte doppelte Arbeit im Übergangsintervall: zurückkehrende Sammlerin konnte im selben Zeitschritt schon Baumeisterarbeit erhalten. Test rot gesehen; Übergänge ans Intervallende verlegt, danach grün. Neue Integration umfasst auch geeignete automatische Wiederaufnahme, Ruheverbrauch, Pause, Tod und Drei-Tage-Vergleich gegen unveränderte A3-Ökonomie.
- Browser: echter Formular-Submit über WebDriver, Trägerinnenwechsel mit Ladung, neun eindeutige sichtbare IDs, fachfremde Grabarbeit exakt 50 ms je 100 ms bei normaler Versorgung, anschließende Baustofflieferung; Pflegezuweisung ruhend, Rückzuweisung und A4-Bedienung/Teich weiter funktionsfähig. Gruppen-Dialog und kleines Querformat visuell geprüft, vertikal scrollbar. Kein physischer Handytest.
- Browserharness wartete zunächst nur auf Canvas/Phaser statt fertiges HUD; bedingtes Warten bis abgeschlossene Szenenerstellung ergänzt. Kein daraus abgeleiteter Produktfehler.

- Abschließende Prüfungen: npm test 95/95, test:world 10/10, Build grün mit bekannter Chunkwarnung, Browser vollständig grün, diff --check sauber. Drei-Tage-Vergleich der nativen Ausgangsgruppen stimmt exakt mit bisheriger Ressourcenökonomie überein.
- Frisches unabhängiges Review `7d68cd5..f554d02`: keine kritischen, wichtigen oder kleinen Befunde; 95/95 und 10/10 unabhängig bestätigt. Empfehlung für spätere Testverstärkung: tatsächlichen Baumeister-Umteilungsadapter in allen Arbeitsphasen zusätzlich im Browser testen. Kein Implementierungsfehler festgestellt.
- Review-Abgrenzungen bestätigt: Live-Spiel-Zuweisung statt vorgezogenem Savegame; Bodenladungen/Materialbilanz B2, weitere Bau-/Verkehrsregeln B2–B6, Brut/Pflege/Kampf später, keine physische Handy-Zertifizierung, A4-Balancing unverändert. Keine neuen Spielregeln oder zurückgestellten Fehler.
- Ergebnisbericht abgeschlossen. Featurebranch sichern und vor B2 stoppen.
