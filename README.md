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

The current screen is a visual draft of the world, camera, resource transport, digging, and building-material transport. Seven collectors perform real food/water pickups and deliveries between reachable sources and separate stores. Two preview ants represent the builder group. Drag from an open tunnel into soil to issue a straight digging order; builder ants move smoothly along cleared tunnels and dig reachable tiles gradually. Each dug tile becomes blocked by a visible earth pile. The ant that dug it picks up and carries that one load; only then does the tile become walkable, so a narrow tunnel cannot be extended through a pile that has not been removed. After pickup, that ant carries its load to the separate building-material store while work can continue where the tunnel is clear. The store has one large static pile and a separate number that increases only when a load arrives. The food store remains separate. Soil gets harder in deeper bands, takes longer to dig, and eventually needs a higher test digging grade. Diagonal-only contact does not count as a passable tunnel; a second connected line may be needed. The grade button cycles through temporary test levels, including the stone outcrop. Borrowed ants from other groups are not assignable in this preview yet; when added, they will only carry. This is only a prototype: it has no full colony simulation, upgrade progression, resource costs, or saved progress. The test levels, worker count, carrying behavior, and depth bands do not set final game rules. Drag from soil or open sky to move the camera. The world preview is 320 × 120 tiles; ANTHIVE's final world size is still open. `src/game/scenes/WorldScene.ts` draws the draft; `src/game/world/worldMap.ts` holds its temporary map. In a portrait window, the page asks you to turn the device; it does not lock device orientation.

### World data structure

The generated 320 × 120 starting map uses 24-pixel tiles and translates the ANTHIVE world-map reference into a playable tile layout. It includes a forest, meadow, pond, mountain range, tree stump, ruins, watchtower, underground roots, mineral and crystal deposits, mushrooms, and a fossil. The infographic labels and legend are not drawn in the game. Most added landmarks are visual decorations without resource rules. In A2 the pond also supplies real water through its dry-bank access points; collectors do not cross its painted surface.

The world includes five vertical terrain bands: topsoil, compact earth, clay, stone layer, and deep rock. The underworld remains mostly solid. A connected starter nest contains the queen's chamber, food store, water store, building-material store, and four brood chambers. Terrain, tile state, resources, and decorations remain separate data. Placeholder colors and shapes can later be replaced with individual pixel-art tile and object graphics.

Existing movement, digging, pathfinding, rubble, and material transport behavior is retained. The current provisional digging-grade bands remain depth-based and unchanged; the new terrain types do not yet have confirmed independent hardness or digging rules. No new ant specialties are implemented.

The modular world files are:

- `src/game/world/worldTypes.ts` defines terrain, tile states (`unknown`, `discovered`, `open`, `rubble`), and separate resource records.
- `src/game/world/terrainDefinitions.ts` describes the five placed soil-layer types and their display keys.
- `src/game/world/terrainPalette.ts` holds the replaceable placeholder color palette.
- `src/game/world/worldDecorationRenderer.ts` draws the concept-map landmarks as replaceable scenery.
- `src/game/world/worldGenerator.ts` owns the 320 × 120 starting grid, 24-pixel tiles, existing landmarks, and existing provisional depth checks.
- `src/game/world/worldMap.ts` provides the generated data and compatibility exports used by `WorldScene`.

Run `npm run test:world` to check map dimensions and bounds, layer placement, reference-map scenery, the connected eight-chamber nest (including the added water store), mostly solid underground, rubble walkability, and that already-open tiles are no longer valid dig targets. This check uses Node's built-in TypeScript stripping and requires Node 22.12 or newer; the production build still supports the Node versions listed above.

### A1 resource foundation (2026-10-22)

`src/game/simulation/` contains the Phaser-independent resource foundation. `createResourceSimulation(world, config?, initialStocks?)` creates one configurable game clock and a resource system from the existing food source, pond and individual furnished start stores. Call `simulation.advance(realSeconds)` to advance the clock and regenerate sources exactly once. The default test day is 600 seconds. A depleted food source rests for two game days, then regenerates at 20 units/day up to 200. Finite small-water sources are supported by the same API; no new puddles are placed in the map.

Each store has its own ID, position, resource, capacity and stock. `takeFromSource(id, requested)` and `takeFromStore(id, requested)` return the real `{ resource, amount }` removed. `depositInStore(id, load)` returns the accepted amount; the caller retains the remainder. Only operational, reachable stores can receive/supply resources. `getStoreTotals(resource)` sums usable stores only; individual snapshots still expose inaccessible stock without deleting it. Returned snapshots and registration inputs do not expose mutable internal state.

