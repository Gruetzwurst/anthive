# Baustofftransport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make digging ants move smoothly and ensure every dug tile produces a visible material load that reaches a separate building-material store.

**Architecture:** Keep the lightweight prototype simulation in `WorldScene`, with explicit per-tile material loads, moving builder-group ants, and a distinct material-store counter and chamber. Add the separate store coordinates to `worldMap`; keep temporary capacities and timing values labeled as prototype behavior.

**Tech Stack:** TypeScript, Phaser 3, Vite.

**Spec:** `docs/superpowers/specs/2026-10-20-building-material-hauling-design.md`

## Global Constraints

- Preserve previous versions under `versions/` before changing existing game files.
- Every dug soil tile creates one material load, and each load must be delivered to the separate building-material store.
- Builder-group ants can dig and carry; ants borrowed from other groups can only carry.
- Food storage remains separate from building-material storage.
- Group sizes, carrying capacity, and movement rates remain temporary preview values.
- Keep the preview lightweight; do not add dependencies or a permanent colony simulation.

## Review Focus

- A long frame or delayed update must not duplicate or lose a material load; keep digging and hauling progress bounded to one state transition at a time.
- A material load already being carried must not remain as a pickup on its source tile.
- A completed haul increments only the building-material total, never the food total.
- A blocked or unfinished tunnel must not send workers through solid soil or stone.
- Multiple queued dig orders must not assign the same tile or consume its load twice.

---

### Task 1: Add a separate building-material store chamber

**Files:**
- Modify: `src/game/world/worldMap.ts`
- Modify: `src/game/scenes/WorldScene.ts`

**Interfaces:**
- Produce `buildingMaterialStoreCenter` alongside `foodStoreCenter` in `worldMap.ts`.
- Keep the existing food store geometry and route unchanged.

- [x] Add a small open chamber connected to the nest by its own tunnel, placed so it is visually distinct from the food store.
- [x] Save the current project files to `versions/2026-10-20-before-builder-material-hauling/` before modifying game files.
- [x] Draw and label the building-material store separately in the world scene.
- [x] Check that the preview map still builds and that the store chamber connects to the nest.

### Task 2: Smooth builder-group movement and tile material states

**Files:**
- Modify: `src/game/scenes/WorldScene.ts`

**Interfaces:**
- Replace teleport-style `digWorker` positioning with a small builder-group worker model and smooth movement between reachable tile centers.
- Each completed dig produces one uniquely identified load associated with its source tile.
- A tile with a waiting load remains visually marked as excavated with loose material; the tunnel stays traversable, as specified for this preview.

- [x] Add a compact material-load state with `waiting`, `carried`, and `stored` progression, preventing duplicate pickups.
- [x] Add two visible builder-group workers as illustrative preview values. Workers may dig and carry; keep assignment flexible so one can dig while another carries, or a worker can perform both jobs in sequence.
- [x] Move workers smoothly along reachable cleared tunnel cells; do not move through solid cells.
- [x] When a dig tile completes, create exactly one visible loose load and allow digging to continue while another builder-group worker carries earlier loads.

### Task 3: Haul loads to the separate store and show stored total

**Files:**
- Modify: `src/game/scenes/WorldScene.ts`

**Interfaces:**
- A carried load follows its worker and is removed from its pickup tile.
- Reaching `buildingMaterialStoreCenter` changes that load to `stored` and increments the building-material counter once.

- [x] Add a simple connected route from reachable excavation tunnels to the material store using existing cleared paths.
- [x] Animate a carrier and its load to the store, then update a separate visible building-material stock display.
- [x] Ensure a load is not picked up twice and cannot count as stored before the carrier arrives.
- [x] Keep borrowed-group workers represented as transport-only workers in the task model; no borrowing UI is required in this preview.

### Task 4: Update project notes and verify

**Files:**
- Modify: `README.md`

- [x] Describe smooth builder movement, per-tile material loads, the separate store, and which values remain temporary.
- [x] Run `npm run build` and confirm it exits successfully.
- [x] Review the complete diff and confirm the earlier version snapshot exists.
- [x] Report that browser rendering was not visually checked unless it was actually opened and inspected.
