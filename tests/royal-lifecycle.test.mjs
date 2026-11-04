import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
import {RoyalBroodSystem} from '../src/game/simulation/royalBroodSystem.ts';
const rooms=[{id:'workers',specialization:'gathering',capacity:100,operational:true,position:{x:24,y:24}}];
function fixture(){
 const queen=new QueenSystem();queen.requireEggTransport({x:12,y:12});queen.setQuotas({gathering:100,building:0,care:0,combat:0});
 const royal=new RoyalBroodSystem(queen,()=>50,24);queen.setRoyalBrood(royal);
 royal.syncRooms([{id:20,cells:[{column:2,row:2}],operational:true}]);
 const id=royal.getEggs()[0].id;
 const deliver=()=>{assert.ok(royal.claimEgg(id,'carrier'));assert.ok(royal.pickUpEgg(id,'carrier'));assert.ok(royal.deliverEgg(id,'carrier'));};
 const environment={syncRooms(){},nextEventDays:()=>Infinity,progress:(_id,days,care)=>days*care};
 return {queen,royal,id,deliver,environment,advance:(days,nurses=1,env=environment)=>queen.advance(days,0,rooms,nurses,undefined,env)};
}
test('royal brood requires arrival and care, develops in2/6/4 minutes, and becomes exactly one adult queen',()=>{
 const a=fixture();a.advance(20);assert.equal(a.royal.getEggs()[0].stageProgressDays,0);a.deliver();
 a.advance(20,0);assert.equal(a.royal.getEggs()[0].stageProgressDays,0);
 a.advance(.2);assert.equal(a.royal.getEggs()[0].stage,'larva');
 a.advance(.6);assert.equal(a.royal.getEggs()[0].stage,'pupa');
 a.advance(.399);assert.equal(a.queen.queenCount,1);a.advance(.001);assert.equal(a.queen.queenCount,2);
 a.advance(10);assert.equal(a.queen.queenCount,2);assert.equal(a.royal.getEggs()[0].stage,'adult');
});
test('royal brood occupies two care places and pauses completely when larval supply is absent',()=>{
 const a=fixture();a.deliver();a.advance(.2,.1);assert.equal(a.royal.getEggs()[0].stage,'egg');
 assert.ok(Math.abs(a.royal.getEggs()[0].stageProgressDays-.1)<1e-8);
 a.advance(.1);assert.equal(a.royal.getEggs()[0].stage,'larva');
 a.advance(30,1,{...a.environment,progress:()=>0});assert.equal(a.royal.getEggs()[0].stage,'larva');assert.equal(a.royal.getEggs()[0].stageProgressDays,0);
 a.advance(1);assert.equal(a.queen.queenCount,2);
});
test('each adult queen lays at her own position with an independent buffer and fair shared quotas',()=>{
 const a=fixture();a.deliver();a.advance(1.2);
 a.queen.advance(.4,1,rooms,1);let eggs=a.queen.snapshot.eggs;
 assert.equal(eggs.length,4);assert.equal(eggs.filter(e=>e.sourceQueenId==='queen-1').length,2);
 const extra=a.queen.getQueens().find(q=>q.id!=='queen-1');assert.deepEqual(extra.position,{x:60,y:60});
 for(const e of eggs)assert.deepEqual(e.origin,e.sourceQueenId==='queen-1'?{x:12,y:12}:{x:60,y:60});
 // Fill both independent buffers, then empty only the original queen's buffer.
 a.queen.advance(100,1,rooms,1);eggs=a.queen.snapshot.eggs;const cap=a.queen.exportState().config.bufferCapacity;
 assert.equal(eggs.filter(e=>e.sourceQueenId===extra.id).length,cap);
 for(const e of a.queen.getEggRequests().filter(e=>eggs.find(x=>x.id===e.eggId).sourceQueenId==='queen-1')){
  a.queen.claimEgg(e.eggId,'carrier');a.queen.pickUpEgg(e.eggId,'carrier');a.queen.deliverEgg(e.eggId,'carrier');
 }
 const before=a.queen.snapshot.laidEggs;a.queen.advance(.2,1,rooms,1);assert.equal(a.queen.snapshot.laidEggs,before+1);
 assert.equal(a.queen.snapshot.eggs.filter(e=>e.sourceQueenId===extra.id).length,cap);
});
test('royal stage transitions and new queen laying agree for large and small time steps',()=>{
 const a=fixture(),b=fixture();a.deliver();b.deliver();
 a.queen.advance(1.8,1,rooms,10,undefined,a.environment);
 for(let i=0;i<180;i++)b.queen.advance(.01,1,rooms,10,undefined,b.environment);
 assert.equal(a.queen.queenCount,2);assert.equal(a.queen.snapshot.laidEggs,b.queen.snapshot.laidEggs);
 assert.deepEqual(a.queen.snapshot.eggs.map(e=>[e.id,e.sourceQueenId]),b.queen.snapshot.eggs.map(e=>[e.id,e.sourceQueenId]));
});
test('a full original buffer does not hide or block the new queen next egg',()=>{
 const a=fixture();a.deliver();a.queen.advance(100,1,rooms,0,undefined,a.environment);
 assert.equal(a.queen.queenCount,1);a.advance(1.2);a.queen.advance(0,1,rooms,1);
 assert.equal(a.queen.snapshot.effectiveEggsPerDay,5);
 assert.ok(Math.abs(a.queen.snapshot.daysUntilNextEgg-.2)<1e-8);
 const before=a.queen.snapshot.laidEggs;a.queen.advance(.2,1,rooms,1);
 assert.equal(a.queen.snapshot.laidEggs,before+1);assert.notEqual(a.queen.snapshot.eggs.at(-1).sourceQueenId,'queen-1');
});
