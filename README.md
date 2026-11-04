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

C1 introduced egg identities and occupancy. C2 extends this below. See `docs/C1-KOENIGIN-EIERZUWEISUNG-ERGEBNIS.md`; `python3 scripts/check-economy-browser.py --queen-only` runs the targeted queen browser check.

### C2 brood development and care (2026-10-26)

Assigned brood now develops through egg (1 game day), larva (3), and pupa (2), then becomes an actual worker with the room's permanent specialization. Development uses the existing clock. Each effective nurse supports 10 brood; care coverage sets development speed between 25% and 100%. No care-only deaths or overstaffing bonus. Unassigned eggs do not develop, and births free real brood places for waiting eggs.

Explicitly assigned care workers count after completing their previous work/return. Foreign care retains 50% efficiency, adult work impairment reduces effective care capacity, and care counts as active adult work while reachable brood exists. This is a provisional shared care pool; room-specific nurse movement and feeding are not implemented here. Larval food/water logistics follow C3 and shortage handling follows C4.

**Gruppen → Königin und Eier** shows stages, births, care speed and chamber occupancy. Each newborn joins the existing worker engines, appears individually at its brood room and consumes adult resources from the following simulation step. `python3 scripts/check-economy-browser.py --brood-only` verifies actual stages, native care assignments and four births increasing visible workers from 9 to 13. See `docs/C2-BRUTENTWICKLUNG-ERGEBNIS.md`. C3 extends this below.

### C3 real larval supplies (2026-10-26)

Care workers physically collect food or water from existing stores and deliver it into each brood room's separate private reservoirs. Larvae consume 0.5 of each resource per game day; eggs/pupae consume none. Reservoir targets cover two days of current larval demand, refill starts at 50%, and each trip carries at most five units of one resource. Reservations prevent duplicate orders; shrinking demand preserves actual stock and cargo. No larvae means no new order.

**Gruppen → Königin und Eier** shows actual stock, target, in-transit supplies and empty reservoirs. Care cargo is individually visible on the map. Withdrawals, delivery, consumption, dropped loads and actual returns conserve resources. Care workers finish cargo safely before changing jobs. `python3 scripts/check-economy-browser.py --larvae-only` verifies the live flow. See `docs/C3-LARVENVERSORGUNG-ERGEBNIS.md`.

Resource shortages are recorded; development penalties/recovery are implemented in C4 below. The C2 care factor continues to apply. The local browser link stays development-current while Vite is running; reloading still starts a new game. **C4 follows below.**

### Visible queen, brood and actual egg carrying (2026-10-26)

The map now shows the queen, actual laid eggs, larvae and pupae. The queen's label shows time until the next egg; no startup brood or acceleration is added. Care workers carry a white egg from the queen to its reserved chamber, and development starts only after real arrival. Without assigned care workers eggs remain visibly waiting by the queen. Existing larval food/water deliveries and individual cargo remain visible, with small reservoir labels and feeding indicators in brood rooms.

Reload the local game, assign at least one worker to **Pflegen** under **Gruppen**, and pan between the queen and the lower brood rooms. The first egg takes about two real minutes at good supply. `python3 scripts/check-economy-browser.py --visible-brood-only` checks the real visible sequence. See `docs/SICHTBARE-BRUT-ERGEBNIS.md`. **C4 follows below.**


### Proportional egg quotas and C4 larval shortages (2026-10-26)

Changing one egg quota now redistributes the others proportionally to exactly 100%, with two decimal places. Disabled zero quotas stay zero; reducing the sole 100% quota splits the remainder equally. Apply commits the changes for future eggs.

Actual larval shortages warn for one game day, then limit development to the poorer resource coverage (minimum 25%). Overall larval progress uses MIN(care, resources). Full food/water supply restores the resource factor gradually over one day. User-approved test values: coverage below 25% is severe; after six full severe days, fractional losses accumulate at 5% of remaining affected larvae per further day. Brief relief pauses severe history; one full day without severe shortage resets it. Care shortage alone never kills brood. The group panel shows the distinct causes, recovery and losses.

