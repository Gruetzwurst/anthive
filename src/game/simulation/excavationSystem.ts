import type { StartingWorld, WorldCellCoordinate, WorldPoint, WorldTile } from '../world/worldTypes.ts';
import { terrainDefinitions } from '../world/terrainDefinitions.ts';
import { diggingGradeAt } from '../world/worldGenerator.ts';
import { cardinalNeighbors, cellKey, findGridPath } from '../world/gridPathfinding.ts';
import { ResourceSystem } from './resourceSystem.ts';
import { BuildingMaterialSystem } from './buildingMaterialSystem.ts';
import { EXCAVATION_CONFIG, CONSTRUCTION_CONFIG, CHAMBER_CONFIG } from './simulationConfig.ts';
import { ChamberSystem } from './chamberSystem.ts';
import type { TunnelTrafficSystem } from './tunnelTrafficSystem.ts';
import type { ExcavationConfig } from './simulationConfig.ts';
import { nonNegativeFinite, positiveFinite } from './validation.ts';
import { PLAN_TYPES, PLAN_LABELS, mergeSelection, isConnectedSelection, constructionMaterialEstimate } from './constructionPlanning.ts';
import type { PlanType } from './constructionPlanning.ts';

type Cell = WorldCellCoordinate;
export type ConstructionStatus = 'planned' | 'digging' | 'blocked' | 'paused' | 'awaitingFurnishing' | 'furnishing' | 'furnished' | 'completed' | 'cancelled';
export type ConstructionBlockReason = 'unreachable' | 'hardness' | 'material';
export type ConstructionOrderSnapshot = {
  capacity: number; operational: boolean;
  id: number; type: PlanType; cells: Cell[]; index: number; paused: boolean; status: ConstructionStatus;
  blockReason: ConstructionBlockReason | null; excavated: number; total: number; partialDigSeconds: number; materialRequired: number; materialUsed: number; materialAtSite: number; materialInTransit: number;
};
type Order = { id: number; type: PlanType; cells: Cell[]; paused: boolean; cancelled: boolean;
  progress: Map<string, number>; status: ConstructionStatus; blockReason: ConstructionBlockReason | null;
  notifiedProblem: ConstructionBlockReason | null; required: number; used: number;
  installed: Map<string, number>; furnishingProgress: Map<string, number>; completionNotified: boolean;
};
export type ConstructionNotice = { orderId: number; reason: ConstructionBlockReason; message: string };
type Job = {
  kind: 'dig' | 'pickup' | 'deliver' | 'withdraw' | 'deliverSite' | 'furnish';
  phase: 'walking' | 'digging' | 'loading' | 'unloading' | 'furnishing';
  path: WorldPoint[]; pathIndex: number; progress: number; duration: number;
  target?: Cell; order?: Order; pileId?: string; storeId?: string; amount?: number;
};
type Builder = { id: string; position: WorldPoint; job: Job | null; status: string; supplyOrderId?: number };
const EPS = 1e-9;
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y);
export function requiredDiggingGrade(cell: Cell, tile: WorldTile): number {
  return tile.terrain === 'stone' ? 3 : diggingGradeAt(cell.column, cell.row);
}

/** Existing cardinal digging/haul workflow, separated from Phaser for B2 tests. */
export class ExcavationSystem {
  readonly materials: BuildingMaterialSystem;
  readonly chambers: ChamberSystem;
  private world: StartingWorld;
  private resources: ResourceSystem;
  private config: ExcavationConfig;
  private minimumAreas: Readonly<Record<PlanType, number>>;
  private builders = new Map<string, Builder>();
  private orders: Order[] = [];
  private reservations = new Set<string>();
  private changed: Cell[] = [];
  private chamberAccessDirty = false;
  private grade = 0;
  private nextOrderId = 1;
  private notices: ConstructionNotice[] = [];
  private completedChambers: Array<{ id: number; type: PlanType; cells: Cell[] }> = [];
  private pathCache = new Map<string, WorldPoint[] | null>();
  private traffic?: TunnelTrafficSystem;

