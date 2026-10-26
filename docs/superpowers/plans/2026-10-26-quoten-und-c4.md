# Proportionale Brutquoten und C4 – Implementierungsplan

**Ziel:** Prozentbearbeitung ohne Kopfrechnen; tatsächlichen Larvenmangel mit Warnung, Bremse, Erholung und bestätigten Verlust-Testwerten integrieren.
**Basis:** 46ed96f, lokaler Stand und GitHub identisch (0/0), sauber. Eigener Branch codex/c4-brood-shortage; bestehende Grafik bleibt erhalten.
**Freigabe:** Nutzer bittet um Quotenänderung und Fortsetzung C4. Testwerte bestätigt: schwere Deckung <25 %, Verluste nach sechs vollen schweren Tagen mit 5 %/Tag anteilig angesammelt.
**Architektur:** Kleine reine Quotenfunktion, bestehender nativer Dialog. Eigener Mangelzustand je Brutkammer; reale Bestände bleiben ausschließlich in BroodSupplySystem. Gemeinsame Ereigniszeitachse in QueenSystem, nur Larven erhalten MIN(Pflege, Ressourcen). Keine neue Uhr, keine späteren Systeme.

- [x] Quoten: Tests für proportionale Restverteilung, Nullgruppen, Rundung/exakt 100 %, Alleinanteil und ungültige Eingaben zuerst rot; Helfer implementieren und Dialog anschließen. Bearbeitetes Feld bleibt maßgeblich; zwei Dezimalstellen, größte Reste verteilen Rundung. Falls alle anderen null: Rest gleichmäßig auf sie verteilen. Änderungen wirken nach Übernehmen auf neue Eier.
- [x] C4: Reinen Mangelzustand mit Tests für Warnphase, getrennte Ressourcen, Mindesttempo, unterbrochenen schweren Mangel, sanfte Erholung und fraktionale Verluste entwickeln. Kurze Vollversorgung baut Mangelzeit über einen vollen Spieltag ab statt sofort zurückzusetzen; sechs volle schwere Tage bleiben Voraussetzung für Verluste; kurze Entlastungen pausieren die Historie, ein voller Tag ohne schweren Mangel setzt sie zurück.
- [x] Integration: Verbrauchsintervalle an Vorratsende/Warnphase/Erholung/Verlustereignissen teilen; Entwicklungsfortschritt über MIN integrieren. Verluste entfernen nur lebende Larven, geben Kapazität frei und bleiben bilanziert. Eier/Puppen bleiben ressourcenunabhängig. Große/kleine Zeitschritte vergleichen.
- [x] UI: Mangeldauer, Ressourcenfaktor, Gesamttempo und Brutverluste pro Kammer anzeigen; vorhandene Grafik blendet verlorene Larven aus.
- [x] Gezielte Tests während Umsetzung; abschließend vollständige Tests, Weltprüfung, Build und gezielter Browserlauf. Eigenprüfung ohne Zusatzagenten. Ergebnis dokumentieren, committen und Entwicklungsbranch pushen. Vor C5 stoppen.

**Prüffokus:** Nullanteile und 100%-Sonderfall; Rundung; Pflege allein ohne Verluste; Ressourcenbilanzen bei Stadienwechsel/Verlust; Großschritte und Erholung ohne doppelten Fortschritt. Alle Balancewerte zentral konfigurierbar.

**Ergebnis:** 225/225 Tests, 10/10 Weltprüfungen, Build und gezielter Firefoxlauf erfolgreich. Details: docs/C4-LARVENMANGEL-ERGEBNIS.md.
