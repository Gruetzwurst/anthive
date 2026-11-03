import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {GatheringSystem} from '../src/game/simulation/gatheringSystem.ts';
import {AdultSupplySystem} from '../src/game/simulation/adultSupplySystem.ts';
import {PLAYABLE_COLONY_CONFIG} from '../src/game/simulation/simulationConfig.ts';
for(const collectors of [150,200])test(`food network supplies 400 adults with ${collectors} real collectors on flat reachable routes`,()=>{
 const world=createStartingWorld({additionalFoodSources:true});
 const food=world.resources.filter(r=>r.kind==='foodSource');assert.equal(food.length,12);
 const config=PLAYABLE_COLONY_CONFIG.simulationConfig.foodSource;
 assert.ok(food.length*config.regenerationPerDay>401);
 const resources=new ResourceSystem(),home={x:176.5*24,y:60};
 for(const source of food)resources.addSource({id:source.id,resource:'food',kind:'finite',position:{x:source.position.x,y:60},capacity:config.capacity,amount:config.initialAmount,regenerationPerDay:config.regenerationPerDay,recoveryDays:config.recoveryDays});
 resources.addSource({id:'pond',resource:'water',kind:'unlimited',position:{x:home.x+48,y:60}});
 for(const resource of ['food','water'])resources.addStore({id:resource,resource,position:home,capacity:540,amount:0,status:'operational',reachable:true});
 // Explicit flat corridor fixture: real distances, movements, finite sources,
 // regeneration, cargo and deliveries, without claiming a full-world FPS test.
 const navigation={findPath:(from,to)=>[{...from},{...to}],canMove:()=>true,sourceAccessPoints:source=>[{...source.position}]};
 const nearest=resources.listSources().filter(s=>s.resource==='food').sort((a,b)=>Math.abs(a.position.x-home.x)-Math.abs(b.position.x-home.x))[0];
 resources.takeFromSource(nearest.id,nearest.amount); // deliberate exhausted-source scenario
 const gathering=new GatheringSystem(resources,navigation),supply=new AdultSupplySystem(resources);
 for(let i=0;i<collectors;i++)gathering.addCollector(`a-${i}`,home);
 const used=new Set(),usedDuringRecovery=new Set();const take=resources.takeFromSource.bind(resources);
 resources.takeFromSource=(id,amount)=>{const recovering=resources.getSource(nearest.id).recoveryDaysLeft>0;const load=take(id,amount);if(load.resource==='food'&&load.amount>0){used.add(id);if(recovering){assert.notEqual(id,nearest.id);usedDuringRecovery.add(id);}}return load;};
 let recovery=false;
 for(let i=0;i<600;i++){
  resources.advance(10/600);gathering.advance(10,supply.snapshot.workFactor);
  supply.advance(10/600,{activeWorkers:400,restingWorkers:0,queens:1});
  if(i%5===0)recovery ||= resources.listSources().some(s=>s.kind==='finite'&&s.recoveryDaysLeft>0);
 }
 assert.equal(supply.snapshot.workerLosses,0);assert.equal(supply.snapshot.workFactor,1);
 assert.ok(resources.getStoreTotals('food').amount>100);assert.ok(resources.getStoreTotals('water').amount>100);
 assert.ok(used.size>=2);assert.ok(usedDuringRecovery.size>0);assert.ok(recovery,'collectors must switch away from exhausted sources');
});
