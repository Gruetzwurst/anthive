# Bauentwurf korrigieren Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Umsetzung direkt, ohne zusätzliche Agenten.

**Goal:** Laufende Striche zurückziehen und Entwurfskacheln radieren.
**Architecture:** Reine Auswahlfunktionen in constructionPlanning; WorldScene führt Vorschau/Übernahme aus, ConstructionPanel bietet Radierer an.
**Tech Stack:** Bestehendes TypeScript/Phaser, Node-Tests und Firefox-Harness; keine Abhängigkeiten.
**Spec:** docs/superpowers/specs/2026-11-09-draft-correction-design.md

## Global Constraints
Nur Entwürfe verändern. Frühere Striche erhalten, bestehende Bauvalidierung anwenden, Maus/Touch/Pinch kompatibel halten.

## Review Focus
Zeigersprünge beim Zurückziehen; frühere überlagerte Striche; leerradierter Entwurf; unterbrochene Radiergeste; Vorlagen/Rechtecke.

## Task 1: Auswahl und Integration
- [x] Tests für Kürzen bei Rückkehr, Fortsetzen nach Kürzen, unabhängige frühere Striche und unveränderndes Radieren schreiben und rot prüfen.
- [x] `extendBrushStroke(stroke: Cell[], end: Cell): Cell[]` und `subtractSelection(cells: Cell[], removed: Cell[]): Cell[]` in src/game/simulation/constructionPlanning.ts implementieren.
- [x] WorldScene für laufenden Pinsel und Radierer integrieren; Anzeige und Übernahme müssen dieselbe Auswahl verwenden. ConstructionPanel.DrawingTool um erase ergänzen.
- [x] Node-Tests, vollständige Suite und Build prüfen. Firefox mit nativen Maus-/Touchpfaden: verlängern/zurückziehen, ältere Fläche erhalten, radieren, Bestätigung; Pinch-Regression.
- [x] Ergebnis und Fortsetzungsstand dokumentieren.

## Ausführungsnotizen
- Auswahltests rot gesehen, anschließend grün; Build grün.
- Nativer Maus-/Touch-Browsertest für Kürzen, ältere Striche, Radieren und leeren Entwurf grün.
- Review fand Überschreiten des Strichstarts zwischen Zeigerereignissen: zusätzlicher Test rot→grün, Zwischenkacheln werden nun der Reihe nach verarbeitet.
- Pinch-Browserregression fand bestehende Abhängigkeit von Ereignishäufigkeit. Ruling: Kleine Zoomkorrektur gehört zur Absicherung der kombinierten Touchbedienung. Distanzreferenz folgt Zoomverhältnis; alle überschrittenen Stufen werden verarbeitet, Hysterese1.5 verhindert direktes Zurückspringen. Halbierungs-/Viertelungstests rot→grün. Keine neuen Zoomstufen.
