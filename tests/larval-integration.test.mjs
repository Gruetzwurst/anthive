import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
function fixture(nurses=7){const world=createStartingWorld(),s=createWorkforceSimulation(world,{workers:()=>[],addWorker:()=>{},removeWorker:()=>{},retireWorker:()=>{},advanceWorkers:()=>{}});
 s.resources.depositInStore('food-store',{resource:'food',amount:100});s.resources.depositInStore('water-store',{resource:'water',amount:100});
 s.moveWorkers('gathering','gathering','care',nurses);s.advance(1);
 const rooms=s.queen.snapshot.chambers;s.queen.setQuotas({gathering:100,building:0,care:0,combat:0});s.queen.advance(.2,1,[]);s.queen.advance(1,0,rooms,100);return s;}
function until(s,p){for(let i=0;i<5000&&!p();i++)s.advance(.1);assert.ok(p(),'condition not reached');}
test('actual care workforce moves real single-resource cargo and feeds larvae from private reservoirs',()=>{
 const s=fixture();until(s,()=>s.getWorkers().some(w=>w.load?.amount>0));assert.ok(s.getWorkers().filter(w=>w.load?.amount>0).every(w=>w.actualWork==='care'&&w.load.amount<=5));
 until(s,()=>s.broodSupply.balance.food.consumed>0&&s.broodSupply.balance.water.consumed>0);
 assert.equal(s.broodSupply.getRooms().find(r=>r.specialization==='gathering').larvae,1);
 for(const kind of ['food','water']){const b=s.broodSupply.balance[kind];assert.ok(Math.abs(b.withdrawn-b.atChambers-b.carried-b.consumed-b.dropped-b.returned)<1e-8);}
 assert.equal(s.getWorkers().length,7);
});
test('actual group change while carrying finishes safe delivery before joining collection',()=>{
 const s=fixture(1);until(s,()=>s.broodSupply.getNurses().find(n=>n.id==='collector-0')?.load);
 s.moveWorkers('gathering','care','gathering',1);assert.equal(s.getWorkers().find(w=>w.id==='collector-0').pending,true);
 until(s,()=>s.getWorkers().find(w=>w.id==='collector-0').actualWork==='gathering');
 assert.ok(!s.broodSupply.getNurses().some(n=>n.id==='collector-0'));assert.equal(s.getWorkers().find(w=>w.id==='collector-0').pending,false);
 for(const kind of ['food','water']){const b=s.broodSupply.balance[kind];assert.ok(Math.abs(b.withdrawn-b.atChambers-b.carried-b.consumed-b.dropped-b.returned)<1e-8);}
});
