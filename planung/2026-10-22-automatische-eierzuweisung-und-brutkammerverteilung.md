# ANTHIVE – Automatische Eierzuweisung und Verteilung auf Brutkammern

**Verbindlicher Nutzerbeschluss vom 22.10.2026: Eierzuweisung B / Verteilung zwischen Kammern B.**

## NEUER BESCHLUSS – ersetzt frühere manuelle Zuweisungspflicht

Die Eier werden **automatisch nach einer vom Spieler festgelegten prozentualen Verteilung** den vier Spezialisierungen zugewiesen. Der Spieler legt beispielsweise gewünschte Anteile für **Sammlerinnen, Baumeisterinnen, Kämpferinnen und Brutpflegerinnen** fest, anstatt jedes neu gelegte Ei manuell verteilen zu müssen.

**Konfliktauflösung zu älteren Dateien:** Dort steht wiederholt, der Spieler verteile einzelne Eier selbst, und die Eierzuweisung erfolge nicht automatisch. **Diese ältere Regel ist durch diese explizite neue Entscheidung ersetzt.** Weiterhin entscheidet der Spieler strategisch über die Anteile. Codex soll **nicht** die ältere Pflicht zur manuellen Einzelzuweisung umsetzen.

## Verbindlicher Beschluss 1 – Art der Eierzuweisung B
- Königin legt weiterhin selbständig Eier abhängig vom Koloniezustand.
- Spieler definiert Zielanteile (%) für vier Spezialisierungen; **neue Eier werden automatisch nach diesen Vorgaben zugewiesen**, soweit passende betriebsbereite Brutkammern freie Kapazität haben.
- Die **Spezialisierung wird weiterhin durch den Kammertyp bestimmt** und ist für die erwachsene Ameise dauerhaft; Arbeitsgruppenzuweisung ist davon verschieden.
- Prozentsätze müssen als nachvollziehbare Verteilung darstellbar sein (zusammen 100 % oder eindeutig normalisierte Werte). Keine Zufalls-/Rundungsfehler, die bestimmte kleine Anteile dauerhaft verhungern lassen.
- Im **Königinnen-Eierpuffer** können weiterhin nicht zugewiesene Eier bleiben, wenn die entsprechende automatische Zuordnung nicht möglich ist (z. B. fehlende Kapazität). Diese Eier entwickeln sich vor der Zuweisung **nicht**.
- Die frühere Kapazitätsregel bleibt: Königinnenpuffer endlich; bei zunehmender Füllung Eiablage zunehmend gedrosselt, bei vollem Puffer pausiert sie. Aktuell **50 Eier** Testkapazität.
- Konkrete Standardprozentsätze, Zeitpunkte des automatischen Zuweisungsversuchs, Verteilung bei mangelnder Kapazität einzelner Spezialisierungen und Rundungsstrategie sind **noch nicht beschlossen**. Codex soll dies bei Implementierung gezielt klären oder als markierte, testbare technische Voreinstellung behandeln.

## Verbindlicher Beschluss 2 – Verteilung auf gleich spezialisierte Brutkammern B
- Wenn es mehrere **betriebsbereite Brutkammern derselben Spezialisierung** gibt, werden zugewiesene Eier **möglichst gleichmäßig auf diese Kammern verteilt**.
- Gleichmäßigkeit ist nur innerhalb der **jeweils freien Kapazitäten** möglich; volle, unfertige, unerreichbare oder nicht freigeschaltete Kammern dürfen keine zusätzlichen Eier erhalten.
- Dies ist **keine** allgemeine Zuweisung von Eiern anderer Spezialisierungen in freie fremde Brutkammern. Eine Sammlerinnen-Brutkammer bleibt auf Sammlerinnen spezialisiert.
- Werden neue Kammern fertiggestellt oder bestehende Plätze frei, dürfen wartende, noch nicht zugewiesene Eier in der Königinnenkammer entsprechend der vom Spieler festgelegten Zielverteilung automatisch nachgezogen werden.
- Ein zugewiesenes Ei beginnt **erst dann** seine individuell simulierte Entwicklung Ei → Larve → Puppe → erwachsene Ameise. Keine doppelte Zuweisung oder doppelt gezählte Brut.

## Wichtige frühere Beschlüsse bleiben bestehen
- Alle vier Brutkammertypen werden bei der Planung festgelegt, fertiggestellte Kammern sind nicht umnutzbar.
- Kapazität jeder Brutkammer ist begrenzt; größere Kammern besitzen mehr Brutplätze, derzeit testweise 2 Brutplätze pro nutzbarer Kachel und 20 Kacheln Mindestfläche.
- Brutpflege-Unterbesetzung verlangsamt die Entwicklung, allein durch fehlendes Personal stirbt keine Brut.
- Direkter Nahrung-/Wasserverbrauch nur für Larven; Brutpflegerinnen transportieren Ressourcen zu kleinen Vorräten der jeweiligen Brutkammer.
- Vorläufige Testwerte: 5 Eier pro Spieltag, 6 Spieltage Gesamtentwicklung (Ei 1, Larve 3, Puppe 2), Spieltag 600 Sekunden.
- Keine Einzelsteuerung von Ameisen; Gruppensteuerung bleibt bestehen.

## Codex – Reihenfolge
1. Lokale, ggf. neuere VM-Dateien vor Änderungen mit GitHub abgleichen und sichern (besonders Teich/Welt).
2. Im übergeordneten Arbeitsplan `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md` die ältere Formulierung 'Spieler weist Eier zu' **ab sofort als 'Spieler legt Zielverteilung fest; Automatik weist zu' lesen**.
3. Erst Ressourcen- und Arbeitsgruppensystem implementieren; automatische Eierzuweisung ist Teil der **späteren Königinnen-/Brutphase**, nicht Ressourcen-Auftrag 01.
4. Automatische Zuordnung deterministisch/testbar gestalten; Gleichverteilung innerhalb einer Spezialisierung mit Kapazitätsgrenzen und stabilem Königinnenpuffer.
5. Nutzerentscheidungen nicht als Erlaubnis interpretieren, ungefragt alle Spielsysteme gleichzeitig zu implementieren.

## Spätere Akzeptanztests
- Neue Eier werden nach festgelegter Zielquote automatisch zugeteilt, sobald passende Plätze vorhanden sind.
- Zwei Brutkammern derselben Spezialisierung und gleicher freier Kapazität erhalten bei ausreichender Ei-Anzahl möglichst gleich viele Eier.
- Eine volle Kammer wird nicht überfüllt; übrige Eier werden auf andere freie Kammern desselben Typs verteilt oder verbleiben korrekt im Königinnenpuffer.
- Keine Kammer einer falschen Spezialisierung wird verwendet.
- Bei neu frei werdender Kapazität kann der Puffer entsprechend der Zielquoten automatisch abgebaut werden.
- Sehr kleine Quoten werden über viele Eier nicht systematisch weggerundet.
- Kein Ei entwickelt sich, solange es unzugewiesen im Königinnenpuffer liegt.
- Zuweisungen erzeugen keinen Ressourcen-/Eierverlust und keine doppelten Individuen.

**Status: verbindliche Designänderung, keine Änderung am Spielcode.**