`python3 scripts/check-economy-browser.py --c4-only` checks quota interaction, shortage/loss integration, renderer, mobile and pond. See `docs/C4-LARVENMANGEL-ERGEBNIS.md`. **C5 is complete; see below.**


### C5 integrated colony growth checks (2026-10-27)

Four additional model integration tests use the real starting world, existing
600-second day, physical egg and larval deliveries, and actual workforce engines.
They cover natural births in all four specializations, newborn adult consumption,
a full 50-egg buffer without nurses followed by a care bottleneck, supply
interruption and recovery, population/cargo conservation, pause, and identical
results for daily versus ten-second advance calls. The longest scenario runs
33 game days. Explicit test reserves do not change production starting stocks.

`npm test`: 229 checks pass; world checks and build also pass. No gameplay,
balance or graphics changes. See `docs/C5-WACHSTUM-ERGEBNIS.md` for scope and
limits. Next: D1.0 data inventory and persistence contract planning; save/load
implementation and the separate post-C5 chamber changes require their own scope.


### Post-C5 chamber updates (2026-10-27)

**Bauen → Form und Größe** now offers Klein/Mittel/Groß square templates as well
as the existing free brush/rectangle drawing. Position a template on the map,
then confirm. Area limits (128 standard / 162 brood tiles) and two empty tile
positions between chamber footprints, including diagonals, are validated in
both the preview and order submission. Conflicting neighbor cells are marked.

Idle workers physically reserve and occupy reachable furnished rest places.
Food/water consumption is 100% active, 80% resting outside or walking to a place,
and 50% actually resting there. Suitable work releases the place and starts
from the real position. New chambers gain natural modular furnishing as actual
material is installed; stores show actual inventory without granting free stock.
See `docs/POST-C5-KAMMERN-ERGEBNIS.md`. Run
`python3 -u scripts/check-economy-browser.py --post-c5-only` for the new browser
flow; the original `--construction-only` regression remains available.

### Playtest balance adjustment (2026-10-27)

The playable scene now starts with one additional native nurse (ten workers in
all). At full supply the queen lays one egg every two real minutes, and
brood develops in 1/3/2 real minutes plus actual egg transport. These current
settings live in `PLAYABLE_COLONY_CONFIG`; existing standalone model scenarios
can still use their original six-day parameters. Care coverage and actual
capacity are displayed separately: a native nurse supports ten brood, foreign
help five. Finished rooms display their room name on the map and in the list.
See `docs/2026-10-27-SPIELTEST-ANPASSUNGEN.md`;
`python3 -u scripts/check-economy-browser.py --playable-only` verifies this flow.

### Camera zoom and extra surface exits (2026-10-27)

Use **− / +** at the bottom right, or the mouse wheel over the map, to zoom
between fixed 25%, 50%, 100% and 200% levels. Click the percentage to reset to 100%. HUD and controls
keep their normal size. Tunnel plans may now break through the grass surface
and connect to walkable outdoor ground, creating additional exits. Functional
chambers remain underground; unsupported sky is not a valid tunnel location.
Run `python3 -u scripts/check-economy-browser.py --zoom-exits-only` for the
browser check. See `docs/2026-10-27-ZOOM-UND-AUSGAENGE.md`.


Zoom refinement (latest playtest preference): world labels retain their original
world font size and scale naturally with the map, including at 25%. Zoom in to
read smaller labels; the fixed HUD keeps its normal screen size.
Canvas display uses pixel-preserving scaling. The original building-material
store label is centered on its room. Pond collection still uses its two existing
bank access points; an underground tunnel does not create a water extraction site.

### Pond shoreline access correction (2026-10-27)

