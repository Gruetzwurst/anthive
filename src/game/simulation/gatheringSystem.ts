import type { WorldPoint } from '../world/worldTypes.ts';
import type { GatheringNavigation } from '../world/collectorNavigation.ts';
import type { ResourceAmount, ResourceStore } from './resourceTypes.ts';
import { ResourceSystem } from './resourceSystem.ts';
import { GATHERING_CONFIG,GATHERING_DEVELOPMENT } from './simulationConfig.ts';
import type { GatheringConfig } from './simulationConfig.ts';
import { nonNegativeFinite, positiveFinite } from './validation.ts';

export type GatheringPriority = 'food' | 'water' | 'balanced';
type GatheredResource = 'food' | 'water';
export type CollectorSnapshot = {
  id: string;
  position: WorldPoint;
  phase: 'idle' | 'toSource' | 'pickup' | 'toStore' | 'deposit' | 'waiting' | 'returning';
  load: ResourceAmount | null;
  sourceId?: string;
  storeId?: string;
};
type Worker = CollectorSnapshot & {
  path: WorldPoint[];
  pathIndex: number;
  remainingAction: number;
  retryIn: number;
  expected: number;
  collectingEnabled: boolean;
  efficiency: number;
  returnTarget?: WorldPoint;
};
type StoreChoice = { store: ResourceStore; path: WorldPoint[]; amount: number; score: number };
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const pathLength = (path: WorldPoint[]) => path.reduce((sum, point, index) => sum + (index ? distance(path[index - 1], point) : 0), 0);

export class GatheringSystem {
  /** Complete internal state, detached from the live simulation; not a HUD snapshot. */
  exportState() { return structuredClone({ developmentLevel:this.stage,config: this.config, workers: this.workers, currentPriority: this.currentPriority }); }
  restoreState(state: ReturnType<GatheringSystem['exportState']>): void {
    const copy = structuredClone(state);
    this.config = copy.config;
    this.workers = copy.workers;
    this.currentPriority = copy.currentPriority;
    this.stage = copy.developmentLevel;
  }

  private resources: ResourceSystem;
  private navigation: GatheringNavigation;
  private config: GatheringConfig;
  private stage=0;
  get developmentStage():number{return this.stage;}
  get carryCapacity():number{return this.config.carryCapacity/GATHERING_CONFIG.carryCapacity*GATHERING_DEVELOPMENT[this.stage].carryCapacity;}
  get speed():number{return this.config.speed/GATHERING_CONFIG.speed*GATHERING_DEVELOPMENT[this.stage].speed;}
  setDevelopmentLevel(level:number):void{
    if(!Number.isInteger(level)||level<0||level>=GATHERING_DEVELOPMENT.length)throw new RangeError('Invalid collector development stage');
    this.stage=level; // Existing cargo, paths and reservations remain unchanged.
  }
  private workers = new Map<string, Worker>();
  private currentPriority: GatheringPriority = 'balanced';

  constructor(resources: ResourceSystem, navigation: GatheringNavigation, config: GatheringConfig = GATHERING_CONFIG) {
    for (const key of ['speed', 'carryCapacity', 'interactionSeconds', 'retrySeconds', 'priorityWeight'] as const) positiveFinite(config[key], key);
    for (const key of ['storeCongestionSeconds', 'storeFullnessSeconds'] as const) nonNegativeFinite(config[key], key);
    this.resources = resources; this.navigation = navigation; this.config = { ...config };
  }

  get priority(): GatheringPriority { return this.currentPriority; }
  setPriority(priority: GatheringPriority): void {
    if (!['food', 'water', 'balanced'].includes(priority)) throw new TypeError('Unknown gathering priority');
    this.currentPriority = priority;
  }

  addCollector(id: string, position: WorldPoint): void {
    if (!id.trim()) throw new TypeError('Collector ID must not be empty');
    if (this.workers.has(id)) throw new Error(`Duplicate collector ID: ${id}`);
    nonNegativeFinite(position.x, 'position.x'); nonNegativeFinite(position.y, 'position.y');
    this.workers.set(id, { id, position: { ...position }, phase: 'idle', load: null,
      path: [], pathIndex: 0, remainingAction: 0, retryIn: 0, expected: 0, collectingEnabled: true, efficiency: 1 });
  }

  getCollectors(): CollectorSnapshot[] {
    return [...this.workers.values()].map(worker => ({
      id: worker.id, position: { ...worker.position }, phase: worker.phase,
      load: worker.load ? { ...worker.load } : null, sourceId: worker.sourceId, storeId: worker.storeId,
    }));
  }

  repositionIdleWorker(id: string, position: WorldPoint): boolean {
    const worker=this.workers.get(id);
    if(!worker || worker.load || worker.phase!=='idle')return false;
    worker.position={...position};worker.retryIn=0;return true;
  }

