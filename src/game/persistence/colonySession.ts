import {migrateColonySave} from './colonyMigration.ts';
import {createStartingWorld} from '../world/worldGenerator.ts';
import type {StartingWorld} from '../world/worldTypes.ts';
import {createWorkforceSimulation} from '../simulation/workforceSimulation.ts';
import {ExcavationSystem} from '../simulation/excavationSystem.ts';
import {PLAYABLE_COLONY_CONFIG, CONSTRUCTION_CONFIG} from '../simulation/simulationConfig.ts';
import type {Specialization} from '../simulation/workforceSystem.ts';
import {newPersistenceTiming} from './persistenceController.ts';
import {validateColonyState} from './validateColonyState.ts';
import {RoyalBroodSystem} from '../simulation/royalBroodSystem.ts';
import {CombinedEggTransport} from '../simulation/eggTransport.ts';

/** One independent model, shared by persistence tests and future menu/scene lifecycle. */
export function createColonySession(identity: {id:string; name:string}, savedWorld?:StartingWorld) {
  if(!identity.id.trim() || !identity.name.trim()) throw new Error('Kolonie-ID und Name fehlen.');
  const world=structuredClone(savedWorld ?? createStartingWorld({additionalFoodSources:true}));
  let excavation!: ExcavationSystem;
  const simulation=createWorkforceSimulation(world,(resources,traffic)=>{
    if(!savedWorld) resources.depositInStore('building-material-store',{resource:'buildingMaterial',amount:CONSTRUCTION_CONFIG.startingMaterial});
    excavation=new ExcavationSystem(world,resources);excavation.setTraffic(traffic);
    if(!savedWorld)for(let i=0;i<2;i++)excavation.addBuilder(`builder-${i}`,{x:world.landmarks.nestChamberCenter.x+(i?3:-3),y:world.landmarks.nestChamberCenter.y});
    return {
      workers:()=>excavation.getBuilders(),addWorker:(id:string,p:{x:number;y:number})=>excavation.addBuilder(id,p),
      removeWorker:(id:string)=>excavation.removeBuilder(id),retireWorker:(id:string)=>excavation.removeBuilder(id),
      repositionWorker:(id:string,p:{x:number;y:number})=>excavation.repositionIdleWorker(id,p),
      restChambers:()=>excavation.chambers.getChambers().filter(r=>r.type==='rest').map(r=>({id:`built-${r.id}`,cells:r.cells,operational:r.operational})),
      broodChambers:()=>excavation.chambers.getChambers().filter(r=>r.type.startsWith('brood-')).map(r=>({id:`built-${r.id}`,specialization:r.type.slice(6) as Specialization,capacity:r.capacity,operational:r.operational,position:{x:(r.cells[0].column+.5)*world.dimensions.tileSize,y:(r.cells[0].row+.5)*world.dimensions.tileSize}})),
      advanceWorkers:(seconds:number,factor:number)=>{syncConstruction();excavation.advance(seconds,factor,id=>simulation.workforce.getWorker(id).assignment==='building',id=>simulation.workforce.efficiency(id,'building'));},
    };
  },PLAYABLE_COLONY_CONFIG.simulationConfig,undefined,{...PLAYABLE_COLONY_CONFIG,restoring:!!savedWorld,physicalQueenSupply:true});
  const royal=new RoyalBroodSystem(simulation.queen,()=>simulation.getProgression().highestPopulation,world.dimensions.tileSize);
  simulation.queen.setRoyalBrood(royal);
  excavation.setQueenLimitProvider(()=>royal.maxQueens);
  simulation.broodSupply.setEggTransport(new CombinedEggTransport(simulation.queen,royal));
  function syncConstruction(force=false){
    const level=simulation.getProgression().level;
    if(force||excavation.developmentStage!==level||excavation.diggingGrade!==level)excavation.setDevelopmentLevel(level);
    royal.syncRooms(excavation.chambers.getChambers().filter(r=>r.type==='queen'));
    simulation.broodSupply.syncRooms(simulation.queen.getLarvalRooms());
  }
  syncConstruction();
  return {id:identity.id,name:identity.name,world,simulation,excavation,royal,syncConstruction,revision:0,persistenceTiming:newPersistenceTiming()};
}
export type ColonySession=ReturnType<typeof createColonySession>;
function canonicalCopy<T>(value:T):T {
  const copy=structuredClone(value);
  const visit=(v:any):void=>{
    if(v instanceof Map){for(const item of v.values())visit(item);}
    else if(v instanceof Set){for(const item of v)visit(item);}
    else if(v && typeof v==='object')for(const key of Object.keys(v)){
      if(v[key]===undefined)delete v[key];else visit(v[key]);
    }
  };
  visit(copy);return copy;
}
export function captureColony(session:ColonySession) {
  session.syncConstruction();
  const s=session.simulation,e=session.excavation;
  return canonicalCopy({format:'anthive-colony' as const,schemaVersion:9 as const,encoding:'map-set-v1' as const,rulesVersion:1 as const,
    id:session.id,name:session.name,revision:session.revision,persistenceTiming:session.persistenceTiming,world:session.world,
    state:{royal:session.royal.exportState(),progression:s.exportProgression(),clock:s.clock.exportState(),resources:s.resources.exportState(),gathering:s.gathering.exportState(),
      workforce:s.workforce.exportState(),engines:s.exportWorkforceState(),queen:s.queen.exportState(),
      broodSupply:s.broodSupply.exportState(),adultSupply:s.supply.exportState(),colony:s.exportColonyState(),
      traffic:s.traffic.exportState(),construction:e.exportState(),materials:e.materials.exportState(),chambers:e.chambers.exportState()}});
}
export type ColonySave=ReturnType<typeof captureColony>;
export function restoreColony(input:unknown):ColonySession {
  const save=migrateColonySave(input).save, session=createColonySession({id:save.id,name:save.name},save.world);
  const s=session.simulation,e=session.excavation,v=save.state;
  if(v.clock.secondsPerGameDay!==s.clock.secondsPerGameDay)throw new Error('Nicht unterstützte Simulationszeit.');
  s.clock.restoreState(v.clock);s.resources.restoreState(v.resources);s.gathering.restoreState(v.gathering);
  s.workforce.restoreState(v.workforce);s.restoreWorkforceState(v.engines);s.queen.restoreState(v.queen);
  s.restoreProgression(v.progression);
  s.broodSupply.restoreState(v.broodSupply);s.supply.restoreState(v.adultSupply);s.restoreColonyState(v.colony);
  s.traffic.restoreState(v.traffic);e.restoreState(v.construction);e.materials.restoreState(v.materials);e.chambers.restoreState(v.chambers);
  session.royal.restoreState(v.royal);
  session.syncConstruction(true);
  session.revision=save.revision;session.persistenceTiming=structuredClone(save.persistenceTiming);return session;
}
/** Explicit Map/Set tags; no executable code, class names or prototype hydration. */
export const MAX_SAVE_BYTES=32*1024*1024;
export function serializeColony(save:ColonySave):string {
  validateColonyState(save);
  const text=JSON.stringify(save,(_key,value)=>value instanceof Map?{$map:[...value]}:value instanceof Set?{$set:[...value]}:value);
  if(text.length>MAX_SAVE_BYTES||new TextEncoder().encode(text).byteLength>MAX_SAVE_BYTES)throw new Error('Spielstand ist zu groß.');
  return text;
}
export function parseColony(text:string):ColonySave {
  if(text.length>MAX_SAVE_BYTES||new TextEncoder().encode(text).byteLength>MAX_SAVE_BYTES)throw new Error('Spielstand ist zu groß.');
  const value=JSON.parse(text,(_key,value)=>{
    if(value && typeof value==='object') {
      if(Object.prototype.hasOwnProperty.call(value,'__proto__')||Object.prototype.hasOwnProperty.call(value,'constructor')||Object.prototype.hasOwnProperty.call(value,'prototype'))throw new Error('Ungültiger Datenschlüssel.');
      if(Object.prototype.hasOwnProperty.call(value,'$map')) {
        if(Object.keys(value).length!==1 || !Array.isArray(value.$map) || value.$map.some((e:unknown)=>!Array.isArray(e)||e.length!==2))throw new Error('Ungültige Map.');
        const map=new Map(value.$map);if(map.size!==value.$map.length)throw new Error('Doppelte Map-ID.');return map;
      }
      if(Object.prototype.hasOwnProperty.call(value,'$set')) {
        if(Object.keys(value).length!==1 || !Array.isArray(value.$set))throw new Error('Ungültiges Set.');
        const set=new Set(value.$set);if(set.size!==value.$set.length)throw new Error('Doppelter Set-Eintrag.');return set;
      }
    }return value;
  });
  return migrateColonySave(value).save;
}
