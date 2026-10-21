export type WorldCell = 'sky' | 'surface' | 'unknown' | 'open';

// Preview only: one tenth of Terraria's small-world width and depth.
// These values are not a final ANTHIVE world-size decision.
export const TILE_SIZE = 24;
const WORLD_COLUMNS = 420;
const WORLD_ROWS = 120;
const CENTER_COLUMN = Math.floor(WORLD_COLUMNS / 2);

export function surfaceRow(column: number): number {
  const broadHill = Math.sin(column * 0.025) * 3;
  const smallRise = Math.sin(column * 0.11) * 1.5;
  return 18 + Math.round(broadHill + smallRise);
}

const nestSurfaceRow = surfaceRow(CENTER_COLUMN);
const nestTopRow = nestSurfaceRow + 7;
const nestBottomRow = nestTopRow + 4;

export const worldMap: WorldCell[][] = Array.from({ length: WORLD_ROWS }, (_, row) =>
  Array.from({ length: WORLD_COLUMNS }, (_, column): WorldCell => {
    const surface = surfaceRow(column);
    const nestEntrance = column >= CENTER_COLUMN - 1 && column <= CENTER_COLUMN && row === surface;
    const passage = column >= CENTER_COLUMN - 1 && column <= CENTER_COLUMN && row > surface && row < nestTopRow;
    const nestChamber = column >= CENTER_COLUMN - 5 && column <= CENTER_COLUMN + 5 && row >= nestTopRow && row < nestBottomRow;

    if (nestEntrance || passage || nestChamber) return 'open';
    if (row < surface) return 'sky';
    if (row === surface) return 'surface';
    return 'unknown';
  }),
);

export const worldSize = {
  width: WORLD_COLUMNS * TILE_SIZE,
  height: WORLD_ROWS * TILE_SIZE,
};

export const nestChamberCenter = {
  x: CENTER_COLUMN * TILE_SIZE,
  y: (nestTopRow + 2) * TILE_SIZE,
};

export const initialCameraY = (nestSurfaceRow - 1.5) * TILE_SIZE;