`simulationConfig.ts` holds provisional source/time/capacity values (10 food/water or 8 building-material units per tile). The existing 54-tile food store and 48-tile material store therefore have test capacities of 540 and 384. Stores start empty unless explicit valid stocks are provided; A1 does not choose a new starting colony or grant demo resources. A1 left water storage absent; A2 now adds a separate connected 54-tile water chamber (test capacity 540) without replacing any existing room.

The A1 foundation is now connected to the running A2 food/water transport economy described below. The same single clock drives regeneration and transport; the former food demo loop is removed. Integrating the existing digging-material counter remains B2. A3 now adds adult consumption and shortage/recovery (see below); A4 adds its minimal resource HUD and priority controls below; brood and egg allocation remain later steps. The side-view pond and existing gameplay graphics remain intact; `?view=pond` still opens the map at the pond.

Run **`npm test`** (Node 22.12+; verified here with Node 24.22.1) for all tests, including clock, sources, individual stores, world adapter and existing graphics/world checks. The command explicitly uses `--test-isolation=none`: in this environment the default isolated runner reported file-level results without individual test results, so the full suite runs in one process for verifiable per-test output. `npm run test:world` remains available for the original world-only check. See `docs/A1-RESSOURCEN-ERGEBNIS.md` for the handoff and `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md` for the authoritative order. A2 through A4 and B1 were approved subsequently; B2 still requires user approval.

Before this draft, the placeholder files were copied to `versions/2026-10-20-before-world-camera/`. If you want to return to that version, ask Codex to restore it.

The earlier, smaller world-and-camera draft is preserved in `versions/2026-10-20-before-expanded-world/`.

### A2 real food and water transports (2026-10-22)

The seven preview collectors now use `gatheringSystem.ts` and `gatheringSimulation.ts` to walk to actual sources, pick up real loads and deposit them into matching individual stores. Food is deducted at pickup and stock increases only after arrival and unloading. Yellow loads carry food; blue loads carry water. Existing food-store labels and a new water-store label show the real delivered amounts. This is local chamber feedback, not the full A4 resource HUD.

A new 9 × 6-tile water chamber lies west of the building-material store, with a connecting tunnel. Original rooms retain their functions and positions. The food marker is aligned with its local grass surface. The side-view pond artwork is unchanged; collectors use an accessible dry bank as its interaction point rather than swimming or walking through the painted water. Water physics is not simulated.

`gridPathfinding.ts` is the extracted existing cardinal BFS, reused by both the original builders and collector navigation. Collectors follow exposed ground/walls and open tunnels, including step corners; unsupported sky, solid soil, diagonal-only tunnel gaps and a surface crossing of the pond are excluded. Existing builder work, rubble and material counters retain their previous rules.

The model exposes `setPriority('food' | 'water' | 'balanced')`, default `balanced`. Its provisional need estimate uses unfilled usable storage capacity, subtracts planned/in-flight deliveries and weights the preferred resource by 2. The priority is a weighting, not a ban on the other resource. Within a resource type, usable sources are ranked by practical route time; stores also account for planned deliveries and fill level. These heuristics and 5-unit loads, 78 px/s walking, 0.25-second interactions and one-second idle retries are central test values in `simulationConfig.ts`. The priority control UI belongs to A4; no unrequested group panel has been added.

If all suitable stores are full or no useful source is reachable, collectors idle and retry. A full store or blocked route during delivery retains the carried remainder and permits another suitable store/retry; no automatic store-to-store redistribution. Source stock and expected deliveries are reserved for planning but are never credited as stored resources. Finite sources keep the A1 recovery/regeneration behavior.

A3 subsequently adds adult consumption and shortages. Brood, group-management interface and transport traffic simulation remain later steps. The old building-material demo is still separate until B2. Read `docs/A2-TRANSPORTE-ERGEBNIS.md` for verification and the next stop point.

### Preview on an iPhone

For an iPhone on the same network, start Vite with `npm run dev -- --host 0.0.0.0`, then open the VM's reachable network address and the port Vite prints (usually `5173`) in the iPhone browser. The VM's network address and iPhone access have not been verified here, so this preview method may need network setup outside the project.


### A3 adult consumption and shortage (2026-10-22)

The running scene uses `createColonySimulation`, which extends the existing transport simulation using the same clock. The seven collectors, two actual builders and separately counted queen consume food and water from reachable operational individual stores; sources and loads in transit cannot feed the colony. Idle workers rest without a room and use 80% of the provisional active rate. Builders and collectors both slow down under shortage. Pause stops all these systems together.

