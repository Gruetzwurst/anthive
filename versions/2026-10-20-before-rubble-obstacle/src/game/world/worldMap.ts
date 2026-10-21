export type WorldCell = 'sky' | 'surface' | 'unknown' | 'stone' | 'open';

// Temporary visual preview dimensions; these are not a final ANTHIVE world-size decision.
export const TILE_SIZE = 24;
const WORLD_COLUMNS = 320;
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
const storageStartColumn = CENTER_COLUMN + 12;
const storageEndColumn = storageStartColumn + 9;
const storageTopRow = nestTopRow;
const storageBottomRow = nestTopRow + 6;
const storageTunnelRow = nestTopRow + 3;
const materialStoreLeftColumn = CENTER_COLUMN - 14;
const materialStoreRightColumn = CENTER_COLUMN - 6;
const materialStoreTopRow = nestTopRow;
const materialStoreBottomRow = materialStoreTopRow + 6;
const materialStoreTunnelRow = nestTopRow + 3;

// Prototype tiers only. Final material depths and upgrade thresholds remain open.
export function diggingGradeAt(column: number, row: number): number {
  const depth = row - surfaceRow(column);
  if (depth < 24) return 0;
  if (depth < 48) return 1;
  if (depth < 72) return 2;
  return 3;
}

export const worldMap: WorldCell[][] = Array.from({ length: WORLD_ROWS }, (_, row) =>
  Array.from({ length: WORLD_COLUMNS }, (_, column): WorldCell => {
    const surface = surfaceRow(column);
    const nestEntrance = column >= CENTER_COLUMN - 1 && column <= CENTER_COLUMN && row === surface;
    const passage = column >= CENTER_COLUMN - 1 && column <= CENTER_COLUMN && row > surface && row < nestTopRow;
    const nestChamber = column >= CENTER_COLUMN - 5 && column <= CENTER_COLUMN + 5 && row >= nestTopRow && row < nestBottomRow;
    const storageTunnel = column > CENTER_COLUMN + 5 && column <= storageStartColumn && row >= storageTunnelRow - 1 && row <= storageTunnelRow;
    const storageChamber = column >= storageStartColumn && column < storageEndColumn && row >= storageTopRow && row < storageBottomRow;
    const materialStoreTunnel = column === CENTER_COLUMN - 6 && row === materialStoreTunnelRow;
    const materialStoreChamber = column >= materialStoreLeftColumn && column < materialStoreRightColumn
      && row >= materialStoreTopRow && row < materialStoreBottomRow;
    const stoneOutcrop = column >= CENTER_COLUMN + 23 && column < CENTER_COLUMN + 28 && row >= nestTopRow && row < nestTopRow + 7;

    if (nestEntrance || passage || nestChamber || storageTunnel || storageChamber || materialStoreTunnel || materialStoreChamber) return 'open';
    if (row < surface) return 'sky';
    if (row === surface) return 'surface';
    if (stoneOutcrop) return 'stone';
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

export const foodStoreCenter = {
  x: (storageStartColumn + 4.5) * TILE_SIZE,
  y: (storageTopRow + 3) * TILE_SIZE,
};

export const buildingMaterialStoreCenter = {
  x: (CENTER_COLUMN - 10) * TILE_SIZE,
  y: (materialStoreTopRow + 3) * TILE_SIZE,
};

export const surfaceFoodSource = {
  x: (CENTER_COLUMN - 5) * TILE_SIZE,
  y: (nestSurfaceRow - 0.35) * TILE_SIZE,
};

export const stoneOutcropCenter = {
  x: (CENTER_COLUMN + 25.5) * TILE_SIZE,
  y: (nestTopRow + 3.5) * TILE_SIZE,
};

export const initialCameraY = (nestSurfaceRow - 1.5) * TILE_SIZE;