Water pickups now follow the actual rendered pond contour. Ants descend exposed
dry banks to the waterline; newly opened dry tunnel approaches beside water
become collection points. Route selection considers the real trip to each
intake and back to an individual store. Visible water cannot be crossed, even
through opened underlying tiles, and ants cannot enter bank faces through
undug soil. Existing trips finish safely; new assignments use current accesses.
`python3 -u scripts/check-economy-browser.py --pond-shore-only` verifies actual
pickup and delivery through a new side tunnel. See `docs/2026-10-27-TEICHZUGAENGE.md`.

The top resource bar can be collapsed/expanded with **− / +** at its right
edge. The compact header keeps Bauen/Gruppen available and frees the map below.
The tile atlas now has extruded private gutters and nearest-pixel sampling to
prevent adjacent-frame color fringes at zoom levels. Camera scrolling aligns
to screen pixels. Old continuous floor stripes in start rooms were removed.
`python3 -u scripts/check-economy-browser.py --hud-art-only` checks every atlas
frame gutter, multiple zoom levels, collapse/expand, freed-map input and touch.

Planning boundary update: tunnel plans must stop at the ground surface. Any
selected air or visible-water tile invalidates the whole draft; no partial
order is created. New exits through the surface remain possible, and normal
outdoor movement remains available.


While holding a brush or rectangle drawing, keep the pointer/finger near the
map edge to scroll continuously and extend the draft beyond the current view.
Useful rooms, including the furnished start nest, now have smooth continuous
material-themed interiors and wall linings. Rest uses wool-white trim, water
ice-blue, food pollen-yellow, material stores slate-blue, queen lavender, and
brood rooms mint/periwinkle/rose/berry. Tunnel colors stay unchanged; furnishing
still reflects actual installed work. See
`docs/2026-10-27-BAUPLAN-KAMERA-UND-RAUMFARBEN.md`.

Latest playtest adjustment: room palettes are less saturated and their surfaces
now meet earth directly, without the old curved beige tunnel lip around room
walls. Tunnel graphics and room dimensions stay unchanged. The playable scene
uses provisional food-source stock/capacity 1,000 and regeneration 60 per game
day; adult/larval consumption and real transport are retained. This addresses
the former 20/day source bottleneck for a test population of twenty collectors
plus three other adults and the queen. See
`docs/2026-10-27-RAUMRAENDER-UND-NAHRUNG.md`.

### Food network and concurrent construction (2026-10-27)

The playable world now has twelve finite food deposits (1,000 stock and 60/day
regeneration each). Nine are initially reachable, up to 540/day; all twelve
total up to 720/day. Collectors use existing travel-time/traffic-aware source
selection and can switch from exhausted deposits. The two 400-adult logistics
scenarios cover 150 and 200 actual carriers on flat connected routes, not a
rendered-scene performance guarantee.

Free builders now seek the next executable order when earlier work fronts are
already reserved; earlier feasible work still has priority. Digging, supplying
and furnishing retain reservations and physical material. Starting-room names
are drawn above the new room surfaces. See
`docs/2026-10-27-NAHRUNGSNETZ-UND-PARALLELBAU.md` and browser mode
`python3 -u scripts/check-economy-browser.py --food-network-only`.

Collector support target: at least three adults supplied per collector under
ordinary reachable routes. A real starting-world integration test verifies one
collector supplying three adults plus the queen for eight game days with actual
food/water pickups, movement, delivery and consumption; no virtual minimum
credits are applied. Source exhaustion and longer routes still matter.
All open passages now use flush straight terrain borders, including ordinary
tunnels; terrain/collision and construction costs are unchanged.

## D1.0: Speicherplanung (28.10.2026)

[Dateninventar und Speichervertrag](docs/2026-10-28-D1.0-DATENINVENTAR-UND-SPEICHERVERTRAG.md) dokumentieren den aktuellen Simulationszustand und die Anforderungen an D1.1. Noch keine Speicherimplementierung.

## D1.1: Speichergrundlage (28.10.2026)

