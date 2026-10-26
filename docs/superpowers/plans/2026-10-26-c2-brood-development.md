# C2 – Brutentwicklung und Pflege

Freigabe „frei“, Basis C1 2590169 sauber und mit GitHub identisch. Maßgeblich: `planung/2026-10-22-testwerte-brutphasen-und-pflegemangel.md` und zentrale Reihenfolge C2. Sparsame Inline-Arbeit ohne Zusatzagenten, Stopp vor C3.

Beschlossen: Ei/Larve/Puppe 1/3/2 Spieltage, 10 zugewiesene Bruttiere/Pflegerin, Faktor clamp(Pflegekapazität/Brut, .25, 1). Kein Tod allein wegen Pflegemangel. C1-Quoten/Puffer erhalten. Provisorischer gemeinsamer Pflegepool gemäß Planungsdatei, noch keine räumliche Pflegeaufteilung/Versorgungstransporte. Nur abgeschlossene Arbeitswechsel und tatsächlicher Pflegeeinsatz zählen; 50 % Fremdleistung und vorhandene Erwachsenen-Arbeitsleistung beeinflussen verfügbare Pflegekapazität. Keine direkte zusätzliche Multiplikation des Entwicklungsfaktors.

Technik: vorhandenes QueenSystem um individuelle Stadien und einmalige Geburtsereignisse erweitern; Ereignisschritte für Eiablage und Stadiengrenzen, damit neue Eier keine Zeit vor ihrer Zuweisung erhalten und große Schritte korrekt bleiben. Erwachsene geben Brutplätze frei; Puffer wird atomar nachgezogen. Unzugewiesene Eier entwickeln sich nicht. Unzugängliche Räume bewahren Brut/Fortschritt, pausieren Entwicklung bis Erreichbarkeit. Das betrifft bislang keinen regulären Abriss-/Einsturzfall.

- [x] Tests rot: Stadien/Zeiten, 100/75/50/25-%-Pflege, keine Mortalität/Überpflege, kleine/große Schritte, neue Zuweisungen und einmalige Geburt/Platzfreigabe.
- [x] QueenSystem und zentrale BROOD_CONFIG erweitern; C1-Prüfungen auf bewusst neue Entwicklungs-/Geburtsbilanz anpassen.
- [x] Geburten mit vorhandener Workforce/Transport-/Bau-Engine verbinden; native Spezialisierung, reale Kammerposition, individuelle Darstellung und Erwachsenenverbrauch. Pflege nur für tatsächlich verfügbare Kräfte.
- [x] Gruppenanzeige um Stadien/Pflege ergänzen. Gezielte Integration, ein voller Testlauf + Weltprüfungen + Build und gezielter Browsercheck. Bericht, Commit/Push; Stopp vor C3.

Larvenressourcen und Nachschub bleiben C3, Ressourcenmangel/Minimum-Kombination C4. Keine fiktiven Futtermengen oder provisorische Ressourcenverluste ergänzen.
