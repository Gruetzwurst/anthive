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

The A1 foundation is now connected to the running A2 food/water transport economy described below. The same single clock drives regeneration and transport; the former food demo loop is removed. B2 now integrates excavation material with actual A1 stores and a conserved physical material balance (see below). A3 now adds adult consumption and shortage/recovery (see below); A4 adds its minimal resource HUD and priority controls below; brood and egg allocation remain later steps. The side-view pond and existing gameplay graphics remain intact; `?view=pond` still opens the map at the pond.

Run **`npm test`** (Node 22.12+; verified here with Node 24.22.1) for all tests, including clock, sources, individual stores, world adapter and existing graphics/world checks. The command explicitly uses `--test-isolation=none`: in this environment the default isolated runner reported file-level results without individual test results, so the full suite runs in one process for verifiable per-test output. `npm run test:world` remains available for the original world-only check. See `docs/A1-RESSOURCEN-ERGEBNIS.md` for the handoff and `planung/00-START-HIER-CODEX-ARBEITSPLAN-UND-KONSISTENZPRUEFUNG.md` for the authoritative order. A2 through A4 and B1 through B4 were approved subsequently; stop before B5.

Before this draft, the placeholder files were copied to `versions/2026-10-20-before-world-camera/`. If you want to return to that version, ask Codex to restore it.

The earlier, smaller world-and-camera draft is preserved in `versions/2026-10-20-before-expanded-world/`.

### A2 real food and water transports (2026-10-22)

The seven preview collectors now use `gatheringSystem.ts` and `gatheringSimulation.ts` to walk to actual sources, pick up real loads and deposit them into matching individual stores. Food is deducted at pickup and stock increases only after arrival and unloading. Yellow loads carry food; blue loads carry water. Existing food-store labels and a new water-store label show the real delivered amounts. This is local chamber feedback, not the full A4 resource HUD.

A new 9 × 6-tile water chamber lies west of the building-material store, with a connecting tunnel. Original rooms retain their functions and positions. The food marker is aligned with its local grass surface. The side-view pond artwork is unchanged; collectors use an accessible dry bank as its interaction point rather than swimming or walking through the painted water. Water physics is not simulated.

`gridPathfinding.ts` is the extracted existing cardinal BFS, reused by both the original builders and collector navigation. Collectors follow exposed ground/walls and open tunnels, including step corners; unsupported sky, solid soil, diagonal-only tunnel gaps and a surface crossing of the pond are excluded. Existing builder work, rubble and material counters retain their previous rules.

The model exposes `setPriority('food' | 'water' | 'balanced')`, default `balanced`. Its provisional need estimate uses unfilled usable storage capacity, subtracts planned/in-flight deliveries and weights the preferred resource by 2. The priority is a weighting, not a ban on the other resource. Within a resource type, usable sources are ranked by practical route time; stores also account for planned deliveries and fill level. These heuristics and 5-unit loads, 78 px/s walking, 0.25-second interactions and one-second idle retries are central test values in `simulationConfig.ts`. The priority control UI belongs to A4; no unrequested group panel has been added.

If all suitable stores are full or no useful source is reachable, collectors idle and retry. A full store or blocked route during delivery retains the carried remainder and permits another suitable store/retry; no automatic store-to-store redistribution. Source stock and expected deliveries are reserved for planning but are never credited as stored resources. Finite sources keep the A1 recovery/regeneration behavior.

A3 subsequently adds adult consumption and shortages. Brood, group-management interface and transport traffic simulation remain later steps. B2 subsequently replaces the separate building-material demo with real excavation, transport and A1 storage. Read `docs/A2-TRANSPORTE-ERGEBNIS.md` for verification and the next stop point.

### Preview on an iPhone

For an iPhone on the same network, start Vite with `npm run dev -- --host 0.0.0.0`, then open the VM's reachable network address and the port Vite prints (usually `5173`) in the iPhone browser. The VM's network address and iPhone access have not been verified here, so this preview method may need network setup outside the project.


### A3 adult consumption and shortage (2026-10-22)

The running scene uses `createColonySimulation`, which extends the existing transport simulation using the same clock. The seven collectors, two actual builders and separately counted queen consume food and water from reachable operational individual stores; sources and loads in transit cannot feed the colony. Idle workers rest without a room and use 80% of the provisional active rate. Builders and collectors both slow down under shortage. Pause stops all these systems together.

