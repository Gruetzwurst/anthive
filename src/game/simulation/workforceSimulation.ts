import type { StartingWorld, WorldPoint } from '../world/worldTypes.ts';
import { createColonySimulation } from './colonySimulation.ts';
import { WorkforceSystem } from './workforceSystem.ts';
import type { Specialization, WorkAssignment, WorkforceWorker } from './workforceSystem.ts';
import type { SimulationConfig, AdultSupplyConfig } from './simulationConfig.ts';
import type { ResourceSystem } from './resourceSystem.ts';
import type { TunnelTrafficSystem } from './tunnelTrafficSystem.ts';
import type { BroodRoom } from './queenSystem.ts';
import type { ResourceAmount } from './resourceTypes.ts';

export type BuilderSnapshot = { id: string; position: WorldPoint; resting: boolean; readyToLeave?: boolean };
export type WorkforceBuilderAdapter = {
  workers: () => BuilderSnapshot[];
  addWorker: (id: string, position: WorldPoint) => void;
  removeWorker: (id: string) => void;
  retireWorker: (id: string) => void;
  advanceWorkers: (realSeconds: number, workFactor: number) => void;
  broodChambers?: () => BroodRoom[];
};
type EngineState = { engine: 'gathering' | 'building' | 'care' | 'parked'; position: WorldPoint };
export type WorkforceSnapshot = WorkforceWorker & {
  position: WorldPoint;
  actualWork: WorkAssignment;
  resting: boolean;
  pending: boolean;
  load?: ResourceAmount | null;
};
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** B1 coordinates existing engines; all stocks, time and mortality remain A1–A3. */
export function createWorkforceSimulation(
  world: StartingWorld,
  builderSource: WorkforceBuilderAdapter | ((resources: ResourceSystem, traffic: TunnelTrafficSystem) => WorkforceBuilderAdapter),
  config?: SimulationConfig,
  supplyConfig?: AdultSupplyConfig,
) {
  let builders: WorkforceBuilderAdapter;
  const workforce = new WorkforceSystem();
  const states = new Map<string, EngineState>();
  const home = world.landmarks.nestChamberCenter;
  const simulation = createColonySimulation(world, {
    effectiveNurses: () => workforce.getWorkers().filter(worker => worker.assignment === 'care' && states.get(worker.id)?.engine === 'care')
      .reduce((sum, worker) => sum + workforce.efficiency(worker.id, 'care'), 0),
    birthWorker: birth => {
      workforce.addWorker(birth.id, birth.specialization);
      states.set(birth.id, {engine: 'parked', position: {...birth.position ?? home}});
      reconcile();
    },
    broodChambers: () => builders?.broodChambers?.() ?? [],
    otherWorkers: () => {
      const activeBuilders = new Map(builders.workers().map(worker => [worker.id, worker]));
      const nurses = new Map(simulation.broodSupply.getNurses().map(worker=>[worker.id,worker]));
      const careActive = simulation.queen.hasDevelopingBrood;
      return workforce.getWorkers().filter(worker => states.get(worker.id)?.engine !== 'gathering').map(worker => ({
        id: worker.id, resting: states.get(worker.id)?.engine === 'care' && (careActive || nurses.get(worker.id)?.active) ? false : activeBuilders.get(worker.id)?.resting ?? true,
        position: nurses.get(worker.id)?.position ?? activeBuilders.get(worker.id)?.position ?? states.get(worker.id)!.position,
      }));
    },
    retireOtherWorker: id => {
      if (states.get(id)?.engine === 'building') builders.retireWorker(id);
      if (states.get(id)?.engine === 'care') simulation.broodSupply.removeNurse(id);
      workforce.removeWorker(id); states.delete(id);
    },
    advanceOtherWorkers: (seconds, factor) => {
      builders.advanceWorkers(seconds, factor);
      reconcile();
      simulation.broodSupply.advanceWorkers(seconds,factor,id=>workforce.efficiency(id,'care'));
      reconcile();
    },
  }, config, supplyConfig);
  builders = typeof builderSource === 'function' ? builderSource(simulation.resources, simulation.traffic) : builderSource;
  for (const collector of simulation.gathering.getCollectors()) {
    workforce.addWorker(collector.id, 'gathering');
    states.set(collector.id, { engine: 'gathering', position: { ...collector.position } });
  }
  for (const builder of builders.workers()) {
    workforce.addWorker(builder.id, 'building');
    states.set(builder.id, { engine: 'building', position: { ...builder.position } });
  }

  function reconcile(): void {
    const collectors = new Map(simulation.gathering.getCollectors().map(worker => [worker.id, worker]));
    const activeBuilders = new Map(builders.workers().map(worker => [worker.id, worker]));
    const nurses = new Map(simulation.broodSupply.getNurses().map(worker=>[worker.id,worker]));
    for (const worker of workforce.getWorkers()) {
      const state = states.get(worker.id)!;
      if (state.engine === 'gathering') {
        const collector = collectors.get(worker.id);
        if (!collector) { workforce.removeWorker(worker.id); states.delete(worker.id); continue; }
        state.position = { ...collector.position };
        simulation.gathering.setWorkEfficiency(worker.id, workforce.efficiency(worker.id, 'gathering'));
        simulation.gathering.setCollectingEnabled(worker.id, worker.assignment === 'gathering', home);
        if (worker.assignment !== 'gathering' && !collector.load && collector.phase === 'idle' && distance(collector.position, home) < 1e-7) {
          simulation.gathering.retireCollector(worker.id);
          state.engine = 'parked';
        }
      } else if (state.engine === 'building') {
        const builder = activeBuilders.get(worker.id);
        if (!builder) { workforce.removeWorker(worker.id); states.delete(worker.id); continue; }
        state.position = { ...builder.position };
        if (worker.assignment !== 'building' && (builder.readyToLeave ?? builder.resting)) {
          builders.removeWorker(worker.id);
          state.engine = 'parked';
        }
      } else if (state.engine==='care') {
        const nurse=nurses.get(worker.id);
        if (!nurse) {workforce.removeWorker(worker.id);states.delete(worker.id);continue;}
        state.position={...nurse.position};simulation.broodSupply.setNursingEnabled(worker.id,worker.assignment==='care');
        if(worker.assignment!=='care' && nurse.readyToLeave){simulation.broodSupply.removeNurse(worker.id);state.engine='parked';}
      }
      if (state.engine === 'parked') {
        if (worker.assignment === 'gathering') {
          simulation.gathering.addCollector(worker.id, state.position);
          simulation.gathering.setWorkEfficiency(worker.id, workforce.efficiency(worker.id, 'gathering'));
          state.engine = 'gathering';
        } else if (worker.assignment === 'building') {
          builders.addWorker(worker.id, state.position);
          state.engine = 'building';
        } else if(worker.assignment==='care') {
          simulation.broodSupply.addNurse(worker.id,state.position);state.engine='care';
        }
      }
    }
  }

  function getWorkers(): WorkforceSnapshot[] {
    const collectors = new Map(simulation.gathering.getCollectors().map(worker => [worker.id, worker]));
    const activeBuilders = new Map(builders.workers().map(worker => [worker.id, worker]));
    const nurses = new Map(simulation.broodSupply.getNurses().map(worker=>[worker.id,worker]));
    const hasBrood = simulation.queen.hasDevelopingBrood;
    return workforce.getWorkers().map(worker => {
      const state = states.get(worker.id)!;
      const collector = collectors.get(worker.id), builder = activeBuilders.get(worker.id);
      const nurse=nurses.get(worker.id),careActive = state.engine === 'care' && (hasBrood || !!nurse?.active);
      const actualWork = state.engine==='care' ? careActive?'care':'rest' : state.engine === 'parked' ? 'rest' : state.engine;
      return { ...worker, position: { ...(nurse?.position ?? collector?.position ?? builder?.position ?? state.position) }, actualWork,load:nurse?.load,
        resting: careActive ? false : state.engine === 'parked' || (collector ? collector.phase === 'idle' || collector.phase === 'waiting' : builder?.resting ?? true),
        pending: state.engine==='care' ? worker.assignment!=='care' : state.engine !== 'parked' && actualWork !== worker.assignment,
      };
    });
  }

  return {
    ...simulation, workforce, getWorkers,
    moveWorkers(specialization: Specialization, from: WorkAssignment, to: WorkAssignment, count: number) {
      workforce.moveWorkers(specialization, from, to, count);
      reconcile();
    },
    advance(realSeconds: number) {
      const step = simulation.advance(realSeconds);
      reconcile();
      return step;
    },
  };
}