`ADULT_SUPPLY_CONFIG` keeps all adult balance values editable: 1 food/water per active worker/day, separate queen rates of 1, warning through two missing days, then 85% work / 75% egg factor, after four missing days 65% work / 0% egg factor. Food and water are tracked independently; the worse factor applies. Recovery takes a provisional full day of supply; short deliveries give partial recovery without immediately resetting the shortage history. The egg factor is data only, without queen or brood behavior.

The user selected a provisional 5% worker loss rate per further shortage day after six complete days. Fractional losses accumulate against surviving workers, avoiding forced daily deaths in a small colony; food and water do not double this rate. The queen is excluded. Real workers are removed, reservations released and carried loads left on the ground without store credit. Automatic pickup of old dropped cargo/rubble remains B2, so these retained loads cannot yet be recollected. A4 subsequently adds the minimal resource HUD and priority controls described below. See `docs/A3-VERBRAUCH-UND-MANGEL-ERGEBNIS.md` for validation and remaining test decisions.


### A4 resource HUD and collection priority (2026-10-22)

A fixed compact panel shows usable food and water stocks/capacities separately, the actual delivered builder-material counter, shared game day, worker count, work rate and losses. Source information distinguishes remaining stock/regeneration, depletion recovery, unlimited pond water and unavailable paths. Supply warnings and recovery stay separate for food and water; no repeating toast messages are created.

Click or tap **Nahrung**, **Ausgeglichen** or **Wasser** to change the existing collector-group priority. The active choice is highlighted immediately. Existing journeys and carried loads continue normally. Priority is a preference: the other resource is still collected automatically. With the current provisional heuristic, permanent food preference can temporarily empty water supplies; the HUD makes the shortage visible so you can change priority. No balance values changed in A4.

`src/game/ui/economyOverview.ts` is a read-only projection of the A1–A3 models; `EconomyHud.ts` renders it in Phaser. Source reachability uses the existing pathfinder at start and after an opened excavation, rather than every frame. The panel refreshes at most every quarter second in normal updates; priority changes and material deliveries refresh immediately. The digging status and test digging-grade button now sit along the bottom. UI presses do not start camera drags or digging.

`npm test` includes eight real-length game days for each priority plus explicit source exhaustion/recovery. For actual mouse/touch, text bounds, input isolation, delivery/digging and warning checks, run **`python3 scripts/check-economy-browser.py`** with Firefox and installed npm packages. The script starts/stops its own local Vite and temporary Firefox instance and saves screenshots in ignored `node_modules/.cache/`. The small landscape window is a desktop-browser check, not an iPhone certification.

A4 was followed by the separately approved B1 worker groups below. Complete material economy (B2), nest-building tools and brood remain later steps. See `docs/A4-RESSOURCEN-HUD-ERGEBNIS.md` for changes, validation and remaining limitations.


### B1 workforce groups and assignments (2026-10-22)

Open **Gruppen** in the HUD. The table separates permanent specialization from assigned work. Choose a specialization, source assignment, target assignment and quantity, then **Zuweisen**. You manage group counts rather than individual ants. Existing seven gathering specialists and two building specialists retain their IDs and specialization. Care/combat specialists start at zero; no new population or brood is created.

The user selected **50% performance for explicitly assigned foreign work**, editable centrally in `WORKFORCE_CONFIG`. Gathering and building use this factor together with the existing adult-shortage work factor. A worker's specialization never changes when reassigned. Assignments persist through idling, source changes, shortages and recovery during the current game; full save/load remains unimplemented.

Reassigned collectors stop acquiring new loads, deliver real carried cargo, then walk along existing paths back into the nest before changing engine. Builders finish their current excavation and material delivery, then take no new building task. Pending transitions remain visible. A blocked load/return route keeps its cargo and position until continuation is possible; no teleport or automatic foreign fallback. All actors remain displayed after changing role.

Without suitable gathering tasks, workers rest at the existing reduced consumption and resume suitable work when it becomes available. Explicit care/combat assignments also rest while no such tasks exist; these later systems are not simulated. Resting does not require a room. Rest chambers remain a later construction feature.

`workforceSystem.ts` manages identity and group assignments; `createWorkforceSimulation` integrates existing gathering, builder adapters, supply and clock. Its `moveWorkers(specialization, from, to, count)` is the live group-edit API. The native modal handles quantity inputs and blocks map gestures; it can scroll on small landscape displays. The game continues running while it is open. Closing it restores the full map interaction.

`npm test` covers group invariants, actual cargo-safe transitions, physical returns, half-rate work, rest consumption, mortality, shared time accounting and unchanged native-group economics over three days. `python3 scripts/check-economy-browser.py` additionally covers actual form submission, nine unique visible worker IDs and 50% foreign digging followed by material delivery. See `docs/B1-ARBEITSGRUPPEN-ERGEBNIS.md`. Stop before B2.