`ADULT_SUPPLY_CONFIG` keeps all adult balance values editable: 1 food/water per active worker/day, separate queen rates of 1, warning through two missing days, then 85% work / 75% egg factor, after four missing days 65% work / 0% egg factor. Food and water are tracked independently; the worse factor applies. Recovery takes a provisional full day of supply; short deliveries give partial recovery without immediately resetting the shortage history. The egg factor is data only, without queen or brood behavior.

The user selected a provisional 5% worker loss rate per further shortage day after six complete days. Fractional losses accumulate against surviving workers, avoiding forced daily deaths in a small colony; food and water do not double this rate. The queen is excluded. Real workers are removed, reservations released and carried loads left on the ground without store credit. B2 adds pickup of old building-material piles; dropped food/water cargo remains retained separately and cannot yet be recollected. A4 subsequently adds the minimal resource HUD and priority controls described below. See `docs/A3-VERBRAUCH-UND-MANGEL-ERGEBNIS.md` for validation and remaining test decisions.


### A4 resource HUD and collection priority (2026-10-22)

A fixed compact panel shows usable food and water stocks/capacities separately, the actual delivered builder-material counter, shared game day, worker count, work rate and losses. Source information distinguishes remaining stock/regeneration, depletion recovery, unlimited pond water and unavailable paths. Supply warnings and recovery stay separate for food and water; no repeating toast messages are created.

Click or tap **Nahrung**, **Ausgeglichen** or **Wasser** to change the existing collector-group priority. The active choice is highlighted immediately. Existing journeys and carried loads continue normally. Priority is a preference: the other resource is still collected automatically. With the current provisional heuristic, permanent food preference can temporarily empty water supplies; the HUD makes the shortage visible so you can change priority. No balance values changed in A4.

`src/game/ui/economyOverview.ts` is a read-only projection of the A1–A3 models; `EconomyHud.ts` renders it in Phaser. Source reachability uses the existing pathfinder at start and after an opened excavation, rather than every frame. The panel refreshes at most every quarter second in normal updates; priority changes and material deliveries refresh immediately. The digging status and test digging-grade button now sit along the bottom. UI presses do not start camera drags or digging.

`npm test` includes eight real-length game days for each priority plus explicit source exhaustion/recovery. For actual mouse/touch, text bounds, input isolation, delivery/digging and warning checks, run **`python3 scripts/check-economy-browser.py`** with Firefox and installed npm packages. The script starts/stops its own local Vite and temporary Firefox instance and saves screenshots in ignored `node_modules/.cache/`. The small landscape window is a desktop-browser check, not an iPhone certification.

A4 was followed by the separately approved B1 worker groups below. B2 material economy follows below; nest-building tools and brood remain later steps. See `docs/A4-RESSOURCEN-HUD-ERGEBNIS.md` for changes, validation and remaining limitations.


### B1 workforce groups and assignments (2026-10-22)

Open **Gruppen** in the HUD. The table separates permanent specialization from assigned work. Choose a specialization, source assignment, target assignment and quantity, then **Zuweisen**. You manage group counts rather than individual ants. Existing seven gathering specialists and two building specialists retain their IDs and specialization. Care/combat specialists start at zero; no new population or brood is created.

The user selected **50% performance for explicitly assigned foreign work**, editable centrally in `WORKFORCE_CONFIG`. Gathering and building use this factor together with the existing adult-shortage work factor. A worker's specialization never changes when reassigned. Assignments persist through idling, source changes, shortages and recovery during the current game; full save/load remains unimplemented.

Reassigned collectors stop acquiring new loads, deliver real carried cargo, then walk along existing paths back into the nest before changing engine. Builders finish their current excavation and material delivery, then take no new building task. Pending transitions remain visible. A blocked load/return route keeps its cargo and position until continuation is possible; no teleport or automatic foreign fallback. All actors remain displayed after changing role.

Without suitable gathering tasks, workers rest at the existing reduced consumption and resume suitable work when it becomes available. Explicit care/combat assignments also rest while no such tasks exist; these later systems are not simulated. Resting does not require a room. Rest chambers remain a later construction feature.

