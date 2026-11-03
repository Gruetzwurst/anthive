import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as config from '../src/game/simulation/simulationConfig.ts';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';

test('playable colony starts with an additional native nurse, actual care and adult consumption',()=>{
 assert.ok(config.PLAYABLE_COLONY_CONFIG);
 const world=createStartingWorld();
 const s=createWorkforceSimulation(world,{workers:()=>[],addWorker:()=>{},removeWorker:()=>{},retireWorker:()=>{},advanceWorkers:()=>{}},undefined,undefined,config.PLAYABLE_COLONY_CONFIG);
 const nurse=s.getWorkers().find(w=>w.specialization==='care');
 assert.equal(s.getWorkers().length,8); // seven existing collectors + one nurse, builders supplied by scene
 assert.equal(nurse.assignment,'care');assert.ok(s.broodSupply.getNurses().some(n=>n.id===nurse.id));
 for(const resource of ['food','water'])s.resources.depositInStore(`${resource}-store`,{resource,amount:540});
 s.advance(180.1);assert.equal(s.queen.snapshot.laidEggs,1);
 assert.ok(s.resources.getStoreTotals('food').amount<540);
 s.advance(40);assert.ok(s.queen.snapshot.eggs[0].arrived,'native nurse physically delivers the first egg');
 assert.equal(s.queen.snapshot.careCapacity,10);
});
test('playable queen lays once per two real minutes; fully supplied development takes six minutes',()=>{
 assert.ok(config.PLAYABLE_COLONY_CONFIG);
 const settings=config.PLAYABLE_COLONY_CONFIG;
 const q=new QueenSystem(settings.queenConfig,settings.broodConfig);
 const room={id:'room',specialization:'gathering',capacity:100,operational:true};
 q.setQuotas({gathering:100,building:0,care:0,combat:0});
 q.advance(119/600,1,[room],100);assert.equal(q.snapshot.laidEggs,0);
 q.advance(1/600,1,[room],100);assert.equal(q.snapshot.laidEggs,1);
 q.advance(359/600,0,[room],100);assert.equal(q.snapshot.bornCount,0);
 q.advance(1/600,0,[room],100);assert.equal(q.snapshot.bornCount,1);
 assert.deepEqual(settings.broodConfig.stageDays,{egg:.1,larva:.3,pupa:.2});
});
test('a native nurse provides twice the actual capacity of a foreign nurse under real care pressure',()=>{
 function fixture(native){
  const world=createStartingWorld();
  const s=createWorkforceSimulation(world,{workers:()=>[],addWorker:()=>{},removeWorker:()=>{},retireWorker:()=>{},advanceWorkers:()=>{}},undefined,undefined,{eggTransport:false,startingCareWorkers:native?1:0});
  if(!native)s.moveWorkers('gathering','gathering','care',1);
  for(const resource of ['food','water'])s.resources.depositInStore(`${resource}-store`,{resource,amount:540});
  s.advance(1);const rooms=s.queen.snapshot.chambers;
  s.queen.setQuotas({gathering:100,building:0,care:0,combat:0});
  s.queen.advance(2,1,[],100);s.queen.advance(0,0,rooms,100);
  s.advance(.1);return s.queen.snapshot;
 }
 const native=fixture(true),foreign=fixture(false);
 assert.equal(native.careCapacity,10);assert.equal(foreign.careCapacity,5);
 assert.equal(native.careFactor,1);assert.equal(foreign.careFactor,.5);
});
