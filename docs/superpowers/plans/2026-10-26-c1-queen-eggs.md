# C1 – Königin und automatische Eierzuweisung

Freigabe „weiter“, Basis B6 620b6c3 sauber/per GitHub identisch. Bestätigte Nutzer-Testkonfiguration: 25 % je Spezialisierung; für volle Kammertypen vorgesehene Eier warten im Puffer, keine Fremdzuweisung. Ab 75 % Pufferfüllung halbe Rate, ab 90 % Viertelrate, voll Pause. Bestehende Werte: 5 Eier/Spieltag, Puffer 50. Alles zentral veränderbar. Maßgebliche Spec: `planung/2026-10-22-automatische-eierzuweisung-und-brutkammerverteilung.md`.

Technik: bestehende Kolonie-Uhr und A3-Eiablagefaktor verwenden. Deterministischer gewichteter Rundlauf mit Restguthaben verhindert dauerhaftes Abrunden kleiner Anteile. Bei Eiablage wird ein Zuweisungsziel vorgemerkt; Quotenänderungen gelten für künftige Eier, wartende Ziele bleiben erhalten. Zugewiesene Spezialisierung ergibt sich aus dem Kammertyp. Neue Eier zuerst in den Puffer; freie passende Kammer mit geringster Belegung (stabile ID bei Gleichstand) erhält das Ei atomar. Volle Ziele blockieren andere Spezialisierungen nicht. Ereignisweise Eiablage erhält Teilfortschritt und berücksichtigt Drosselung innerhalb großer Zeitschritte.

- [x] Tests rot: Rate/Zeitfaktor, Puffergrenzen/Drosselung, Zeitschrittgleichheit, kleine Quoten, blockierte Typen, gleiche Kammerbelegung und exakte Identitäten/Bilanz.
- [x] Reines Königinnenmodell, zentrale Testwerte, Startbrutkammer-Metadaten und Anschluss bestehender/neuer erreichbarer Kammern an die gemeinsame Koloniesimulation. Keine C2-Entwicklung, keine neuen Ressourcen-/Pflegevorgänge.
- [x] Bestehenden Gruppen-Dialog um Eierquoten und Puffer/Kammerbelegung erweitern. Keine neue Menü-/Gestaltungsstruktur. Zielanteile zusammen 100 %, validieren ohne Teiländerung.
- [x] Gezielte Integration, ein kompletter Testlauf + Weltprüfungen + Build, Browsercheck und Eigenprüfung; Bericht, Commit/Push, Stopp vor C2. Ohne zusätzliche Agenten.

Noch kein Schlüpfen, Brutpflege-, Larvenversorgungs- oder Ruhebelegungssystem. Zugewiesene Eier bleiben in C1 im Ei-Stadium; unzugewiesene Eier erhalten niemals Entwicklungsfortschritt.
