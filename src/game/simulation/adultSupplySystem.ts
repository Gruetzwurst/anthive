import { ResourceSystem } from './resourceSystem.ts';
import { ADULT_SUPPLY_CONFIG } from './simulationConfig.ts';
import type { AdultSupplyConfig } from './simulationConfig.ts';
import { nonNegativeFinite, positiveFinite } from './validation.ts';

type SupplyKind = 'food' | 'water';
export type AdultPopulation = { activeWorkers: number; restingWorkers: number; queens: number };
export type SupplyState = {
  shortageDays: number;
  recoveryProgress: number;
  workFactor: number;
  eggFactor: number;
  recovering: boolean;
};
type InternalState = SupplyState & { recoveryWork: number; recoveryEgg: number };
const EPS = 1e-10;
const fresh = (): InternalState => ({ shortageDays: 0, recoveryProgress: 0,
  workFactor: 1, eggFactor: 1, recovering: false, recoveryWork: 1, recoveryEgg: 1 });

/** Adult colony demand only. No brood, egg production or global inventory. */
export class AdultSupplySystem {
  private resources: ResourceSystem;
  private config: AdultSupplyConfig;
  private states = { food: fresh(), water: fresh() };
  private lossProgress = 0;
  private totalLosses = 0;

  constructor(resources: ResourceSystem, config: AdultSupplyConfig = ADULT_SUPPLY_CONFIG) {
    for (const rates of [config.workerPerDay, config.queenPerDay]) {
      nonNegativeFinite(rates.food, 'food rate'); nonNegativeFinite(rates.water, 'water rate');
    }
    for (const key of ['restingConsumptionFactor', 'reducedWorkFactor', 'reducedEggFactor',
      'severeWorkFactor', 'severeEggFactor', 'workerLossFractionPerDay'] as const) {
      nonNegativeFinite(config[key], key);
      if (config[key] > 1) throw new RangeError(`${key} must not exceed 1`);
    }
    nonNegativeFinite(config.warningDays, 'warningDays');
    nonNegativeFinite(config.severeAfterDays, 'severeAfterDays');
    nonNegativeFinite(config.mortalityAfterDays, 'mortalityAfterDays');
    positiveFinite(config.recoveryDays, 'recoveryDays');
    if (config.warningDays > config.severeAfterDays || config.severeAfterDays > config.mortalityAfterDays
      || config.severeWorkFactor > config.reducedWorkFactor || config.severeEggFactor > config.reducedEggFactor) {
      throw new RangeError('Shortage stages must be ordered');
    }
    this.resources = resources;
    this.config = { ...config, workerPerDay: { ...config.workerPerDay }, queenPerDay: { ...config.queenPerDay } };
  }

  get snapshot() {
    const copy = ({ recoveryWork: _work, recoveryEgg: _egg, ...state }: InternalState): SupplyState => ({ ...state });
    return {
      food: copy(this.states.food), water: copy(this.states.water),
      workFactor: Math.min(this.states.food.workFactor, this.states.water.workFactor),
      // Prepared for a later queen system; never creates eggs here.
      eggFactor: Math.min(this.states.food.eggFactor, this.states.water.eggFactor),
      workerLosses: this.totalLosses,
    };
  }

  advance(gameDays: number, population: AdultPopulation): { workerLosses: number } {
    nonNegativeFinite(gameDays, 'gameDays');
    for (const key of ['activeWorkers', 'restingWorkers', 'queens'] as const) {
      nonNegativeFinite(population[key], key);
      if (!Number.isInteger(population[key])) throw new RangeError(`${key} must be an integer`);
    }
    const survivors = { ...population };
    let remainingDays = gameDays, workerLosses = 0;
    // Split exactly at stock depletion, full recovery, risk onset and death.
    // Each interval therefore consumes only for adults alive in that interval.
    while (remainingDays > EPS) {
      const workerDemand = survivors.activeWorkers + survivors.restingWorkers * this.config.restingConsumptionFactor;
      let step = remainingDays, atRisk = false;
      for (const kind of ['food', 'water'] as const) {
        const rate = workerDemand * this.config.workerPerDay[kind] + survivors.queens * this.config.queenPerDay[kind];
        const stock = this.resources.getStoreTotals(kind).amount;
        const state = this.states[kind];
        const fed = rate === 0 || stock > EPS;
        if (rate > 0 && stock > EPS) step = Math.min(step, stock / rate);
        if (fed && state.shortageDays > 0) {
          step = Math.min(step, this.config.recoveryDays * (1 - state.recoveryProgress));
        } else if (!fed) {
          const untilRisk = this.config.mortalityAfterDays - state.shortageDays;
          if (untilRisk > EPS) step = Math.min(step, untilRisk);
          else atRisk = true;
        }
      }
      const alive = survivors.activeWorkers + survivors.restingWorkers;
      const lossRate = alive * this.config.workerLossFractionPerDay;
      if (atRisk && lossRate > 0) step = Math.min(step, (1 - this.lossProgress) / lossRate);
      step = Math.min(remainingDays, Math.max(EPS, step));
      const result = this.advanceInterval(step, survivors);
      workerLosses += result.workerLosses;
      // The adapter uses this same stable active-before-resting ordering.
      const activeLosses = Math.min(survivors.activeWorkers, result.workerLosses);
      survivors.activeWorkers -= activeLosses;
      survivors.restingWorkers -= result.workerLosses - activeLosses;
      remainingDays = Math.max(0, remainingDays - step);
    }
    return { workerLosses };
  }

