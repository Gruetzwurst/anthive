# C3 – Echte Larvenversorgung

Freigabe „mit c3 weiter“. Basis C2 82acea6 sauber, mit GitHub identisch. Spec: `planung/2026-10-22-larvenverbrauch-und-brutkammer-vorraete.md`, neuere `2026-10-22-testwerte-brutkammer-vorrat-nachfuellen-und-tragmenge.md` und zentrale Reihenfolge C3. Keine Zusatzagenten.

Bestätigt: je Larve/Spieltag .5 Nahrung und .5 Wasser; Zielvorrat 2 Tage, Nachfüllung bei <=50 %, maximal 5 Einheiten einer Ressource/Fahrt. Bestehende Lager, Kardinalnavigation, Verkehrszeiten, Gruppen, Effizienz und Uhr verwenden. Kein allgemeines Lager in Brutkammern.

Technische Auslegung: harter Kammerhöchstbestand aus maximalen Brutplätzen × Verbrauch × 2 Tage; dynamischer Nachfüllzielbestand aus aktuellen Larven. Sinkende Larvenzahl vernichtet keine Bestände; ohne Larven keine neue Bestellung. Nachfüllauftrag läuft nach Auslösen bis zum Ziel, Reservierungen verhindern Doppelbestellung. Vorrang für geringste Reichweite, dann tatsächliche erwartete Laufzeit/stabile IDs. Fütterungstransporte sind Pflegearbeit innerhalb des vorläufigen C2-Pflegepools, keine zweite gleichzeitige fremde Aufgabe.

- [x] Tests rot: tatsächliche Entnahme/Ankunft, Larvenverbrauch, 50%-Nachfüllung, mehrere Pflegerinnen/Reservierungen, schrumpfender Bedarf, blockierte/leere Lager, Gruppenwechsel und Ladungsverlustschutz.
- [x] Eigenes begrenztes Brutvorrats-/Transportmodell an bestehendes ResourceSystem/Navigation anschließen, keine zusätzliche Uhr. Verbrauch an tatsächlichen Larvenintervallen der Queen-Zeitachse abrechnen. Fehlmengen erfassen, Folgen erst C4.
- [x] Pflege-Engine in bestehende Workforce integrieren, reale Positionen/Ladungen, sicherer Wechsel/Tod, gemeinsamer Verkehr; Gruppenanzeige um Bestand/Ziel/Fehlbedarf erweitern.
- [x] Gezielte Integration, ein vollständiger Testlauf + Weltprüfungen + Build und gezielter Browsercheck; Eigenprüfung, Bericht, Commit/Push. Stopp vor C4.

Quelllager sinkt nur bei tatsächlicher Aufnahme, Kammer steigt erst bei Ablieferung. Geladene Reste bleiben erhalten oder werden tatsächlich zurückgebracht; Tod legt reale Ladung am Ort ab. Bilanz intern: entnommen = Kammerbestand + getragen + verbraucht + abgelegt + zurückgeliefert. C4-Mangelbremse, Erholung und Mortalität nicht vorziehen.
