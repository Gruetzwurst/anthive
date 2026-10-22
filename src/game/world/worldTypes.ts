export type TerrainKind =
  | 'air'
  | 'surface'
  | 'soil'
  | 'topsoil'
  | 'stone'
  | 'compactEarth'
  | 'clay'
  | 'stoneLayer'
  | 'deepRock';

export type TileState = 'unknown' | 'discovered' | 'open' | 'rubble';

export const RESOURCE_KINDS = ['food', 'water', 'buildingMaterial'] as const;
export type ResourceKind = typeof RESOURCE_KINDS[number];
// A source/landmark kind is distinct from the material extracted from it.
export type WorldResourceKind = ResourceKind | 'foodSource' | 'mineral';
export type BroodChamberKind = 'gathering' | 'building' | 'care' | 'combat';
export type WorldDecorationKind =
  | 'forest' | 'flowerPatch' | 'pond' | 'mountain' | 'treeStump' | 'ruins' | 'watchtower'
  | 'roots' | 'mineral' | 'gold' | 'mushrooms' | 'crystal' | 'fossil';

export type WorldPoint = { x: number; y: number };
export type WorldCellCoordinate = { column: number; row: number };

export type WorldTile = {
  terrain: TerrainKind;
  state: TileState;
};

export type WorldResource = {
  id: string;
  kind: WorldResourceKind;
  position: WorldPoint;
};

// Metadata for the existing furnished start chambers, not a new room builder.
export type WorldStorageChamber = {
  id: string;
  resource: ResourceKind;
  position: WorldPoint;
  areaTiles: number;
};

// Visible landmarks from the concept map. Decorations do not affect collision,
// digging, pathfinding, or resource rules.
export type WorldDecoration = {
  id: string;
  kind: WorldDecorationKind;
  position: WorldPoint;
  scale?: number;
};

export type WorldLandmarks = {
  nestChamberCenter: WorldPoint;
  queenChamberCenter: WorldPoint;
  foodStoreCenter: WorldPoint;
  buildingMaterialStoreCenter: WorldPoint;
  waterStoreCenter: WorldPoint;
  stoneOutcropCenter: WorldPoint;
  surfaceFoodSource: WorldPoint;
  broodChamberCenters: Record<BroodChamberKind, WorldPoint>;
};

export type StartingWorld = {
  tiles: WorldTile[][];
  resources: WorldResource[];
  decorations: WorldDecoration[];
  storageChambers: WorldStorageChamber[];
  landmarks: WorldLandmarks;
  dimensions: { columns: number; rows: number; tileSize: number };
};

export function isOpenTile(tile: WorldTile | undefined): boolean {
  return tile?.state === 'open';
}
