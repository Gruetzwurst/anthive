import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony,restoreColony} from '../src/game/persistence/colonySession.ts';
const fixture=seconds=>{const s=createColonySession({id:'strict',name:'Strikt'});if(seconds)s.simulation.advance(seconds);return s;};
function rejectMutations(snapshot,mutations){for(const mutate of mutations){const bad=structuredClone(snapshot);mutate(bad);assert.throws(()=>restoreColony(bad));}}
test('missing world labels and brood centers are rejected before scene creation',()=>{
 rejectMutations(captureColony(fixture()),[s=>delete s.world.landmarks.foodStoreCenter,s=>s.world.landmarks.broodChamberCenters.care=null]);
});
test('historical egg IDs cannot collide with future eggs or duplicate queued births',()=>{
 const s=captureColony(fixture(650));assert.ok(s.state.queen.eggs.some(e=>e.stage==='adult'));
 rejectMutations(s,[s=>s.state.queen.eggs[0].id=`egg-${s.state.queen.eggs.length+1}`,s=>{const e=s.state.queen.eggs.find(e=>e.stage==='adult');s.state.queen.births.push({id:`born-${e.id}`,eggId:e.id,chamberId:e.chamberId,specialization:e.targetSpecialization});}]);
});
test('every unarrived egg must remain represented in the real buffer',()=>{
 const s=captureColony(fixture(120.001));assert.ok(s.state.queen.buffer.length);
 rejectMutations(s,[s=>s.state.queen.buffer=[]]);
});
test('impossible loads and positions are rejected',()=>{
 rejectMutations(captureColony(fixture()),[
 s=>s.state.gathering.workers.values().next().value.load={resource:'food',amount:99999},
 s=>s.state.broodSupply.nurses.values().next().value.load={resource:'buildingMaterial',amount:1},
 s=>s.state.gathering.workers.values().next().value.position={x:1e9,y:1},
 ]);
});
test('larval consumption, shortage credit and delivery balances cannot be incomplete or invented',()=>{
 const s=captureColony(fixture(1));assert.ok(s.state.broodSupply.shortage.rooms.size);
 rejectMutations(s,[s=>delete s.state.broodSupply.rooms.values().next().value.food.consumed,s=>delete s.state.broodSupply.shortage.rooms.values().next().value.lossCredit,s=>s.state.broodSupply.withdrawn.food+=3]);
});
test('construction partial states refer to real cells and installed units match material use',()=>{
 const a=fixture();a.excavation.addOrder(Array.from({length:16},(_,i)=>({column:204+i%4,row:35+Math.floor(i/4)})),'food');
 rejectMutations(captureColony(a),[s=>s.state.construction.orders[0].progress.set('999,999',1),s=>s.state.construction.orders[0].installed.set('204,35',1),s=>s.state.construction.grade=4]);
});
test('event credits and action progress cannot create negative future time steps',()=>{
 const a=fixture(1),s=captureColony(a);
 rejectMutations(s,[s=>s.state.queen.progress=1000,s=>s.state.adultSupply.states.food.eggFactor=2,s=>s.state.broodSupply.shortage.rooms.values().next().value.lossCredit=2]);
 const b=fixture();b.excavation.addOrder([{column:148,row:35}]);b.simulation.advance(.1);const save=captureColony(b);
 const builder=[...save.state.construction.builders.values()].find(b=>b.job);assert.ok(builder);
 rejectMutations(save,[s=>[...s.state.construction.builders.values()].find(b=>b.job).job.duration=0,s=>[...s.state.construction.builders.values()].find(b=>b.job).job.progress=1e10]);
});
