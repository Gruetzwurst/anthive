import type {
  StartingWorld,
  TerrainKind,
  TileState,
  WorldLandmarks,
  WorldPoint,
  WorldResource,
  WorldTile,
} from './worldTypes.ts';

export const WORLD_CONFIG = {
  columns: 320,
  rows: 120,
  tileSize: 24,
} as const;

export const TILE_SIZE = WORLD_CONFIG.tileSize;
const CENTER_COLUMN = Math.floor(WORLD_CONFIG.columns / 2);

export function surfaceRow(column: number): number {
  const broadHill = Math.sin(column * 0.025) * 3;
  const smallRise = Math.sin(column * 0.11) * 1.5;
  return 18 + Math.round(broadHill + smallRise);
}

// These values preserve the current prototype behavior. They are not final
// balance values, and new terrain layers do not change them in this step.
export function diggingGradeAt(column: number, row: number): number {
  const depth = row - surfaceRow(column);
  if (depth < 24) return 0;
  if (depth < 48) return 1;
  if (depth < 72) return 2;
  return 3;
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

function pointAtTile(column: number, row: number): WorldPoint {
  return { x: column * TILE_SIZE, y: row * TILE_SIZE };
}

function createStartingLandmarks(): WorldLandmarks {
  return {
    nestChamberCenter: pointAtTile(CENTER_COLUMN, nestTopRow + 2),
    foodStoreCenter: pointAtTile(storageStartColumn + 4.5, storageTopRow + 3),
    buildingMaterialStoreCenter: pointAtTile(CENTER_COLUMN - 10, materialStoreTopRow + 3),
    stoneOutcropCenter: pointAtTile(CENTER_COLUMN + 25.5, nestTopRow + 3.5),
    surfaceFoodSource: pointAtTile(CENTER_COLUMN - 5, nestSurfaceRow - 0.35),
  };
}

function tile(terrain: TerrainKind, state: TileState): WorldTile {
  return { terrain, state };
}

function createStartingTiles(): WorldTile[][] {
  return Array.from({ length: WORLD_CONFIG.rows }, (_, row) =>
    Array.from({ length: WORLD_CONFIG.columns }, (_, column): WorldTile => {
      const surface = surfaceRow(column);
      const nestEntrance = column >= CENTER_COLUMN - 1 && column <= CENTER_COLUMN && row === surface;
      const passage = column >= CENTER_COLUMN - 1 && column <= CENTER_COLUMN && row > surface && row < nestTopRow;
      const nestChamber = column >= CENTER_COLUMN - 5 && column <= CENTER_COLUMN + 5 && row >= nestTopRow && row < nestBottomRow;
      const storageTunnel = column > CENTER_COLUMN + 5 && column <= storageStartColumn && row >= storageTunnelRow - 1 && row <= storageTunnelRow;
      const storageChamber = column >= storageStartColumn && column < storageEndColumn && row >= storageTopRow && row < storageBottomRow;
      const materialStoreTunnel = column === CENTER_COLUMN - 6 && row === materialStoreTunnelRow;
      const materialStoreChamber = column >= materialStoreLeftColumn && column < materialStoreRightColumn
        && row >= materialStoreTopRow && row < materialStoreBottomRow;
      const stoneOutcrop = column >= CENTER_COLUMN + 23 && column < CENTER_COLUMN + 28
        && row >= nestTopRow && row < nestTopRow + 7;

      if (nestEntrance || passage || nestChamber || storageTunnel || storageChamber || materialStoreTunnel || materialStoreChamber) {
        return tile('soil', 'open');
      }
      if (row < surface) return tile('air', 'discovered');
      if (row === surface) return tile('surface', 'discovered');
      if (stoneOutcrop) return tile('stone', 'discovered');
      return tile('soil', 'unknown');
    }),
  );
}

function createStartingResources(landmarks: WorldLandmarks): WorldResource[] {
  return [{ id: 'surface-food-source', kind: 'foodSource', position: landmarks.surfaceFoodSource }];
}

export function createStartingWorld(): StartingWorld {
  const landmarks = createStartingLandmarks();
  return {
    tiles: createStartingTiles(),
    resources: createStartingResources(landmarks),
    landmarks,
    dimensions: WORLD_CONFIG,
  };
}

export const startingWorld = createStartingWorld();

export const worldSize = {
  width: WORLD_CONFIG.columns * TILE_SIZE,
  height: WORLD_CONFIG.rows * TILE_SIZE,
};
