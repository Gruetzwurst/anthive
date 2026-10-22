# ANTHIVE – Baumaterialgewinn und Abraum bei vollem Lager

**Entscheidungen vom 22.10.2026.** Ergänzung zu den übrigen Dokumenten in `planung/`. Dieses Dokument unterscheidet **vorläufige Testzahlen** von **verbindlichen Spielmechaniken**. Es verändert keinen Spielcode.

## A. Vorläufige Testwerte – Baumaterialgewinn B

Der Ertrag von **einer tatsächlich ausgegrabenen Kachel** unterscheidet sich nach Erdmaterial:

| Erdmaterial | Vorläufiger Ertrag an verwertbarem Baumaterial pro Kachel |
|---|---:|
| Lockere Erde | 1 Einheit |
| Kompakte Erde | 2 Einheiten |
| Lehm | 3 Einheiten |
| Stein | 4 Einheiten |

- **Dies sind ausschließlich konfigurierbare Testwerte**, keine endgültig festgelegten Balancezahlen. Die grundsätzliche Unterscheidung des Ertrags nach Materialart ist die gewählte Variante B.
- Für die tiefste Gesteinsschicht liegt **noch kein konkreter Ertragswert** vor. Nicht unbegründet auf 4 setzen oder eine neue Materialart erfinden; vorhandene Terrain-Definitionen prüfen und spätere Abstimmung ermöglichen.
- Material entsteht ausschließlich beim **realen Abbau**, nicht bereits beim Eintragen eines Bauplans oder beim erneuten Laden.
- Falls eine ausgegrabene Kachel mehr als einen Grabfortschrittsschritt benötigt, wird die Ressource **nur einmal** je tatsächlich entferntem Feld erzeugt. Testen gegen Doppelbuchungen.
- Bereits ausgewählte, konfigurierbare Grabzeit-Multiplikatoren: lockere Erde 1×, kompakte Erde 2×, Lehm 3×, Stein 5×. Eine absolute Grabzeit je Referenzkachel fehlt noch.

## B. Verbindliche Spielregel – volles Baumateriallager B

- Ist das passende **Baumateriallager voll**, geht beim Weitergraben entstehendes überschüssiges Material **nicht verloren** und wird auch **nicht kostenlos eingelagert**.
- Das Material bleibt **als Abraum/Material am Grabungsort** liegen, bis Ameisen es später aufnehmen und in ein Baumateriallager transportieren können.
- **Graben darf trotz vollem Baumateriallager weitergehen**, soweit andere Voraussetzungen erfüllt sind.
- Der gelagerte Abraum muss im Weltzustand als konkrete, nachverfolgbare Menge erhalten bleiben, nicht durch beliebig oft wiederholbare Interaktionen duplizierbar sein.
- Abraum soll **Transportwege nicht unbeabsichtigt blockieren**. Ob und wie sichtbare Materialhaufen dargestellt werden, ist noch eine technische/UI-Frage.
- Sobald wieder Kapazität frei ist, kann der liegengebliebene Abraum später abgeholt werden. Seine genaue Abhol-Priorität ist noch offen.
- Die bestehende Unterscheidung zwischen Lagerbestand (mit Kapazitätsgrenze), Material unterwegs und Material am Grabungsort muss erhalten bleiben.

## C. Verhältnis zu bisherigen Entscheidungen

- Baumaterial kommt primär aus Grabungen; Materiallagerkammern sind endlich und können mehrfach gebaut werden.
- Der Spieler gestaltet frei zusammenhängende Kammerformen mit Pinsel/Rechteck, wählt den Kammertyp bei Planung, Baumeisterinnen graben autonom.
- Die Kammer wird erst **nach Aushub UND Einrichtung** mit Baumaterial funktionsfähig.
- Bereits ausgewählte **veränderbare Einrichtungs-Testwerte**: Lager jeder Art 2 Baumaterial/Kachel, Brutkammern 3/Kachel, Ruhekammern 2/Kachel.
- Eine unfertige Kammer bietet noch keine nutzbare Lagerkapazität; Abraum neben ihr ist keine gültige Einlagerung.
- Aufträge werden grundsätzlich FIFO bearbeitet; blockierte Aufträge dürfen vorübergehend übersprungen werden; Abbruch erhält bereits ausgehobene Flächen und unverbrauchtes Material.
- Tiefere/härtere Materialien können besondere Freischaltungen erfordern; diese gelten weiterhin unabhängig vom Materialertrag.

## D. Codex: Umsetzung in Stufen

1. **Vor Codeänderungen lokalen VM-Stand mit GitHub abgleichen**; lokale Teich-/Weltänderungen nicht überschreiben.
2. Erst bereits priorisierten Ressourcen-Unterbau aus Auftrag 01 der übergeordneten Planungsdatei implementieren.
3. Vorhandene Grab- und Aushubmechanik wiederverwenden und den konfigurierbaren Ertrag pro Terrain-Art integrieren, **nicht** durch eine konkurrierende zweite Materiallogik ersetzen.
4. Die Materialmenge einer entfernten Kachel sauber im Zustand verbuchen: Lagerbestand erst nach Lieferung, andernfalls als getragenes oder am Aushubort liegendes Material.
5. Bei vollem Baumateriallager kann weiter gegraben werden; überschüssiges Material verbleibt am Ort und wird später abholbar.
6. Transport, freie Lagerkapazität, Lagerwechsel und Unterbrechung **ohne Ressourcenverdopplung oder Verlust** testen.
7. Lege weder einen festen Ertrag für die tiefste Felsschicht noch Abhol-Prioritäten oder zusätzliche Hinderniseffekte als fertige Beschlüsse fest.

## E. Akzeptanztests

- Abbau einer Kachel lockerer Erde erzeugt 1, kompakter Erde 2, Lehm 3, Stein 4 Materialeinheiten (konfigurierbare Testwerte).
- Mehrfache Updates/fortgesetztes Graben derselben Kachel erzeugen nicht mehrmals denselben Ertrag.
- Volles Baumateriallager: Grabung geht weiter, kein Überfüllen und kein Löschen des überschüssigen Materials.
- Überschüssige Menge bleibt am Grabungsort und kann nach Freiwerden von Lagerplatz abgeholt werden.
- Teilweise freie Lagerkapazität: nur tatsächlich verfügbare Menge wird eingelagert, Rest bleibt erhalten.
- Material auf dem Boden wird nicht zusätzlich als Lagerbestand mitgezählt.
- Ausgrabung, Materialtransport und Einrichtungskosten sind getrennte Zustandsänderungen; kein doppelter Verbrauch.
- Keine künstliche Blockade von Gehwegen allein durch gelagerten Abraum, sofern nicht später ausdrücklich so entschieden.

## F. Für die nächste Planung offen

- **Absolute Basis-Grabzeit** einer Baumeisterin für eine Kachel lockerer Erde (Testwert).
- **Tragmenge und Transportverhalten** von Baumeisterinnen bzw. Transportameisen.
- Wann zurückgelassener Abraum bevorzugt abgeholt werden soll.
- Umgang mit Bodenmaterial der tiefsten Schicht.

**Status: Nutzerentscheidung dokumentiert; Spielcode unverändert.**
