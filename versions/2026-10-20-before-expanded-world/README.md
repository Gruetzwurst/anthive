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

The current screen is a first visual draft of the world and camera: a landscape soil cross-section with a surface, an open nest chamber, and unknown underground tiles. Drag with the mouse or a finger to look around. The preview contains no ants, digging, resources, simulation, or saved progress. Its world dimensions and tile appearance are temporary. `src/game/scenes/WorldScene.ts` draws the draft; `src/game/world/worldMap.ts` holds its temporary map. In a portrait window, the page asks you to turn the device; it does not lock device orientation.

Before this draft, the placeholder files were copied to `versions/2026-10-20-before-world-camera/`. If you want to return to that version, ask Codex to restore it.

### Preview on an iPhone

For an iPhone on the same network, start Vite with `npm run dev -- --host 0.0.0.0`, then open the VM's reachable network address and the port Vite prints (usually `5173`) in the iPhone browser. The VM's network address and iPhone access have not been verified here, so this preview method may need network setup outside the project.
