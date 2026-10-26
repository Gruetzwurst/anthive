import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
const room={id:'room',specialization:'gathering',capacity:100,operational:true};
function cohort(count=1){const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(count/5,1,[]);q.advance(0,0,[room],100);return q;}
test('assigned egg advances through one/three/two days and emits exactly one native birth',()=>{
 const q=cohort();q.advance(1,0,[room],1);assert.equal(q.snapshot.eggs[0].stage,'larva');q.advance(3,0,[room],1);assert.equal(q.snapshot.eggs[0].stage,'pupa');q.advance(2,0,[room],1);
 assert.equal(q.snapshot.eggs[0].stage,'adult');assert.equal(q.snapshot.bornCount,1);assert.equal(q.snapshot.assignedCount,0);assert.equal(q.snapshot.chambers[0].occupied,0);
 assert.deepEqual(q.drainBirths().map(b=>[b.eggId,b.specialization,b.chamberId]),[['egg-1','gathering','room']]);q.advance(100,0,[room],1);assert.deepEqual(q.drainBirths(),[]);
});
for(const [nurses,days] of [[1,6],[.75,8],[.5,12],[0,24],[100,6]])test(`${nurses} effective nurses for ten brood: expected maturity after ${days} days without care deaths`,()=>{
 const q=cohort(10);q.advance(days-.001,0,[room],nurses);assert.equal(q.snapshot.bornCount,0);assert.equal(q.snapshot.assignedCount,10);q.advance(.001,0,[room],nurses);assert.equal(q.snapshot.bornCount,10);assert.equal(q.drainBirths().length,10);
});
test('newly laid/assigned eggs do not inherit elapsed time before their actual laying event',()=>{
 const q=new QueenSystem();q.advance(1,1,[room],100);const eggs=q.snapshot.eggs;
 assert.equal(eggs.length,5);assert.ok(Math.abs(eggs[0].stageProgressDays-.8)<1e-8);assert.ok(eggs[4].stageProgressDays<1e-8);
});
test('care changes preserve progress; unreachable or unassigned brood never advances',()=>{
 const q=cohort();q.advance(2,0,[room],0);assert.equal(q.snapshot.eggs[0].stageProgressDays,.5);q.advance(1,0,[{...room,operational:false}],100);assert.equal(q.snapshot.eggs[0].stageProgressDays,.5);
 q.advance(.5,0,[room],1);assert.equal(q.snapshot.eggs[0].stage,'larva');assert.ok(q.snapshot.eggs[0].stageProgressDays<1e-8);
 const waiting=new QueenSystem();waiting.advance(100,1,[],0);assert.ok(waiting.snapshot.eggs.every(e=>e.stage==='egg'&&e.developmentProgress===0));
});
test('birth frees a real place and waiting egg starts at zero, with conserved identities',()=>{
 const q=cohort(2),small={...room,capacity:1};
 // Begin with a fresh unassigned cohort so both compete for the single place.
 const one=new QueenSystem();one.setQuotas({gathering:100,building:0,care:0,combat:0});one.advance(.4,1,[]);one.advance(0,0,[small],1);one.advance(6,0,[small],1);
 assert.equal(one.snapshot.bornCount,1);assert.equal(one.snapshot.assignedCount,1);assert.equal(one.snapshot.bufferCount,0);assert.equal(one.snapshot.eggs[1].stageProgressDays,0);
 assert.equal(one.snapshot.laidEggs,one.snapshot.bornCount+one.snapshot.assignedCount+one.snapshot.bufferCount);assert.equal(q.snapshot.assignedCount,2);
});
test('large and small development/laying steps agree including births and buffer refill',()=>{
 const a=new QueenSystem(),b=new QueenSystem(),r=[{...room,capacity:3}];a.setQuotas({gathering:100,building:0,care:0,combat:0});b.setQuotas(a.snapshot.quotas);
 a.advance(15,1,r,.2);for(let i=0;i<1500;i++)b.advance(.01,1,r,.2);
 const x=a.snapshot,y=b.snapshot;assert.equal(x.laidEggs,y.laidEggs);assert.equal(x.bornCount,y.bornCount);assert.equal(x.bufferCount,y.bufferCount);
 assert.deepEqual(x.eggs.map(e=>[e.id,e.stage,e.chamberId]),y.eggs.map(e=>[e.id,e.stage,e.chamberId]));
 for(let i=0;i<x.eggs.length;i++)assert.ok(Math.abs(x.eggs[i].stageProgressDays-y.eggs[i].stageProgressDays)<1e-7);
});
