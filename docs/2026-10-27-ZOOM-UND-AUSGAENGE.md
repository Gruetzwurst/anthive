# Zoom und zusätzliche Ausgänge – 27.10.2026

Nutzerauftrag: mehr Übersicht durch Herauszoomen und zusätzliche Tunnel bis
nach draußen, keine Funktionskammern an der Oberfläche.

- Minus/Plus unten rechts, Mausrad über der Karte; 35–150 % Zoom.
  Prozentanzeige anklicken setzt 100 % zurück. Zoom hält den Kartenausschnitt
  am Zeiger (innerhalb eines Pixels wegen Pixelgrafikrundung); Kartenziehen
  berücksichtigt den Zoom. HUD/Bedienelemente bleiben über eine eigene Kamera
  unverändert groß. Auch neu erzeugte Weltobjekte sind der Weltkamera zugeordnet.
- Tunnel dürfen die Grasoberfläche durchbrechen und an begehbare oberirdische
  Luftkacheln anschließen. Oberflächenboden verwendet die bestehenden Oberboden-
  Grabzeiten und Materialausbeute. Bereits freie Luft wird nicht ausgegraben oder
  mit neuem Material gefüllt. Nicht gestützte Luft bleibt ungültig.
- Nur Tunnel erhalten diese Ausnahme. Funktionskammern bleiben unterirdisch;
  bestehende Abstands-/Flächenregeln gelten weiter. Die vorhandene Grab-,
  Transport-, Gelände- und Wegfindungslogik bleibt zuständig.

Prüfung: zwei neue Grabtests zuerst rot, danach grün; 22 fokussierte Grab-/Bau-
prüfungen erfolgreich, vollständige Suite **253/253**, Build und Diffcheck grün.
Browser `--zoom-exits-only`: Maus-/Touchzoom, feste HUD-Größe, Kachelauswahl bei
Zoom, Zeigeranker, Rücksetzen und tatsächlich ausgegrabener begehbarer Ausgang.
Screenshots `node_modules/.cache/anthive-zoom-*.png` visuell geprüft.
Logs `/tmp/anthive-{exits-green,zoom-suite,zoom-build,zoom-browser}.log`.
Keine neuen Grafikassets oder Abhängigkeiten; Änderungen lokal, kein Push.


Nachtrag nach Spieltest: feste Zoomstufen 25/50/100/200 % statt Zwischenwerten.
Raumtexte werden gegenläufig skaliert und behalten damit ihre Bildschirmgröße;
bei 50 % werden überlappende Texte unterdrückt, bei 25 % Welttexte ausgeblendet.
HUD bleibt sichtbar. CSS erhält `image-rendering: pixelated`, damit die Browser-
Skalierung keine zusätzliche Glättung einführt. Baustofflagertext zentral im Raum.
Gezielter Zoomtest, Build und aktualisierte Maus-/Touch-Browserprüfung erfolgreich
(`/tmp/anthive-crisp-zoom-*.log`). Wegwahl geprüft: kürzeste gewichtete Routen mit
Verkehr; Teichzugänge weiterhin nur an den zwei Ufern, keine neue Entnahmestelle
allein durch einen unterirdischen Tunnel. Wegregeln hier nicht geändert.

Weitere Nutzerkorrektur: Bauentwürfe dürfen keine Luft- oder sichtbaren
Wasserkacheln enthalten. Ein gemischter Entwurf wird vollständig abgelehnt,
auch wenn sein Bodenanteil grabbar wäre. Tunnel dürfen weiterhin bis zur
Erdoberfläche führen; damit bleiben zusätzliche Ausgänge möglich. Begehbare
Luft ist nur für Bewegung zulässig, nicht als Teil eines neuen Bauplans.
Vorschau und Auftragsannahme nutzen dieselbe Prüfung einschließlich tatsächlicher
Teichkontur. Zwei neue Ablehnungstests zuerst rot, danach 12 fokussierte Bau-/
Teichprüfungen und Build grün; Diffcheck sauber. Logs
`/tmp/anthive-plan-boundaries-{green,build}.log`.
