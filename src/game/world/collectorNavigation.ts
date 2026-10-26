import type { StartingWorld, WorldCellCoordinate, WorldPoint } from './worldTypes.ts';
import type { ResourceSource } from '../simulation/resourceTypes.ts';
import { cardinalNeighbors, findGridPath } from './gridPathfinding.ts';
import { createPondProfile } from './pondProfile.ts';
import type { TunnelTrafficSystem } from '../simulation/tunnelTrafficSystem.ts';

export type GatheringNavigation = {
  findPath(from: WorldPoint, to: WorldPoint): WorldPoint[] | null;
  canMove(from: WorldPoint, to: WorldPoint): boolean;
  sourceAccessPoints(source: ResourceSource): WorldPoint[];
  speedFactor?(position: WorldPoint): number;
  travelSeconds?(path: WorldPoint[], speed: number): number;
};

export class CollectorNavigation implements GatheringNavigation {
  private world: StartingWorld;
  private ponds: Array<{ id: string; left: number; right: number }>;
  private traffic?: TunnelTrafficSystem;
  private cache = new Map<string, WorldCellCoordinate[] | null>();
  private cacheRevision = -1;

  constructor(world: StartingWorld, traffic?: TunnelTrafficSystem) {
    this.world = world;
    this.traffic = traffic;
    const tile = world.dimensions.tileSize;
    this.ponds = world.decorations.filter(item => item.kind === 'pond').map(pond => {
      const profile = createPondProfile(pond.position.x, tile, pond.scale ?? 1, column => this.surfaceRow(column));
      const last = profile.columns[profile.columns.length - 1];
      return { id: pond.id, left: profile.columns[0].x, right: last.x + last.width };
    });
  }

  private surfaceRow(column: number): number {
    return this.world.tiles.findIndex(row => row[column]?.terrain !== 'air');
  }

  private cell(point: WorldPoint): WorldCellCoordinate {
    const tile = this.world.dimensions.tileSize;
    return { column: Math.floor(point.x / tile), row: Math.floor(point.y / tile) };
  }

  private passable(cell: WorldCellCoordinate): boolean {
    const tile = this.world.tiles[cell.row]?.[cell.column];
    if (!tile) return false;
    if (tile.state === 'open') return true;
    if (tile.terrain !== 'air') return false;
    const centerX = (cell.column + 0.5) * this.world.dimensions.tileSize;
    if (this.ponds.some(pond => centerX >= pond.left && centerX < pond.right)) return false;
    // Crawl only next to actual ground/walls, never through unsupported sky.
    const supports = [...cardinalNeighbors(cell),
      { column: cell.column - 1, row: cell.row - 1 }, { column: cell.column + 1, row: cell.row - 1 },
      { column: cell.column - 1, row: cell.row + 1 }, { column: cell.column + 1, row: cell.row + 1 },
    ];
    return supports.some(next => {
      const adjacent = this.world.tiles[next.row]?.[next.column];
      // Open nest entrances retain a soil terrain kind: their air cell above
      // is the doorway transition between the ground contour and the tunnel.
      return adjacent && adjacent.terrain !== 'air';
    });
  }

  isWalkable(point: WorldPoint): boolean { return this.passable(this.cell(point)); }

  canMove(from: WorldPoint, to: WorldPoint): boolean {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / (this.world.dimensions.tileSize / 4)));
    for (let index = 0; index <= steps; index++) {
      if (!this.isWalkable({ x: from.x + (to.x - from.x) * index / steps, y: from.y + (to.y - from.y) * index / steps })) return false;
    }
    return true;
  }

  findPath(from: WorldPoint, to: WorldPoint): WorldPoint[] | null {
    if (this.cacheRevision !== this.traffic?.revision) {this.cache.clear();this.cacheRevision = this.traffic?.revision ?? -1;}
    const start = this.cell(from), goal = this.cell(to), key = `${start.column},${start.row}>${goal.column},${goal.row}`;
    let cells = this.traffic ? this.cache.get(key) : undefined;
    if (cells === undefined) {
      cells = findGridPath(start, goal, cell => this.passable(cell), this.traffic ? (cell, from) => this.traffic!.cellCost(cell, from) : undefined);
      if (this.traffic) {if (this.cache.size >= 2048) this.cache.clear();this.cache.set(key, cells);}
    }
    if (!cells) return null;
    const size = this.world.dimensions.tileSize;
    const points = cells.map(cell => {
      const below = this.world.tiles[cell.row + 1]?.[cell.column];
      const onSurface = this.world.tiles[cell.row][cell.column].terrain === 'air'
        && below && below.terrain !== 'air' && below.state !== 'open';
      return { x: (cell.column + 0.5) * size, y: onSurface ? (cell.row + 1) * size - 3 : (cell.row + 0.5) * size };
    });
    // Keep physical endpoints, including positions part-way along a cell.
    return [{ ...from }, ...points, { ...to }];
  }

  speedFactor(position: WorldPoint): number {return this.traffic?.speedFactor(position) ?? 1;}
  travelSeconds(path: WorldPoint[], speed: number): number {
    return this.traffic?.travelSeconds(path, speed) ?? path.reduce((sum, point, i) => sum + (i ? Math.hypot(point.x-path[i-1].x, point.y-path[i-1].y) / speed : 0), 0);
  }

  sourceAccessPoints(source: ResourceSource): WorldPoint[] {
    const pond = this.ponds.find(item => item.id === source.id);
    if (!pond) return [{ ...source.position }];
    const size = this.world.dimensions.tileSize;
    return [Math.floor(pond.left / size) - 1, Math.ceil(pond.right / size)].map(column => ({
      x: (column + 0.5) * size, y: this.surfaceRow(column) * size - 3,
    }));
  }
}
