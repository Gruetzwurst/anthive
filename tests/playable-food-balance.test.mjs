import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createColonySimulation} from '../src/game/simulation/colonySimulation.ts';
import {SIMULATION_CONFIG,PLAYABLE_COLONY_CONFIG} from '../src/game/simulation/simulationConfig.ts';
test('twenty actual collectors sustain food and water for fifteen days with the playable source balance',()=>{
 const others=Array.from({length:3},(_,i)=>({id:`other-${i}`,resting:false}));
 const world=createStartingWorld(),s=createColonySimulation(world,{
  otherWorkers:()=>others,retireOtherWorker:id=>others.splice(others.findIndex(w=>w.id===id),1),advanceOtherWorkers:()=>{},
 },PLAYABLE_COLONY_CONFIG.simulationConfig??SIMULATION_CONFIG);
 for(let i=7;i<20;i++)s.gathering.addCollector(`collector-${i}`,world.landmarks.nestChamberCenter);
 const stocks=[];for(let day=0;day<15;day++){s.advance(600);stocks.push(s.resources.getStoreTotals('food').amount);}
 assert.equal(s.supply.snapshot.workerLosses,0);assert.equal(s.supply.snapshot.workFactor,1);
 assert.ok(s.resources.getStoreTotals('food').amount>400,JSON.stringify({food:s.resources.getStoreTotals('food'),source:s.resources.getSource('surface-food-source')}));
 assert.ok(stocks[14]>=stocks[4]-5,JSON.stringify(stocks));
 assert.ok(s.resources.getStoreTotals('water').amount>0);
 assert.ok(s.resources.getSource('surface-food-source').amount>0);
});
