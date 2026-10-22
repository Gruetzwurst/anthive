import type { createColonySimulation } from '../simulation/colonySimulation.ts';
import type { SupplyState } from '../simulation/adultSupplySystem.ts';
import { ADULT_SUPPLY_CONFIG } from '../simulation/simulationConfig.ts';
import type { AdultSupplyConfig } from '../simulation/simulationConfig.ts';

type EconomySimulation = ReturnType<typeof createColonySimulation>;
export type SourceOverview = {
  id: string;
  amount: number | null;
  capacity: number | null;
  regenerationPerDay: number | null;
  recoveryDaysLeft: number;
  reachable: boolean | null;
};
export type SupplyOverview = {
  level: 'stable' | 'warning' | 'reduced' | 'severe' | 'risk' | 'recovering';
  shortageDays: number;
  recoveryProgress: number;
};
export type EconomyOverviewOptions = {
  buildingMaterial: number;
  otherWorkerCount: number;
  sourceReachability: ReadonlyMap<string, boolean>;
};
export type EconomyOverview = ReturnType<typeof buildEconomyOverview>;

function supplyOverview(state: SupplyState, config: AdultSupplyConfig): SupplyOverview {
  const level = state.shortageDays === 0 ? 'stable' : state.recovering ? 'recovering'
    : state.shortageDays > config.mortalityAfterDays ? 'risk'
    : state.shortageDays > config.severeAfterDays ? 'severe'
    : state.shortageDays > config.warningDays ? 'reduced' : 'warning';
  return { level, shortageDays: state.shortageDays, recoveryProgress: state.recoveryProgress };
}

/** Read-only projection of actual A1–A3 state. Never books a transaction. */
export function buildEconomyOverview(
  simulation: EconomySimulation,
  options: EconomyOverviewOptions,
  config: AdultSupplyConfig = ADULT_SUPPLY_CONFIG,
) {
  const collectors = simulation.gathering.getCollectors();
  const supply = simulation.supply.snapshot;
  const sources = simulation.resources.listSources();
  const projectSources = (kind: 'food' | 'water'): SourceOverview[] => sources.filter(source => source.resource === kind)
    .map(source => ({ id: source.id,
      amount: source.kind === 'finite' ? source.amount : null,
      capacity: source.kind === 'finite' ? source.capacity : null,
      regenerationPerDay: source.kind === 'finite' ? source.regenerationPerDay : null,
      recoveryDaysLeft: source.kind === 'finite' ? source.recoveryDaysLeft : 0,
      reachable: options.sourceReachability.get(source.id) ?? null,
    }));
  return {
    day: Math.floor(simulation.clock.totalGameDays) + 1,
    dayProgress: simulation.clock.dayFraction,
    workerCount: collectors.length + options.otherWorkerCount,
    collectorCount: collectors.length,
    workFactor: supply.workFactor,
    workerLosses: supply.workerLosses,
    priority: simulation.gathering.priority,
    stocks: { food: simulation.resources.getStoreTotals('food'), water: simulation.resources.getStoreTotals('water') },
    // The legacy builder counter is authoritative until B2. Do not combine it
    // with the still separate A1 material-store data or invent a capacity.
    buildingMaterial: options.buildingMaterial,
    sources: { food: projectSources('food'), water: projectSources('water') },
    supply: { food: supplyOverview(supply.food, config), water: supplyOverview(supply.water, config) },
  };
}

export const formatAmount = (amount: number) => amount.toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function describeSupply(state: SupplyOverview): string {
  switch (state.level) {
    case 'stable': return 'gut versorgt';
    case 'recovering': return `Erholung ${Math.floor(state.recoveryProgress * 100)} %`;
    case 'risk': return `Verlustrisiko · ${formatAmount(state.shortageDays)} T Mangel`;
    case 'severe': return `starker Mangel · ${formatAmount(state.shortageDays)} T`;
    case 'reduced': return `Mangel · ${formatAmount(state.shortageDays)} T`;
    case 'warning': return `Warnung · ${formatAmount(state.shortageDays)} T Mangel`;
  }
}

export function describeSources(sources: SourceOverview[]): string {
  if (!sources.length) return 'keine Quelle';
  const reachable = sources.filter(source => source.reachable === true);
  if (!reachable.length) return sources.every(source => source.reachable === false) ? 'kein Weg zur Quelle' : 'Quellenweg unbekannt';
  if (reachable.some(source => source.amount === null)) return 'unbegrenzt';
  const amount = reachable.reduce((sum, source) => sum + source.amount!, 0);
  const capacity = reachable.reduce((sum, source) => sum + source.capacity!, 0);
  const recovery = reachable.filter(source => source.recoveryDaysLeft > 0);
  const stock = `${formatAmount(amount)}/${capacity}`;
  if (recovery.length === reachable.length) return `${stock} · Erholung ${formatAmount(Math.min(...recovery.map(source => source.recoveryDaysLeft)))} T`;
  const regeneration = reachable.filter(source => source.recoveryDaysLeft === 0).reduce((sum, source) => sum + source.regenerationPerDay!, 0);
  return `${stock} · +${formatAmount(regeneration)}/Tag`;
}
