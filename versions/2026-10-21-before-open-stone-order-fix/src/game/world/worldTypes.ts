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

export type WorldResourceKind = 'foodSource' | 'food' | 'water' | 'mineral';

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

export type WorldLandmarks = {
  nestChamberCenter: WorldPoint;
  foodStoreCenter: WorldPoint;
  buildingMaterialStoreCenter: WorldPoint;
  stoneOutcropCenter: WorldPoint;
  surfaceFoodSource: WorldPoint;
};

export type StartingWorld = {
  tiles: WorldTile[][];
  resources: WorldResource[];
  landmarks: WorldLandmarks;
  dimensions: { columns: number; rows: number; tileSize: number };
};

export function isOpenTile(tile: WorldTile | undefined): boolean {
  return tile?.state === 'open';
}
