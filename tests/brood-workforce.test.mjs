import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
function fixture(){
 const world=createStartingWorld();let excavation;
 const s=createWorkforceSimulation(world,(resources,traffic)=>{
  excavation=new ExcavationSystem(world,resources);excavation.setTraffic(traffic);excavation.addBuilder('builder-0',world.landmarks.nestChamberCenter);excavation.addBuilder('builder-1',world.landmarks.nestChamberCenter);
  return{workers:()=>excavation.getBuilders(),addWorker:(id,p)=>excavation.addBuilder(id,p),removeWorker:id=>excavation.removeBuilder(id),retireWorker:id=>excavation.removeBuilder(id),advanceWorkers:(sec,f)=>excavation.advance(sec,f)};
 },undefined,undefined,{eggTransport:false});s.resources.depositInStore('food-store',{resource:'food',amount:540});s.resources.depositInStore('water-store',{resource:'water',amount:540});return{s,world,excavation};
}
test('explicit foreign care counts only after handoff, supplies half capacity, and genuinely replaces resting work',()=>{
 const {s}=fixture();s.resources.takeFromStore('food-store',100);s.resources.takeFromStore('water-store',100);s.advance(5);const carrier=s.gathering.getCollectors().find(c=>c.phase!=='idle');assert.ok(carrier);
 s.moveWorkers('gathering','gathering','care',7);s.advance(.1);assert.ok(s.getWorkers().some(w=>w.pending));
 for(let i=0;i<3000&&s.getWorkers().some(w=>w.pending);i++)s.advance(.1);
 assert.equal(s.getWorkers().filter(w=>w.pending).length,0);
 s.queen.advance(.2,1,[]);s.advance(.1);assert.equal(s.queen.snapshot.careCapacity,35);
 assert.equal(s.getWorkers().filter(w=>w.actualWork==='care').length,7);assert.ok(s.getWorkers().filter(w=>w.actualWork==='care').every(w=>!w.resting));
});
test('actual births enter native groups exactly once at brood-room positions and join adult consumption',()=>{
 const {s,world}=fixture();s.moveWorkers('gathering','gathering','care',7);s.moveWorkers('building','building','care',2);s.advance(1);
 const rooms=s.queen.snapshot.chambers;s.queen.advance(.8,1,[]);s.queen.advance(0,0,rooms,100);
 const original=s.getWorkers().length;s.advance(3600);
 const born=s.getWorkers().filter(w=>w.id.startsWith('born-'));assert.equal(born.length,4);assert.equal(s.getWorkers().length,original+4);
 assert.deepEqual(new Set(born.map(w=>w.specialization)),new Set(['gathering','building','care','combat']));
 for(const worker of born){const room=world.broodChambers.find(r=>r.specialization===worker.specialization);assert.deepEqual(worker.position,{x:(room.cells[0].column+.5)*24,y:(room.cells[0].row+.5)*24});assert.equal(worker.assignment,worker.specialization);}
 s.advance(.1);const workers=s.getWorkers(),before=s.resources.getStoreTotals('food').amount;
 const demand=workers.reduce((sum,w)=>sum+(w.resting?.8:1),1);s.advance(.1);
 assert.ok(Math.abs(before-s.resources.getStoreTotals('food').amount-demand*.1/600)<1e-7);
 assert.equal(s.getWorkers().filter(w=>w.id.startsWith('born-')).length,4);
});
