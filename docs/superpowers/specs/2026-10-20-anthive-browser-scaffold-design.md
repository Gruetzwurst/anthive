# Anthive Browser Scaffold Design

## Purpose

Create the smallest launchable and buildable browser project for Anthive, so the technical foundation can be checked before game mechanics are added. The user confirmed Phaser 3, TypeScript, and Vite for this initial scaffold; this does not settle future app packaging.

## Current state

The Anthive directory contains project documentation and empty working folders, but no game source, package manifest, or build configuration. `npm run dev` and `npm run build` both fail because `package.json` is absent. `ANTHIVE_Gesamtdokument_Entwicklung_Codex_v3.docx` in `inbox/` is the central project and design reference; it consolidates the earlier documents, so a separate Game Design Document is not required. Keep its distinctions between decided, provisional, and open points when later implementing game behavior. This technical scaffold does not settle or implement those game-design points.

## Approaches considered

1. **Minimal Vite + Phaser browser app (selected):** Add the application entry, a single diagnostic Phaser scene, scripts, and setup instructions. This proves the chosen stack with little code and leaves game design decisions untouched.
2. **Implement MVP phase 1 now:** Add tile world, surface and underground, camera, and touch behavior. This is larger than the requested first step and introduces design details that still need decisions.
3. **Create a multi-target web/mobile workspace:** Separate shared game logic and platform shells in a monorepo. The app target is not part of the MVP, so this adds structure before there is a second target.

## Design

Keep one Vite application at the Anthive project root. Use Phaser 3 for the game canvas and scene lifecycle, TypeScript for source, and Vite for local development and production builds. The first scene is a simple diagnostic screen labeled “ANTHIVE prototype” in a 16:9 landscape play area. Portrait viewports show a prompt to turn the device instead of the game; device orientation is not locked. It contains no simulation, world generation, controls, assets, or persistence.

Add a root `package.json` with `dev`, `build`, and `preview` scripts; `package-lock.json` for reproducible dependency installation; `vite.config.ts`; `tsconfig.json`; `index.html`; and focused source files under `src/` for Phaser startup, game configuration, and the diagnostic scene. Add `.gitignore` entries for generated dependencies and build output. Preserve the existing `docs/`, `assets/`, `inbox/`, and `export/` folders and the handoff documents.

Update `README.md` with Node/npm prerequisites, install/dev/build/preview commands, basic orientation to the source files, the fact that the screen is only a technical placeholder, and instructions for trying the Vite server on an iPhone on the same network. Clearly state that iPhone access has not been verified in this VM. Preserve Phaser's required MIT notice in `THIRD_PARTY_NOTICES.md`.

## Boundaries and open decisions

- Do not add colony, terrain, digging, resources, ants, touch controls, or local saves in this step.
- Do not choose balance values or implement provisional/open rules from the handoff.
- Do not add an iOS wrapper or a second application target.
- Use original programmatic placeholder styling only; do not copy Terraria assets or other third-party art.
- Preserve Phaser's required MIT license notice from the installed package in `THIRD_PARTY_NOTICES.md`.
- No automated test suite is required for this scaffold. Verify dependency installation, a production build, and a local development-server HTTP response. Do not claim browser or iPhone testing unless performed.

## Acceptance criteria

- `npm install` completes and writes a lockfile.
- `npm run dev` starts the local server and serves the app entry successfully.
- `npm run build` completes without TypeScript or Vite errors.
- The served app starts one Phaser scene and displays the diagnostic label in a 16:9 landscape viewport; portrait viewports show a turn-device prompt.
- README documents setup, commands, source layout, placeholder limitations, and unverified iPhone preview steps.
- `THIRD_PARTY_NOTICES.md` contains Phaser's required MIT notice from the installed Phaser package.
- No files outside the Anthive project are changed; existing handoff and workspace documents remain intact.