`workforceSystem.ts` manages identity and group assignments; `createWorkforceSimulation` integrates existing gathering, builder adapters, supply and clock. Its `moveWorkers(specialization, from, to, count)` is the live group-edit API. The native modal handles quantity inputs and blocks map gestures; it can scroll on small landscape displays. The game continues running while it is open. Closing it restores the full map interaction.

`npm test` covers group invariants, actual cargo-safe transitions, physical returns, half-rate work, rest consumption, mortality, shared time accounting and unchanged native-group economics over three days. `python3 scripts/check-economy-browser.py` additionally covers actual form submission, nine unique visible worker IDs and 50% foreign digging followed by material delivery. See `docs/B1-ARBEITSGRUPPEN-ERGEBNIS.md`. B2 follows below.


### B2 excavation and material balance (2026-10-22)

Actual tile removal produces material once: loose earth 6 seconds / 1 unit, compact earth 12 / 2, clay 18 / 3, stone 30 / 4, deep rock **36 / 5** (user-selected highest + lowest existing values). All are provisional central `EXCAVATION_CONFIG` values. Existing digging-grade restrictions remain independent. B1 foreign-work efficiency and A3 shortage speed affect the same existing simulation clock.

Builders carry at most five units. Four units continue into executable digging; full loads are delivered, and partial loads are delivered at the end of executable work or before reassignment. Only actual arrival and accepted deposit increase the existing individual A1 material chamber stock. The HUD reads that same amount and capacity (384 initially), replacing the old separate counter. Empty stores show no stock mound.

Full/unreachable stores do not stop digging: surplus stays in non-blocking, visible piles at actual excavation sites. Old piles are collected only after executable digging. Locked/unreachable orders allow cleanup. Partial acceptance preserves the carried remainder; death leaves it at the real position. A pending group change cannot remove a worker carrying blocked material.

`BuildingMaterialSystem` tracks ground, carried, stored, site and consumed quantities: initial stock + actual yield = ground + carried + stored + at sites + consumed. `ExcavationSystem` owns the existing cardinal digging and transport jobs independently of Phaser; `WorldScene` renders its state. B4 adds real furnishing consumption and 24 starting material in the preview's existing material store (see below).

`npm test` covers actual yields/times, conservation, full stores, multiple builders, blocked paths, partial acceptance, redirection, work-rate/time integration and actual builder handoffs during digging/loading/delivery. `python3 scripts/check-economy-browser.py` covers the running map, controls, worker groups, half-rate digging, full-store continuation, ground cleanup, stock HUD and pond. See `docs/B2-MATERIALBILANZ-ERGEBNIS.md`. B3 follows below.


### B3 construction plans and tools (2026-10-22)

Choose **Bauen**, select a tunnel or chamber type and press **Zeichnen**. Combine **Pinsel** and **Rechteck** within one draft; **Karte verschieben** pans without losing the selection. **Bestätigen** creates the order; **Verwerfen** changes no terrain and creates no order. Selections use the existing cardinal grid and must form one connected area. Outside drawing mode, dragging pans the map and clicking a planned area opens its details.

Orders retain their IDs, selected chamber types and original FIFO order. Remote or hardness-locked plans remain visible and can be skipped temporarily. Later player-planned tunnels can unlock earlier rooms; connections are never generated automatically. Available targets are chosen from the reachable edge regardless of selection order. B4 extends this with parallel front allocation and furnishing (see below).

Click a site or select it in the **Bauen** dialog for separate excavation, furnishing and material information. **Pausieren/Fortsetzen** preserves the order and its rank, allows other executable orders and safely completes an active tile action. **Auftrag abbrechen** stops unfinished digging, preserves real open tiles and all material, and keeps a terminal history entry. Released partial excavation progress survives grade changes and loss of a builder. New blockage states generate a short notice once; deliberate pause does not generate an error.

Material requirements use approved configurable per-tile costs (stores/rest 2, brood 3). B4 replaces the original pending-furnishing state with actual supply and installation progress. Minimum-size/capacity activation belongs to B5. Existing resource economy, worker specializations, work factors and side-view pond remain unchanged. Plans persist within the running preview; reloading still starts a new game.

See `docs/B3-BAUPLANUNG-ERGEBNIS.md` for files, verification and remaining limitations. B4 follows below.