  private advanceInterval(gameDays: number, population: AdultPopulation): { workerLosses: number } {
    const workerDemand = population.activeWorkers + population.restingWorkers * this.config.restingConsumptionFactor;
    let riskDays = 0;
    for (const kind of ['food', 'water'] as const) {
      const rate = workerDemand * this.config.workerPerDay[kind] + population.queens * this.config.queenPerDay[kind];
      const demand = rate * gameDays;
      let remaining = demand;
      for (const store of this.resources.listStores()) {
        if (store.resource !== kind || remaining <= 0) continue;
        remaining -= this.resources.takeFromStore(store.id, remaining).amount;
      }
      const fedDays = rate === 0 ? gameDays : Math.min(gameDays, (demand - remaining) / rate);
      this.recover(this.states[kind], fedDays);
      const missingDays = gameDays - fedDays;
      if (missingDays > EPS) riskDays = Math.max(riskDays, this.deprive(this.states[kind], missingDays));
    }
    // The uncovered intervals are both tails of this step: their union is the
    // longer interval. Food + water shortage never doubles the mortality rate.
    let alive = population.activeWorkers + population.restingWorkers;
    let losses = 0;
    while (alive > 0 && riskDays > EPS && this.config.workerLossFractionPerDay > 0) {
      const rate = alive * this.config.workerLossFractionPerDay;
      const untilLoss = (1 - this.lossProgress) / rate;
      if (untilLoss > riskDays + EPS) { this.lossProgress += rate * riskDays; break; }
      riskDays = Math.max(0, riskDays - untilLoss);
      this.lossProgress = 0; alive--; losses++;
    }
    if (this.states.food.shortageDays === 0 && this.states.water.shortageDays === 0) this.lossProgress = 0;
    this.totalLosses += losses;
    return { workerLosses: losses };
  }

  private recover(state: InternalState, fedDays: number): void {
    if (fedDays <= 0 || state.shortageDays === 0) return;
    if (!state.recovering) {
      state.recovering = true; state.recoveryProgress = 0;
      state.recoveryWork = state.workFactor; state.recoveryEgg = state.eggFactor;
    }
    state.recoveryProgress = Math.min(1, state.recoveryProgress + fedDays / this.config.recoveryDays);
    state.workFactor = state.recoveryWork + (1 - state.recoveryWork) * state.recoveryProgress;
    state.eggFactor = state.recoveryEgg + (1 - state.recoveryEgg) * state.recoveryProgress;
    if (state.recoveryProgress >= 1 - EPS) Object.assign(state, fresh());
  }

  private deprive(state: InternalState, missingDays: number): number {
    const before = state.shortageDays;
    state.shortageDays += missingDays;
    state.recovering = false; state.recoveryProgress = 0;
    if (state.shortageDays > this.config.severeAfterDays + EPS) {
      state.workFactor = Math.min(state.workFactor, this.config.severeWorkFactor);
      state.eggFactor = Math.min(state.eggFactor, this.config.severeEggFactor);
    } else if (state.shortageDays > this.config.warningDays + EPS) {
      state.workFactor = Math.min(state.workFactor, this.config.reducedWorkFactor);
      state.eggFactor = Math.min(state.eggFactor, this.config.reducedEggFactor);
    }
    return Math.max(0, state.shortageDays - this.config.mortalityAfterDays)
      - Math.max(0, before - this.config.mortalityAfterDays);
  }
}
