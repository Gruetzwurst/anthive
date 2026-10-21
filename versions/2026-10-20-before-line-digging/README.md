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

The current screen is a visual draft of the world, camera, and a food-carrying route: a surface food source connects through the nest to an underground store. Seven simple ants move along the route as a visual demonstration. Drag with the mouse or a finger to look around. This preview is 320 × 120 tiles and is only for judging the look and camera; ANTHIVE's final world size is still open. Ant movement is illustrative only: there is no colony simulation, digging, resource accounting, or saved progress. `src/game/scenes/WorldScene.ts` draws the draft; `src/game/world/worldMap.ts` holds its temporary map. In a portrait window, the page asks you to turn the device; it does not lock device orientation.

Before this draft, the placeholder files were copied to `versions/2026-10-20-before-world-camera/`. If you want to return to that version, ask Codex to restore it.

The earlier, smaller world-and-camera draft is preserved in `versions/2026-10-20-before-expanded-world/`.

### Preview on an iPhone

For an iPhone on the same network, start Vite with `npm run dev -- --host 0.0.0.0`, then open the VM's reachable network address and the port Vite prints (usually `5173`) in the iPhone browser. The VM's network address and iPhone access have not been verified here, so this preview method may need network setup outside the project.
