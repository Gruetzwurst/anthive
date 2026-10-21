# ANTHIVE world and camera: first playable slice

## Purpose

Build the first real game scene after the browser scaffold: a simple side-view tile world that the player can inspect by moving the camera. This is Phase 1 in the MVP order in `inbox/ANTHIVE_Gesamtdokument_Entwicklung_Codex_v3.docx`.

This document is the design basis for a visual review prototype. Seeing the prototype does not finalize game rules, art, or world-generation decisions.

## Existing decisions from v3

- ANTHIVE is a mobile-friendly 2D colony game in side view.
- The game uses a tile-based world with a green surface above underground soil.
- The agreed orientation is landscape with a 16:9 play area. Portrait viewports ask the player to turn the device; the browser does not lock orientation.
- The MVP begins with world and camera, followed by digging, then colony and supplies.
- The visual direction is colorful, high-contrast pixel art. Original procedural placeholder graphics are allowed; third-party game art is not.
- The world includes a small nest chamber. Underground details start unknown; revealing adjacent cells is a provisional rule whose exact range is still open.

## Proposed first slice

Show a finite horizontal world made from a tile grid. A grass-covered surface sits above soil. Include a small pre-existing nest chamber connected to the surface by a short passage, as described in the v3 start-world definition. Render the chamber as open space and render still-unknown underground cells with a neutral covered placeholder, without exposing their soil type or possible contents.

Start the camera near the chamber so the player can see the surface, entrance, and nest together. Let the player pan by dragging with a mouse or one finger. Keep the camera within the world edges. Do not add zoom in this slice.

Use simple original programmatic pixel-style tiles. Tile size, map width, and map depth are implementation settings, kept together so they can be adjusted; they are technical preview values, not balance or world-generation decisions.

## Structure and flow

- `WorldScene` owns the scene lifecycle and displays the world.
- A small world-data module describes the surface, soil, open passage, and nest chamber separately from rendering.
- Camera drag input changes the camera position only. It does not select cells or issue game orders.
- The existing landscape layout remains in place, including the portrait turn-device prompt.

On scene start, load the fixed placeholder map, draw its tiles, and frame the chamber. During a drag, move the camera. When it reaches the map edge, stop it there.

## Out of scope

No ants, queen, eggs, resource points, collection, digging, tile selection, fog discovery behavior, HUD, simulation clock, save/load, zoom, or balance values. These belong to later MVP phases or require more design decisions. The scene is an interactive world-and-camera prototype, not yet a complete game loop.

## Acceptance criteria

- `npm run build` succeeds.
- In the landscape browser view, the player sees the grass surface, a short entrance passage, and the small nest chamber.
- Unknown underground cells do not reveal soil types or resources.
- Dragging with a mouse or one finger pans the view; the camera does not leave the world bounds.
- A portrait viewport shows the existing turn-device prompt.
- The scene uses original placeholder graphics and adds no gameplay rules beyond the stated camera behavior.
- No browser or phone test is claimed unless actually performed.

## Decisions still open

- Final tile artwork and visual identity.
- Final dimensions and any future world-generation approach.
- Exact underground reveal behavior when digging is implemented.
- Zoom behavior and camera controls beyond basic dragging.
