import type {StartingWorld, WorldPoint, WorldCellCoordinate as Cell} from '../world/worldTypes.ts';
import {TRAFFIC_CONFIG} from './simulationConfig.ts';
import type {TrafficConfig} from './simulationConfig.ts';
import {nonNegativeFinite, positiveFinite} from './validation.ts';

/** Linear aggregation of individuals into straight narrow tunnel sections. */
export class TunnelTrafficSystem {
  private world: StartingWorld;
  private config: TrafficConfig;
  private counts = new Map<string, number>();
  private segments = new Map<string, string | null>();
  private untilRefresh = 0;
  private version = 0;
  private updates = 0;
  private agents = 0;
  constructor(world: StartingWorld, config: TrafficConfig = TRAFFIC_CONFIG) {
    positiveFinite(config.segmentTiles, 'segmentTiles');positiveFinite(config.refreshSeconds, 'refreshSeconds');
    nonNegativeFinite(config.freeAgentsPerSegment, 'freeAgentsPerSegment');nonNegativeFinite(config.delayPerExtraAgent, 'delayPerExtraAgent');
    positiveFinite(config.minimumSpeedFactor, 'minimumSpeedFactor');
    if (!Number.isInteger(config.segmentTiles) || config.minimumSpeedFactor > 1) throw new RangeError('Invalid traffic configuration');
    this.world = world; this.config = {...config};
  }
  get revision(): number {return this.version;}
  get stats() {return {revision: this.version, updates: this.updates, buckets: this.counts.size, agents: this.agents};}
  invalidateTopology(): void {this.segments.clear();this.counts.clear();this.untilRefresh = 0;this.version++;}
  private segment(point: WorldPoint): string | null {
    const size = this.world.dimensions.tileSize;
    const cell = {column: Math.floor(point.x / size), row: Math.floor(point.y / size)}, key = `${cell.column},${cell.row}`;
    if (this.segments.has(key)) return this.segments.get(key)!;
    const tile = this.world.tiles[cell.row]?.[cell.column];
    const open = (dc: number, dr: number) => this.world.tiles[cell.row + dr]?.[cell.column + dc]?.state === 'open';
    const horizontal = (open(-1, 0) || open(1, 0)) && !open(0, -1) && !open(0, 1);
    const vertical = (open(0, -1) || open(0, 1)) && !open(-1, 0) && !open(1, 0);
    const section = tile?.state !== 'open' || tile.terrain === 'air' ? null
      : horizontal ? `h:${cell.row}:${Math.floor(cell.column / this.config.segmentTiles)}`
      : vertical ? `v:${cell.column}:${Math.floor(cell.row / this.config.segmentTiles)}` : null;
    this.segments.set(key, section);return section;
  }
  advance(seconds: number, positions: readonly WorldPoint[]): void {
    nonNegativeFinite(seconds, 'seconds');this.untilRefresh -= seconds;
    if (this.untilRefresh > 1e-9) return;
    this.untilRefresh = this.config.refreshSeconds;this.updates++;this.agents = positions.length;
    const next = new Map<string, number>();
    for (const point of positions) {const key = this.segment(point);if (key) next.set(key, (next.get(key) ?? 0) + 1);}
    if (next.size !== this.counts.size || [...next].some(([key, count]) => this.counts.get(key) !== count)) this.version++;
    this.counts = next;
  }
  speedFactor(point: WorldPoint): number {
    const key = this.segment(point), count = key ? this.counts.get(key) ?? 0 : 0;
    return Math.max(this.config.minimumSpeedFactor, 1 / (1 + Math.max(0, count - this.config.freeAgentsPerSegment) * this.config.delayPerExtraAgent));
  }
  cellCost(cell: Cell, from?: Cell): number {
    const size = this.world.dimensions.tileSize;
    const factor = (at: Cell) => this.speedFactor({x: (at.column + .5) * size, y: (at.row + .5) * size});
    return 1 / Math.min(factor(cell), from ? factor(from) : 1);
  }
  travelSeconds(path: WorldPoint[], speed: number): number {
    let seconds = 0;
    for (let i = 1; i < path.length; i++) seconds += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y)
      / (speed * Math.min(this.speedFactor(path[i-1]), this.speedFactor(path[i])));
    return seconds;
  }
}
