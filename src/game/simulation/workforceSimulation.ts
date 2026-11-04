import { RestSystem } from './restSystem.ts';
import {COLONY_MILESTONES} from './simulationConfig.ts';
import type { RestChamber, RestSnapshot } from './restSystem.ts';
import type { StartingWorld, WorldPoint } from '../world/worldTypes.ts';
import { createColonySimulation } from './colonySimulation.ts';
import { WorkforceSystem } from './workforceSystem.ts';
import type { Specialization, WorkAssignment, WorkforceWorker } from './workforceSystem.ts';
import type { SimulationConfig, AdultSupplyConfig, QueenConfig, BroodConfig } from './simulationConfig.ts';
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
  restChambers?: () => RestChamber[];
  repositionWorker?: (id: string, position: WorldPoint) => boolean;
};
type EngineState = { engine: 'gathering' | 'building' | 'care' | 'parked'; position: WorldPoint };
export type WorkforceSnapshot = WorkforceWorker & {
  position: WorldPoint;
  actualWork: WorkAssignment;
  resting: boolean;
  rest?: RestSnapshot;
  pending: boolean;
  load?: ResourceAmount | null;
  eggId?:string|null;
};
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** B1 coordinates existing engines; all stocks, time and mortality remain A1–A3. */
export function createWorkforceSimulation(
  world: StartingWorld,
  builderSource: WorkforceBuilderAdapter | ((resources: ResourceSystem, traffic: TunnelTrafficSystem) => WorkforceBuilderAdapter),
  config?: SimulationConfig,
  supplyConfig?: AdultSupplyConfig,
  options: {eggTransport:boolean; startingCareWorkers?:number; queenConfig?:QueenConfig; broodConfig?:BroodConfig; restoring?:boolean} = {eggTransport:true},
) {
  let builders: WorkforceBuilderAdapter;
  let rest: RestSystem;
  const workforce = new WorkforceSystem();
  let highestPopulation=1;
  function getProgression(){
    // Adult queens count alongside workers; developing brood is excluded.
    const population=workforce.size+simulation.queen.queenCount;
    highestPopulation=Math.max(highestPopulation,population);
    const level=COLONY_MILESTONES.filter(n=>highestPopulation>=n).length;
    if(simulation.gathering.developmentStage!==level)simulation.gathering.setDevelopmentLevel(level);
    if(simulation.queen.developmentStage!==level)simulation.queen.setDevelopmentLevel(level);
    if(simulation.broodSupply.developmentStage!==level)simulation.broodSupply.setDevelopmentLevel(level);
    return {population,highestPopulation,level,nextMilestone:COLONY_MILESTONES[level]??null};
  }
  const states = new Map<string, EngineState>();
  const home = world.landmarks.nestChamberCenter;
  const simulation = createColonySimulation(world, {
    observePopulation:()=>{getProgression();},
    effectiveNurses: () => workforce.getWorkers().filter(worker => worker.assignment === 'care' && states.get(worker.id)?.engine === 'care')
      .reduce((sum, worker) => sum + workforce.efficiency(worker.id, 'care'), 0),
    birthWorker: birth => {
      workforce.addWorker(birth.id, birth.specialization);
      getProgression(); // Capture the peak even if deaths occur in the same simulation step.
      states.set(birth.id, {engine: 'parked', position: {...birth.position ?? home}});
      reconcile();
    },
    broodChambers: () => builders?.broodChambers?.() ?? [],
    restingInChambers: () => getWorkers().filter(worker => worker.resting && worker.rest?.occupied).length,
    otherWorkers: () => {
      const activeBuilders = new Map(builders.workers().map(worker => [worker.id, worker]));
      const nurses = new Map(simulation.broodSupply.getNurses().map(worker=>[worker.id,worker]));
      const careActive = simulation.queen.hasDevelopingBrood;
      return workforce.getWorkers().filter(worker => states.get(worker.id)?.engine !== 'gathering').map(worker => ({
        id: worker.id, resting: rest?.get(worker.id) ? true : states.get(worker.id)?.engine === 'care' && (careActive || nurses.get(worker.id)?.active) ? false : activeBuilders.get(worker.id)?.resting ?? true,
        position: nurses.get(worker.id)?.position ?? activeBuilders.get(worker.id)?.position ?? states.get(worker.id)!.position,
      }));
    },
    retireOtherWorker: id => {
      if (states.get(id)?.engine === 'building') builders.retireWorker(id);
      if (states.get(id)?.engine === 'care') simulation.broodSupply.removeNurse(id);
      rest?.release(id);workforce.removeWorker(id); states.delete(id);
    },
    advanceOtherWorkers: (seconds, factor) => {
      builders.advanceWorkers(seconds, factor);
      reconcile();
      simulation.broodSupply.advanceWorkers(seconds,factor,id=>workforce.efficiency(id,'care'));
      reconcile();
      advanceRest(seconds);
    },
  }, config, supplyConfig, options);
  builders = typeof builderSource === 'function' ? builderSource(simulation.resources, simulation.traffic) : builderSource;
  rest = new RestSystem(simulation.navigation,world.dimensions.tileSize);
  if(options.eggTransport){simulation.queen.requireEggTransport(world.landmarks.queenChamberCenter);simulation.broodSupply.setEggTransport(simulation.queen);}
  for (const collector of simulation.gathering.getCollectors()) {
    workforce.addWorker(collector.id, 'gathering');
    states.set(collector.id, { engine: 'gathering', position: { ...collector.position } });
  }
  for (const builder of builders.workers()) {
    workforce.addWorker(builder.id, 'building');
    states.set(builder.id, { engine: 'building', position: { ...builder.position } });
  }

  const startingCareWorkers = options.restoring ? 0 : options.startingCareWorkers ?? 0;
  if (!Number.isInteger(startingCareWorkers) || startingCareWorkers < 0) throw new RangeError('Invalid starting care workforce');
  for (let i = 0; i < startingCareWorkers; i++) {
    const id = `nurse-${i}`;
    workforce.addWorker(id, 'care');
    states.set(id, {engine: 'parked', position: {...world.landmarks.queenChamberCenter}});
  }
  reconcile();

  function reconcile(): void {
    const collectors = new Map(simulation.gathering.getCollectors().map(worker => [worker.id, worker]));
    const activeBuilders = new Map(builders.workers().map(worker => [worker.id, worker]));
    const nurses = new Map(simulation.broodSupply.getNurses().map(worker=>[worker.id,worker]));
    for (const worker of workforce.getWorkers()) {
      const state = states.get(worker.id)!;
      if (state.engine === 'gathering') {
        const collector = collectors.get(worker.id);
        if (!collector) { rest?.release(worker.id);workforce.removeWorker(worker.id); states.delete(worker.id); continue; }
        state.position = { ...collector.position };
        simulation.gathering.setWorkEfficiency(worker.id, workforce.efficiency(worker.id, 'gathering'));
        simulation.gathering.setCollectingEnabled(worker.id, worker.assignment === 'gathering', home);
        if (worker.assignment !== 'gathering' && !collector.load && collector.phase === 'idle' && distance(collector.position, home) < 1e-7) {
          simulation.gathering.retireCollector(worker.id);
          state.engine = 'parked';
        }
      } else if (state.engine === 'building') {
        const builder = activeBuilders.get(worker.id);
        if (!builder) { rest?.release(worker.id);workforce.removeWorker(worker.id); states.delete(worker.id); continue; }
        state.position = { ...builder.position };
        if (worker.assignment !== 'building' && (builder.readyToLeave ?? builder.resting)) {
          builders.removeWorker(worker.id);
          state.engine = 'parked';
        }
      } else if (state.engine==='care') {
        const nurse=nurses.get(worker.id);
        if (!nurse) {rest?.release(worker.id);workforce.removeWorker(worker.id);states.delete(worker.id);continue;}
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

  function advanceRest(seconds: number): void {
    const chambers=builders.restChambers?.()??[];
    if(!chambers.length && !rest.size)return;
    const collectors=new Map(simulation.gathering.getCollectors().map(worker=>[worker.id,worker]));
    const currentBuilders=new Map(builders.workers().map(worker=>[worker.id,worker]));
    const nurses=new Map(simulation.broodSupply.getNurses().map(worker=>[worker.id,worker]));
    const idle=workforce.getWorkers().flatMap(worker=>{
      const state=states.get(worker.id)!;
      if(state.engine!=='parked' && state.engine!==worker.assignment)return [];
      const collector=collectors.get(worker.id),builder=currentBuilders.get(worker.id),nurse=nurses.get(worker.id);
      const eligible=state.engine==='parked' || (state.engine==='gathering' && collector?.phase==='idle' && !collector.load)
        || (state.engine==='building' && builder?.resting && (builder.readyToLeave??true) && !!builders.repositionWorker)
        || (state.engine==='care' && nurse?.readyToLeave);
      return eligible ? [{id:worker.id,position:collector?.position??builder?.position??nurse?.position??state.position}] : [];
    });
    rest.advance(seconds,chambers,idle,(id,position)=>{
      const state=states.get(id)!;
      const moved=state.engine==='gathering' ? simulation.gathering.repositionIdleWorker(id,position)
        : state.engine==='care' ? simulation.broodSupply.repositionIdleWorker(id,position)
        : state.engine==='building' ? builders.repositionWorker?.(id,position)??false : true;
      if(moved)state.position={...position};
      return moved;
    });
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
      return { ...worker, position: { ...(nurse?.position ?? collector?.position ?? builder?.position ?? state.position) }, actualWork,load:nurse?.load,eggId:nurse?.eggId,
        rest: rest?.get(worker.id),
        resting: rest?.get(worker.id) ? true : careActive ? false : state.engine === 'parked' || (collector ? collector.phase === 'idle' || collector.phase === 'waiting' : builder?.resting ?? true),
        pending: state.engine==='care' ? worker.assignment!=='care' : state.engine !== 'parked' && actualWork !== worker.assignment,
      };
    });
  }

  return {
    ...simulation, workforce, getWorkers,getProgression,
    exportProgression:()=>({highestPopulation:getProgression().highestPopulation}),
    restoreProgression(state:{highestPopulation:number}){
      if(!Number.isSafeInteger(state.highestPopulation)||state.highestPopulation<workforce.size+simulation.queen.queenCount)throw new Error('Ungültiger Koloniehöchststand.');
      highestPopulation=state.highestPopulation;
    },
    exportWorkforceState: () => structuredClone({states, rest: rest.exportState()}),
    restoreWorkforceState(state: {states: Map<string, EngineState>; rest: ReturnType<RestSystem['exportState']>}) {
      states.clear(); for (const [id, value] of structuredClone(state.states)) states.set(id, value);
      rest.restoreState(state.rest);
    },
    moveWorkers(specialization: Specialization, from: WorkAssignment, to: WorkAssignment, count: number) {
      const before=new Map(workforce.getWorkers().map(worker=>[worker.id,worker.assignment]));
      workforce.moveWorkers(specialization, from, to, count);
      for(const worker of workforce.getWorkers())if(before.get(worker.id)!==worker.assignment)rest.release(worker.id);
      reconcile();
    },
    advance(realSeconds: number) {
      getProgression();
      const step = simulation.advance(realSeconds);
      reconcile();
      getProgression();
      return step;
    },
  };
}
