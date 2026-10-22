# Anthive

Anthive is a browser-first game project, with the option to become an app later.

## Folders

- `docs/` — project concept and decisions
- `assets/` — images, audio, and other game content
- `src/` — game source code
- `inbox/` — files brought into the VM for the project
- `export/` — files prepared to take out of the VM

## Moving files in and out

To bring a file in, place it in the shared `Piet` folder on the host, then copy it from `Piet` into `inbox/` in Anthive. The VM currently mounts `Piet` as read-only, so files created in the VM cannot be copied there directly. To take a file out, put it in `export/` and copy it from the VM using the host.

## Run the browser prototype

Requirements: Node.js 20.19 or newer (or 22.12 or newer) and npm.

From this folder, run:

```sh
npm install
npm run dev
```

Vite prints a local address to open in a browser. To create a production build, run `npm run build`; the result is placed in `dist/`. To serve that build locally, run `npm run preview`.

The current screen is a visual draft of the world, camera, food transport, digging, and building-material transport. Seven simple ants move between a surface food source and the food store. Two preview ants represent the builder group. Drag from an open tunnel into soil to issue a straight digging order; builder ants move smoothly along cleared tunnels and dig reachable tiles gradually. Each dug tile becomes blocked by a visible earth pile. The ant that dug it picks up and carries that one load; only then does the tile become walkable, so a narrow tunnel cannot be extended through a pile that has not been removed. After pickup, that ant carries its load to the separate building-material store while work can continue where the tunnel is clear. The store has one large static pile and a separate number that increases only when a load arrives. The food store remains separate. Soil gets harder in deeper bands, takes longer to dig, and eventually needs a higher test digging grade. Diagonal-only contact does not count as a passable tunnel; a second connected line may be needed. The grade button cycles through temporary test levels, including the stone outcrop. Borrowed ants from other groups are not assignable in this preview yet; when added, they will only carry. This is only a prototype: it has no full colony simulation, upgrade progression, resource costs, or saved progress. The test levels, worker count, carrying behavior, and depth bands do not set final game rules. Drag from soil or open sky to move the camera. The world preview is 320 × 120 tiles; ANTHIVE's final world size is still open. `src/game/scenes/WorldScene.ts` draws the draft; `src/game/world/worldMap.ts` holds its temporary map. In a portrait window, the page asks you to turn the device; it does not lock device orientation.

### World data structure

The generated 320 × 120 starting map uses 24-pixel tiles and translates the ANTHIVE world-map reference into a playable tile layout. It includes a forest, meadow, pond, mountain range, tree stump, ruins, watchtower, underground roots, mineral and crystal deposits, mushrooms, and a fossil. The infographic labels and legend are not drawn in the game. These added landmarks are visual decorations and do not block ants or add resource rules.

The world includes five vertical terrain bands: topsoil, compact earth, clay, stone layer, and deep rock. The underworld remains mostly solid. A connected starter nest contains the queen's chamber, food store, building-material store, and four brood chambers. Terrain, tile state, resources, and decorations remain separate data. Placeholder colors and shapes can later be replaced with individual pixel-art tile and object graphics.

Existing movement, digging, pathfinding, rubble, and material transport behavior is retained. The current provisional digging-grade bands remain depth-based and unchanged; the new terrain types do not yet have confirmed independent hardness or digging rules. No new ant specialties are implemented.

The modular world files are:

- `src/game/world/worldTypes.ts` defines terrain, tile states (`unknown`, `discovered`, `open`, `rubble`), and separate resource records.
- `src/game/world/terrainDefinitions.ts` describes the five placed soil-layer types and their display keys.
- `src/game/world/terrainPalette.ts` holds the replaceable placeholder color palette.
- `src/game/world/worldDecorationRenderer.ts` draws the concept-map landmarks as replaceable scenery.
- `src/game/world/worldGenerator.ts` owns the 320 × 120 starting grid, 24-pixel tiles, existing landmarks, and existing provisional depth checks.
- `src/game/world/worldMap.ts` provides the generated data and compatibility exports used by `WorldScene`.

Run `npm run test:world` to check map dimensions and bounds, layer placement, reference-map scenery, the connected seven-chamber nest, mostly solid underground, rubble walkability, and that already-open tiles are no longer valid dig targets. This check uses Node's built-in TypeScript stripping and requires Node 22.12 or newer; the production build still supports the Node versions listed above.

### A1 resource foundation (2026-10-22)

`src/game/simulation/` contains the Phaser-independent resource foundation. `createResourceSimulation(world, config?, initialStocks?)` creates one configurable game clock and a resource system from the existing food source, pond and individual furnished start stores. Call `simulation.advance(realSeconds)` to advance the clock and regenerate sources exactly once. The default test day is 600 seconds. A depleted food source rests for two game days, then regenerates at 20 units/day up to 200. Finite small-water sources are supported by the same API; no new puddles are placed in the map.

Each store has its own ID, position, resource, capacity and stock. `takeFromSource(id, requested)` and `takeFromStore(id, requested)` return the real `{ resource, amount }` removed. `depositInStore(id, load)` returns the accepted amount; the caller retains the remainder. Only operational, reachable stores can receive/supply resources. `getStoreTotals(resource)` sums usable stores only; individual snapshots still expose inaccessible stock without deleting it. Returned snapshots and registration inputs do not expose mutable internal state.

`simulationConfig.ts` holds provisional source/time/capacity values (10 food/water or 8 building-material units per tile). The existing 54-tile food store and 48-tile material store therefore have test capacities of 540 and 384. Stores start empty unless explicit valid stocks are provided; A1 does not choose a new starting colony or grant demo resources. No water store is invented: a real chamber and routes must be added deliberately during A2.

This is the tested data foundation, **not yet a running transport economy**. The active scene still shows the previous food animation and digging/material demo. It does not instantiate a competing economy or tick an unused second timer. Connecting real pickups/deliveries is A2; integrating the existing digging-material counter is B2. No consumption, shortage, UI, brood or egg-allocation system has been added. The side-view pond and existing gameplay graphics remain intact; `?view=pond` still opens the map at the pond.

Run **`npm test`** (Node 22.12+; verified here with Node 24.22.1) for all tests, including clock, sources, individual stores, world adapter and existing graphics/world checks. The command explicitly uses `--test-isolation=none`: in this environment the default isolated runner reported file-level results without individual test results, so the full suite runs in one process for verifiable per-test output. `npm run test:world` remains available for the original world-only check. See `docs/A1-RESSOURCEN-ERGEBNIS.md` for the handoff and `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md` for the authoritative order. Stop after A1; A2 requires user approval.

Before this draft, the placeholder files were copied to `versions/2026-10-20-before-world-camera/`. If you want to return to that version, ask Codex to restore it.

The earlier, smaller world-and-camera draft is preserved in `versions/2026-10-20-before-expanded-world/`.

### Preview on an iPhone

For an iPhone on the same network, start Vite with `npm run dev -- --host 0.0.0.0`, then open the VM's reachable network address and the port Vite prints (usually `5173`) in the iPhone browser. The VM's network address and iPhone access have not been verified here, so this preview method may need network setup outside the project.
