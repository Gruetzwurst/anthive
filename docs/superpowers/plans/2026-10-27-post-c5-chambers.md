# Post-C5 – Bauvorlagen, Ruheplätze, Kammerdarstellung

Nutzerfreigabe 27.10.2026: Umsetzung der empfohlenen drei Pakete vor D1.
Verbindliche Spezifikation: GitHub planung/2026-10-26-kammervorlagen-klein-mittel-gross-und-freies-bauen.md,
2026-10-26-ruhekammern-nach-c5.md und 2026-10-26-visueller-kammerstil-und-offene-baugrenzen.md.
Bestehende lokale C5-Arbeit erhalten; kein Push/Merge. Native bestehende Oberfläche
und Renderer verwenden, keine neuen Bildassets/Abhängigkeiten.

- [x] Bauvorlagen: Quadrat 4/6/8 für Lager/Ruhe, 5/7/9 Brut, Frei unverändert;
  maximale 128/162 Zellen; Chebyshev-Abstand >=3 zwischen Funktionskammerflächen.
  Einzige Validierung für Vorschau und addOrder, Konﬂiktzellen sichtbar, alte Räume erhalten.
  Kosten und Kapazität bestehend, Bestätigen als einziger Auftragsauslöser.
- [x] Ruheplätze: eigene Zustandsverwaltung mit tatsächlichen Wegen/Reservierungen;
  Adapter liefert betriebsbereite Kammern; bestehende Arbeitsengines bleiben Eigentümer
  der Ameisen. Freigabe bei Arbeit/Tod/Ausfall, 100/80/50-Verbrauch erst bei Ankunft.
- [x] Einrichtung: modularer Renderer, tatsächliche bereits installierte Einheiten pro
  Zelle, keine Fortschritte durch reine Renderzeit, natürliche dezente Boden-/Randdetails.
  Leere Grundausstattung enthält keine erfundenen Ressourcen oder Brut.
- [x] Tests zuerst rot, fokussierte Checks, Browserprüfung mit vorhandener Umgebung,
  vollständige Suite einschließlich C5, Welttests, Build und unabhängige Schlussprüfung.

Umsetzung: Aufgaben mit klar getrennten Dateien nach Superpowers delegieren;
Integration und Bauvorlagen durch Hauptagent. Ein gemeinsames Schlussreview.
Technische Entscheidungen: Vorlagen ankern an der oberen linken Zeigerkachel;
Formen verwenden dieselbe FIFO-Engine. Ruheplätze sind deterministische Punkte
innerhalb der tatsächlichen Raumzellen, keine zweite Ameisenpopulation.
