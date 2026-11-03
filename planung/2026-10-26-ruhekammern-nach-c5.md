# ANTHIVE – Ruhekammern: separater Entwicklungsschritt nach C5

**Verbindlicher Spielerbeschluss, 26.10.2026. Nur Planung, keine Codeänderung.**

## Beschlossene Regeln
- Aktive Ameisen: 100 % Nahrung und Wasser (Referenz).
- Untätige Ameisen ruhen automatisch, wenn keine geeignete Arbeit verfügbar ist; außerhalb einer Ruhekammer verbrauchen sie **80 %** Nahrung und Wasser.
- Untätige Ameisen suchen selbstständig einen **freien, erreichbaren Ruheplatz** in einer **fertig eingerichteten, betriebsbereiten** Ruhekammer.
- Wer **tatsächlich in einer betriebsbereiten Ruhekammer ruht**, verbraucht **50 %** von Nahrung und Wasser einer aktiven Ameise (also nicht 50 % von 80 %).
- Solange eine Ameise erst zum Ruheplatz unterwegs ist, gilt noch der normale Ruheverbrauch von 80 %; der zusätzliche Rabatt beginnt erst bei tatsächlicher Belegung.
- Ohne freien oder erreichbaren Platz ruhen Ameisen weiterhin außerhalb der Kammer mit 80 %.
- Sobald passende Arbeit verfügbar ist, verlassen sie die Ruhekammer, geben ihren Platz frei und kehren zu ihrer zugewiesenen Tätigkeit zurück. Spezialisierung und Spielerzuweisung bleiben unverändert.
- Ruhekammern haben endliche Plätze; bisheriger konfigurierbarer Testwert: 2 Plätze je nutzbarer Kachel, Mindestfläche 16 verbundene Kacheln. Unfertige und nicht betriebsbereite Räume bieten keine Plätze.
- Verbrauchsraten zentral konfigurierbar halten; die beschlossenen Zielwerte sind 100 / 80 / 50 %.

## Einordnung und Reihenfolge
- Ergänzung zu `planung/2026-10-21-ruhekammern-und-kammerkapazitaeten.md` und `planung/2026-10-21-ersatzarbeit-und-ruheverhalten.md`.
- B5 implementiert Raumkapazitäten, **nicht** automatische Ruheplatzbelegung; A3 implementiert Ruheverbrauch außerhalb von Kammern mit 80 %.
- **Eigenes Arbeitspaket erst NACH Abschluss und Abgleich von C5; nicht als Teil von C5 umsetzen.**
- Vor Implementierung lokalen Codex-Stand und Branches prüfen, nichts überschreiben. Bis zur ausdrücklichen Freigabe keinen Spielcode ändern.

## Anforderungen für spätere Implementierung
1. Ruhende Ameisen wählen erreichbare betriebsbereite Ruhekammern mit freien Plätzen und planen reale Laufwege; sinnvollerweise kürzeste prognostizierte Laufzeit.
2. Plätze atomar reservieren, bei Ankunft belegen und bei Weggang, Tod, Auftragswechsel, Kammerausfall oder unerreichbarem Ziel wieder freigeben; keine Doppelbelegung.
3. 50-%-Verbrauch ausschließlich bei tatsächlicher Ruheplatzbelegung, sonst 80 % beim Ruhen. Verbrauch von Nahrung und Wasser bleibt bilanziert.
4. Neue passende Arbeit unterbricht den Ruhemodus und löst Rückkehr zur Arbeit aus, ohne fachfremde automatische Zuweisung.
5. Bestehende Sammel-, Bau-, Brut-, Verkehrs- und Ressourcenfunktionen erhalten.

## Abnahmetests
- Aktive, ruhende außerhalb und ruhende in Kammern verbrauchen 100/80/50 % beider Ressourcen.
- Auf dem Hinweg zum Schlafplatz noch 80 %, nicht 50 %.
- Automatische Suche und tatsächliche Platzbelegung bei freier erreichbarer Kammer.
- Volle, unfertige, unerreichbare oder ausgefallene Ruhekammer: weiterhin Ruhen außerhalb zu 80 %.
- Mehrere Ameisen: kein Überbuchen; sichere Freigabe bei Arbeit, Tod, Unterbrechung oder Raumstatuswechsel.
- Bestehende Spielsysteme unverändert; `npm test` und `npm run build` erfolgreich.

**Status: Beschlossen und dokumentiert; Umsetzung ausdrücklich noch nicht freigegeben.**
