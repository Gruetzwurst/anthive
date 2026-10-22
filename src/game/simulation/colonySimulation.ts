import type { StartingWorld, WorldPoint } from '../world/worldTypes.ts';
import type { ResourceAmount } from './resourceTypes.ts';
import { AdultSupplySystem } from './adultSupplySystem.ts';
import { createGatheringSimulation } from './gatheringSimulation.ts';
import { ADULT_SUPPLY_CONFIG, SIMULATION_CONFIG } from './simulationConfig.ts';
import type { AdultSupplyConfig, SimulationConfig } from './simulationConfig.ts';

export type OtherAdultWorker = { id: string; resting: boolean };
export type ColonyWorkerAdapter = {
  otherWorkers: () => OtherAdultWorker[];
  retireOtherWorker: (id: string) => void;
  advanceOtherWorkers: (realSeconds: number, workFactor: number) => void;
};
export type DroppedResourceLoad = { id: string; position: WorldPoint; load: ResourceAmount };
const noOtherWorkers: ColonyWorkerAdapter = {
  otherWorkers: () => [], retireOtherWorker: () => {}, advanceOtherWorkers: () => {},
};

/** A3 integration: the existing A1/A2 clock drives adults as well as transport. */
export function createColonySimulation(
  world: StartingWorld,
  workers: ColonyWorkerAdapter = noOtherWorkers,
  config: SimulationConfig = SIMULATION_CONFIG,
  supplyConfig: AdultSupplyConfig = ADULT_SUPPLY_CONFIG,
) {
  const simulation = createGatheringSimulation(world, config);
  const supply = new AdultSupplySystem(simulation.resources, supplyConfig);
  const droppedLoads: DroppedResourceLoad[] = [];
  return {
    ...simulation, supply,
    getDroppedLoads: () => droppedLoads.map(drop => ({ ...drop, position: { ...drop.position }, load: { ...drop.load } })),
    advance(realSeconds: number) {
      return simulation.advance(realSeconds, {
        workFactor: () => supply.snapshot.workFactor,
        afterStep(gameDays, seconds, factor) {
          workers.advanceOtherWorkers(seconds, factor);
          const collectors = simulation.gathering.getCollectors();
          const other = workers.otherWorkers();
          const resting = collectors.filter(worker => worker.phase === 'idle' || worker.phase === 'waiting').length
            + other.filter(worker => worker.resting).length;
          const result = supply.advance(gameDays, {
            activeWorkers: collectors.length + other.length - resting,
            restingWorkers: resting,
            queens: 1, // The existing queen is counted separately; no queen mechanics yet.
          });
          // Stable IDs make the provisional loss selection deterministic; never
          // include the queen or create replacement workers automatically.
          const candidates = [...collectors.map(worker => ({ id: worker.id, collector: true })),
            ...other.map(worker => ({ id: worker.id, collector: false }))].sort((a, b) => a.id.localeCompare(b.id));
          for (const worker of candidates.slice(0, result.workerLosses)) {
            if (worker.collector) {
              const retired = simulation.gathering.retireCollector(worker.id);
              if (retired?.load) droppedLoads.push({ id: retired.id, position: retired.position, load: retired.load });
            } else workers.retireOtherWorker(worker.id);
          }
        },
      });
    },
  };
}
