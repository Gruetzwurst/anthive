import { diggingGradeAt, startingWorld, surfaceRow, TILE_SIZE, worldSize, WORLD_CONFIG } from './worldGenerator.ts';

// Compatibility exports keep the current scene's landmark imports stable while
// the actual tile data now carries terrain and state separately.
export const worldMap = startingWorld.tiles;
export const worldResources = startingWorld.resources;
export const nestChamberCenter = startingWorld.landmarks.nestChamberCenter;
export const foodStoreCenter = startingWorld.landmarks.foodStoreCenter;
export const buildingMaterialStoreCenter = startingWorld.landmarks.buildingMaterialStoreCenter;
export const stoneOutcropCenter = startingWorld.landmarks.stoneOutcropCenter;
export const surfaceFoodSource = startingWorld.landmarks.surfaceFoodSource;
export const initialCameraY = (surfaceRow(Math.floor(WORLD_CONFIG.columns / 2)) - 1.5) * TILE_SIZE;

export { diggingGradeAt, surfaceRow, TILE_SIZE, worldSize, WORLD_CONFIG };
export { terrainDefinitions } from './terrainDefinitions.ts';
export { TERRAIN_PALETTE } from './terrainPalette.ts';
export { isOpenTile } from './worldTypes.ts';
export type { StartingWorld, TerrainKind, TileState, WorldResource, WorldResourceKind, WorldTile } from './worldTypes.ts';
