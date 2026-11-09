# Bauentwurf beim Zeichnen korrigieren

- Laufenden Pinselstrich durch Zurückfahren kürzen, einschließlich schneller Sprünge über den Startpunkt. Frühere losgelassene Striche bleiben erhalten, auch bei Überlappung.
- Werkzeug „Radierer“ entfernt durch Antippen/Ziehen ausschließlich Kacheln aus dem Entwurf. Vorschau zeigt die verbleibende Auswahl; erst Loslassen übernimmt die Änderung. Leere oder anderweitig ungültige Entwürfe können nicht bestätigt werden.
- Vorlagen, Rechtecke und Bauvalidierung bleiben erhalten. Kein Abriss bestehender Bauwerke und keine Änderung erteilter Aufträge.
- Zusätzlicher Browsercheck zeigte einen bestehenden Zoom-Randfall: Ein Halbieren des Fingerabstands konnte abhängig von der Ereignishäufigkeit mehrere Stufen wechseln. Referenzdistanz folgt nun dem Zoomverhältnis; alle überschrittenen Stufen werden verarbeitet, Hysterese verhindert sofortiges Zurückspringen. Scharfe Zoomstufen unverändert.

## Nachweise

Auswahl-/Radier- und zusätzliche Zoomtests jeweils zuerst rot, danach grün. Gesamttestsuite370/370 erfolgreich (381,6s). Nach den letzten Zoomkorrekturen alle13 gezielten Auswahl-/Pinch-Tests erneut grün. Produktionsbuild erfolgreich, nur bekannter Bundlegrößenhinweis. Unabhängiger Review: zwei Randfälle gefunden und korrigiert, abschließend keine weiteren Befunde.

Browserprüfung über `--draft-correction-only` und `--pinch-only`: native Maus-/Touchpfade für Kürzen, frühere Striche, Ziehradieren, leeren Entwurf und erneutes Zeichnen sowie Zwei-Finger-Zoom. Echter iPhone-Test bleibt erforderlich.
