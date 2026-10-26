import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
const kinds=['gathering','building','care','combat'];
const rooms=(capacity=100)=>kinds.map(specialization=>({id:specialization,specialization,capacity,operational:true}));
const shares={gathering:25,building:25,care:25,combat:25};
function balance(q){const s=q.snapshot;assert.equal(s.laidEggs,s.bufferCount+s.assignedCount);assert.equal(new Set(s.eggs.map(e=>e.id)).size,s.laidEggs);assert.ok(s.eggs.every(e=>e.stage==='egg'&&e.developmentProgress===0));}
test('five actual eggs per supplied game day, no reproduction on zero elapsed time, no C2 growth',()=>{
 const q=new QueenSystem();q.advance(1,1,rooms());assert.equal(q.snapshot.laidEggs,5);assert.equal(q.snapshot.assignedCount,5);q.advance(0,1,rooms());assert.equal(q.snapshot.laidEggs,5);balance(q);
});
test('A3 egg factor affects production once and partial progress survives supply pause',()=>{
 const q=new QueenSystem();q.advance(.1,1,rooms());assert.equal(q.snapshot.layingProgress,.5);q.advance(100,0,rooms());assert.equal(q.snapshot.laidEggs,0);q.advance(.2,.5,rooms());assert.equal(q.snapshot.laidEggs,1);balance(q);
});
test('buffer throttle crosses selected 75/90 percent thresholds and stops exactly at fifty',()=>{
 const q=new QueenSystem();q.advance(8,1,[]);assert.equal(q.snapshot.bufferCount,39);assert.equal(q.snapshot.bufferRateFactor,.5);
 q.advance(2.4,1,[]);assert.equal(q.snapshot.bufferCount,45);assert.equal(q.snapshot.bufferRateFactor,.25);
 q.advance(1000,1,[]);assert.equal(q.snapshot.bufferCount,50);assert.equal(q.snapshot.effectiveEggsPerDay,0);balance(q);
});
test('large time steps and many small updates produce the same eggs, assignments and fractional progress',()=>{
 const one=new QueenSystem(),many=new QueenSystem();one.advance(13,1,[]);for(let i=0;i<1300;i++)many.advance(.01,1,[]);
 assert.equal(one.snapshot.laidEggs,many.snapshot.laidEggs);assert.ok(Math.abs(one.snapshot.layingProgress-many.snapshot.layingProgress)<1e-8);assert.deepEqual(one.snapshot.eggs,many.snapshot.eggs);
});
test('small percentage quotas survive deterministic rounding; invalid edits are atomic',()=>{
 const q=new QueenSystem();q.setQuotas({gathering:97,building:1,care:1,combat:1});q.advance(20,1,rooms(200));
 assert.deepEqual(Object.fromEntries(q.snapshot.chambers.map(r=>[r.id,r.occupied])),{gathering:97,building:1,care:1,combat:1});
 assert.throws(()=>q.setQuotas({...shares,gathering:24}),/100/);assert.throws(()=>q.setQuotas({...shares,care:NaN}));assert.throws(()=>q.setQuotas({...shares,care:-1,combat:51}));assert.equal(q.snapshot.quotas.gathering,97);balance(q);
});
test('fractional small quotas stay fair even when unchanged settings are repeatedly applied',()=>{
 const q=new QueenSystem(),quotas={gathering:99.7,building:.1,care:.1,combat:.1};q.setQuotas(quotas);
 for(let i=0;i<200;i++){q.advance(1,1,rooms(2000));q.setQuotas(quotas);}
 assert.deepEqual(q.snapshot.chambers.map(r=>r.occupied),[997,1,1,1]);balance(q);
});
test('full specialty waits without reassigning its eggs or blocking others; new room drains waiting eggs',()=>{
 const q=new QueenSystem(),r=rooms();r[0].operational=false;q.advance(4,1,r);
 assert.equal(q.snapshot.bufferCount,5);assert.ok(q.snapshot.eggs.filter(e=>e.chamberId===null).every(e=>e.targetSpecialization==='gathering'));
 assert.equal(q.snapshot.assignedCount,15);r.push({id:'new-gathering',specialization:'gathering',capacity:3,operational:true});q.advance(0,1,r);
 assert.equal(q.snapshot.bufferCount,2);assert.equal(q.snapshot.chambers.find(c=>c.id==='new-gathering').occupied,3);
 r[0].operational=true;q.advance(0,1,r);assert.equal(q.snapshot.bufferCount,0);balance(q);
});
test('same-specialty rooms are balanced by occupied places without overfilling; snapshots cannot mutate identities',()=>{
 const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});const r=[{id:'a',specialization:'gathering',capacity:3,operational:true},{id:'b',specialization:'gathering',capacity:5,operational:true}];
 q.advance(1.2,1,r);assert.deepEqual(q.snapshot.chambers.map(c=>c.occupied),[3,3]);q.advance(1,1,r);assert.deepEqual(q.snapshot.chambers.map(c=>c.occupied),[3,5]);assert.equal(q.snapshot.bufferCount,3);
 const s=q.snapshot;s.eggs[0].chamberId='wrong';s.quotas.gathering=0;assert.equal(q.snapshot.eggs[0].chamberId,'a');assert.equal(q.snapshot.quotas.gathering,100);balance(q);
});
test('quota changes affect future eggs while existing pending targets and assigned specializations persist',()=>{
 const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(1,1,[]);
 q.setQuotas({gathering:0,building:100,care:0,combat:0});q.advance(1,1,rooms());
 assert.equal(q.snapshot.chambers.find(c=>c.id==='gathering').occupied,5);assert.equal(q.snapshot.chambers.find(c=>c.id==='building').occupied,5);balance(q);
});
test('unreachable rooms keep existing eggs but accept none; restoring access preserves IDs',()=>{
 const q=new QueenSystem();q.setQuotas({gathering:100,building:0,care:0,combat:0});const r=rooms();q.advance(1,1,r);const ids=q.snapshot.eggs.map(e=>e.id);
 r[0].operational=false;q.advance(1,1,r);assert.equal(q.snapshot.bufferCount,5);assert.equal(q.snapshot.assignedCount,5);
 r[0].operational=true;q.advance(0,1,r);assert.equal(q.snapshot.bufferCount,0);assert.deepEqual(q.snapshot.eggs.slice(0,5).map(e=>e.id),ids);balance(q);
});
