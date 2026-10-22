import type { StartingWorld, WorldCellCoordinate, WorldPoint, WorldTile } from '../world/worldTypes.ts';
import { terrainDefinitions } from '../world/terrainDefinitions.ts';
import { diggingGradeAt } from '../world/worldGenerator.ts';
import { cardinalNeighbors, cellKey, findGridPath } from '../world/gridPathfinding.ts';
import { ResourceSystem } from './resourceSystem.ts';
import { BuildingMaterialSystem } from './buildingMaterialSystem.ts';
import { EXCAVATION_CONFIG } from './simulationConfig.ts';
import type { ExcavationConfig } from './simulationConfig.ts';
import { nonNegativeFinite, positiveFinite } from './validation.ts';

type Cell = WorldCellCoordinate;
type Order = { id: number; cells: Cell[]; index: number };
type Job = {
  kind: 'dig' | 'pickup' | 'deliver';
  phase: 'walking' | 'digging' | 'loading' | 'unloading';
  path: WorldPoint[]; pathIndex: number; progress: number; duration: number;
  target?: Cell; order?: Order; orderIndex?: number; pileId?: string; storeId?: string; amount?: number;
};
type Builder = { id: string; position: WorldPoint; job: Job | null; status: string };
const EPS = 1e-9;
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y);
export function requiredDiggingGrade(cell: Cell, tile: WorldTile): number {
  return tile.terrain === 'stone' ? 3 : diggingGradeAt(cell.column, cell.row);
}

/** Existing cardinal digging/haul workflow, separated from Phaser for B2 tests. */
export class ExcavationSystem {
  readonly materials: BuildingMaterialSystem;
  private world: StartingWorld;
  private resources: ResourceSystem;
  private config: ExcavationConfig;
  private builders = new Map<string, Builder>();
  private orders: Order[] = [];
  private reservations = new Set<string>();
  private changed: Cell[] = [];
  private grade = 0;
  private nextOrderId = 1;

