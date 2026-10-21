export type WorldCell = 'sky' | 'surface' | 'unknown' | 'open';

// These dimensions are temporary preview settings, not final world-design values.
export const TILE_SIZE = 24;
const WORLD_COLUMNS = 52;
const WORLD_ROWS = 22;
const SURFACE_ROW = 5;

export const worldMap: WorldCell[][] = Array.from({ length: WORLD_ROWS }, (_, row) =>
  Array.from({ length: WORLD_COLUMNS }, (_, column): WorldCell => {
    if (row < SURFACE_ROW) return 'sky';
    if (row === SURFACE_ROW) return 'surface';

    const passage = column >= 13 && column <= 14 && row >= 6 && row <= 12;
    const nestChamber = column >= 11 && column <= 18 && row >= 12 && row <= 15;
    return passage || nestChamber ? 'open' : 'unknown';
  }),
);

export const worldSize = {
  width: WORLD_COLUMNS * TILE_SIZE,
  height: WORLD_ROWS * TILE_SIZE,
};

export const nestChamberCenter = {
  x: 15 * TILE_SIZE,
  y: 14 * TILE_SIZE,
};