[Snapshot und lokale Persistenz](docs/D1.1-SPEICHERN-LADEN-ERGEBNIS.md): vollständige Modellzustände, isoliertes Wiederherstellen und atomare IndexedDB-Speicherung. Menü, Speicherknöpfe, Autosave und Backups folgen in den nächsten D1-Paketen.

## D1.2: Autosave, Backups und Tab-Schutz (28.10.2026)

[Ergebnisbericht](docs/D1.2-AUTOSAVE-BACKUPS-TABS-ERGEBNIS.md): Speichern im HUD/Strg+S, aktive 5-Minuten-Autosaves, gestaffelte 15/60/180-Minuten-Sicherungen und exklusives Schreibrecht. Das Startmenü mit Spielstandauswahl folgt in D1.3; Reload startet bis dahin weiterhin eine neue Runde, ohne ältere Saves zu überschreiben.

## D1.3: Hauptmenü und Kolonieverwaltung (28.10.2026)

[Ergebnisbericht](docs/D1.3-HAUPTMENUE-KOLONIEN-ERGEBNIS.md): Start im Menü, letzte Kolonie fortsetzen, neue unabhängige Kolonien, Umbenennen, Dateiexport und bestätigtes Löschen. **Die frühere Zwischenlösung „Reload startet eine neue Runde“ ist damit abgelöst.** Dateiimport und Backup-Wiederherstellung folgen in D1.4.

## D1.4: Dateiimport und Wiederherstellung (28.10.2026)

[Ergebnisbericht](docs/D1.4-IMPORT-WIEDERHERSTELLUNG-ERGEBNIS.md): Datei als neue Kolonie importieren oder ein bewusst gewähltes Ziel nach Bestätigung ersetzen. Automatische Backups und zusätzliche Sicherheitskopien lassen sich exportieren und wiederherstellen. Ein gültiger bisheriger Stand wird zuvor zusätzlich gesichert; bei Platzmangel wird abgebrochen. D1.5 folgt mit Migration und Robustheitsabnahme.

## D1.5: Migration und Robustheit (03.11.2026)

[Ergebnisbericht](docs/D1.5-MIGRATION-ROBUSTHEIT-ERGEBNIS.md): bekannte ältere Spielstände sicher auf Schema2 übernehmen, Original vor dem Formatwechsel zusätzlich sichern und unbekannte Formate abweisen. Bei Speicherfehlern lässt sich der aktuelle ungesicherte Fortschritt exportieren. Abschluss mit304 erfolgreichen Tests, Build und Browserprüfungen für Migration, Import, Wiederherstellung, Speicherfehler und Autosave-/Tab-Schutz.

Das Spiel startet über `./start-anthive.sh` unter http://localhost:5173/.
[Start und Fortsetzung ohne laufenden Chat](WEITERMACHEN.md).

Performance (03.11.2026): Der statische Geländeuntergrund wird nur für sichtbare
Kartenabschnitte gerendert und beim ersten Besuch aufgebaut. Das reduziert die
Zeichenarbeit beim Heranzoomen ohne Änderung der Grafikqualität.
[Messung und Regression](docs/2026-11-03-PERFORMANCE-SICHTBARES-GELAENDE.md).

## D2.1: Koloniehöchststand und Berufsstufen

Die gesamte erwachsene Kolonie einschließlich Königin zählt zu den Meilensteinen
50/150/250/500. Der Höchststand bleibt bei Verlusten und Backup-Wiederherstellung
erhalten. Größe, Höchststand und Stufe stehen im Gruppenfenster. Schema3 ergänzt
den Fortschritt mit geschützter Migration der bisherigen Spielstände; konkrete
Berufsboni folgen in den nächsten D2-Paketen.
[Ergebnis und Prüfungen](docs/D2.1-KOLONIEFORTSCHRITT-ERGEBNIS.md).

## D2.2: Baumeisterinnen und Terrainfreigaben

