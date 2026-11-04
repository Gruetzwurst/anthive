import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld,terrainAtDepth,surfaceRow} from '../src/game/world/worldGenerator.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {ExcavationSystem,requiredDiggingGrade} from '../src/game/simulation/excavationSystem.ts';
import {EXCAVATION_CONFIG,CHAMBER_CONFIG} from '../src/game/simulation/simulationConfig.ts';
import {createColonySession,captureColony,parseColony,serializeColony,restoreColony} from '../src/game/persistence/colonySession.ts';
const c={column:3,row:3},p={x:60,y:84};
const wire=s=>JSON.stringify(s,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v);
function fixture(terrain='topsoil',open=false){
 const world=createStartingWorld();world.dimensions={columns:18,rows:8,tileSize:24};
 world.tiles=Array.from({length:8},()=>Array.from({length:18},()=>({terrain:'topsoil',state:'discovered'})));
 for(let i=0;i<3;i++)world.tiles[3][i].state='open';world.tiles[3][3]={terrain,state:open?'open':'discovered'};
 const resources=new ResourceSystem();resources.addStore({id:'material',resource:'buildingMaterial',position:p,capacity:100,amount:20,status:'operational',reachable:true});
 const e=new ExcavationSystem(world,resources,EXCAVATION_CONFIG,{...CHAMBER_CONFIG.minimumArea,food:1});e.addBuilder('a',p);
 return {world,resources,e};
}
test('five terrain permissions follow the actual tile, including every boundary and separate stone',()=>{
 for(const [terrain,grade]of [['soil',0],['topsoil',0],['compactEarth',1],['clay',2],['stoneLayer',3],['stone',3],['deepRock',4]])
  for(const row of [0,119])assert.equal(requiredDiggingGrade({column:160,row},{terrain,state:'discovered'}),grade);
 for(const column of [0,100,160,319])for(const [depth,grade]of [[20,0],[21,1],[41,1],[42,2],[66,2],[67,3],[87,3],[88,4]]){
  const row=surfaceRow(column)+depth;assert.equal(requiredDiggingGrade({column,row},{terrain:terrainAtDepth(column,row),state:'discovered'}),grade);
 }
});
test('all five stages change real excavation time without changing material yield',()=>{
 for(const [level,factor]of [1,.85,.65,.45,.25].entries()){
  const {e,world}=fixture();e.setDevelopmentLevel(level);e.addOrder([c]);e.advance(6*factor-.001);
  assert.notEqual(world.tiles[3][3].state,'open');e.advance(.002);assert.equal(world.tiles[3][3].state,'open');assert.equal(e.materials.balance.produced,1);
 }
});
test('foreign builders keep full terrain permission and exactly half developed work speed',()=>{
 const {e,world}=fixture('deepRock');e.setDevelopmentLevel(4);e.addOrder([c]);
 e.advance(17.999,1,()=>true,()=>.5);assert.notEqual(world.tiles[3][3].state,'open');
 e.advance(.002,1,()=>true,()=>.5);assert.equal(world.tiles[3][3].state,'open');assert.equal(e.materials.balance.produced,5);
 const blocked=fixture('compactEarth');blocked.e.setDevelopmentLevel(0);blocked.e.addOrder([c]);blocked.e.advance(100);
 assert.equal(blocked.e.getConstructionOrders()[0].blockReason,'hardness');assert.notEqual(blocked.world.tiles[3][3].state,'open');
});
test('upgrading a running dig preserves work and accelerates only the remaining work',()=>{
 const {e,world}=fixture();e.addOrder([c]);e.advance(2);const progress=e.getConstructionOrders()[0].partialDigSeconds;
 assert.ok(Math.abs(progress-2)<1e-7);e.setDevelopmentLevel(4);assert.equal(e.getConstructionOrders()[0].partialDigSeconds,progress);
 e.advance(.999);assert.notEqual(world.tiles[3][3].state,'open');e.advance(.002);assert.equal(world.tiles[3][3].state,'open');assert.equal(e.materials.balance.produced,1);
});
test('furnishing stages apply only to actual installation with real material consumption',()=>{
 for(const [level,seconds]of [2,1.8,1.5,1.2,.8].entries()){
  const {e}=fixture('topsoil',true);e.setDevelopmentLevel(level);e.addOrder([c],'food');
  for(let n=0;n<500&&e.getBuilders()[0].job?.phase!=='furnishing';n++)e.advance(.01);
  const job=e.getBuilders()[0].job;assert.equal(job.phase,'furnishing');assert.equal(e.materials.balance.consumed,0);
  const remaining=(job.duration-job.progress)/(2/seconds);e.advance(remaining-.0001);assert.equal(e.materials.balance.consumed,0);
  e.advance(.0002);assert.equal(e.materials.balance.consumed,1);
 }
});
test('developed colony saves restore the derived builder stage and reject inconsistent stages',()=>{
 const a=createColonySession({id:'developed',name:'Developed'});a.simulation.restoreProgression({highestPopulation:500});
 const save=captureColony(a);assert.equal(save.state.construction.grade,4);assert.equal(save.state.construction.developmentLevel,4);
 const b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);
 save.state.construction.developmentLevel=0;assert.throws(()=>restoreColony(save));
});
function activeColony(){
 const a=createColonySession({id:'active',name:'Active'}),world=a.world;
 a.simulation.restoreProgression({highestPopulation:50});a.syncConstruction();
 const q=world.landmarks.queenChamberCenter,col=Math.floor(q.x/24),row=Math.floor(q.y/24);
 let target;
 for(let r=row-5;r<=row+5&&!target;r++)for(let c=col-7;c<=col+7;c++){
  const t=world.tiles[r]?.[c];if(t?.terrain==='topsoil'&&t.state!=='open'&&[[c-1,r],[c+1,r],[c,r-1],[c,r+1]].some(([x,y])=>world.tiles[y]?.[x]?.state==='open')){target={column:c,row:r};break;}
 }
 assert.ok(target);world.tiles[target.row][target.column].terrain='compactEarth';a.excavation.addOrder([target]);
 for(let n=0;n<1000&&!a.excavation.getBuilders().some(b=>b.job?.phase==='digging'&&b.job.progress>0);n++)a.excavation.advance(.02);
 assert.ok(a.excavation.getBuilders().some(b=>b.job?.phase==='digging'&&b.job.progress>0));return {a,target};
}
test('running developed work roundtrips and continues with identical material accounting',()=>{
 const {a}=activeColony(),save=captureColony(a),b=restoreColony(parseColony(serializeColony(save)));
 assert.deepEqual(captureColony(b),save);a.excavation.advance(1);b.excavation.advance(1);assert.deepEqual(captureColony(b),captureColony(a));
});
test('schema3 prototype digging preserves partial work while newly locked jobs wait for the milestone',()=>{
 const {a,target}=activeColony(),old=captureColony(a);old.schemaVersion=3;delete old.state.construction.developmentLevel;delete old.state.gathering.developmentLevel;delete old.state.queen.developmentLevel;delete old.state.broodSupply.developmentLevel;
 old.state.progression.highestPopulation=11;old.state.construction.grade=3;
 delete old.state.royal;
 const before=structuredClone(old),progress=a.excavation.getConstructionOrders()[0].partialDigSeconds,b=restoreColony(parseColony(wire(old)));
 assert.deepEqual(old,before);assert.equal(b.excavation.diggingGrade,0);assert.equal(b.excavation.getConstructionOrders()[0].partialDigSeconds,progress);
 assert.equal(b.excavation.getConstructionOrders()[0].blockReason,'hardness');assert.ok(b.excavation.getBuilders().every(w=>!w.job));
 b.simulation.restoreProgression({highestPopulation:50});b.syncConstruction();
 for(let n=0;n<1000&&b.world.tiles[target.row][target.column].state!=='open';n++)b.excavation.advance(.05);
 assert.equal(b.world.tiles[target.row][target.column].state,'open');assert.equal(b.excavation.materials.balance.produced,2);
 const invalid=structuredClone(old);const builder=[...invalid.state.construction.builders.values()].find(w=>w.job?.kind==='dig');builder.job.duration=-1;
 assert.throws(()=>parseColony(wire(invalid)),'migration must validate a job before releasing it');
});
