import {
  BROOD_CHAMBER_SIZE,
  diggingGradeAt,
  startingWorld,
  surfaceRow,
  terrainAtDepth,
  TILE_SIZE,
  worldSize,
  WORLD_CONFIG,
} from './worldGenerator.ts';
import { terrainDefinitions } from './terrainDefinitions.ts';
import type { WorldTile } from './worldTypes.ts';

// Compatibility exports keep the current scene's landmark imports stable while
// the actual tile data now carries terrain and state separately.
export const worldMap = startingWorld.tiles;
export const worldResources = startingWorld.resources;
export const worldDecorations = startingWorld.decorations;
export const worldStorageChambers = startingWorld.storageChambers;
export const nestChamberCenter = startingWorld.landmarks.nestChamberCenter;
export const queenChamberCenter = startingWorld.landmarks.queenChamberCenter;
export const broodChamberCenters = startingWorld.landmarks.broodChamberCenters;
export const foodStoreCenter = startingWorld.landmarks.foodStoreCenter;
export const buildingMaterialStoreCenter = startingWorld.landmarks.buildingMaterialStoreCenter;
export const waterStoreCenter = startingWorld.landmarks.waterStoreCenter;
export const stoneOutcropCenter = startingWorld.landmarks.stoneOutcropCenter;
export const surfaceFoodSource = startingWorld.landmarks.surfaceFoodSource;
export const initialCameraY = (surfaceRow(Math.floor(WORLD_CONFIG.columns / 2)) - 1.5) * TILE_SIZE;

export function isDiggableTile(tile: WorldTile | undefined): boolean {
  if (!tile || tile.state === 'open' || tile.state === 'rubble') return false;
  return terrainDefinitions[tile.terrain].diggable;
}

export { BROOD_CHAMBER_SIZE, diggingGradeAt, surfaceRow, terrainAtDepth, TILE_SIZE, worldSize, WORLD_CONFIG };
export { terrainDefinitions };
export { TERRAIN_PALETTE } from './terrainPalette.ts';
export { isOpenTile } from './worldTypes.ts';
export type { StartingWorld, TerrainKind, TileState, WorldDecoration, WorldDecorationKind, WorldResource, WorldResourceKind, WorldTile } from './worldTypes.ts';