  retireCollector(id: string): CollectorSnapshot | undefined {
    const snapshot = this.getCollectors().find(worker => worker.id === id);
    this.workers.delete(id); // Reservations live on the removed job, not in stocks.
    return snapshot;
  }

  setWorkEfficiency(id: string, efficiency: number): void {
    positiveFinite(efficiency, 'efficiency');
    if (efficiency > 1) throw new RangeError('efficiency must not exceed 1');
    this.requireWorker(id).efficiency = efficiency;
  }

  setCollectingEnabled(id: string, enabled: boolean, returnTarget?: WorldPoint): void {
    if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
    if (returnTarget) {
      nonNegativeFinite(returnTarget.x, 'returnTarget.x'); nonNegativeFinite(returnTarget.y, 'returnTarget.y');
    }
    const worker = this.requireWorker(id);
    if (worker.collectingEnabled === enabled && (enabled || (!returnTarget && !worker.returnTarget)
      || (returnTarget && worker.returnTarget && distance(returnTarget, worker.returnTarget) < 1e-9))) return;
    worker.collectingEnabled = enabled;
    worker.returnTarget = enabled ? undefined : returnTarget ? { ...returnTarget } : undefined;
    if (!worker.load) this.clearJob(worker);
    worker.retryIn = 0;
  }

  private requireWorker(id: string): Worker {
    const worker = this.workers.get(id);
    if (!worker) throw new Error(`Unknown collector: ${id}`);
    return worker;
  }

  private reservedStore(id: string, except: Worker): number {
    let amount = 0;
    for (const worker of this.workers.values()) if (worker !== except && worker.storeId === id) amount += worker.load?.amount ?? worker.expected;
    return amount;
  }

  private chooseStore(worker: Worker, from: WorldPoint, resource: GatheredResource, requested: number): StoreChoice | null {
    const choices: StoreChoice[] = [];
    for (const store of this.resources.listStores()) {
      if (store.resource !== resource || store.status !== 'operational' || !store.reachable) continue;
      const reserved = this.reservedStore(store.id, worker);
      const free = store.capacity - store.amount - reserved;
      if (free <= 1e-9) continue;
      const path = this.navigation.findPath(from, store.position);
      if (!path) continue;
      const inFlight = [...this.workers.values()].filter(other => other !== worker && other.storeId === store.id).length;
      const fullness = store.capacity > 0 ? (store.amount + reserved) / store.capacity : 1;
      choices.push({ store, path, amount: Math.min(requested, free),
        score: this.travelSeconds(path) + inFlight * this.config.storeCongestionSeconds + fullness * this.config.storeFullnessSeconds });
    }
    return choices.sort((a, b) => a.score - b.score || a.store.id.localeCompare(b.store.id))[0] ?? null;
  }

  private demand(resource: GatheredResource, worker: Worker): number {
    const totals = this.resources.getStoreTotals(resource);
    if (totals.capacity === 0) return 0;
    const reserved = this.resources.listStores().filter(store => store.resource === resource)
      .reduce((sum, store) => sum + this.reservedStore(store.id, worker), 0);
    const weight = this.currentPriority === resource ? this.config.priorityWeight : 1;
    return Math.max(0, (totals.capacity - totals.amount - reserved) / totals.capacity) * weight;
  }

  private assign(worker: Worker): boolean {
    // Large groups need not scan every source when all receiving space is
    // already occupied or promised to real in-flight loads.
    const needed = new Set(this.resources.listStores()
      .filter(store => (store.resource === 'food' || store.resource === 'water') && store.status === 'operational' && store.reachable
        && store.capacity - store.amount - this.reservedStore(store.id, worker) > 1e-9)
      .map(store => store.resource));
    if (!needed.size) return false;
    const choices: Array<{ sourceId: string; path: WorldPoint[]; delivery: StoreChoice; demand: number; score: number }> = [];
    for (const source of this.resources.listSources()) {
      if ((source.resource !== 'food' && source.resource !== 'water') || !needed.has(source.resource)) continue;
      const reserved = [...this.workers.values()].filter(other => other !== worker && other.sourceId === source.id && !other.load)
        .reduce((sum, other) => sum + other.expected, 0);
      const available = source.kind === 'unlimited' ? this.carryCapacity
        : source.recoveryDaysLeft > 0 ? 0 : Math.max(0, source.amount - reserved);
      if (available <= 1e-9) continue;
      for (const access of this.navigation.sourceAccessPoints(source)) {
        const path = this.navigation.findPath(worker.position, access);
        if (!path) continue;
        const delivery = this.chooseStore(worker, access, source.resource, Math.min(available, this.carryCapacity));
        if (!delivery) continue;
        choices.push({ sourceId: source.id, path, delivery, demand: this.demand(source.resource, worker),
          score: this.travelSeconds(path) + delivery.score });
      }
    }
    choices.sort((a, b) => b.demand - a.demand || a.score - b.score || a.sourceId.localeCompare(b.sourceId));
    const choice = choices[0];
    if (!choice) return false;
    worker.sourceId = choice.sourceId; worker.storeId = choice.delivery.store.id;
    worker.expected = choice.delivery.amount;
    this.startPath(worker, choice.path, 'toSource');
    return true;
  }

