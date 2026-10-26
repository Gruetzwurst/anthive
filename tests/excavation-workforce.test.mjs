import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createWorkforceSimulation } from '../src/game/simulation/workforceSimulation.ts';
import { ExcavationSystem } from '../src/game/simulation/excavationSystem.ts';
import { EXCAVATION_CONFIG, CHAMBER_CONFIG } from '../src/game/simulation/simulationConfig.ts';
const point=column=>({x:(column+.5)*24,y:60});
const cell=column=>({column,row:2});
function fixture(terrain='topsoil',capacity=20) {
 const world=createStartingWorld();
 world.dimensions={columns:16,rows:5,tileSize:24};
 world.tiles=Array.from({length:5},()=>Array.from({length:16},()=>({terrain,state:'discovered'})));
 for(let i=0;i<3;i++)world.tiles[2][i].state='open';
 world.landmarks.nestChamberCenter=point(2);
 world.resources=[];world.decorations=[];
 world.storageChambers=[{id:'material',resource:'buildingMaterial',position:point(0),areaTiles:capacity/8}];
 let excavation, simulation;
 simulation=createWorkforceSimulation(world, resources=>{
  excavation=new ExcavationSystem(world,resources,EXCAVATION_CONFIG,{...CHAMBER_CONFIG.minimumArea,food:1});excavation.setDiggingGrade(3);excavation.addBuilder('builder-0',point(2));
  return {workers:()=>excavation.getBuilders(),addWorker:(id,pos)=>excavation.addBuilder(id,pos),removeWorker:id=>excavation.removeBuilder(id),retireWorker:id=>excavation.removeBuilder(id),
   advanceWorkers:(seconds,factor)=>excavation.advance(seconds,factor,id=>simulation.workforce.getWorker(id).assignment==='building',id=>simulation.workforce.efficiency(id,'building'))};
 });
 return {simulation,excavation,world};
}
function until(s,p) {for(let i=0;i<5000&&!p();i++)s.advance(.05);assert.ok(p());}
for(const phase of ['digging','loading','deliver'])test(`actual builder reassignment during ${phase} preserves material and finishes only its active action`,()=>{
 const {simulation,excavation}=fixture();
 excavation.addOrder([3,4,5,6,7,8].map(cell));
 until(simulation,()=>{const j=excavation.getBuilders()[0]?.job;return phase==='deliver'?j?.kind==='deliver':j?.phase===phase;});
 const expected=phase==='deliver'?5:1;
 simulation.moveWorkers('building','building','gathering',1);
 assert.equal(simulation.getWorkers().find(w=>w.id==='builder-0').pending,true);
 until(simulation,()=>simulation.getWorkers().find(w=>w.id==='builder-0').actualWork==='gathering');
 assert.equal(excavation.materials.balance.produced,expected);
 assert.equal(excavation.materials.balance.stored,expected);
 assert.equal(excavation.materials.balance.carried,0);
 assert.equal(simulation.workforce.getWorkers().length,8);
});

test('blocked partial load may rest but cannot be removed by group handoff before real delivery',()=>{
 const {simulation,excavation}=fixture('deepRock',2);
 excavation.addOrder([cell(3)]);
 until(simulation,()=>excavation.materials.balance.stored===2&&excavation.materials.balance.carried===3);
 simulation.moveWorkers('building','building','rest',1);
 simulation.advance(1);
 assert.equal(simulation.getWorkers().find(w=>w.id==='builder-0').pending,true);
 assert.equal(simulation.getWorkers().find(w=>w.id==='builder-0').resting,true);
 assert.equal(excavation.materials.balance.carried,3);
 excavation.materials.consumeFromStore('material',2);
 until(simulation,()=>excavation.materials.balance.stored===2);
 excavation.materials.consumeFromStore('material',2);
 until(simulation,()=>simulation.getWorkers().find(w=>w.id==='builder-0').actualWork==='rest');
 assert.equal(excavation.materials.balance.carried,0);
 assert.equal(excavation.materials.balance.stored,1);
 assert.equal(excavation.materials.balance.consumed,4);
});

test('real B1 reassignment finishes one furnishing unit and leaves actual site stock intact',()=>{
 const {simulation,excavation,world}=fixture('topsoil',40);
 const cells=Array.from({length:12},(_,i)=>cell(i+3));for(const c of cells)world.tiles[c.row][c.column].state='open';
 const pile=excavation.materials.produce(point(0),24);
 while(excavation.materials.getGround().some(p=>p.id===pile)){
  excavation.materials.pickUp(pile,'external',5);excavation.materials.deposit('external','material');
 }
 excavation.addOrder(cells,'food');until(simulation,()=>excavation.getBuilders()[0]?.job?.phase==='furnishing');
 simulation.moveWorkers('building','building','rest',1);
 until(simulation,()=>simulation.getWorkers().find(w=>w.id==='builder-0').actualWork==='rest');
 assert.equal(excavation.getConstructionOrders()[0].materialUsed,1);
 const b=excavation.materials.balance;assert.equal(b.carried,0);assert.equal(b.initial+b.produced,b.stored+b.ground+b.atSites+b.consumed);
});