Koloniestufen schalten die fünf Bodenarten frei und verkürzen Grab-/
Einrichtungszeiten. Der bisherige Test-Grabkraftschalter ist durch eine
Statusanzeige ersetzt. Laufende Arbeit bleibt erhalten; Transport und
Materialbilanz werden weiter real ausgeführt. Schema4 übernimmt ältere
Spielstände mit Originalschutz.
[Ergebnis und Prüfungen](docs/D2.2-BAUMEISTERINNEN-ERGEBNIS.md).

## D2.3: Sammlerinnen

Koloniestufen erhöhen Nahrung-/Wasser-Traglast bis15Einheiten und Grundtempo
bis105px/s. Fachfremde Sammlerinnen transportieren die volle entwickelte Last
mit dem bestehenden50%-Zeitfaktor. Reservierungen, Quellen und Lager bleiben
begrenzt; laufende Ladungen wachsen beim Upgrade nicht nachträglich.
Schema5 übernimmt die bisherigen Spielstände mit Originalschutz.
[Ergebnis und Prüfungen](docs/D2.3-SAMMLERINNEN-ERGEBNIS.md).

## D2.4: Brutpflege

Koloniestufen erhöhen die Pflegekapazität von10 auf15 Bruttiere je effektiver
Fachpflegerin und die reale Versorgungstraglast von5 auf12Einheiten. Tempo und
normale Brutdauer bleiben unverändert. Das Gruppenfenster zeigt die aktuellen
Fach-/Fremdpflegewerte. Schema6 übernimmt ältere Spielstände mit Originalschutz.
[Ergebnis und Prüfungen](docs/D2.4-BRUTPFLEGE-ERGEBNIS.md).

## D2.5: Königinnenkammer und besonderes Ei

Ab50/150/500/1000 Koloniemitgliedern werden zusätzliche Königinnenplätze frei
(am04.11.2026 zusätzlicher Platz bei50; die bisherigen Schwellen bleiben erhalten).
Kammern lassen sich als11×4-Vorlage oder frei ab44 Kacheln bauen, für3Material
je Kachel. Nach echter Einrichtung und Verbindung entsteht genau ein besonderes
Ei bei der Startkönigin; Pflegerinnen tragen es in die neue Kammer. Schema7
bewahrt Ei und Träger mit Originalschutz für alte Spielstände. Aufzucht und
autonome Eiablage weiterer erwachsener Königinnen folgen im eigenen PaketD2.6.
[Ergebnis und Prüfungen](docs/D2.5-KOENIGINNENKAMMER-EI-ERGEBNIS.md).


D2.6: Königliche Brut entwickelt sich nach Ankunft in ihrer Königinnenkammer
in12 Minuten(2 Ei /6 Larve /4 Puppe) bei vollständiger Pflege und Versorgung.
Sie bindet2 Pflegeplätze, Larven benötigen doppelte tägliche Nahrung/Wasser
über echte Pflegerinnenlieferungen. Ohne Pflege oder Larvenvorrat pausiert die
Entwicklung; königliche Brut stirbt nicht. Jede erwachsene Königin legt unter
den bestehenden Versorgungsregeln alle2 Minuten eigene normale Eier in ihrer
Kammer, mit eigenem Puffer/Fortschritt und gemeinsamen Berufsquoten. Pflegerinnen
bringen diese Eier in die spezialisierten Brutkammern. Schema8 migriert1–7
mit dem bestehenden atomaren Originalschutz; keine Offline-Entwicklung.

Erwachsene Königinnen werden jetzt physisch von Pflegerinnen versorgt. Jede
verbraucht5 Nahrung und5 Wasser je Spieltag aus ihrem eigenen Kammervorrat
(Kapazität je10). Fehlt eine Ressource, pausiert ihre Eiablage. Neue Vorräte
starten leer und werden tatsächlich beliefert. Kein doppelter Verbrauch aus
dem allgemeinen Lager; individuelle Countdown- und Vorratsanzeigen an jeder
Königin. Schema9 erhält alte Spielstände über Migration1–8 mit Originalschutz.