  constructor(world: StartingWorld, resources: ResourceSystem, config: ExcavationConfig = EXCAVATION_CONFIG) {
    for (const key of ['speed', 'carryCapacity', 'interactionSeconds', 'maxStepSeconds'] as const) positiveFinite(config[key], key);
    for (const rule of Object.values(config.terrain)) { positiveFinite(rule.seconds, 'dig seconds'); nonNegativeFinite(rule.yield, 'material yield'); }
    this.world = world; this.resources = resources;
    this.config = { ...config, terrain: Object.fromEntries(Object.entries(config.terrain).map(([kind, rule]) => [kind, { ...rule }])) as ExcavationConfig['terrain'] };
    this.materials = new BuildingMaterialSystem(resources, config.carryCapacity);
  }
  setDiggingGrade(grade: number): void {
    if (!Number.isInteger(grade) || grade < 0) throw new RangeError('Digging grade must be a nonnegative integer');
    this.grade = grade;
    for (const worker of this.builders.values()) {
      const job = worker.job;
      if (job?.kind === 'dig' && requiredDiggingGrade(job.target!, this.tile(job.target!)!) > grade) {
        this.clearJob(worker);
        worker.status = 'Grabkraft fehlt · Auftrag wartet';
      }
    }
  }
  addBuilder(id: string, position: WorldPoint): void {
    if (!id.trim() || this.builders.has(id)) throw new Error('Builder needs a unique non-empty ID');
    if (!this.open(this.cell(position))) throw new Error('Builder must start in an open tunnel');
    this.builders.set(id, { id, position: { ...position }, job: null, status: 'Bereit' });
  }
  removeBuilder(id: string): void {
    const worker = this.builders.get(id);
    if (!worker) return;
    this.clearJob(worker);
    this.materials.dropCarrier(id, worker.position);
    this.builders.delete(id);
  }
  getBuilders() {
    return [...this.builders.values()].map(worker => ({ id: worker.id, position: { ...worker.position },
      load: this.materials.getCarried(worker.id), resting: worker.job === null,
      readyToLeave: worker.job === null && this.materials.getCarried(worker.id) === 0,
      status: worker.status,
      job: worker.job ? { kind: worker.job.kind, phase: worker.job.phase, duration: worker.job.duration, progress: worker.job.progress,
        target: worker.job.target ? { ...worker.job.target } : undefined, storeId: worker.job.storeId, pileId: worker.job.pileId } : null,
    }));
  }
  getOrders() { return this.orders.map(order => ({ ...order, cells: order.cells.map(cell => ({ ...cell })) })); }
  drainChangedCells(): Cell[] { const changed = this.changed; this.changed = []; return changed; }
  addOrder(cells: Cell[]): number {
    if (!cells.length || cells.some(cell => !Number.isInteger(cell.column) || !Number.isInteger(cell.row) || !this.tile(cell))) throw new RangeError('Dig order contains invalid cells');
    const id = this.nextOrderId++;
    this.orders.push({ id, cells: cells.map(cell => ({ ...cell })), index: 0 });
    return id;
  }
  private cell(position: WorldPoint): Cell {
    return { column: Math.floor(position.x / this.world.dimensions.tileSize), row: Math.floor(position.y / this.world.dimensions.tileSize) };
  }
  private center(cell: Cell): WorldPoint {
    return { x: (cell.column + .5) * this.world.dimensions.tileSize, y: (cell.row + .5) * this.world.dimensions.tileSize };
  }
  private tile(cell: Cell): WorldTile | undefined { return this.world.tiles[cell.row]?.[cell.column]; }
  private open(cell: Cell): boolean { return this.tile(cell)?.state === 'open'; }
  private rule(tile: WorldTile) {
    if (tile.terrain === 'air' || tile.terrain === 'surface' || !terrainDefinitions[tile.terrain].diggable) return null;
    return this.config.terrain[tile.terrain];
  }
  private diggable(cell: Cell): boolean {
    const tile = this.tile(cell);
    return !!tile && tile.state !== 'open' && tile.state !== 'rubble' && !!this.rule(tile);
  }
  private path(from: WorldPoint, to: WorldPoint): WorldPoint[] | null {
    const cells = findGridPath(this.cell(from), this.cell(to), cell => this.open(cell));
    return cells ? [...cells.map(cell => this.center(cell)), { ...to }] : null;
  }
  private canMove(from: WorldPoint, to: WorldPoint): boolean {
    const steps = Math.max(1, Math.ceil(distance(from, to) / (this.world.dimensions.tileSize / 4)));
    for (let i = 0; i <= steps; i++) if (!this.open(this.cell({ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }))) return false;
    return true;
  }
  private clearJob(worker: Builder): void {
    if (worker.job?.kind === 'dig' && worker.job.target) this.reservations.delete(cellKey(worker.job.target));
    worker.job = null;
  }
  private findDig(worker: Builder): Job | null {
    for (const order of this.orders) {
      while (order.index < order.cells.length && !this.diggable(order.cells[order.index])) order.index++;
      if (order.index >= order.cells.length) continue;
      const target = order.cells[order.index], tile = this.tile(target)!;
      if (this.reservations.has(cellKey(target)) || requiredDiggingGrade(target, tile) > this.grade) continue;
      const paths = cardinalNeighbors(target).filter(cell => this.open(cell))
        .map(cell => this.path(worker.position, this.center(cell))).filter((path): path is WorldPoint[] => path !== null)
        .sort((a, b) => a.length - b.length);
      if (!paths[0]) continue;
      return { kind: 'dig', phase: 'walking', path: paths[0], pathIndex: 0, target: { ...target },
        order, orderIndex: order.index, progress: 0, duration: this.rule(tile)!.seconds };
    }
    return null;
  }
  private chooseStore(worker: Builder) {
    return this.resources.listStores().filter(store => store.resource === 'buildingMaterial'
      && store.status === 'operational' && store.reachable && store.amount < store.capacity - EPS)
      .map(store => ({ store, path: this.path(worker.position, store.position) }))
      .filter((choice): choice is typeof choice & { path: WorldPoint[] } => choice.path !== null)
      .sort((a, b) => a.path.length - b.path.length || a.store.id.localeCompare(b.store.id))[0];
  }
  private pickup(worker: Builder, pileId: string): Job | null {
    if (this.materials.getCarried(worker.id) >= this.config.carryCapacity - EPS || !this.chooseStore(worker)) return null;
    const pile = this.materials.getGround().find(pile => pile.id === pileId);
    if (!pile) return null;
    const reserved = [...this.builders.values()].filter(other => other !== worker && other.job?.pileId === pileId)
      .reduce((sum, other) => sum + (other.job?.amount ?? 0), 0);
    const amount = Math.min(pile.amount - reserved, this.config.carryCapacity - this.materials.getCarried(worker.id));
    const path = amount > EPS ? this.path(worker.position, pile.position) : null;
    return path ? { kind: 'pickup', phase: 'walking', path, pathIndex: 0, pileId, amount, progress: 0, duration: this.config.interactionSeconds } : null;
  }
  private delivery(worker: Builder): Job | null {
    const choice = this.chooseStore(worker);
    return choice ? { kind: 'deliver', phase: 'walking', path: choice.path, pathIndex: 0,
      storeId: choice.store.id, progress: 0, duration: this.config.interactionSeconds } : null;
  }
  private hasDigWork(canStart: (id: string) => boolean): boolean {
    return [...this.builders.values()].some(worker => {
      const job = worker.job;
      if (job?.kind === 'dig' && job.target && this.diggable(job.target) && requiredDiggingGrade(job.target, this.tile(job.target)!) <= this.grade) return true;
      return canStart(worker.id) && this.findDig(worker) !== null;
    });
  }
  private assign(worker: Builder, canStart: (id: string) => boolean): boolean {
    const carried = this.materials.getCarried(worker.id);
    if (carried >= this.config.carryCapacity - EPS) worker.job = this.delivery(worker);
    if (!worker.job && canStart(worker.id)) {
      worker.job = this.findDig(worker);
      if (worker.job?.target) this.reservations.add(cellKey(worker.job.target));
    }
    if (!worker.job && canStart(worker.id) && !this.hasDigWork(canStart)) {
      for (const pile of this.materials.getGround()) {
        worker.job = this.pickup(worker, pile.id);
        if (worker.job) break;
      }
    }
    if (!worker.job && carried > EPS) worker.job = this.delivery(worker);
    worker.status = worker.job?.kind === 'dig' ? 'Grabauftrag' : worker.job?.kind === 'pickup' ? 'Abraum aufnehmen'
      : worker.job ? 'Baustoff abliefern' : carried > EPS ? 'Ladung wartet auf erreichbaren Lagerplatz' : 'Keine ausführbare Arbeit · ruht';
    return worker.job !== null;
  }
  private finish(worker: Builder, job: Job): void {
    if (job.kind === 'dig') {
      const target = job.target!, tile = this.tile(target)!;
      if (!this.diggable(target)) { this.clearJob(worker); return; }
      const amount = this.rule(tile)!.yield;
      tile.state = 'open'; this.changed.push({ ...target });
      const pileId = this.materials.produce(this.center(target), amount);
      job.order!.index = Math.max(job.order!.index, job.orderIndex! + 1);
      this.clearJob(worker);
      // Material produced by the current dig belongs to that atomic action;
      // collecting old, unrelated piles remains lower priority.
      worker.job = this.pickup(worker, pileId);
      worker.status = 'Kachel ausgegraben';
    } else if (job.kind === 'pickup') {
      this.materials.pickUp(job.pileId!, worker.id, job.amount!);
      worker.job = null;
    } else {
      this.materials.deposit(worker.id, job.storeId!);
      worker.job = null;
      worker.status = 'Baustoff angeliefert';
    }
  }
  advance(realSeconds: number, workFactor = 1, canStart: (id: string) => boolean = () => true, efficiency: (id: string) => number = () => 1): void {
    nonNegativeFinite(realSeconds, 'realSeconds'); nonNegativeFinite(workFactor, 'workFactor');
    if (workFactor > 1) throw new RangeError('workFactor must not exceed 1');
    for (const worker of this.builders.values()) {
      const factor = efficiency(worker.id); positiveFinite(factor, 'efficiency');
      if (factor > 1) throw new RangeError('efficiency must not exceed 1');
    }
    const slices = Math.ceil(realSeconds / this.config.maxStepSeconds), step = slices ? realSeconds / slices : 0;
    for (let i = 0; i < slices; i++) {
      for (const worker of this.builders.values()) {
        let remaining = step * workFactor * efficiency(worker.id);
        while (remaining > EPS) {
          if (!worker.job && !this.assign(worker, canStart)) break;
          const job = worker.job!;
          if (job.kind === 'dig' && requiredDiggingGrade(job.target!, this.tile(job.target!)!) > this.grade) { worker.status = 'Grabkraft fehlt · Auftrag wartet'; break; }
          if (job.phase === 'walking') {
            const target = job.path[job.pathIndex];
            if (!target) { job.phase = job.kind === 'dig' ? 'digging' : job.kind === 'pickup' ? 'loading' : 'unloading'; continue; }
            if (!this.canMove(worker.position, target)) { this.clearJob(worker); worker.status = 'Weg blockiert'; break; }
            const length = distance(worker.position, target), spent = Math.min(remaining, length / this.config.speed);
            const fraction = length > 0 ? Math.min(1, spent * this.config.speed / length) : 1;
            worker.position.x += (target.x - worker.position.x) * fraction; worker.position.y += (target.y - worker.position.y) * fraction;
            remaining -= spent;
            if (fraction >= 1 - EPS) { worker.position = { ...target }; job.pathIndex++; }
          } else {
            const spent = Math.min(remaining, job.duration - job.progress);
            remaining -= spent; job.progress += spent;
            if (job.progress >= job.duration - EPS) this.finish(worker, job);
          }
        }
      }
    }
    this.orders = this.orders.filter(order => order.index < order.cells.length);
  }
}
