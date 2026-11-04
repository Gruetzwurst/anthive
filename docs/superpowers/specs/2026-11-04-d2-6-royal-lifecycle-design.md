# D2.6 – Aufzucht und mehrere Königinnen

Freigabe: Nutzer möchte D2.6 jetzt im Spiel testen. Bestätigte Werte: normale
Brut6 Minuten, königliche Brut12 Minuten (2/6/4),2 Pflegeplätze, zusätzliche
Freischaltung50 neben150/500/1000 (insgesamt2/3/4/5 Königinnen).

Ansatz: vorhandene QueenSystem-Ereignisachse erweitern, damit Pflege und reale
Larvenvorräte genau einmal gemeinsam verrechnet werden. Eigene QueenSystem-
Instanzen würden gemeinsame Pflege/Versorgung mehrfach verrechnen oder eine
zusätzliche Koordination brauchen. Deshalb persistente zusätzliche Quellköniginnen
mit eigenem Fortschritt, Verteilguthaben und logisch getrenntem Eierpuffer im
bestehenden System. Normale Eier behalten globale eindeutige IDs und speichern
zusätzlich ihre Quellkönigin. Gemeinsame Spielerquoten bleiben erhalten.

RoyalBroodSystem verwaltet weiterhin genau ein besonderes Ei je eingerichteter
Kammer; nach Ankunft entwickeln sich Ei/Larve/Puppe dort. Jede Phase benötigt
Pflege, ohne Pflege Stillstand; Larven benötigen doppelte tägliche Nahrung/
Wassermenge, physisch geliefert. Keine königliche Brutsterblichkeit, bei fehlendem
Larvenvorrat Pause. Normalbrut behält bisherige Mangelregeln. Erwachsene Königin
bleibt am Kammerplatz, zählt zur Bevölkerung/Erwachsenenversorgung und legt dort
alle120 Sekunden unter bestehenden Puffer-/Versorgungsregeln. Unerreichbare
Kammer pausiert Entwicklung und dortige Eiablage; keine neue Todesregel.

Schema8 mit expliziter Migration1–7, unveränderten Originalschutzregeln,
strikten Querverweisen zwischen Erwachsenen, königlicher Brut und Kammern.
Darstellung: vorhandene Raumstatusanzeige um Entwicklungsphase/Fortschritt und
aktive Königin erweitern, königliche Phasen und erwachsene Königin sichtbar.
Keine neue Bedienung oder Testbeschleunigung im eigentlichen Spiel.
