# ANTHIVE – Quellenwahl und Verteilung der Sammlerinnen

**Verbindliche Entscheidungen vom 21. Oktober 2026**

Dieses Dokument ergänzt die übrigen Beschlüsse in `planung/`. Bei widersprüchlichen früheren *Empfehlungen* gelten die hier ausdrücklich gewählten Optionen A.

## Beschluss 1: Strategie für Ressourcenquellen A – schnellstmögliche Versorgung

- Sammlerinnen bevorzugen bei der automatischen Quellenwahl die **nutzbare und erreichbare Quelle mit dem kürzesten praktikablen Transportweg**.
- Die Sammelautomatik versucht **nicht**, Quellen aktiv zu schonen oder den langfristigen Nachwuchs zu optimieren.
- Keine zusätzliche Spieler-Umschaltung zwischen »nachhaltig« und »schnell« vorsehen; diese Option wurde **nicht** gewählt.
- Erreichbarkeit und tatsächliche Nutzbarkeit bleiben zwingend: leere, gerade gesperrte oder nicht erreichbare Quellen liefern nichts.
- Quelle erschöpft? Wie bereits beschlossen automatisch eine andere erreichbare nutzbare Quelle suchen. Regeneration und Erholungsphase wirken weiterhin unverändert.
- Die Transportkosten gelten für den tatsächlichen praktikablen Weg (inkl. Ablieferung am passenden Lager), nicht nur für die Luftlinie; die präzise Bewertungsformel ist ein konfigurierbarer Implementierungs-/Testwert und noch keine finale Balancingentscheidung.

## Beschluss 2: Verteilung der Sammlerinnen A – beste Quelle bevorzugen

- Möglichst viele Sammlerinnen nutzen bevorzugt die **aktuell ergiebigste bzw. für die schnelle Versorgung attraktivste Quelle**, bis sie nicht mehr attraktiv oder nutzbar ist.
- Keine ausdrücklich gleichmäßige Aufteilung zum Schutz mehrerer Quellen.
- Quelle kann wegen Erschöpfung, langer Wartezeiten/Überlastung, Blockierung, Erreichbarkeit oder veränderter Transportdauer an Attraktivität verlieren. Die konkrete technische Behandlung von Warteschlangen/Quellendurchsatz ist noch offen.
- Wenn die bevorzugte Quelle nicht mehr sinnvoll nutzbar ist, wählen Ameisen automatisch eine Alternative.

## Zusammenspiel mit früheren Beschlüssen

- Automatische Erkennung **aller erreichbaren** Quellen; keine manuelle Freigabe.
- Sammlerinnen richten die Aufteilung **zwischen Nahrung und Wasser** weiterhin nach Bedarf und der Spielerpriorität `Nahrung / Wasser / Ausgeglichen` aus. Das ist von der hier entschiedenen Wahl **zwischen mehreren Quellen derselben Ressourcenart** zu unterscheiden.
- Lagerwahl bleibt **Option B – intelligent**: bei der **Ablieferung** passende Lager nach Wegeffizienz, verfügbarer Kapazität und Auslastung berücksichtigen.
- Nahrungsquellen bleiben **endlich, langsam regenerierend und nach Übernutzung erholungsbedürftig**. Diese Knappheit ist eine strategische Folge der ausdrücklich gewählten schnellen Sammelstrategie, kein Fehler.
- Teichwasser bleibt zunächst unbegrenzt; kleinere Wasserquellen sind begrenzt.
- Wenn alle passenden Lager voll sind: nur **passende Ersatzarbeiten** übernehmen; keine automatische fachfremde Aushilfe. Wenn keine passende Arbeit: **Ruhemodus** mit reduziertem Ressourcenverbrauch.
- Erschöpfte Quelle: automatisch Quelle wechseln (nicht auf Spielerbefehl warten).
- Spezialisation dauerhaft; Gruppenzuweisung des Spielers wird durch die automatisierte Quelle-/Aufgabenwahl nicht überschrieben.
- Bei Gefahr grundsätzlich fliehen, bei direktem Angriff ggf. verteidigen; Kampf ist kein Teil des ersten Ressourcenauftrags.

## Konkrete Umsetzung für Codex – in richtiger Reihenfolge

1. Zuerst Ressourcen- und Lagerdatenmodell, Spieluhr und Tests aus `planung/2026-10-21-phase-1-entscheidungen-und-codex-auftrag.md`.
2. Danach echte Sammeltransporte implementieren. Pro benötigtem Ressourcentyp die schnellste nutzbare Quelle bevorzugen; den Großteil der Sammlerinnen zur attraktivsten Quelle schicken, **nicht künstlich gleichmäßig verteilen**.
3. Bei Erschöpfung die nächstbeste erreichbare Quelle wählen; realen Transport und Einlagerungsgrenzen einhalten. Keine Ressourcen ohne erfolgreiche Entnahme/Lieferung entstehen lassen.
4. Auswahl/Zielneubewertung so programmieren, dass keine ständigen unnötigen Hin-und-her-Wechsel zwischen fast gleich guten Quellen entstehen (konkrete Hysterese optionaler Testparameter, nicht beschlossene Spielregel).
5. Vor Änderungen: lokale VM-Version mit GitHub abgleichen; ältere GitHub-Teichdarstellung darf neuere lokale Änderungen nicht überschreiben.

## Tests

- Mehrere nutzbare Quellen: bevorzugt die mit kurzer praktikabler Versorgungskette.
- Mehrere Sammlerinnen: nutzen bevorzugt die attraktivste Quelle, ohne künstliches Gleichverteilen.
- Beste Quelle erschöpft: automatische Alternative, keine Phantomressourcen.
- Quelle nicht erreichbar: ausgeschlossen.
- Quelle wieder verfügbar: darf erneut gewählt werden.
- Ablieferung: intelligent geeignetes Lager mit freiem Platz, keine Überfüllung.
- Nahrung/Wasser-Zuteilung respektiert die gewählte Priorität trotz eigener Quellenauswahl.

## Nicht beschlossen

- Exakte Bewertungsformel für »schnell«/»attraktiv«.
- Warteschlangen-/Durchsatzmodell, Sammelzeiten, Weggeschwindigkeit, Kapazitäts- und Regenerationswerte.
- Aktive Schutzstrategie oder Spielerumschaltung zu nachhaltigem Sammeln.

**Dokumentation, noch keine Änderung des Spielcodes.**
