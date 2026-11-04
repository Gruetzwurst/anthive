# D2.5 – Königinnenkammer und besonderes Ei

Entwurfsstand vor Implementierung. Grundlage: bestehende D2-Planung und
Nutzerauftrag, nach D2.4 fortzufahren. Nutzer bestätigt3 Baumaterial pro Kachel
wie gewöhnliche Brutkammern,132 Material bei44 Kacheln. Builder-Check meldet
keine weiteren wichtigen offenen Fragen für dieses Paket.

## Ziel und bestehende Beschlüsse

Ab Höchststand150/500/1000 darf die Kolonie insgesamt2/3/4 Königinnenplätze
belegen. Die Startkönigin belegt einen Platz. Bereits erreichte Freischaltungen
bleiben bestehen. Die Zahl zählt erwachsene Königinnen und reservierte Plätze
für ihre laufende Aufzucht, nicht nur schon geschlüpfte Tiere.

Neue Königinnenkammer: identische11×4-Vorlage oder frei gezeichnete
zusammenhängende Fläche von mindestens44 Kacheln. Bestehende Abstands-,
Terrain-, Zugangs- und Bau-/Materialregeln gelten. Zusätzliche Fläche schafft
keinen zweiten Königinnenplatz in derselben Kammer.

Erst eine vollständig eingerichtete und erreichbare Kammer fordert automatisch
ein besonderes Ei von einer lebenden Königin an. Eine Brutpflegerin muss dieses
Ei tatsächlich an der Quellkönigin aufnehmen und in die neue Kammer tragen.
Es gibt genau ein solches Ei je Königinnenplatz, keinen Sofortspawn und keine
zusätzliche Aufzucht-Schaltfläche. Normale Eierquoten und Eiablage bleiben.

## Ansatz

Die vorhandenen Bauaufträge, reale Materiallieferung, schrittweise Einrichtung
und der Eiertransport werden erweitert. Ein eigener paralleler Bau-/Transport-
Mechanismus würde dieselben Wege, Reservierungen und Abbruchregeln duplizieren
und wird deshalb nicht eingeführt.

Königliche Eier erhalten getrennte persistente Identitäten und Zielkammern.
Eine kleine gemeinsame Eiertransport-Schnittstelle bündelt normale und
königliche Transportanfragen für die bestehende Pflegerinnen-Logik. Die
Spezialisierungsquoten normaler Eier erhalten keine fünfte Berufsgruppe.

Technische Festlegungen des Assistenten:

- Schon angenommene, nicht abgebrochene Königinnen-Bauaufträge reservieren
  einen Platz, auch wenn sie pausiert oder noch unerreichbar sind. So können
  gleichzeitige Aufträge das Limit nicht überschreiten. Abbruch vor Fertigstellung
  gibt den Platz frei; vorhandener Aushub und Material folgen bestehenden Regeln.
- Die bisher einzige Startkönigin ist die Quelle. Nach Fertigstellung erzeugt
  sie das Sonder-Ei als einmaliges eigenes Ereignis an ihrer Position; keine
  weitere künstliche Wartezeit. Das normale Eierpufferlimit darf die reservierte
  Sonderproduktion nicht dauerhaft blockieren. Kein Bonus auf normale Eiablage.
- Auftrag, Ei und Transport bleiben eindeutig miteinander verbunden. Ausfall
  einer Pflegerin gibt die Reservierung frei bzw. lässt das Ei am tatsächlichen
  Ort liegen. Unerreichbarkeit des Ziels erzeugt kein zweites Ei und vernichtet
  kein getragenes Ei. Kein Bruttod für Königinnen-Nachwuchs.
- Beim Laden wird keine Kammer/Eiproduktion neu ausgelöst, wenn das zugehörige
  Ei bereits existiert. Alte Kolonien starten mit genau ihrem bisherigen
  Startköniginnenplatz; die bisherige Welt wird nicht umgebaut.

## Paketgrenze und spätere Entscheidungen

D2.5 endet mit eingerichtetem Raum und darin real abgeliefertem Königinnen-Ei.
Die Entwicklungsphasen und das autonome Eierlegen mehrerer erwachsener
Königinnen gehören zu D2.6. Damit werden in D2.5 keine noch ungeklärten
königlichen Entwicklungszeiten oder Pflegeplatzkosten erfunden.

Vor D2.6 sind die alten12/20-Spieltage-Tabellen mit dem erneut bestätigten
6-Minuten-Normalbrutprofil abzugleichen. Der Wunsch nach doppelt langen Phasen
und der Pflegebedarf königlicher Brut müssen im neuen Zeitmaß eindeutig sein.
Nahrung/Wasser werden auch dort physisch geliefert; Mangel darf die unsterbliche
königliche Brut pausieren. Noch keine zusätzliche erwachsene Königin in D2.5.

## Abnahme

Tests für alle Freischaltungen und überbuchte/abgebrochene/pausierte Aufträge;
Vorlage/freie Form und Mindestfläche; echte Baukosten; Ei erst nach vollständig
betriebsbereiter Kammer; reale Quell-/Zielpositionen; exklusive Reservierung,
Ausfall und blockierte Route; keine Doppelerzeugung nach Save/Reload/Restore;
Migration mit Originalschutz sowie unveränderte normale Eiablage und Brutpflege.
Build, gezielte Browserprüfung und vollständiger Modelltestlauf am Paketende.
