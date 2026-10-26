import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createColonySimulation} from '../src/game/simulation/colonySimulation.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {ADULT_SUPPLY_CONFIG} from '../src/game/simulation/simulationConfig.ts';
test('existing four start brood chambers supply 48 places each and shared clock creates eggs without C2 workers',()=>{
 const world=createStartingWorld(),s=createColonySimulation(world);assert.equal(world.broodChambers.length,4);
 s.advance(600);assert.equal(s.queen.snapshot.laidEggs,5);assert.equal(s.queen.snapshot.assignedCount,5);
 assert.deepEqual(s.queen.snapshot.chambers.map(c=>c.capacity),[48,48,48,48]);assert.equal(s.gathering.getCollectors().length,7);
 s.clock.setPaused(true);const before=s.queen.snapshot;s.advance(600);assert.deepEqual(s.queen.snapshot,before);
});
test('actual A3 severe shortage pauses egg laying without deleting assigned or pending eggs',()=>{
 const world=createStartingWorld();world.resources=[];world.decorations=[];
 const s=createColonySimulation(world,undefined,undefined,{...ADULT_SUPPLY_CONFIG,warningDays:.001,severeAfterDays:.002,mortalityAfterDays:6});
 s.advance(10);assert.equal(s.supply.snapshot.eggFactor,0);const before=s.queen.snapshot.laidEggs;s.advance(1200);assert.equal(s.queen.snapshot.laidEggs,before);assert.equal(s.queen.snapshot.effectiveEggsPerDay,0);
});
test('actual completed extra brood chamber is discovered and receives waiting target eggs',()=>{
 const world=createStartingWorld();world.dimensions={columns:20,rows:8,tileSize:24};world.chamberFootprints=[];world.broodChambers=[];world.decorations=[];world.resources=[];
 world.tiles=Array.from({length:8},()=>Array.from({length:20},()=>({terrain:'topsoil',state:'open'})));
 world.landmarks.nestChamberCenter={x:36,y:84};world.storageChambers=[{id:'material',resource:'buildingMaterial',position:{x:36,y:84},areaTiles:100}];
 let excavation;
 const s=createWorkforceSimulation(world,(resources,traffic)=>{
  resources.depositInStore('material',{resource:'buildingMaterial',amount:60});excavation=new ExcavationSystem(world,resources);excavation.setTraffic(traffic);excavation.addBuilder('builder',{x:60,y:84});
  return{workers:()=>excavation.getBuilders(),addWorker:(id,p)=>excavation.addBuilder(id,p),removeWorker:id=>excavation.removeBuilder(id),retireWorker:id=>excavation.removeBuilder(id),advanceWorkers:(seconds,factor)=>excavation.advance(seconds,factor),broodChambers:()=>excavation.chambers.getChambers().filter(c=>c.type.startsWith('brood-')).map(c=>({id:`built-${c.id}`,specialization:c.type.slice(6),capacity:c.capacity,operational:c.operational}))};
 });
 s.queen.setQuotas({gathering:100,building:0,care:0,combat:0});s.advance(120);assert.equal(s.queen.snapshot.bufferCount,1);
 const cells=Array.from({length:20},(_,i)=>({column:3+i%5,row:2+Math.floor(i/5)}));excavation.addOrder(cells,'brood-gathering');
 for(let i=0;i<2000&&!s.queen.snapshot.assignedCount;i++)s.advance(.1);
 assert.equal(s.queen.snapshot.bufferCount,0);assert.ok(s.queen.snapshot.assignedCount>=1);assert.equal(s.queen.snapshot.chambers[0].capacity,40);
});
