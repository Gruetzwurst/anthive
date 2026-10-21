# Anthive Workspace Design

## Purpose

Create a simple, editable workspace for the Anthive game project inside the VM. The user needs a clear place to bring files from outside the VM, while the assistant needs a writable project directory. The project is expected to start as a browser game and may later become an app.

## Environment and constraints

- The workspace is `/home/paul/Desktop/anthive`, under the writable Desktop directory.
- `/home/paul/Desktop/Piet` points to `/media/sf_Piet`, which is mounted read-only in the VM.
- Files placed in `Piet` from the host can be copied into the project. Files created in the VM cannot currently be written back to `Piet`; the user can copy exports from the host if needed.
- The existing `/home/paul/Desktop/spiele` directory contains other game work and should remain separate.

## Directory layout

```text
anthive/
├── README.md
├── docs/          # project concept and decisions
├── assets/        # images, audio, and other game content
├── src/           # browser game source code
├── inbox/         # files transferred into the VM and copied from Piet
└── export/        # files prepared for transfer out of the VM
```

`inbox/` and `export/` are project-local working folders. `inbox/` is for files the user brings in; `export/` is for files the user wants to take out. Neither folder performs automatic synchronization.

## Scope

This workspace setup creates only the folders and a short README explaining their purpose and the manual transfer flow. It does not choose a game engine, add dependencies, generate game code, or configure a browser or app build. The `src/` directory leaves room for the browser-first project without committing to a later app framework.

## Acceptance criteria

- The project root exists at `/home/paul/Desktop/anthive`.
- The six listed top-level entries exist, with `docs/` available for project documentation.
- The README explains where to place project files and the read-only `Piet` transfer constraint.
- Existing files under `/home/paul/Desktop/spiele` are untouched.
