# ANTHIVE – Sammelverhalten, Gefahren und Lager (Beschlüsse vom 21.10.2026)

**Status:** Verbindliche Designentscheidungen. Vorbereitung für spätere Codex-Arbeit; diese Datei ist kein Auftrag, sofort sämtliche Mechaniken umzusetzen. Zusammen mit `planung/2026-10-21-phase-1-entscheidungen-und-codex-auftrag.md` lesen.

## 1. Verbindlich entschieden

### Ressourcensuche: Option A – automatisch
- Sammlerinnen erkennen selbstständig **alle erreichbaren Ressourcenquellen** und können sie nutzen.
- Keine vorgeschriebene vorherige Gebietserkundung und keine Pflicht zur manuellen Freigabe jeder Quelle.
- Vorhandene Entscheidungen beibehalten: Ameisen werden nicht einzeln gesteuert; der Spieler verwaltet Gruppen, ihre Anzahl und die Sammelpriorität **Nahrung / Wasser / Ausgeglichen**. Sammlerinnen teilen sich nach Bedarf automatisch auf Nahrung und Wasser auf.
- „Erreichbar“ bedeutet, dass eine gültige Route zur Quelle existiert; nicht, dass Ameisen Hindernisse ignorieren oder sich teleportieren.

### Gefahrenverhalten: Option B – autonomes Fliehen mit Selbstverteidigung
- Bei erkennbarer Gefahr versuchen Sammlerinnen selbstständig zu fliehen.
- Werden sie direkt angegriffen oder können nicht ausweichen, dürfen sie sich verteidigen.
- Keine manuelle Kontrolle einzelner Ameisen erforderlich.
- Gegner-KI, Kampfschaden, exakte Erkennungsradien und konkrete Fluchtbewertung sind **noch nicht entschieden**; nicht als Phase-1-Mindestumfang interpretieren.

### Lagerorganisation: Option B – getrennte Lager
- **Nahrung und Wasser haben unterschiedliche Lagerräume.**
- Beim Transport wird Nahrung ins Nahrungslager und Wasser ins Wasserlager gebracht.
- Die bestehenden Baumateriallager sind nicht mit diesen Lagern gleichzusetzen.
- Die Implementierung darf vorläufig getrennte **logische Bestände** vorsehen; die konkreten räumlichen Wasserlager/-kammern sind beim aktuellen Weltstand ggf. noch nicht vorhanden. Für eine korrekte visuelle Verbindung muss eine passende Wasserlagerkammer später ergänzt werden, ohne vorhandene Nestkammern unbeabsichtigt umzubauen.
- Anzahl zusätzlicher Lager, Ausbaumöglichkeiten, genaue Lagerkapazitäten und Transportwege zwischen mehreren Lagern sind **noch nicht entschieden**.

## 2. Bezug auf bestehende Planung

Die folgenden früheren Entscheidungen bleiben unverändert:
- Nahrungsquellen sind begrenzt, regenerieren langsam und brauchen bei Übernutzung Erholung.
- Teich als vorläufig unbegrenzte Wasserquelle; kleinere Wasserstellen begrenzt und regenerierend.
- Wasser und Nahrung müssen tatsächlich transportiert und erst bei Ablieferung eingelagert werden.
- Ressourcenmangel bremst zuerst Arbeit und Eiablage, erst später folgen mögliche Todesfälle; **entspanntes Überlebenstempo A**.
- Vorläufiger Spieltag: **600 Echtzeitsekunden**; alle Zahlen weiterhin konfigurierbare Testwerte.
- Spezialisationen und Koloniewachstum sind für spätere Entwicklungsphasen vorgesehen.

## 3. Codex-Hinweise für die Reihenfolge

1. Erst **Auftrag 01** der anderen Planungsdatei: Uhr, Ressourcentypen/-quellen, getrennte Lagerbestände, Entnahme/Regeneration und Tests ohne Eingriff in Weltgrafik.
2. Bei **Auftrag 02**: erreichbare Quellen automatisch auswählen; Pfadfindung respektieren; Nahrung/Wasser entsprechend Priorität und Bedarf sammeln; Transport zur jeweils richtigen Lagerart; Ressourcen erst nach Lieferung gutschreiben.
3. Fehlende echte Wasserlagerkammer und Grafikanschluss als separaten notwendigen Ausbauschritt planen, nicht durch stillschweigendes Ersetzen einer bestehenden Kammer lösen.
4. Flucht/Selbstverteidigung nur als **Designvorgabe für das spätere Gefahrensystem** vormerken, nicht ungefragt vollständige Kampflogik in Auftrag 01/02 einbauen.
5. Vor allem anderen: **aktuelle lokale VM-Änderungen mit GitHub abgleichen**, damit unveröffentlichte Teich-/Weltänderungen nicht überschrieben werden.

## 4. Noch offen – nächste Planungsfragen

- Haben die getrennten Lager eine Kapazitätsgrenze, und wie wird erweitert?
- Sollen die getrennten Lager jeweils genau eine Startkammer haben oder kann man später mehrere desselben Typs bauen?
- Was sollen Sammlerinnen tun, wenn ein Lager voll oder eine Quelle vorübergehend erschöpft ist?

Diese Punkte sind keine bereits getroffenen Entscheidungen.
