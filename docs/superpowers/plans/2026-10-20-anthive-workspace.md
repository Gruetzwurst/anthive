# Anthive Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up a writable Anthive project folder on the Desktop with clear places for game files and manual file transfer.

**Architecture:** Keep Anthive separate from the existing `spiele/` folder at `/home/paul/Desktop/anthive`. Add a short root README and the agreed documentation, assets, source, inbox, and export directories. Files travel manually between the read-only `Piet` share and the project.

**Tech Stack:** Filesystem only; no runtime or dependencies.

**Spec:** `docs/superpowers/specs/2026-10-20-anthive-workspace-design.md`

## Global Constraints

- The workspace is `/home/paul/Desktop/anthive`, under the writable Desktop directory.
- `/home/paul/Desktop/Piet` points to `/media/sf_Piet`, which is mounted read-only in the VM.
- Files placed in `Piet` from the host can be copied into the project. Files created in the VM cannot currently be written back to `Piet`; the user can copy exports from the host if needed.
- The existing `/home/paul/Desktop/spiele` directory contains other game work and should remain separate.
- `inbox/` and `export/` do not synchronize automatically.
- Do not choose a game engine, add dependencies, generate game code, or configure a browser or app build.

## Review Focus

- A host-provided file is copied from `Piet` into `inbox/`; the README describes this manual step.
- A file prepared for host pickup goes into `export/`; the README explains that VM writes to `Piet` are unavailable.
- The setup leaves `spiele/` unchanged; verify its listing before and after setup.
- Empty working directories exist immediately after creation; add `.gitkeep` files to empty `assets/`, `src/`, `inbox/`, and `export/` folders.
- The README uses the agreed folder names exactly; inspect its contents after writing.

---

### Task 1: Create the Anthive workspace

**Files:**
- Create: `README.md`
- Create: `docs/`
- Create: `assets/.gitkeep`
- Create: `src/.gitkeep`
- Create: `inbox/.gitkeep`
- Create: `export/.gitkeep`

**Interfaces:**
- Consumes: The approved layout and transfer constraints in the spec.
- Produces: `/home/paul/Desktop/anthive` with root entries `README.md`, `docs/`, `assets/`, `src/`, `inbox/`, and `export/`.

- [ ] **Step 1: Record the existing `spiele/` listing**

Run: `find /home/paul/Desktop/spiele -maxdepth 1 -mindepth 1 -printf '%f\n' | sort`
Expected: Save the displayed names for comparison after setup.

- [ ] **Step 2: Create the workspace directories**

Create `/home/paul/Desktop/anthive/{docs,assets,src,inbox,export}` and place an empty `.gitkeep` in `assets/`, `src/`, `inbox/`, and `export/` so the empty folders remain visible to future version control.

- [ ] **Step 3: Write the root README**

Create `README.md` with a short description of Anthive as a browser-first game project that may later become an app, explain the purpose of each folder, and document manual transfer: copy host files from `Piet` into `inbox/`; prepare outbound files in `export/` and copy them from the host because `Piet` is read-only in the VM.

- [ ] **Step 4: Verify the workspace and existing games folder**

Run: `find /home/paul/Desktop/anthive -maxdepth 5 -print | sort`
Expected: `README.md`, the five named directories including the spec/plan documentation paths, and `.gitkeep` files in the four empty working directories are present.

Run the Step 1 listing command again.
Expected: It matches the saved listing exactly.
