# ANTHIVE – Lagerkapazität und Lagererweiterung

**Verbindliche Entscheidungen vom 21.10.2026**

Diese Datei ergänzt:
- `planung/2026-10-21-phase-1-entscheidungen-und-codex-auftrag.md`
- `planung/2026-10-21-sammelverhalten-gefahren-und-lager.md`

## Beschluss 1: Lagerkapazität B – begrenzte Kapazität

- Jede Lagerkammer hat eine **endliche Kapazität**.
- Ist die Kammer voll, passt keine weitere Ressource hinein. Es dürfen keine Bestände über das Limit hinaus verbucht werden.
- Der Spieler muss zusätzlichen Lagerraum schaffen, um insgesamt mehr einlagern zu können.
- Bereits beschlossen: Nahrung und Wasser haben **getrennte Lagerräume**; Baumateriallager existiert im Prototyp als eigener Typ.
- Exakte Kapazitäten sind **noch nicht beschlossen**. Werte als zentrale Konfiguration führen und später balancieren.

## Beschluss 2: Lagererweiterung B – mehrere Lagerkammern

- Der Spieler kann **mehrere Nahrungs- und mehrere Wasserlagerkammern** ausgraben.
- Jede zusätzliche Lagerkammer erhöht die Gesamtkapazität der zugehörigen Ressource.
- Räumliche Verteilung ist relevant: Mehrere Lager können Transportwege verkürzen.
- Nicht als unbegrenzt großes virtuelles Einzellager implementieren; die **einzelnen Lagerkammern samt Position, Kapazität und Bestand** müssen unterscheidbar bleiben.
- Welche konkreten Baukosten, Kammergrößen, Upgrades und Startkapazitäten gelten, bleibt offen.

## Technische Konsequenzen für Codex

- **Auftrag 01** soll die Datenstruktur so anlegen, dass pro Ressourcentyp **mehrere Lager** mit `id`, Position/Anbindung, Kapazität und eigenem Bestand möglich sind.
- Sichere Einlagerung: nur bis zu freier Kapazität der konkreten Kammer; zurückgeben, wie viel tatsächlich eingelagert wurde. Keine Ressourcen durch Überfüllung erzeugen oder verlieren.
- Gesamtanzeige/Bedarfsberechnung darf die Bestände über alle Lager desselben Ressourcentyps aggregieren.
- **Auftrag 02** soll beim Transport das erreichbare Lager mit freiem Platz berücksichtigen; konkrete Auswahlstrategie ist noch zu entscheiden.
- Wasserlager: aktuell auf GitHub ggf. noch **keine passende visuelle Startkammer**. Eine neue Wasserlagerkammer sauber ergänzen, nicht vorhandene Nestkammern stillschweigend austauschen.
- Vor Implementierung lokale, noch nicht gepushte VM-Änderungen (v. a. Teichgestaltung) prüfen und mit GitHub synchronisieren.
- Ressourcenwirtschaft und bestehende Grafiken/Grabmechanik schrittweise ändern, mit Tests absichern.

## Zusätzliche Tests

1. Ein Lager nimmt höchstens seine Kapazität auf.
2. Volles Lager verweigert weitere Einlagerung ohne Bestandsfehler.
3. Zwei Lager desselben Typs erhöhen die Gesamtkapazität.
4. Nahrung darf nicht ins Wasserlager und umgekehrt.
5. Individuelle Lagerbestände und summierter Vorrat bleiben konsistent.
6. Neue Kammer erhöht Kapazität, ohne Bestände bestehender Kammern zurückzusetzen.
7. Transport zu einem inzwischen vollen Lager darf keine Ressourcen duplizieren; neue Zielwahl oder saubere Behandlung nötig.

## Noch offen

- Zielwahl bei mehreren Lagern (kürzester erreichbarer Weg oder andere Priorisierung?)
- Verhalten bei vollem Lager oder erschöpfter Quelle
- Baukosten, Startkapazitäten und Startzahl der Lagerkammern
- Ob und wie Lager später zusätzlich aufgewertet werden können

**Keine Änderung am Spielcode durch dieses Dokument.**