  constructor(world: StartingWorld, resources: ResourceSystem, config: ExcavationConfig = EXCAVATION_CONFIG,
    minimumAreas: Readonly<Record<PlanType, number>> = CHAMBER_CONFIG.minimumArea) {
    positiveFinite(CONSTRUCTION_CONFIG.furnishingSecondsPerUnit, 'furnishingSecondsPerUnit');
    for (const key of ['speed', 'carryCapacity', 'interactionSeconds', 'maxStepSeconds'] as const) positiveFinite(config[key], key);
    for (const rule of Object.values(config.terrain)) { positiveFinite(rule.seconds, 'dig seconds'); nonNegativeFinite(rule.yield, 'material yield'); }
    this.world = world; this.resources = resources;
    this.config = { ...config, terrain: Object.fromEntries(Object.entries(config.terrain).map(([kind, rule]) => [kind, { ...rule }])) as ExcavationConfig['terrain'] };
    this.materials = new BuildingMaterialSystem(resources, config.carryCapacity);
    this.minimumAreas = { ...minimumAreas };
    this.chambers = new ChamberSystem(world, resources);
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
    this.refreshOrders();
  }
  setTraffic(traffic: TunnelTrafficSystem): void {this.traffic = traffic;this.pathCache.clear();}
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
        target: worker.job.target ? { ...worker.job.target } : undefined, orderId: worker.job.order?.id, storeId: worker.job.storeId, pileId: worker.job.pileId } : null,
    }));
  }
  getOrders() {
    return this.getConstructionOrders().filter(order => order.status !== 'cancelled' && order.excavated < order.total);
  }
  getConstructionOrders(): ConstructionOrderSnapshot[] {
    this.pathCache.clear(); this.refreshOrders();
    const rooms = new Map(this.chambers.getChambers().map(room => [room.id, room]));
    return this.orders.map(order => {
      const excavated = order.cells.filter(cell => this.open(cell)).length;
      return { id: order.id, type: order.type, cells: order.cells.map(cell => ({ ...cell })), index: excavated,
        capacity: rooms.get(order.id)?.capacity ?? 0, operational: rooms.get(order.id)?.operational ?? false,
        paused: order.paused, status: order.status, blockReason: order.blockReason, excavated, total: order.cells.length,
        partialDigSeconds: [...order.progress.values()].reduce((sum, value) => sum + value, 0),
        materialRequired: order.required, materialUsed: order.used, materialAtSite: this.materials.getAtSite(order.id),
        materialInTransit: this.inTransit(order) };
    });
  }
  drainCompletedChambers() { const completed = this.completedChambers; this.completedChambers = []; return completed; }
  drainConstructionNotices(): ConstructionNotice[] { const notices = this.notices; this.notices = []; return notices; }
  private orderById(id: number): Order {
    const order = this.orders.find(order => order.id === id);
    if (!order) throw new RangeError('Unbekannter Bauauftrag');
    return order;
  }
  pauseOrder(id: number): void {
    const order = this.orderById(id);
    if (order.cancelled || ['completed', 'furnished'].includes(order.status)) throw new Error('Auftrag ist bereits beendet');
    order.paused = true;
    // A running tile action finishes atomically; a walk has not started digging.
    for (const worker of this.builders.values()) if (worker.job?.order === order && ['dig', 'furnish', 'withdraw'].includes(worker.job.kind) && worker.job.phase === 'walking') this.clearJob(worker);
    this.refreshOrders();
  }
  resumeOrder(id: number): void {
    const order = this.orderById(id);
    if (order.cancelled || ['completed', 'furnished'].includes(order.status)) throw new Error('Auftrag ist bereits beendet');
    order.paused = false; this.refreshOrders();
  }
  cancelOrder(id: number): void {
    const order = this.orderById(id);
    if (['completed', 'furnished'].includes(order.status)) throw new Error('Auftrag ist bereits beendet');
    order.cancelled = true; order.paused = false;
    for (const worker of this.builders.values()) if (worker.job?.order === order && ['dig', 'furnish', 'withdraw'].includes(worker.job.kind)) this.clearJob(worker);
    this.materials.releaseSite(order.id);
    this.refreshOrders();
  }
  drainChangedCells(): Cell[] { const changed = this.changed; this.changed = []; return changed; }
  addOrder(cells: Cell[], type: PlanType = 'tunnel'): number {
    if (!PLAN_TYPES.includes(type) || !cells.length || cells.some(cell => !Number.isInteger(cell.column) || !Number.isInteger(cell.row)
      || !this.tile(cell) || !terrainDefinitions[this.tile(cell)!.terrain].diggable || this.tile(cell)!.state === 'rubble')) throw new RangeError('Nur gültige unterirdische Kacheln markieren');
    const selected = mergeSelection(cells);
    if (!isConnectedSelection(selected)) throw new RangeError('Ein Bauplan muss über gemeinsame Kanten zusammenhängen');
    if (selected.length < this.minimumAreas[type]) throw new RangeError(`${PLAN_LABELS[type]} benötigt mindestens ${this.minimumAreas[type]} zusammenhängende Kacheln`);
    if (type !== 'tunnel') {
      const keys = new Set(selected.map(cellKey));
      if (this.world.chamberFootprints?.some(room => room.some(cell => keys.has(cellKey(cell))))) throw new RangeError('Hier besteht bereits eine Kammer');
      if (this.orders.some(order => !order.cancelled && order.type !== 'tunnel' && order.cells.some(cell => keys.has(cellKey(cell))))) throw new RangeError('Hier ist bereits eine Kammer geplant');
    }
    const id = this.nextOrderId++;
    this.orders.push({ id, type, cells: selected, paused: false, cancelled: false, progress: new Map(),
      status: 'planned', blockReason: null, notifiedProblem: null,
      required: constructionMaterialEstimate(type, selected.length), used: 0, installed: new Map(), furnishingProgress: new Map(), completionNotified: false });
    if (type !== 'tunnel') this.materials.registerSite(id, this.center(selected[0]));
    this.refreshOrders();
    return id;
  }
  private approach(worker: Builder, target: Cell): WorldPoint[] | null {
    const paths = cardinalNeighbors(target).filter(cell => this.open(cell))
      .map(cell => this.path(worker.position, this.center(cell))).filter((path): path is WorldPoint[] => path !== null)
      .sort((a, b) => this.travelSeconds(worker.position, a) - this.travelSeconds(worker.position, b));
    return paths[0] ?? null;
  }
  private availableTargets(order: Order): Cell[] {
    return order.cells.filter(cell => this.diggable(cell) && requiredDiggingGrade(cell, this.tile(cell)!) <= this.grade);
  }
  private allDug(order: Order): boolean { return order.cells.every(cell => this.open(cell)); }
  private isFinished(order: Order): boolean { return this.allDug(order) && (order.type === 'tunnel' || order.used >= order.required); }
  private inTransit(order: Order): number {
    return [...this.builders.values()].reduce((sum, worker) => sum + (worker.supplyOrderId === order.id ? this.materials.getCarried(worker.id) : 0)
      + (worker.job?.kind === 'withdraw' && worker.job.order === order ? worker.job.amount ?? 0 : 0), 0);
  }
  private hasMaterialAccess(order: Order): boolean {
    return this.materials.getAtSite(order.id) >= 1 || this.inTransit(order) > EPS
      || this.resources.listStores().some(store => store.resource === 'buildingMaterial' && store.status === 'operational' && store.reachable
        && store.amount > EPS && order.cells.some(cell => this.path(store.position, this.center(cell))));
  }
  private primaryOrder(): Order | null {
    for (const order of this.orders) {
      if (order.cancelled || order.paused || this.isFinished(order)) continue;
      if ([...this.builders.values()].some(worker => worker.job?.order === order && ['dig', 'furnish', 'withdraw', 'deliverSite'].includes(worker.job.kind))) return order;
      if (!this.allDug(order)) {
        if (this.availableTargets(order).some(target => [...this.builders.values()].some(worker => this.approach(worker, target)))) return order;
      } else if (this.hasMaterialAccess(order)) return order;
    }
    return null;
  }
  private refreshOrders(): void {
    for (const order of this.orders) {
      let reason: ConstructionBlockReason | null = null;
      const active = [...this.builders.values()].filter(worker => worker.job?.order === order);
      if (order.cancelled) order.status = 'cancelled';
      else if (order.paused) order.status = 'paused';
      else if (this.isFinished(order)) order.status = order.type === 'tunnel' ? 'completed' : 'furnished';
      else if (!this.builders.size) order.status = 'planned';
      else if (this.allDug(order)) {
        const reachable = order.cells.some(cell => [...this.builders.values()].some(worker => this.path(worker.position, this.center(cell))));
        const material = this.hasMaterialAccess(order);
        if (!reachable) reason = 'unreachable'; else if (!material) reason = 'material';
        order.status = reason ? 'blocked' : active.some(worker => worker.job?.kind === 'furnish') ? 'furnishing' : 'awaitingFurnishing';
      } else if (active.some(worker => worker.job?.kind === 'dig')) order.status = 'digging';
      else {
        const targets = this.availableTargets(order);
        const reachable = targets.some(target => [...this.builders.values()].some(worker => this.approach(worker, target)));
        order.status = reachable ? 'planned' : 'blocked';
        if (!reachable) reason = targets.length ? 'unreachable' : 'hardness';
      }
      order.blockReason = reason;
      if (reason && order.notifiedProblem !== reason) {
        this.notices.push({ orderId: order.id, reason, message: `${PLAN_LABELS[order.type]} #${order.id}: ${reason === 'hardness' ? 'Grabkraft fehlt' : reason === 'material' ? 'Baumaterial fehlt' : 'Baufläche nicht erreichbar'}` });
        order.notifiedProblem = reason;
      } else if (!reason && !order.paused) order.notifiedProblem = null;
    }
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
    const key = `${cellKey(this.cell(from))}>${to.x},${to.y}`;
    if (!this.pathCache.has(key)) {
      const cells = findGridPath(this.cell(from), this.cell(to), cell => this.open(cell), this.traffic ? (cell, previous) => this.traffic!.cellCost(cell, previous) : undefined);
      this.pathCache.set(key, cells ? [...cells.map(cell => this.center(cell)), { ...to }] : null);
    }
    return this.pathCache.get(key)!;
  }
  private canMove(from: WorldPoint, to: WorldPoint): boolean {
    const steps = Math.max(1, Math.ceil(distance(from, to) / (this.world.dimensions.tileSize / 4)));
    for (let i = 0; i <= steps; i++) if (!this.open(this.cell({ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }))) return false;
    return true;
  }
  private travelSeconds(from: WorldPoint, path: WorldPoint[]): number {
    const points = [from, ...path];
    return this.traffic?.travelSeconds(points, this.config.speed) ?? points.reduce((sum, point, i) => sum + (i ? distance(points[i-1], point) / this.config.speed : 0), 0);
  }
  private clearJob(worker: Builder): void {
    if (worker.job && ['dig', 'furnish'].includes(worker.job.kind) && worker.job.target) this.reservations.delete(cellKey(worker.job.target));
    worker.job = null;
  }
  private findDig(worker: Builder): Job | null {
    const order = this.primaryOrder();
    if (!order || this.allDug(order)) return null;
    for (const target of this.availableTargets(order)) {
      if (this.reservations.has(cellKey(target))) continue;
      const path = this.approach(worker, target);
      if (path) return { kind: 'dig', phase: 'walking', path, pathIndex: 0, target: { ...target },
        order, progress: order.progress.get(cellKey(target)) ?? 0, duration: this.rule(this.tile(target)!)!.seconds };
    }
    return null;
  }
  private supplyChoice(worker: Builder, order: Order) {
    const need = order.required - order.used - this.materials.getAtSite(order.id) - this.inTransit(order);
    if (need <= EPS) return undefined;
    const length = (start: WorldPoint, path: WorldPoint[]) => this.travelSeconds(start, path);
    return this.resources.listStores().filter(store => store.resource === 'buildingMaterial' && store.status === 'operational' && store.reachable)
      .map(store => {
        const reserved = [...this.builders.values()].filter(other => other.job?.kind === 'withdraw' && other.job.storeId === store.id)
          .reduce((sum, other) => sum + (other.job?.amount ?? 0), 0);
        const amount = Math.min(need, this.config.carryCapacity - this.materials.getCarried(worker.id), store.amount - reserved);
        const path = amount > EPS ? this.path(worker.position, store.position) : null;
        const routes = path ? order.cells.map(cell => this.path(store.position, this.center(cell))).filter((route): route is WorldPoint[] => route !== null) : [];
        routes.sort((a, b) => length(store.position, a) - length(store.position, b));
        return { store, amount, path, cost: path && routes[0] ? length(worker.position, path) + length(store.position, routes[0]) : Infinity };
      }).filter(choice => Number.isFinite(choice.cost)).sort((a, b) => a.cost - b.cost || a.store.id.localeCompare(b.store.id))[0];
  }
  private findFurnishing(worker: Builder): Job | null {
    const order = this.primaryOrder();
    if (!order || !this.allDug(order) || order.type === 'tunnel') return null;
    const reservedUnits = [...this.builders.values()].filter(other => other.job?.kind === 'furnish' && other.job.order === order).length;
    if (this.materials.getAtSite(order.id) - reservedUnits >= 1) {
      const cost = CONSTRUCTION_CONFIG.materialPerTile[order.type];
      for (const target of order.cells) {
        const key = cellKey(target);
        if (this.reservations.has(key) || (order.installed.get(key) ?? 0) >= cost) continue;
        const path = this.path(worker.position, this.center(target));
        if (path) { this.reservations.add(key); return { kind: 'furnish', phase: 'walking', path, pathIndex: 0, target: { ...target },
          order, progress: order.furnishingProgress.get(key) ?? 0, duration: CONSTRUCTION_CONFIG.furnishingSecondsPerUnit }; }
      }
    }
    const choice = this.supplyChoice(worker, order);
    return choice?.path ? { kind: 'withdraw', phase: 'walking', path: choice.path, pathIndex: 0, storeId: choice.store.id,
      amount: choice.amount, order, progress: 0, duration: this.config.interactionSeconds } : null;
  }
  private siteDelivery(worker: Builder, order: Order): Job | null {
    const paths = order.cells.map(cell => this.path(worker.position, this.center(cell))).filter((path): path is WorldPoint[] => path !== null);
    paths.sort((a, b) => this.travelSeconds(worker.position, a) - this.travelSeconds(worker.position, b));
    return paths[0] ? { kind: 'deliverSite', phase: 'walking', path: paths[0], pathIndex: 0, order, progress: 0, duration: this.config.interactionSeconds } : null;
  }
  private chooseStore(worker: Builder) {
    return this.resources.listStores().filter(store => store.resource === 'buildingMaterial'
      && store.status === 'operational' && store.reachable && store.amount < store.capacity - EPS)
      .map(store => ({ store, path: this.path(worker.position, store.position) }))
      .filter((choice): choice is typeof choice & { path: WorldPoint[] } => choice.path !== null)
      .sort((a, b) => this.travelSeconds(worker.position, a.path) - this.travelSeconds(worker.position, b.path) || a.store.id.localeCompare(b.store.id))[0];
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
    if (worker.supplyOrderId !== undefined) {
      const order = this.orderById(worker.supplyOrderId);
      if (carried > EPS && !order.cancelled) {
        worker.job = this.siteDelivery(worker, order);
        worker.status = worker.job ? 'Baustelle beliefern' : 'Baustellenweg blockiert';
        return worker.job !== null;
      }
      worker.supplyOrderId = undefined;
    }
    const primary = this.primaryOrder();
    if (carried > EPS && primary && this.allDug(primary)) worker.job = this.delivery(worker);
    if (!worker.job && carried >= this.config.carryCapacity - EPS) worker.job = this.delivery(worker);
    if (!worker.job && canStart(worker.id)) {
      worker.job = this.findDig(worker);
      if (worker.job?.target) this.reservations.add(cellKey(worker.job.target));
    }
    if (!worker.job && carried <= EPS && canStart(worker.id)) worker.job = this.findFurnishing(worker);
    if (!worker.job && canStart(worker.id) && !this.hasDigWork(canStart)) {
      for (const pile of this.materials.getGround()) {
        worker.job = this.pickup(worker, pile.id);
        if (worker.job) break;
      }
    }
    if (!worker.job && carried > EPS) worker.job = this.delivery(worker);
    worker.status = worker.job?.kind === 'dig' ? 'Grabauftrag' : worker.job?.kind === 'pickup' ? 'Abraum aufnehmen'
      : worker.job?.kind === 'furnish' ? 'Kammer einrichten' : worker.job?.kind === 'withdraw' ? 'Baumaterial aufnehmen' : worker.job?.kind === 'deliverSite' ? 'Baustelle beliefern'
      : worker.job ? 'Baustoff abliefern' : carried > EPS ? 'Ladung wartet auf erreichbaren Lagerplatz' : 'Keine ausführbare Arbeit · ruht';
    return worker.job !== null;
  }
  private finish(worker: Builder, job: Job): void {
    if (job.kind === 'dig') {
      const target = job.target!, tile = this.tile(target)!;
      if (!this.diggable(target)) { this.clearJob(worker); return; }
      const amount = this.rule(tile)!.yield;
      tile.state = 'open'; this.pathCache.clear(); this.changed.push({ ...target }); this.chamberAccessDirty = true;
      this.traffic?.invalidateTopology();
      const pileId = this.materials.produce(this.center(target), amount);
      job.order!.progress.delete(cellKey(target));
      this.clearJob(worker);
      // Material produced by the current dig belongs to that atomic action;
      // collecting old, unrelated piles remains lower priority.
      worker.job = this.pickup(worker, pileId);
      if (worker.job) worker.job.order = job.order;
      worker.status = 'Kachel ausgegraben';
    } else if (job.kind === 'pickup') {
      this.materials.pickUp(job.pileId!, worker.id, job.amount!);
      worker.job = null;
    } else if (job.kind === 'withdraw') {
      if (!job.order!.cancelled) {
        this.materials.withdraw(job.storeId!, worker.id, job.amount!);
        worker.supplyOrderId = job.order!.id;
      }
      worker.job = null;
    } else if (job.kind === 'deliverSite') {
      const order = job.order!;
      if (!order.cancelled) this.materials.depositAtSite(order.id, worker.id, Math.max(0, order.required - order.used - this.materials.getAtSite(order.id)));
      worker.supplyOrderId = undefined; worker.job = null;
    } else if (job.kind === 'furnish') {
      const order = job.order!, key = cellKey(job.target!);
      if (!order.cancelled && this.materials.getAtSite(order.id) >= 1 && this.materials.consumeAtSite(order.id, 1) === 1) {
        order.used++; order.installed.set(key, (order.installed.get(key) ?? 0) + 1); order.furnishingProgress.delete(key);
        if (order.used >= order.required && !order.completionNotified) {
          this.chambers.registerFinished({id: order.id, type: order.type, cells: order.cells});
          order.completionNotified = true;
          this.completedChambers.push({ id: order.id, type: order.type, cells: order.cells.map(cell => ({ ...cell })) });
        }
      }
      this.clearJob(worker);
    } else {
      this.materials.deposit(worker.id, job.storeId!);
      worker.job = null;
      worker.status = 'Baustoff angeliefert';
    }
  }
  advance(realSeconds: number, workFactor = 1, canStart: (id: string) => boolean = () => true, efficiency: (id: string) => number = () => 1): void {
    this.pathCache.clear();
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
            if (!target) { job.phase = job.kind === 'dig' ? 'digging' : ['pickup', 'withdraw'].includes(job.kind) ? 'loading' : job.kind === 'furnish' ? 'furnishing' : 'unloading'; continue; }
            if (!this.canMove(worker.position, target)) { this.clearJob(worker); worker.status = 'Weg blockiert'; break; }
            const speed = this.config.speed * Math.min(this.traffic?.speedFactor(worker.position) ?? 1, this.traffic?.speedFactor(target) ?? 1);
            const length = distance(worker.position, target), spent = Math.min(remaining, length / speed);
            const fraction = length > 0 ? Math.min(1, spent * speed / length) : 1;
            worker.position.x += (target.x - worker.position.x) * fraction; worker.position.y += (target.y - worker.position.y) * fraction;
            remaining -= spent;
            if (fraction >= 1 - EPS) { worker.position = { ...target }; job.pathIndex++; }
          } else {
            const spent = Math.min(remaining, job.duration - job.progress);
            remaining -= spent; job.progress += spent;
            if (job.kind === 'dig') job.order!.progress.set(cellKey(job.target!), job.progress);
            if (job.kind === 'furnish') job.order!.furnishingProgress.set(cellKey(job.target!), job.progress);
            if (job.progress >= job.duration - EPS) this.finish(worker, job);
          }
        }
      }
    }
    if (this.chamberAccessDirty) {this.chambers.refreshAccess(); this.chamberAccessDirty = false;}
    this.refreshOrders();
  }
}
