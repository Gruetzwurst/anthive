import type { StartingWorld, WorldPoint } from '../world/worldTypes.ts';
import type { ResourceAmount } from './resourceTypes.ts';
import { AdultSupplySystem } from './adultSupplySystem.ts';
import { createGatheringSimulation } from './gatheringSimulation.ts';
import { ADULT_SUPPLY_CONFIG, SIMULATION_CONFIG } from './simulationConfig.ts';
import type { AdultSupplyConfig, SimulationConfig } from './simulationConfig.ts';
import { CHAMBER_CONFIG } from './simulationConfig.ts';
import { QueenSystem } from './queenSystem.ts';
import type { BroodRoom } from './queenSystem.ts';
import { cardinalNeighbors, cellKey } from '../world/gridPathfinding.ts';

export type OtherAdultWorker = { id: string; resting: boolean; position?: WorldPoint };
export type ColonyWorkerAdapter = {
  otherWorkers: () => OtherAdultWorker[];
  retireOtherWorker: (id: string) => void;
  advanceOtherWorkers: (realSeconds: number, workFactor: number) => void;
  broodChambers?: () => BroodRoom[];
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
  const queen = new QueenSystem();
  let topology = -1, startingRooms: BroodRoom[] = [];
  const broodRooms = (includeAdditional = true): BroodRoom[] => {
    if (topology !== simulation.traffic.topologyRevision) {
      topology = simulation.traffic.topologyRevision;
      const size = world.dimensions.tileSize, home = world.landmarks.nestChamberCenter;
      const origin = {column: Math.floor(home.x / size), row: Math.floor(home.y / size)};
      const open = (cell: {column: number; row: number}) => world.tiles[cell.row]?.[cell.column]?.state === 'open';
      const reachable = new Set<string>(), queue = [];
      if (open(origin)) {queue.push(origin);reachable.add(cellKey(origin));}
      for (let i = 0; i < queue.length; i++) for (const next of cardinalNeighbors(queue[i])) {
        const key = cellKey(next);if (open(next) && !reachable.has(key)) {reachable.add(key);queue.push(next);}
      }
      startingRooms = (world.broodChambers ?? []).map(room => ({
        id: room.id, specialization: room.specialization, capacity: room.cells.length * CHAMBER_CONFIG.broodPlacesPerTile,
        operational: room.cells.length >= CHAMBER_CONFIG.minimumArea[`brood-${room.specialization}`] && room.cells.every(cell => reachable.has(cellKey(cell))),
      }));
    }
    return [...startingRooms, ...(includeAdditional ? workers.broodChambers?.() ?? [] : [])];
  };
  // Dynamic builder adapters are initialized by the caller after construction.
  queen.advance(0, supply.snapshot.eggFactor, broodRooms(false));
  const droppedLoads: DroppedResourceLoad[] = [];
  return {
    ...simulation, supply, queen,
    getDroppedLoads: () => droppedLoads.map(drop => ({ ...drop, position: { ...drop.position }, load: { ...drop.load } })),
    advance(realSeconds: number) {
      return simulation.advance(realSeconds, {
        otherPositions: () => workers.otherWorkers().flatMap(worker => worker.position ? [worker.position] : []),
        workFactor: () => supply.snapshot.workFactor,
        afterStep(gameDays, seconds, factor) {
          const eggFactor = supply.snapshot.eggFactor;
          workers.advanceOtherWorkers(seconds, factor);
          const collectors = simulation.gathering.getCollectors();
          const other = workers.otherWorkers();
          const resting = collectors.filter(worker => worker.phase === 'idle' || worker.phase === 'waiting').length
            + other.filter(worker => worker.resting).length;
          const result = supply.advance(gameDays, {
            activeWorkers: collectors.length + other.length - resting,
            restingWorkers: resting,
            queens: 1, // The existing queen is counted separately from workers.
          });
          queen.advance(gameDays, eggFactor, broodRooms());
          // Stable IDs make the provisional loss selection deterministic; never
          // include the queen or create replacement workers automatically.
          const candidates = [...collectors.map(worker => ({ id: worker.id, collector: true,
            resting: worker.phase === 'idle' || worker.phase === 'waiting' })),
            ...other.map(worker => ({ id: worker.id, collector: false, resting: worker.resting }))]
            .sort((a, b) => Number(a.resting) - Number(b.resting) || a.id.localeCompare(b.id));
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
