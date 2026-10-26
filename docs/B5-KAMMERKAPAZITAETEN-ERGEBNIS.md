# B5 – Kammerkapazitäten

Stand: 26.10.2026. Freigabe „weiter“. Basis B4 `6b34a00`, sauber und mit GitHub identisch. Branch `codex/b5-chamber-capacities`. Stopp vor B6.

## Änderungen

- Mindestflächen nach ausdrücklichem Testwertbeschluss vom 22.10.: Lager 12, spezialisierte Brutkammern 20, Ruhekammern 16 zusammenhängende Kacheln. Tunnel weiterhin ab einer Kachel. Prüfung vor Auftragserstellung; freie Formen bleiben erlaubt.
- Vollständig eingerichtete Lager werden einmalig als individuelle, zunächst leere Lager im vorhandenen `ResourceSystem` angelegt. Nahrung/Wasser 10 und Baumaterial 8 Einheiten/Kachel. Echte Sammlerinnen und Baustellenversorgung verwenden diese Lager über ihre vorhandene Lagerwahl.
- Neue spezialisierte Brutkammern registrieren 2 Brutplätze/Kachel; Ruhekammern 2 Ruheplätze/Kachel. Keine Eiablage, Brutentwicklung oder Ruhebelegung vorgezogen.
- Kammern behalten ihren Typ. Exakte Startkammer-Grundrisse schützen Königinnen-, Lager- und Brutkammern vor erneuter Kammerplanung/Umwidmung. Anschlussgänge bleiben nutzbar.
- Nur vollständig eingerichtete, vom Nest erreichbare Kammern liefern nutzbare Kapazität. Bei fehlender Erreichbarkeit bleiben individuelle Bestände erhalten und können nicht entnommen werden. Eine gemeinsame Kanten-Floodsuche aktualisiert alle neuen Kammern bei Geländeänderungen; keine Suche pro Ameise/Frame.
- Bauauswahl zeigt Mindestflächen, Details die tatsächliche Kapazität und Betriebsbereitschaft; fertige nutzbare Räume erscheinen grün.

## Dateien

- `src/game/simulation/chamberSystem.ts`: Register fertiger Kammern, typspezifische Kapazität und Erreichbarkeit; keine zweite Ressourcenbuchhaltung.
- `simulationConfig.ts`, `excavationSystem.ts`, `resourceSystem.ts`: zentrale Testwerte, Mindestflächenprüfung, einmaliger Bauabschluss, echte neue Lager und Zugriffsschutz.
- `src/game/world/worldTypes.ts`, `worldGenerator.ts`: genaue vorhandene Kammergrundrisse als Metadaten; unveränderte Weltkacheln/Grafiken.
- `src/game/ui/ConstructionPanel.ts`, `scenes/WorldScene.ts`: Mindestflächen/Kapazität/Betriebszustand anzeigen.
- `tests/chamber-capacities.test.mjs`: 13 neue Prüfungen; bestehende B3/B4-Schedulerprüfungen behalten explizite kleine Testmindestflächen bzw. verwenden passende Lagerarten. `scripts/check-economy-browser.py` ergänzt `--chambers-only`; historische Touch-Auswahl an neues Lagerminimum angepasst.

## Prüfung

- Neue 11 Kernprüfungen zuerst rot, danach grün; zwei zusätzliche Integrationsprüfungen für reale Sammellieferung und Startgrundrisse ebenfalls grün.
- `npm test`: **159/159 erfolgreich**. `npm run test:world`: **10/10 erfolgreich**. `npm run build`: erfolgreich. Bestehende Chunk-Warnung über 500 kB bleibt.
- Gezielter Firefox-Check erfolgreich: echte Parallelgrabung, Einrichtung, Pause/Fortsetzung, Materialerhaltung und **+120 nutzbare Nahrungslagerkapazität (540 → 660)**. Mobile Details zeigen 120/120 und betriebsbereit. Teichdarstellung geprüft. Screenshots `node_modules/.cache/anthive-b5-*.png`.
- Eigenprüfung ohne Zusatzagenten, ein vollständiger Test-/Buildlauf. Lokale Logs `/tmp/anthive-b5-*.log`.

## Offene Punkte und Abgrenzung

- Alle beschlossenen Grundtypen sind von Anfang an baubar. Konkrete Spezialkammern, Wachstums- und Verbesserungsschwellen wurden noch nicht festgelegt; daher kein erfundener Forschungsbaum oder Freischaltzahlen. Bestehende Härte-/Grabkraftsperren bleiben bestehen.
- Ruheplätze sind verfügbar; automatische Belegung und die zusätzliche Verbrauchsersparnis sind noch nicht aktiv. Der zusätzliche Verbrauchsfaktor ist offen und muss vor dieser Integration festgelegt werden. Allgemeines Ruhen ohne Kammer bleibt möglich.
- Brutplätze sind vorbereitet; automatische Eierzuweisung und Entwicklung bleiben Abschnitt C.
- Keine Speicherfunktion, Kammererweiterung, Abriss- oder Einsturzmechanik ergänzt.

**Nächster geplanter Schritt: B6 – Tunnelverkehr/Performance. Erst nach Freigabe.**
