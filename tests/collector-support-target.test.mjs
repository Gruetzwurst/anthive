import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createColonySimulation} from '../src/game/simulation/colonySimulation.ts';
import {PLAYABLE_COLONY_CONFIG,COLLECTOR_BALANCE_TARGET} from '../src/game/simulation/simulationConfig.ts';
test('one actual collector supplies three adults plus queen through real starting-world paths',()=>{
 assert.equal(COLLECTOR_BALANCE_TARGET.adultsPerCollector,3);
 const others=[{id:'other-a',resting:false},{id:'other-b',resting:false}];
 const s=createColonySimulation(createStartingWorld({additionalFoodSources:true}),{otherWorkers:()=>others,retireOtherWorker:id=>others.splice(others.findIndex(w=>w.id===id),1),advanceOtherWorkers:()=>{}},PLAYABLE_COLONY_CONFIG.simulationConfig);
 for(const worker of s.gathering.getCollectors().slice(1))s.gathering.retireCollector(worker.id);
 for(let day=0;day<8;day++)s.advance(600);
 assert.equal(s.gathering.getCollectors().length,1);assert.equal(others.length,2);
 assert.equal(s.supply.snapshot.workerLosses,0);assert.equal(s.supply.snapshot.workFactor,1);
 for(const resource of ['food','water'])assert.ok(s.resources.getStoreTotals(resource).amount>0,resource);
});
