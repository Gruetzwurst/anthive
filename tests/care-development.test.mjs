import {withoutQueenFeeding} from './helpers/legacyQueenSupply.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
import {BroodSupplySystem} from '../src/game/simulation/broodSupplySystem.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {QUEEN_CONFIG,BROOD_CONFIG,LARVAL_SUPPLY_CONFIG} from '../src/game/simulation/simulationConfig.ts';
import {createColonySession,captureColony,parseColony,serializeColony,restoreColony} from '../src/game/persistence/colonySession.ts';
const p=x=>({x,y:10}),room={id:'room',specialization:'gathering',capacity:100,operational:true,position:p(78),larvae:20};
const wire=s=>JSON.stringify(s,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v);
function supply(stock=100){
 const resources=new ResourceSystem();for(const resource of ['food','water'])resources.addStore({id:resource,resource,position:p(0),capacity:100,amount:stock,status:'operational',reachable:true});
 const s=new BroodSupplySystem(resources,{findPath:(a,b)=>[{...a},{...b}],canMove:()=>true,sourceAccessPoints:source=>[source.position]});
 s.syncRooms([room]);s.addNurse('n',p(0));return {s,resources};
}
test('all care stages change real coverage, foreign care halves it once, and intrinsic stage durations stay fixed',()=>{
 for(const [level,places]of [10,11,12,13,15].entries()){
  const q=new QueenSystem({...QUEEN_CONFIG,eggsPerGameDay:20},{...BROOD_CONFIG,stageDays:{egg:100,larva:100,pupa:100}});
  q.setQuotas({gathering:100,building:0,care:0,combat:0});q.setDevelopmentLevel(level);q.advance(1,1,[room],1);
  assert.equal(q.snapshot.assignedCount,20);assert.equal(q.snapshot.careCapacity,places);assert.equal(q.snapshot.careFactor,places/20);
  q.advance(0,1,[room],.5);assert.equal(q.snapshot.careCapacity,places/2);assert.equal(q.snapshot.careFactor,places/40);
  assert.deepEqual(q.exportState().broodConfig.stageDays,{egg:100,larva:100,pupa:100});
 }
});
test('all nurse loads are physically picked up and delivered without a speed or interaction bonus',()=>{
 for(const [level,amount]of [5,6,8,10,12].entries()){
  const {s,resources}=supply();s.setDevelopmentLevel(level);s.advanceWorkers(.25);
  assert.equal(s.getNurses()[0].load.amount,amount);assert.equal(resources.getStore('food').amount,100-amount);
  assert.equal(s.getRooms()[0].food.amount,0);s.advanceWorkers(1.249);assert.equal(s.getRooms()[0].food.amount,0);
  s.advanceWorkers(.0011);assert.equal(s.getRooms()[0].food.amount,amount);assert.equal(s.speed,78);
 }
});
test('foreign nurses use full developed load at exactly half transport tempo',()=>{
 const {s}=supply();s.setDevelopmentLevel(4);s.advanceWorkers(.5,1,()=>.5);assert.equal(s.getNurses()[0].load.amount,12);
 s.advanceWorkers(2.499,1,()=>.5);assert.equal(s.getRooms()[0].food.amount,0);s.advanceWorkers(.0011,1,()=>.5);assert.equal(s.getRooms()[0].food.amount,12);
});
test('room needs, store contents and reservations still bound multiple nurses; upgrade preserves existing amounts',()=>{
 const {s}=supply(7);s.setDevelopmentLevel(4);s.addNurse('second',p(0));s.advanceWorkers(20);
 assert.equal(s.getRooms()[0].food.amount,7);assert.equal(s.getRooms()[0].water.amount,7);
 const a=supply();a.s.advanceWorkers(.1);const before=a.s.exportState().nurses.get('n').job.amount;a.s.setDevelopmentLevel(4);
 assert.equal(a.s.exportState().nurses.get('n').job.amount,before);a.s.advanceWorkers(1.4001);assert.equal(a.s.getRooms()[0].food.amount,5);
});
function liveBrood(){
 const a=createColonySession({id:'care',name:'Care'});a.simulation.restoreProgression({highestPopulation:500});a.syncConstruction();
 const q=a.simulation.queen.exportState(),r=[...q.rooms.values()].find(r=>r.specialization==='gathering');
 q.eggs=Array.from({length:18},(_,i)=>({id:`egg-${i+1}`,sourceQueenId:'queen-1',targetSpecialization:'gathering',chamberId:r.id,stage:'larva',stageProgressDays:0,arrived:true,carrierId:null,carried:false,origin:{...a.world.landmarks.queenChamberCenter}}));
 a.simulation.queen.restoreState(q);a.simulation.broodSupply.syncRooms(a.simulation.queen.getLarvalRooms());
 for(const resource of ['food','water'])a.simulation.resources.depositInStore(`${resource}-store`,{resource,amount:100});return a;
}
test('real developed larval cargo survives save and produces an identical continued colony',()=>{
 const a=liveBrood();for(let i=0;i<2000&&!a.simulation.broodSupply.getNurses().some(n=>(n.load?.amount??0)>5);i++)a.simulation.advance(.05);
 assert.ok(a.simulation.broodSupply.getNurses().some(n=>(n.load?.amount??0)>5));
 assert.equal(a.simulation.queen.snapshot.careCapacity,15,'one nurse is not credited extra capacity for its delivery job');
 const save=captureColony(a),b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);
 a.simulation.advance(.5);b.simulation.advance(.5);assert.deepEqual(captureColony(b),captureColony(a));
 assert.deepEqual(save.state.queen.broodConfig.stageDays,{egg:.1,larva:.3,pupa:.2});assert.equal(save.state.queen.config.eggsPerGameDay,5);
});
test('developed foreign care and real resource shortage combine as minimum, not multiplied penalties',()=>{
 const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(4,1,[]);q.advance(1,0,[room],100);q.setDevelopmentLevel(4);q.advance(0,0,[room],.5);
 assert.equal(q.snapshot.careFactor,.375);
 const s=new BroodSupplySystem(new ResourceSystem(),{findPath:()=>null});s.setDevelopmentLevel(4);s.syncRooms(q.getLarvalRooms());s.consume(2,q.getLarvalRooms());
 assert.equal(s.getRooms()[0].shortage.factor,.25);const before=q.snapshot.eggs[0].stageProgressDays;
 q.advance(.1,0,[room],.5,d=>s.consume(d,q.getLarvalRooms()),s);
 assert.ok(Math.abs(q.snapshot.eggs[0].stageProgressDays-before-.025)<1e-8);
});
test('schema5 keeps developed collector cargo but never legitimises oversized old nurse cargo',()=>{
 const a=createColonySession({id:'old-care',name:'Old Care'});a.simulation.restoreProgression({highestPopulation:500});
 for(let i=0;i<2000&&!a.simulation.gathering.getCollectors().some(w=>(w.load?.amount??0)>5);i++)a.simulation.advance(.05);
 assert.ok(a.simulation.gathering.getCollectors().some(w=>(w.load?.amount??0)>5));
 const old=withoutQueenFeeding(captureColony(a));old.schemaVersion=5;delete old.state.queen.developmentLevel;delete old.state.broodSupply.developmentLevel;
 delete old.state.royal;
 const before=structuredClone(old),migrated=parseColony(wire(old));assert.equal(migrated.schemaVersion,9);assert.equal(migrated.state.queen.developmentLevel,4);assert.deepEqual(migrated.state.gathering,old.state.gathering);assert.deepEqual(old,before);
 const nurse=old.state.broodSupply.nurses.values().next().value;nurse.load={resource:'food',amount:6};old.state.broodSupply.withdrawn.food+=6;
 assert.throws(()=>parseColony(wire(old)),/alte Pflegeladung/);
});
test('current saves reject care stages that do not match permanent colony history',()=>{
 const a=createColonySession({id:'invalid-care',name:'Invalid Care'});a.simulation.restoreProgression({highestPopulation:500});
 for(const section of ['queen','broodSupply']){const save=captureColony(a);save.state[section].developmentLevel=0;assert.throws(()=>restoreColony(save));}
});
