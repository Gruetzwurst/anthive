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
  private ponds: Array<{ id: string; left: number; right: number; profile: ReturnType<typeof createPondProfile> }>;
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
      return { id: pond.id, left: profile.columns[0].x, right: last.x + last.width, profile };
    });
  }

  private surfaceRow(column: number): number {
    return this.world.tiles.findIndex(row => row[column]?.terrain !== 'air');
  }

  private cell(point: WorldPoint): WorldCellCoordinate {
    const tile = this.world.dimensions.tileSize;
    return { column: Math.floor(point.x / tile), row: Math.floor(point.y / tile) };
  }

  /** Exposed dry bank faces can be climbed; they are not tunnels through soil. */
  private bankFace(cell: WorldCellCoordinate): {x: number} | undefined {
    const size = this.world.dimensions.tileSize;
    for (const pond of this.ponds) for (const x of [pond.left-.5, pond.right+.5]) {
      const column=Math.floor(x/size), ground=this.surfaceRow(column);
      if (cell.column===column && cell.row>=ground-1 && cell.row<=Math.floor(pond.profile.waterY/size)) return {x};
    }
    return undefined;
  }

  private bankAlignment(cell: WorldCellCoordinate): number | undefined {
    const size=this.world.dimensions.tileSize;
    for (const pond of this.ponds) for (const x of [pond.left-.5,pond.right+.5])
      if(Math.floor(x/size)===cell.column)return x;
    return undefined;
  }
  private traversable(cell: WorldCellCoordinate, from?: WorldCellCoordinate): boolean {
    if(!this.passable(cell))return false;
    if(from && from.column!==cell.column) {
      for(const edge of [cell,from]) {
        const tile=this.world.tiles[edge.row]?.[edge.column];
        if(this.bankFace(edge) && tile?.terrain!=='air' && tile?.state!=='open')return false;
      }
    }
    return true;
  }

  intersectsWater(cell: WorldCellCoordinate): boolean {
    const size = this.world.dimensions.tileSize;
    return this.ponds.some(pond => pond.profile.columns.some(water =>
      cell.column*size < water.x+water.width && (cell.column+1)*size > water.x
      && cell.row*size < water.bottomY && (cell.row+1)*size > water.surfaceY));
  }

  private passable(cell: WorldCellCoordinate): boolean {
    const tile = this.world.tiles[cell.row]?.[cell.column];
    if (!tile) return false;
    if (this.intersectsWater(cell)) return false;
    if (this.bankFace(cell)) return true;
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

  isWalkable(point: WorldPoint): boolean {
    const cell=this.cell(point),tile=this.world.tiles[cell.row]?.[cell.column],face=this.bankFace(cell);
    if (face && tile?.terrain!=='air' && tile?.state!=='open') return this.passable(cell) && Math.abs(point.x-face.x)<=.75;
    return this.passable(cell);
  }

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
      cells = findGridPath(start, goal, (cell, from) => this.traversable(cell, from), this.traffic ? (cell, from) => this.traffic!.cellCost(cell, from) : undefined);
      if (this.traffic) {if (this.cache.size >= 2048) this.cache.clear();this.cache.set(key, cells);}
    }
    if (!cells) return null;
    const size = this.world.dimensions.tileSize;
    const points = cells.map(cell => {
      const bankX=this.bankAlignment(cell);
      const below = this.world.tiles[cell.row + 1]?.[cell.column];
      const onSurface = this.world.tiles[cell.row][cell.column].terrain === 'air'
        && below && below.terrain !== 'air' && below.state !== 'open';
      return { x: bankX ?? (cell.column + 0.5) * size, y: onSurface ? (cell.row + 1) * size - 3 : (cell.row + 0.5) * size };
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
    const accesses = new Map<string, WorldPoint>();
    const add = (point: WorldPoint, requireOpen: boolean) => {
      const cell = this.cell(point);
      if ((requireOpen && this.world.tiles[cell.row]?.[cell.column]?.state !== 'open') || !this.isWalkable(point)) return;
      accesses.set(`${cell.column},${cell.row}`, point);
    };
    // Touch the visible waterline after climbing down the exposed dry bank.
    // Soil behind that narrow face remains solid and cannot be walked through.
    for (const x of [pond.left - .5, pond.right + .5]) add({x, y:pond.profile.waterY}, false);
    // Real open dry cells immediately beside the drawn water become intakes.
    // Recompute from terrain on assignment so newly dug approaches are usable.
    for (const water of pond.profile.columns) {
      for (const x of [water.x - .5, water.x + water.width + .5]) {
        for (let row = Math.floor(water.surfaceY / size); row <= Math.floor((water.bottomY - .01) / size); row++) {
          const top = Math.max(water.surfaceY, row * size), bottom = Math.min(water.bottomY, (row + 1) * size);
          if (bottom > top) add({x, y: (top + bottom) / 2}, true);
        }
      }
      if (Math.abs(water.bottomY / size - Math.round(water.bottomY / size)) < 1e-8)
        add({x: water.x + water.width / 2, y: water.bottomY + .5}, true);
    }
    return [...accesses.values()];
  }
}
