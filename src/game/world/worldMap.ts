import {
  BROOD_CHAMBER_SIZE,
  diggingGradeAt,
  startingWorld,
  surfaceRow,
  terrainAtDepth,
  TILE_SIZE,
  worldSize as initialWorldSize,
  WORLD_CONFIG,
} from './worldGenerator.ts';
import { terrainDefinitions } from './terrainDefinitions.ts';
import type { StartingWorld, WorldTile } from './worldTypes.ts';

// Compatibility exports keep the current scene's landmark imports stable while
// the actual tile data now carries terrain and state separately.
export let worldMap = startingWorld.tiles;
export let worldResources = startingWorld.resources;
export let worldDecorations = startingWorld.decorations;
export let worldStorageChambers = startingWorld.storageChambers;
export let nestChamberCenter = startingWorld.landmarks.nestChamberCenter;
export let queenChamberCenter = startingWorld.landmarks.queenChamberCenter;
export let broodChamberCenters = startingWorld.landmarks.broodChamberCenters;
export let foodStoreCenter = startingWorld.landmarks.foodStoreCenter;
export let buildingMaterialStoreCenter = startingWorld.landmarks.buildingMaterialStoreCenter;
export let waterStoreCenter = startingWorld.landmarks.waterStoreCenter;
export let stoneOutcropCenter = startingWorld.landmarks.stoneOutcropCenter;
export let surfaceFoodSource = startingWorld.landmarks.surfaceFoodSource;
export let worldSize=initialWorldSize;
export const initialCameraY = (surfaceRow(Math.floor(WORLD_CONFIG.columns / 2)) - 1.5) * TILE_SIZE;

/** Only the active scene uses these compatibility bindings; each model owns its world. */
export function activateWorld(world:StartingWorld):void {
 worldMap=world.tiles;worldResources=world.resources;worldDecorations=world.decorations;worldStorageChambers=world.storageChambers;
 ({nestChamberCenter,queenChamberCenter,broodChamberCenters,foodStoreCenter,buildingMaterialStoreCenter,waterStoreCenter,stoneOutcropCenter,surfaceFoodSource}=world.landmarks);
 worldSize={width:world.dimensions.columns*world.dimensions.tileSize,height:world.dimensions.rows*world.dimensions.tileSize};
}

export function isDiggableTile(tile: WorldTile | undefined): boolean {
  if (!tile || tile.state === 'open' || tile.state === 'rubble') return false;
  return terrainDefinitions[tile.terrain].diggable;
}

export { BROOD_CHAMBER_SIZE, diggingGradeAt, surfaceRow, terrainAtDepth, TILE_SIZE, WORLD_CONFIG };
export { terrainDefinitions };
export { TERRAIN_PALETTE } from './terrainPalette.ts';
export { isOpenTile } from './worldTypes.ts';
export type { StartingWorld, TerrainKind, TileState, WorldDecoration, WorldDecorationKind, WorldResource, WorldResourceKind, WorldTile } from './worldTypes.ts';
