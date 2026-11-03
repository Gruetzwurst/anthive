import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
function fixture(builderSource){
 const world=createStartingWorld();world.dimensions={columns:24,rows:5,tileSize:24};
 world.tiles=Array.from({length:5},()=>Array.from({length:24},()=>({terrain:'soil',state:'discovered'})));
 for(let c=0;c<24;c++)world.tiles[2][c].state='open';
 world.landmarks.nestChamberCenter={x:36,y:60};world.landmarks.queenChamberCenter={x:36,y:60};world.resources=[];world.decorations=[];world.storageChambers=[];world.broodChambers=[];
 let operational=true;
 const simulation=createWorkforceSimulation(world,builderSource ? ((resources,traffic)=>builderSource(resources,traffic,world)) : {workers:()=>[],addWorker:()=>{},removeWorker:()=>{},retireWorker:()=>{},advanceWorkers:()=>{},restChambers:()=>[{id:'rest',operational,cells:Array.from({length:16},(_,i)=>({column:i+8,row:2}))}]});
 return {simulation,world,disable:()=>{operational=false;}};
}
test('idle collectors walk to reserved places and engine positions follow physical rest movement',()=>{
 const {simulation,disable}=fixture();const start=simulation.getWorkers()[0].position;
 simulation.advance(.1);let worker=simulation.getWorkers()[0];
 assert.ok(worker.rest);assert.equal(worker.rest.occupied,false);assert.ok(worker.position.x>start.x);assert.ok(worker.position.x<200);
 assert.deepEqual(simulation.gathering.getCollectors()[0].position,worker.position);
 simulation.advance(6);worker=simulation.getWorkers()[0];assert.equal(worker.rest.occupied,true);
 assert.equal(new Set(simulation.getWorkers().map(w=>w.rest.spotId)).size,7);
 const position={...worker.position};disable();simulation.advance(.1);
 assert.equal(simulation.getWorkers()[0].rest,undefined);assert.deepEqual(simulation.getWorkers()[0].position,position);
});
test('new suitable collector work wakes a resting worker from its real location',()=>{
 const {simulation}=fixture();simulation.advance(6.13);const before=simulation.getWorkers()[0];assert.ok(before.rest?.occupied);
 simulation.resources.addSource({id:'water',resource:'water',kind:'unlimited',position:{x:36,y:60}});
 simulation.resources.addStore({id:'water-store',resource:'water',amount:0,capacity:100,position:{x:36,y:60},status:'operational',reachable:true});
 simulation.advance(.1);const worker=simulation.getWorkers()[0];assert.equal(worker.rest,undefined);assert.equal(worker.resting,false);assert.ok(Math.hypot(worker.position.x-before.position.x,worker.position.y-before.position.y)<9);
});
test('group change releases a real occupied place without resetting the ant position',()=>{
 const {simulation}=fixture();simulation.advance(6);const worker=simulation.getWorkers()[0];assert.ok(worker.rest.occupied);
 simulation.moveWorkers('gathering','gathering','care',1);
 const after=simulation.getWorkers()[0];assert.equal(after.rest,undefined);assert.deepEqual(after.position,worker.position);
});
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
test('idle builder engine walks to rest and takes a real dig order from that position',()=>{
 let engine,simulation;
 ({simulation}=fixture((resources,traffic,world)=>{
  engine=new ExcavationSystem(world,resources);engine.setTraffic(traffic);engine.addBuilder('builder', {x:36,y:60});
  return {workers:()=>engine.getBuilders(),addWorker:(id,p)=>engine.addBuilder(id,p),removeWorker:id=>engine.removeBuilder(id),retireWorker:id=>engine.removeBuilder(id),advanceWorkers:(sec,f)=>engine.advance(sec,f),repositionWorker:(id,p)=>engine.repositionIdleWorker(id,p),restChambers:()=>[{id:'rest',operational:true,cells:Array.from({length:16},(_,i)=>({column:i+8,row:2}))}]};
 }));
 simulation.advance(6.13);const before=simulation.getWorkers().find(w=>w.id==='builder');assert.ok(before.rest?.occupied);
 engine.addOrder([{column:8,row:3}]);simulation.advance(.1);
 const after=simulation.getWorkers().find(w=>w.id==='builder');assert.equal(after.rest,undefined);assert.equal(after.resting,false);
 assert.ok(Math.hypot(after.position.x-before.position.x,after.position.y-before.position.y)<9);
});
test('idle nurse rests physically and wakes for an actual egg transport request',()=>{
 const {simulation}=fixture();simulation.moveWorkers('gathering','gathering','care',1);simulation.advance(6.13);
 const before=simulation.getWorkers()[0];assert.ok(before.rest?.occupied);assert.deepEqual(simulation.broodSupply.getNurses()[0].position,before.position);
 simulation.queen.setQuotas({gathering:0,building:0,care:100,combat:0});
 simulation.queen.advance(.2,1,[{id:'brood',specialization:'care',capacity:32,operational:true,position:{x:36,y:60}}]);
 assert.ok(simulation.queen.getEggRequests().length);simulation.advance(.1);
 const after=simulation.getWorkers()[0];assert.equal(after.rest,undefined);assert.equal(after.resting,false);
 assert.ok(Math.hypot(after.position.x-before.position.x,after.position.y-before.position.y)<9);
});
