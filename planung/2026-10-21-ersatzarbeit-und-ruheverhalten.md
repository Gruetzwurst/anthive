# ANTHIVE – Ersatzarbeiten und Ruheverhalten

**Verbindliche Entscheidungen vom 21.10.2026.** Bestandteil des Codex-Planungsordners `planung/`. Zusammen mit den vorherigen Planungsdateien lesen, insbesondere `2026-10-21-intelligente-sammel-und-transportlogik.md`.

## Beschluss 1: Ersatzarbeiten A – nur geeignete Tätigkeiten

- Sammlerinnen, deren aktuelle Sammelarbeit blockiert ist (z. B. alle passenden Lager voll), dürfen **automatisch nur passende Arbeiten** aus ihrem Aufgabenbereich übernehmen.
- Dazu gehören beispielsweise andere **noch mögliche** Sammel- oder Transportaufgaben; jedoch nur, wenn sie tatsächlich sinnvoll, erreichbar und mit Lagerkapazität ausführbar sind.
- **Kein automatischer fachfremder Wechsel** zu Bau-, Kampf- oder Brutpflegeaufgaben als Ersatz für blockiertes Sammeln.
- Die bereits beschlossene grundsätzliche Möglichkeit, Ameisen mit Effizienznachteil fachfremd einzusetzen, bleibt erhalten: **Der Spieler kann Gruppen ausdrücklich anders zuweisen.** Das ist etwas anderes als die automatische Ersatzaufgabe.
- Die dauerhafte Spezialisierung und die vom Spieler eingerichtete Gruppenzuweisung/Sammelpriorität werden durch temporäre Ausweicharbeit nicht verändert.
- Sobald die normale Sammelaufgabe wieder möglich und sinnvoll ist, kehren die Sammlerinnen automatisch dazu zurück.

## Beschluss 2: Keine sinnvolle Arbeit B – Ruhemodus

- Ist keine geeignete Tätigkeit verfügbar, **ruhen die betroffenen Ameisen**, statt ziellos Ressourcen zu verbrauchen oder sinnlose Wege zu laufen.
- Im Ruhemodus benötigen sie **etwas weniger Nahrung und Wasser** als während normaler Aktivität.
- Sobald geeignete Arbeit verfügbar ist, verlassen sie den Ruhemodus selbstständig.
- Die genaue Reduktion des Verbrauchs, Darstellung/Animation und mögliche Grenzen des Ruhemodus sind **noch nicht entschieden**. Werte konfigurierbar halten.
- Ruhemodus macht Ameisen nicht automatisch immun gegen Ressourcenmangel; Überlebensregeln bleiben erhalten.

## Präzisierung der bisherigen Beschlüsse

In der Datei `2026-10-21-intelligente-sammel-und-transportlogik.md` steht, dass Sammlerinnen bei vollen Lagern andere sinnvolle Arbeit suchen. **Diese neue Entscheidung konkretisiert das ausdrücklich auf passende Tätigkeiten (Option A).** Bei Fehlen geeigneter Arbeit wird geruht (Option B), nicht automatisch bei fachfremden Tätigkeiten ausgeholfen.

Weitere unveränderte Regeln:
- Lagerwahl intelligent (Weg, Auslastung, freier Platz).
- Erschöpfte Quelle: automatisch alternative erreichbare Quelle wählen.
- Nahrung/Wasser separat und pro Kammer kapazitätsbegrenzt; mehrere Lagerkammern möglich.
- Automatische Erkennung aller erreichbaren Ressourcenquellen; kein manueller Quellfreigabezwang.
- Keine Einzelsteuerung.
- Vorläufig 600 Echtzeitsekunden pro Spieltag; Entspanntes Überlebenstempo A.

## Implementierungsfolge / Codex-Hinweise

1. Erst Ressourcen-Grundsystem und Lagerdatenmodell (Auftrag 01).
2. Beim echten Sammel- und Arbeitsplanungs-System eine priorisierte Folge vorsehen: ursprüngliche Tätigkeit ausführbar? -> andere passende Tätigkeit? -> Ruhemodus.
3. Fachfremde Tätigkeiten **nur** über ausdrückliche Spieler-Gruppenzuweisung, nicht durch automatischen Leerlauf-Ausgleich.
4. Ruhezustand und Aktivitätszustand sollten in einem späteren Verbrauchssystem unterschiedliche konfigurierbare Verbrauchsfaktoren haben.
5. Sämtliche Automatik darf weder Ressourcen ohne Transport erzeugen noch dauerhafte Spielerzuweisungen überschreiben.

## Tests für später

- Ist eine passende Alternativquelle und freier Lagerplatz vorhanden, bleibt die Ameise aktiv und sammelt passend weiter.
- Ist nur fachfremde Arbeit verfügbar, wird sie **nicht eigenmächtig** angenommen.
- Keine passende Arbeit -> Ruhemodus; kein unsinniger Ressourcentransport.
- Ruhemodus senkt Nahrung- und Wasserverbrauch gegenüber der normalen Aktivität; genaue Höhe ist ein Testparameter.
- Passende Arbeit taucht wieder auf -> Ruhemodus verlassen, ursprüngliche Arbeitszuweisung bleibt erhalten.
- Spieler weist explizit fachfremde Tätigkeit zu -> zulässiger Einsatz gemäß bereits beschlossener Effizienzregel.

**Nur Planungsdokumentation. Noch keine Änderung an Spielcode oder Grafik.**
