import type { StartingWorld, WorldCellCoordinate as Cell } from '../world/worldTypes.ts';
import { cellKey, cardinalNeighbors } from '../world/gridPathfinding.ts';
import { CHAMBER_CONFIG, SIMULATION_CONFIG } from './simulationConfig.ts';
import type { ResourceSystem } from './resourceSystem.ts';
import type { PlanType } from './constructionPlanning.ts';

export type ChamberSnapshot = {
  id: number; type: Exclude<PlanType, 'tunnel'>; cells: Cell[];
  capacity: number; operational: boolean; storeId?: string;
};
export function chamberCapacity(type: PlanType, area: number): number {
  if (type === 'tunnel') return 0;
  const perTile = type === 'rest' ? CHAMBER_CONFIG.restPlacesPerTile
    : type.startsWith('brood-') ? CHAMBER_CONFIG.broodPlacesPerTile
    : SIMULATION_CONFIG.storageCapacityPerTile[type as 'food' | 'water' | 'buildingMaterial'];
  return area * perTile;
}

/** Furnished rooms only. Resource stock stays in the existing ResourceSystem. */
export class ChamberSystem {
  private chambers = new Map<number, ChamberSnapshot>();
  private world: StartingWorld;
  private resources: ResourceSystem;
  constructor(world: StartingWorld, resources: ResourceSystem) {this.world = world; this.resources = resources;}

  registerFinished(room: {id: number; type: PlanType; cells: Cell[]}): void {
    if (room.type === 'tunnel' || this.chambers.has(room.id)) return;
    const capacity = chamberCapacity(room.type, room.cells.length);
    const storeId = ['food', 'water', 'buildingMaterial'].includes(room.type) ? `construction-${room.id}` : undefined;
    if (storeId) {
      const size = this.world.dimensions.tileSize, first = room.cells[0];
      this.resources.addStore({id: storeId, resource: room.type as 'food' | 'water' | 'buildingMaterial',
        position: {x: (first.column + .5) * size, y: (first.row + .5) * size}, capacity,
        amount: 0, status: 'operational', reachable: false});
    }
    this.chambers.set(room.id, {...room, type: room.type, cells: room.cells.map(cell => ({...cell})), capacity, operational: false, storeId});
    this.refreshAccess();
  }

  // One cardinal flood for all rooms when terrain changes, never per ant/frame.
  refreshAccess(): void {
    if (!this.chambers.size) return;
    const size = this.world.dimensions.tileSize, home = this.world.landmarks.nestChamberCenter;
    const origin = {column: Math.floor(home.x / size), row: Math.floor(home.y / size)};
    const open = (cell: Cell) => this.world.tiles[cell.row]?.[cell.column]?.state === 'open';
    const reachable = new Set<string>(), queue: Cell[] = [];
    if (open(origin)) {queue.push(origin); reachable.add(cellKey(origin));}
    for (let i = 0; i < queue.length; i++) for (const next of cardinalNeighbors(queue[i])) {
      const key = cellKey(next);
      if (open(next) && !reachable.has(key)) {reachable.add(key); queue.push(next);}
    }
    for (const room of this.chambers.values()) {
      room.operational = room.cells.every(cell => reachable.has(cellKey(cell)));
      if (room.storeId) this.resources.setStoreReachable(room.storeId, room.operational);
    }
  }

  getChambers(): ChamberSnapshot[] {
    return [...this.chambers.values()].map(room => ({...room, cells: room.cells.map(cell => ({...cell}))}));
  }
}
