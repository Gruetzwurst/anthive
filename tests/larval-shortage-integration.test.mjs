import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
import {BroodSupplySystem} from '../src/game/simulation/broodSupplySystem.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
const room={id:'a',specialization:'gathering',capacity:100,operational:true,position:{x:0,y:0}};
function fixture(count=20){const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(count/5,1,[]);q.advance(1,0,[room],100);const s=new BroodSupplySystem(new ResourceSystem(),{findPath:()=>null});s.syncRooms(q.getLarvalRooms());
 const advance=(days,nurses=100)=>q.advance(days,0,[room],nurses,d=>{for(const loss of s.consume(d,q.getLarvalRooms()))q.loseLarvae(loss.roomId,loss.count);},s);
 return{q,s,advance};}
test('actual empty room warns, then slows only larvae; real losses free slots and remain in the egg ledger',()=>{
 const {q,s,advance}=fixture();advance(1);assert.equal(q.snapshot.eggs[0].stageProgressDays,1);advance(5);assert.equal(q.snapshot.lostCount,0);assert.equal(q.snapshot.eggs[0].stage,'larva');advance(1);
 assert.equal(q.snapshot.lostCount,1);assert.equal(q.snapshot.chambers[0].occupied,19);assert.equal(q.snapshot.laidEggs,q.snapshot.assignedCount+q.snapshot.bufferCount+q.snapshot.bornCount+q.snapshot.lostCount);
 advance(30);assert.equal(q.snapshot.bornCount+q.snapshot.lostCount,20);assert.equal(q.drainBirths().length,q.snapshot.bornCount);assert.equal(s.balance.food.consumed,0);assert.equal(s.balance.water.consumed,0);
});
test('real brood MIN factor is 50%, not 25%, and care shortage alone cannot kill',()=>{
 const {q,s,advance}=fixture();s.shortage.observe('a',20,.5,1);s.shortage.advance(1);
 // Isolate the environmental contract from physical depletion for the exact combination check.
 q.advance(1,0,[room],1,undefined,{syncRooms:()=>{},nextEventDays:()=>Infinity,progress:(_id,days,care)=>days*Math.min(.5,care)});
 assert.equal(q.snapshot.eggs[0].stageProgressDays,.5);assert.equal(q.snapshot.lostCount,0);
 const safe=fixture();safe.q.advance(30,0,[room],0);assert.equal(safe.q.snapshot.lostCount,0);assert.equal(safe.q.snapshot.bornCount,20);
});
test('large and small integrated steps match stage changes, losses and demand',()=>{
 const a=fixture(40),b=fixture(40);a.advance(11);for(let i=0;i<1100;i++)b.advance(.01);
 assert.equal(a.q.snapshot.lostCount,b.q.snapshot.lostCount);assert.deepEqual(a.q.snapshot.stageCounts,b.q.snapshot.stageCounts);
 for(let i=0;i<a.q.snapshot.eggs.length;i++)assert.ok(Math.abs(a.q.snapshot.eggs[i].stageProgressDays-b.q.snapshot.eggs[i].stageProgressDays)<1e-7);
 for(const kind of ['food','water'])assert.ok(Math.abs(a.s.getRooms()[0][kind].unmet-b.s.getRooms()[0][kind].unmet)<1e-6);
});

test('real delivered reserves delay shortage until depletion and replenishment recovers smoothly without phantom withdrawal',()=>{
 const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(4,1,[]);q.advance(1,0,[room],100);
 const resources=new ResourceSystem();for(const resource of ['food','water'])resources.addStore({id:resource,resource,position:{x:0,y:0},capacity:100,amount:2.5,status:'operational',reachable:true});
 const s=new BroodSupplySystem(resources,{findPath:(from,to)=>[from,to],canMove:()=>true});s.syncRooms(q.getLarvalRooms());s.addNurse('n',{x:0,y:0});s.advanceWorkers(100);s.setNursingEnabled('n',false);
 const advance=days=>q.advance(days,0,[room],100,d=>{for(const loss of s.consume(d,q.getLarvalRooms()))q.loseLarvae(loss.roomId,loss.count);},s);
 advance(.25);assert.equal(s.getRooms()[0].shortage.shortageDays,0);advance(1);assert.equal(q.snapshot.eggs[0].stageProgressDays,1.25);assert.equal(s.getRooms()[0].shortage.factor,.25);
 advance(.5);assert.equal(q.snapshot.eggs[0].stageProgressDays,1.375);
 for(const resource of ['food','water'])resources.depositInStore(resource,{resource,amount:50});s.setNursingEnabled('n',true);s.advanceWorkers(100);s.setNursingEnabled('n',false);
 assert.equal(s.getRooms()[0].shortage.factor,.25);advance(.5);assert.ok(Math.abs(s.getRooms()[0].shortage.factor-.625)<1e-8);advance(.5);assert.ok(Math.abs(q.snapshot.eggs[0].stageProgressDays-2)<1e-8);assert.equal(s.getRooms()[0].shortage.factor,1);
 for(const kind of ['food','water']){const b=s.balance[kind];assert.ok(Math.abs(b.withdrawn-b.atChambers-b.carried-b.consumed-b.dropped-b.returned)<1e-8);}
});
