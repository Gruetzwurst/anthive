# ANTHIVE – Kammerfreischaltung, Mindestgrößen und Nutzen der Fläche

**Verbindliche Entscheidungen vom 21.10.2026.** Ergänzt die bestehenden Dokumente im Ordner `planung/`. Dies ist **Planung, keine Codeänderung**.

## 1. Freischaltung von Kammerarten B – Koloniefortschritt

- **Grundlegende Kammerarten sind von Beginn an baubar.**
- **Spezielle Kammerarten** werden erst durch **Wachstum der Kolonie und Verbesserungen** freigeschaltet.
- Das setzt die bisherige Entscheidung fort, dass auch besonders harte Erdschichten zunächst durch Verbesserungen gesperrt sein können.
- Die konkrete Liste der Grund- und Spezialkammern, Schwellenwerte und Freischaltmechanismen ist **noch nicht beschlossen**.
- Bereits existierende Startkammern im Prototyp sind nicht automatisch identisch mit der späteren Liste aller baubaren Typen: Der Bestand ist vor Implementierung im aktuellen VM-Code zu prüfen.

## 2. Mindestgrößen B – funktionsabhängig

- Jede Kammerart kann eine **eigene Mindestfläche bzw. Mindestabmessung** benötigen.
- Beispielsweise darf ein einfaches Lager kleiner sein als eine Königinnen- oder besondere Brutkammer.
- Der Spieler darf weiterhin Kammern **frei und in beliebigen zusammenhängenden Formen** zeichnen (Pinsel/Rechteck), sofern die Anforderungen des gewählten Typs erfüllt werden.
- Mindestgrößen der verschiedenen Typen werden noch separat festgelegt; jetzt **keine erfundenen verbindlichen Tile-Zahlen** verwenden.
- Die Kammerfunktion wird schon beim Planen gewählt; ist eine Kammer fertig, darf ihr Typ **nicht umgewidmet** werden.

## 3. Größere Kammern B – funktionsabhängiger Flächennutzen

- **Nutzbare Kammerfläche erhöht die Kapazität ihrer jeweiligen Funktion.**
- Größere **Nahrungs- und Wasserlager** können mehr Vorräte aufnehmen.
- Größere **Brutkammern** können entsprechend mehr Brut aufnehmen.
- Für weitere Kammertypen wird der jeweilige Kapazitäts-/Funktionsnutzen später individuell festgelegt.
- **Nicht automatisch** beschlossene Zusatzboni: generelle Steigerung der Geschwindigkeit, Arbeitsleistung oder Effizienz nur durch mehr Fläche. Das war **Option C** und wurde nicht gewählt.
- Größere Kammern benötigen gemäß vorherigem Beschluss **mehr Einrichtungsmaterial**; Kosten hängen zudem vom Kammertyp ab.
- Konkrete Kapazitätsformeln und Höchstwerte sind noch **offene Balanceentscheidungen**.

## Konsequenzen für Codex – schrittweise umsetzen

1. **Vor Spielcodeänderungen** den aktuellen lokalen VM-Stand einschließlich ungesicherter Teich-/Weltarbeit mit GitHub synchronisieren.
2. **Auftrag 01 Ressourcenwirtschaft** zuerst: getrennte Lager mit individuellen Beständen und endlichen Kapazitäten modellieren; die Kammerkapazität später an den Flächenwert anbinden. Noch keine unentschiedenen endgültigen Mindestgrößen oder Forschungssysteme fest codieren.
3. Beim späteren **Nestbau-Arbeitspaket** für jeden geplanten Kammertyp konfigurierbare `minArea` und passende Kapazitätsregel definieren; Planung und UI vor Ausführung gegen diese Voraussetzungen prüfen.
4. Kammertypen mit erforderlicher Freischaltung markieren; zu Beginn nur tatsächlich freigegebene Typen zur Auswahl stellen.
5. Nur **vollständig ausgegrabene und eingerichtete** sowie erreichbare Kammern dürfen die für ihre Funktion vorgesehene Kapazität bereitstellen.
6. Bereits beschlossene FIFO-Bauwarteschlange mit vorübergehendem Überspringen blockierter Aufträge respektieren.
7. Keine umfangreiche Forschung oder Königinnenmechanik ungefragt in den ersten Ressourcenauftrag aufnehmen.

## Tests für später

- Grundkammer kann zu Spielbeginn gewählt werden; gesperrte Spezialkammer zunächst nicht.
- Spezialkammer wird nach erfüllter Freischaltbedingung verfügbar.
- Eine Kammer unter der **typspezifischen** Mindestgröße wird vor Baubeginn als ungültig erkannt.
- Eine gültige L-förmige, zusammenhängende Kammer wird nicht wegen der ungewöhnlichen Form abgelehnt.
- Größere fertige Lagerkammer hat mehr Kapazität; größere fertige Brutkammer kann mehr Brut aufnehmen.
- Zusätzliche Fläche verursacht die vorgesehenen höheren Einrichtungskosten, aber **keinen pauschalen unbegründeten Effizienzbonus**.
- Eine bloß geplante oder ausgegrabene, aber nicht eingerichtete Kammer hat noch keine nutzbare Kapazität.
- Typ einer fertiggestellten Kammer bleibt unverändert.

## Für die nächste Planung noch offen

- **Welche konkreten Kammerarten** sind Grundkammern, welche werden erst freigeschaltet?
- Welche Mindestfläche und zusätzliche Voraussetzungen erhält jede Art?
- Welche besonderen Funktionen brauchen eigene Kammern und welche gehören zu bereits bestehenden Räumen?
- Welche Verbesserungen/Fortschrittsbedingungen schalten Spezialkammern und härteren Untergrund frei?

**Dokumentiert werden ausschließlich explizite Entscheidungen; Vorschläge bleiben als solche markiert.**
