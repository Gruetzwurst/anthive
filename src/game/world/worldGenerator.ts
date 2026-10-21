import type {
  StartingWorld,
  BroodChamberKind,
  TerrainKind,
  TileState,
  WorldLandmarks,
  WorldDecoration,
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
export const BROOD_CHAMBER_SIZE = { width: 6, height: 4 } as const;

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

export function terrainAtDepth(column: number, row: number): TerrainKind {
  const depth = row - surfaceRow(column);
  // The reference's approximate 25/50/80/105 bands are scaled to the
  // starting map's ~100 underground rows, because its surface begins below row 0.
  if (depth < 21) return 'topsoil';
  if (depth < 42) return 'compactEarth';
  if (depth < 67) return 'clay';
  if (depth < 88) return 'stoneLayer';
  return 'deepRock';
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
const broodCorridorRow = nestBottomRow + 4;
const broodChamberTopRow = broodCorridorRow + 2;
const broodChamberBottomRow = broodChamberTopRow + BROOD_CHAMBER_SIZE.height;
const broodChambers: Record<BroodChamberKind, { left: number; right: number }> = {
  gathering: { left: CENTER_COLUMN - 13, right: CENTER_COLUMN - 7 },
  building: { left: CENTER_COLUMN - 6, right: CENTER_COLUMN },
  care: { left: CENTER_COLUMN + 2, right: CENTER_COLUMN + 8 },
  combat: { left: CENTER_COLUMN + 9, right: CENTER_COLUMN + 15 },
};
const broodDoorColumns = Object.values(broodChambers).map(({ left, right }) => Math.floor((left + right) / 2));
const broodCorridorLeft = Math.min(...broodDoorColumns);
const broodCorridorRight = Math.max(...broodDoorColumns);

function pointAtTile(column: number, row: number): WorldPoint {
  return { x: column * TILE_SIZE, y: row * TILE_SIZE };
}

function createStartingLandmarks(): WorldLandmarks {
  const nestChamberCenter = pointAtTile(CENTER_COLUMN, nestTopRow + 2);
  const broodChamberCenters = Object.fromEntries(
    Object.entries(broodChambers).map(([kind, bounds]) => [
      kind,
      pointAtTile((bounds.left + bounds.right) / 2, broodChamberTopRow + BROOD_CHAMBER_SIZE.height / 2),
    ]),
  ) as Record<BroodChamberKind, WorldPoint>;

  return {
    nestChamberCenter,
    queenChamberCenter: nestChamberCenter,
    foodStoreCenter: pointAtTile(storageStartColumn + 4.5, storageTopRow + 3),
    buildingMaterialStoreCenter: pointAtTile(CENTER_COLUMN - 10, materialStoreTopRow + 3),
    stoneOutcropCenter: pointAtTile(CENTER_COLUMN + 25.5, nestTopRow + 3.5),
    surfaceFoodSource: pointAtTile(CENTER_COLUMN - 5, nestSurfaceRow - 0.35),
    broodChamberCenters,
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
      const broodMainTunnel = column === CENTER_COLUMN && row >= nestBottomRow && row <= broodCorridorRow;
      const broodCrossTunnel = row === broodCorridorRow && column >= broodCorridorLeft && column <= broodCorridorRight;
      const broodRoomTunnel = broodDoorColumns.includes(column) && row > broodCorridorRow && row < broodChamberTopRow;
      const broodRoom = row >= broodChamberTopRow && row < broodChamberBottomRow
        && Object.values(broodChambers).some(({ left, right }) => column >= left && column < right);
      const stoneOutcrop = column >= CENTER_COLUMN + 23 && column < CENTER_COLUMN + 28
        && row >= nestTopRow && row < nestTopRow + 7;

      if (
        nestEntrance || passage || nestChamber || storageTunnel || storageChamber
        || materialStoreTunnel || materialStoreChamber || broodMainTunnel
        || broodCrossTunnel || broodRoomTunnel || broodRoom
      ) {
        return tile(terrainAtDepth(column, row), 'open');
      }
      if (row < surface) return tile('air', 'discovered');
      if (row === surface) return tile('surface', 'discovered');
      if (stoneOutcrop) return tile('stone', 'discovered');
      return tile(terrainAtDepth(column, row), 'unknown');
    }),
  );
}

function createStartingResources(landmarks: WorldLandmarks): WorldResource[] {
  return [{ id: 'surface-food-source', kind: 'foodSource', position: landmarks.surfaceFoodSource }];
}

function createStartingDecorations(): WorldDecoration[] {
  const atSurface = (column: number): WorldPoint => pointAtTile(column + 0.5, surfaceRow(column));
  const atDepth = (column: number, depth: number): WorldPoint => pointAtTile(column + 0.5, surfaceRow(column) + depth);
  const surfaceFeatures: Array<[string, WorldDecoration['kind'], number, number?]> = [
    ['western-forest', 'forest', 18, 1.2],
    ['northwest-trees', 'forest', 42, 0.8],
    ['flower-meadow', 'flowerPatch', 67, 1],
    ['start-meadow', 'flowerPatch', 168, 0.75],
    ['pond', 'pond', 91, 1],
    ['mountain-range', 'mountain', 124, 1.1],
    ['ancient-stump', 'treeStump', 207, 1],
    ['old-ruins', 'ruins', 258, 1],
    ['abandoned-watchtower', 'watchtower', 301, 0.9],
    ['deep-roots', 'roots', 208, 1],
  ];
  const undergroundFeatures: Array<[string, WorldDecoration['kind'], number, number, number?]> = [
    ['ore-west-shallow', 'mineral', 25, 34],
    ['gold-west', 'gold', 45, 58],
    ['mushrooms-west', 'mushrooms', 60, 43],
    ['ore-center', 'mineral', 112, 66],
    ['ore-east', 'gold', 195, 73],
    ['mushrooms-east', 'mushrooms', 230, 55],
    ['fossil-remains', 'fossil', 280, 82],
    ['crystal-west-deep', 'crystal', 26, 96, 1],
    ['crystal-center-deep', 'crystal', 145, 96, 0.75],
    ['crystal-east-deep', 'crystal', 286, 96, 1.1],
  ];

  return [
    ...surfaceFeatures.map(([id, kind, column, scale]) => ({
      id,
      kind,
      position: atSurface(column),
      ...(scale ? { scale } : {}),
    }) as WorldDecoration),
    ...undergroundFeatures.map(([id, kind, column, depth, scale]) => ({
      id,
      kind,
      position: atDepth(column, depth),
      ...(scale ? { scale } : {}),
    }) as WorldDecoration),
  ];
}

export function createStartingWorld(): StartingWorld {
  const landmarks = createStartingLandmarks();
  return {
    tiles: createStartingTiles(),
    resources: createStartingResources(landmarks),
    decorations: createStartingDecorations(),
    landmarks,
    dimensions: WORLD_CONFIG,
  };
}

export const startingWorld = createStartingWorld();

export const worldSize = {
  width: WORLD_CONFIG.columns * TILE_SIZE,
  height: WORLD_CONFIG.rows * TILE_SIZE,
};
