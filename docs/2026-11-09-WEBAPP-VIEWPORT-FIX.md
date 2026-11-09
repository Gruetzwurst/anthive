# Web-App: Spiel und obere Leiste gegen Fokusverschiebungen absichern

Nutzerbericht: Installierte iPhone-Web-App verschiebt nach Öffnen des Baumenüs die gesamte Darstellung, rechts bleibt Fläche frei und die obere Leiste verschwindet.

## Untersuchung

Kamera für HUD ist bereits getrennt, mit Zoom1/Scroll0. Größenwechsel, Hoch-/Querformat und Menüöffnungen reproduzieren unter Firefox allein keine Verschiebung. Der genaue iOS-Ablauf ist ohne echtes iPhone hier nicht reproduzierbar.

Zwei konkrete Schwachstellen:

- Formularfelder erben12–14px Schrift. WebKit kann fokussierte Felder durch Seitenzoom und Verschieben sichtbar machen, unabhängig vom Spielzoom. Quelle: https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/WKContentViewInteraction.mm (`_zoomToRevealFocusedElement`). Deshalb alle Eingabe-/Auswahlfelder innerhalb des Spiels mindestens16px.
- `overflow:hidden` verbirgt Scrollleisten, verhindert aber kein Fokus-/programmatisches Scrollen des Spielcontainers. Browserregression mit überlaufendem Fokusziel reproduziert Verschieben. Wechsel auf `overflow:clip` an Dokument und Spielcontainer verhindert es; Dialoge behalten ihr eigenes `overflow:auto`.

## Prüfung

Browserregressionen scheiterten vor den Änderungen zuerst an der Feldschrift und nach deren Korrektur am verschiebbaren Container. Nach `clip` besteht die Fokus-/Overflow-Prüfung. Weitere Prüfungen sichern feste Canvas-/HUD-Grenzen nach Menüöffnungen und Größenwechseln, Dialogscrollen und Zwei-Finger-Zoom ab. Produktionsbuild erfolgreich (bekannter Bundlegrößenhinweis).

Kein neues Interface, keine Spielregeln geändert. Das Spiel behält16:9 und Safe-Area-Abstände; freie Ränder aufgrund des Geräte-Seitenverhältnisses sind von einer verschobenen Darstellung zu unterscheiden. Echter Test in der installierten iPhone-Web-App bleibt notwendig.