### B4 parallel excavation and real furnishing (2026-10-26)

Builders share the current FIFO site's reachable front, with one reservation per tile. A narrow front does not start a later site just to occupy idle builders. Excavated chambers receive real deliveries from the fastest reachable stocked material stores; there is no store-to-store redistribution. Source stock decreases only on pickup, cargo reaches the site physically, and each installed unit consumes site stock after **2 seconds** at full performance. Pause, shortage, worker loss and resumption preserve partial work; cancellation releases unused site material as actual ground piles.

The running map starts with **24 material** in its existing material store. Both new values are central provisional `CONSTRUCTION_CONFIG` values. Food/water and the standalone A1 resource foundation retain their existing initialization. Details now show actual installed, on-site and in-transit amounts. Fully furnished rooms generate one completion record; capacity/function activation and minimum-size validation remain B5.

Run the targeted browser check with `python3 scripts/check-economy-browser.py --furnishing-only`. See `docs/B4-PARALLELBAU-ERGEBNIS.md`. B5 extends this below.

### B5 chamber capacity (2026-10-26)

Chamber plans now require the centrally configurable selected minimum areas: 12 tiles for stores, 20 for specialized brood rooms, 16 for rest rooms. Connected free shapes are supported. Existing start rooms and other chamber plans cannot be reused as a different room.

Fully furnished, reachable rooms supply capacity: food/water 10 units per tile, building material 8, brood/rest 2 places. Each new store starts empty, keeps its own stock, and participates in existing real collection and construction deliveries. Details show actual usable capacity and operational status. Unfinished/unreachable rooms provide no usable capacity; unavailable stored stock is retained.

Brood development, rest-place occupancy and the additional rest-room consumption discount remain pending; the discount factor and specific special-room unlock thresholds are undecided. No research tree or invented unlock values were added. All approved basic room types remain buildable from the start.

`python3 scripts/check-economy-browser.py --chambers-only` verifies real furnishing and the resulting +120 food capacity, controls, mobile details and pond. See `docs/B5-KAMMERKAPAZITAETEN-ERGEBNIS.md`. B6 extends this below.

### B6 tunnel traffic (2026-10-26)

Collectors and builders share one traffic snapshot, including parked workers. Straight one-tile-wide tunnel sections slow movement under load without becoming blocked. Initial adjustable values: 4 tiles per section, 4 workers before slowdown, 15% extra travel time per additional worker, minimum speed 60%, refresh every 0.5 simulation seconds. Work and interaction times are unaffected.

The existing cardinal pathfinder supports weighted travel costs. Sources, delivery stores and construction supply use expected travel time including congestion. Routes stay fixed during a passable journey and are reconsidered for new jobs or actual blockage. Cached routes invalidate when traffic or excavation changes; every ant keeps its identity and individual rendering.

`python3 scripts/check-economy-browser.py --traffic-only` checks the live construction flow and nine visible workers, plus actual conserved deliveries with 500 individual collectors in an isolated browser simulation. This is not a 500-worker rendered-scene FPS benchmark. See `docs/B6-TUNNELVERKEHR-ERGEBNIS.md`. C1 extends this below.

### C1 queen and automatic egg allocation (2026-10-26)

Open **Gruppen** and scroll to **Königin und Eier**. Set percentages for the four permanent specializations, totaling 100%. Defaults are 25% each. Allocation is automatic, preserves small fractional quotas over time, and balances occupancy between usable rooms of the same type. Quota edits affect future eggs; existing waiting eggs keep their intended target. Full/unreachable types leave their eggs waiting without redirecting them into another specialty.

The existing clock and adult-supply factor drive 5 eggs per game day at full supply. The 50-egg queen buffer reduces laying to half rate from 75% full, quarter rate from 90%, and pauses at capacity. Existing start brood rooms provide 48 places each; additional finished reachable rooms use B5 capacity. All balance values remain centrally editable.

C1 preserves egg identities and occupancy but does not develop or hatch eggs yet. C2 adds development and care; larval resource logistics follow later. No additional workers are created in C1. See `docs/C1-KOENIGIN-EIERZUWEISUNG-ERGEBNIS.md`; `python3 scripts/check-economy-browser.py --queen-only` runs the targeted browser check. **Stop before C2.**
