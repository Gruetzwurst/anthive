# Sichtbare Königin, Brut und echte Eiertransporte

Nutzerauftrag als Zwischenschritt vor C4, keine Zeitbeschleunigung. Basis C3 201b0c4, sauber/per GitHub identisch. Ausdrücklich bestätigt: automatische Brutplatzreservierung nach Quoten, echte Abholung durch Pflegekräfte bei der Königin, Entwicklung erst nach Ablieferung; ohne Pflegekraft sichtbare Eier bei der Königin.

- [x] QueenSystem: reservierte, abgeholte und angelieferte Eier unterscheidbar; keine doppelte Vergabe, keine Entwicklung unterwegs, Tod/Abbruch bewahrt Ei am tatsächlichen Ort.
- [x] Vorhandene Pflege-Engine um Eierabholung/-ablage erweitern, gleiche Wege und Verkehr. Offener Larven-Nachschub hat Vorrang vor neuen Eierfahrten, laufende Arbeit bleibt erhalten. Rohe Modelltests behalten direkte Zuweisung, vollständiges Spiel benutzt echte Transporte.
- [x] Phaser-Darstellung: sichtbare größere Königin, Ablagebewegung, einzelne Eier/Larven/Puppen auf tatsächlichen Kammerkacheln; weiße Eierladung an tatsächlicher Pflegerin, bestehende Nahrung-/Wasserladung und Versorgung am Ziel sichtbar. Kleine Zeitanzeige bis zum nächsten Ei; keine vorgetäuschte Startbrut.
- [x] Gezielte Modell-/Transporttests rot→grün, vorhandene Tests/Build einmal vollständig und Browserprüfung echter Abholung/Ankunft/Darstellung; Bericht, Commit/Push, Stopp vor C4.

Bestehende Grafikstilmittel (Phaser Graphics/Ellipsen) wiederverwenden, keine externe Bildgenerierung oder separate Designplattform. Keine geänderten Tages-/Stadienzeiten. Reservierte/unterwegs befindliche Eier bleiben bis Ankunft Teil des begrenzten Puffers; Kammerreservierung verhindert Überfüllung. Pflegekräfte tragen ein Ei pro Fahrt als technische Anfangsumsetzung. Fallen gelassene Eier bleiben individuell auffindbar. Numerische historische Testfixtures können Transport explizit ausschalten, das Spiel nicht.
