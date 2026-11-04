import assert from 'node:assert/strict';
import {test} from 'node:test';
import {GatheringSystem} from '../src/game/simulation/gatheringSystem.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {createColonySession,captureColony,parseColony,serializeColony,restoreColony} from '../src/game/persistence/colonySession.ts';
const point=x=>({x,y:10});
const wire=s=>JSON.stringify(s,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v);
function fixture({distance=105,stock=100,capacity=100}={}){
 const resources=new ResourceSystem();resources.addSource({id:'source',resource:'food',kind:'finite',position:point(distance),capacity:100,amount:stock,regenerationPerDay:0,recoveryDays:0});
 resources.addStore({id:'store',resource:'food',position:point(0),capacity,amount:0,status:'operational',reachable:true});
 const navigation={findPath:(a,b)=>[{...a},{...b}],canMove:()=>true,sourceAccessPoints:s=>[s.position]};
 const g=new GatheringSystem(resources,navigation);g.addCollector('a',point(0));return {resources,g};
}
test('all collector stages use actual developed load and movement with unchanged interaction duration',()=>{
 for(const [level,[load,speed]]of [[5,78],[7,84],[9,91],[12,98],[15,105]].entries()){
  const {g,resources}=fixture({distance:speed});g.setDevelopmentLevel(level);g.advance(1.249);
  assert.equal(g.getCollectors()[0].load,null);g.advance(.0011);assert.equal(g.getCollectors()[0].load.amount,load);
  assert.equal(resources.getStore('store').amount,0);g.advance(1.249);assert.equal(resources.getStore('store').amount,0);
  g.advance(.001);assert.equal(resources.getStore('store').amount,load);assert.equal(resources.getSource('source').amount,100-load);
 }
});
test('foreign collectors carry the full developed load and complete a trip in exactly twice the time',()=>{
 const native=fixture(),foreign=fixture();for(const {g}of [native,foreign])g.setDevelopmentLevel(4);
 foreign.g.setWorkEfficiency('a',.5);native.g.advance(2.5);foreign.g.advance(2.5);
 assert.equal(native.resources.getStore('store').amount,15);assert.equal(foreign.g.getCollectors()[0].load.amount,15);assert.equal(foreign.resources.getStore('store').amount,0);
 foreign.g.advance(2.5);assert.equal(foreign.resources.getStore('store').amount,15);assert.equal(foreign.resources.getSource('source').amount,85);
});
test('larger loads respect finite stock, limited storage and other collectors reservations',()=>{
 for(const [stock,capacity,expected]of [[9,100,9],[100,9,9],[7,3,3]]){
  const {g,resources}=fixture({stock,capacity});g.setDevelopmentLevel(4);g.addCollector('b',point(0));g.advance(20);
  assert.equal(resources.getStore('store').amount,expected);assert.equal(resources.getSource('source').amount,stock-expected);
  assert.ok(g.getCollectors().every(w=>!w.load));
 }
});
test('upgrading an in-flight reservation or existing cargo never invents extra resources',()=>{
 for(const phase of ['toSource','toStore']){
  const {g,resources}=fixture();g.advance(phase==='toSource'?.1:105/78+.25+.001);
  const before=g.exportState().workers.get('a');assert.equal(before.phase,phase);
  g.setDevelopmentLevel(4);assert.equal(g.exportState().workers.get('a').expected,before.expected);assert.deepEqual(g.getCollectors()[0].load,before.load);
  for(let n=0;n<1000&&resources.getStore('store').amount===0;n++)g.advance(.005);
  assert.equal(resources.getStore('store').amount,5);assert.equal(resources.getSource('source').amount,95);
 }
});
test('stage follows colony history, survives save and applies to newly reassigned collectors',()=>{
 const a=createColonySession({id:'a',name:'A'});a.simulation.restoreProgression({highestPopulation:500});
 const save=captureColony(a);assert.equal(save.state.gathering.developmentLevel,4);
 const b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);
 b.simulation.moveWorkers('building','building','gathering',1);b.simulation.advance(.01);
 const foreign=[...b.simulation.gathering.exportState().workers.values()].find(w=>w.id.startsWith('builder'));
 assert.ok(foreign);assert.equal(foreign.efficiency,.5);assert.equal(b.simulation.gathering.carryCapacity,15);
 save.state.gathering.developmentLevel=0;assert.throws(()=>restoreColony(save));
});
test('developed live cargo roundtrips and continues with the identical resource history',()=>{
 const a=createColonySession({id:'cargo',name:'Cargo'});a.simulation.restoreProgression({highestPopulation:500});
 for(let n=0;n<2000&&!a.simulation.gathering.getCollectors().some(w=>(w.load?.amount??0)>5);n++)a.simulation.advance(.05);
 assert.ok(a.simulation.gathering.getCollectors().some(w=>(w.load?.amount??0)>5));
 const save=captureColony(a),b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);
 a.simulation.advance(.5);b.simulation.advance(.5);assert.deepEqual(captureColony(b),captureColony(a));
});
test('schema4 preserves existing loads and rejects old overloads before raising the carry limit',()=>{
 const a=createColonySession({id:'old',name:'Old'}),old=captureColony(a);old.schemaVersion=4;delete old.state.gathering.developmentLevel;delete old.state.queen.developmentLevel;delete old.state.broodSupply.developmentLevel;
 old.state.progression.highestPopulation=500;old.state.construction.grade=4;old.state.construction.developmentLevel=4;
 delete old.state.royal;
 const before=structuredClone(old),loaded=parseColony(wire(old));assert.equal(loaded.schemaVersion,8);assert.equal(loaded.state.gathering.developmentLevel,4);assert.deepEqual(old,before);
 const worker=[...old.state.gathering.workers.values()][0];worker.load={resource:'food',amount:6};
 assert.throws(()=>parseColony(wire(old)),'old overload must not become valid through development');
 worker.load=null;worker.expected=6;assert.throws(()=>parseColony(wire(old)));
});
test('collector efficiency in saves must match the actual permanent specialization',()=>{
 const save=captureColony(createColonySession({id:'eff',name:'Eff'}));
 save.state.gathering.workers.values().next().value.efficiency=.5;assert.throws(()=>restoreColony(save));
});