  private travelSeconds(path: WorldPoint[]): number {
    return this.navigation.travelSeconds?.(path, this.speed) ?? pathLength(path) / this.speed;
  }

  private startPath(worker: Worker, path: WorldPoint[], phase: 'toSource' | 'toStore' | 'returning'): void {
    worker.path = path; worker.pathIndex = 0; worker.phase = phase;
  }

  private clearJob(worker: Worker): void {
    worker.sourceId = undefined; worker.storeId = undefined; worker.expected = 0;
    worker.path = []; worker.pathIndex = 0;
    worker.phase = worker.load ? 'waiting' : 'idle';
  }

  private deliver(worker: Worker): boolean {
    if (!worker.load || (worker.load.resource !== 'food' && worker.load.resource !== 'water')) return false;
    const choice = this.chooseStore(worker, worker.position, worker.load.resource, worker.load.amount);
    if (!choice) return false;
    worker.storeId = choice.store.id;
    this.startPath(worker, choice.path, 'toStore');
    return true;
  }

  private finishAction(worker: Worker): void {
    if (worker.phase === 'pickup') {
      const source = this.resources.getSource(worker.sourceId!);
      if (source.resource !== 'food' && source.resource !== 'water') { this.clearJob(worker); return; }
      const choice = this.chooseStore(worker, worker.position, source.resource, worker.expected);
      if (!choice) { this.clearJob(worker); return; }
      const load = this.resources.takeFromSource(source.id, choice.amount);
      if (load.amount === 0) { this.clearJob(worker); return; }
      worker.load = load; worker.expected = 0; worker.storeId = choice.store.id;
      this.startPath(worker, choice.path, 'toStore');
    } else if (worker.phase === 'deposit' && worker.load) {
      const accepted = this.resources.depositInStore(worker.storeId!, worker.load);
      worker.load.amount = Math.max(0, worker.load.amount - accepted);
      if (worker.load.amount <= 1e-9) worker.load = null;
      this.clearJob(worker);
    }
  }

  advance(realSeconds: number, workFactor = 1): void {
    nonNegativeFinite(realSeconds, 'realSeconds');
    nonNegativeFinite(workFactor, 'workFactor');
    if (workFactor > 1) throw new RangeError('workFactor must not exceed 1');
    if (workFactor === 0) return;
    for (const worker of this.workers.values()) {
      let remaining = realSeconds * workFactor * worker.efficiency;
      while (remaining > 1e-9) {
        if (worker.retryIn > 0) {
          const wait = Math.min(remaining, worker.retryIn);
          worker.retryIn -= wait; remaining -= wait;
          if (remaining <= 1e-9) break;
        }
        if (worker.phase === 'idle' || worker.phase === 'waiting') {
          if (!worker.load && !worker.collectingEnabled) {
            if (!worker.returnTarget || distance(worker.position, worker.returnTarget) < 1e-9) break;
            const path = this.navigation.findPath(worker.position, worker.returnTarget);
            if (!path) { worker.retryIn = this.config.retrySeconds; continue; }
            this.startPath(worker, path, 'returning');
          } else if (!(worker.load ? this.deliver(worker) : this.assign(worker))) {
            worker.retryIn = this.config.retrySeconds;
            continue;
          }
        }
        if (worker.phase === 'pickup' || worker.phase === 'deposit') {
          const spent = Math.min(remaining, worker.remainingAction);
          remaining -= spent; worker.remainingAction -= spent;
          if (worker.remainingAction <= 1e-9) this.finishAction(worker);
          continue;
        }
        const target = worker.path[worker.pathIndex];
        if (!target) {
          if (worker.phase === 'returning') { this.clearJob(worker); continue; }
          worker.phase = worker.phase === 'toSource' ? 'pickup' : 'deposit';
          worker.remainingAction = this.config.interactionSeconds;
          continue;
        }
        if (!this.navigation.canMove(worker.position, target)) {
          this.clearJob(worker); worker.retryIn = this.config.retrySeconds;
          continue;
        }
        const length = distance(worker.position, target);
        const speed = this.speed * Math.min(this.navigation.speedFactor?.(worker.position) ?? 1, this.navigation.speedFactor?.(target) ?? 1);
        const spent = Math.min(remaining, length / speed);
        const fraction = length > 0 ? Math.min(1, spent * speed / length) : 1;
        worker.position.x += (target.x - worker.position.x) * fraction;
        worker.position.y += (target.y - worker.position.y) * fraction;
        remaining -= spent;
        if (fraction >= 1 - 1e-9) { worker.position = { ...target }; worker.pathIndex++; }
      }
    }
  }
}
