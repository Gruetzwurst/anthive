import {withoutQueenFeeding} from './helpers/legacyQueenSupply.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony,restoreColony,parseColony,serializeColony} from '../src/game/persistence/colonySession.ts';
import {prepareBackupRestore,prepareNewImport,prepareReplacement} from '../src/game/persistence/colonyTransfer.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {QUEEN_CONFIG,BROOD_CONFIG} from '../src/game/simulation/simulationConfig.ts';

function population(session,workers){
 const s=session.simulation,engines=s.exportWorkforceState();
 for(const w of s.workforce.getWorkers())if(w.id.startsWith('extra-')){s.workforce.removeWorker(w.id);engines.states.delete(w.id);}
 for(let i=s.workforce.getWorkers().length;i<workers;i++){
  const id=`extra-${i}`;s.workforce.addWorker(id,'combat');engines.states.set(id,{engine:'parked',position:{...session.world.landmarks.nestChamberCenter}});
 }
 s.restoreWorkforceState(engines);
}
const wire=s=>JSON.stringify(s,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v);
test('new colony progression counts adult workers plus its living queen, not eggs',()=>{
 const a=createColonySession({id:'a',name:'A'});
 assert.equal(typeof a.simulation.getProgression,'function','colony-wide progression must exist');
 const p=a.simulation.getProgression();assert.equal(p.population,a.simulation.getWorkers().length+1);
 assert.equal(p.highestPopulation,p.population);assert.equal(p.level,0);assert.equal(p.nextMilestone,50);
});
test('real lifecycle births increase the adult peak without counting developing brood',()=>{
 const s=createWorkforceSimulation(createStartingWorld(),{workers:()=>[],addWorker(){},removeWorker(){},retireWorker(){},advanceWorkers(){}},undefined,undefined,
  {eggTransport:false,queenConfig:{...QUEEN_CONFIG,eggsPerGameDay:6000},broodConfig:{...BROOD_CONFIG,stageDays:{egg:.000001,larva:.000001,pupa:.000001}}});
 for(const resource of ['food','water'])s.resources.depositInStore(`${resource}-store`,{resource,amount:100});
 const before=s.getProgression().population;s.advance(.5);
 assert.ok(s.getWorkers().some(w=>w.id.startsWith('born-')),'actual queen lifecycle must produce adults');
 assert.ok(s.getProgression().highestPopulation>before);assert.equal(s.getProgression().highestPopulation,s.workforce.size+1);
});
test('all four thresholds count the queen and remain unlocked after population decline',()=>{
 const a=createColonySession({id:'a',name:'A'});
 for(const [level,threshold]of [50,150,250,500].entries()){
  population(a,threshold-2);assert.equal(a.simulation.getProgression().level,level);
  population(a,threshold-1);const p=a.simulation.getProgression();assert.equal(p.population,threshold);assert.equal(p.level,level+1);
 }
 population(a,10);const p=a.simulation.getProgression();assert.equal(p.population,11);assert.equal(p.highestPopulation,500);assert.equal(p.level,4);assert.equal(p.nextMilestone,null);
});
test('progression survives complete save roundtrip and stays isolated between colonies',()=>{
 const a=createColonySession({id:'a',name:'A'}),b=createColonySession({id:'b',name:'B'});
 population(a,149);a.simulation.getProgression();population(a,10);
 const restored=restoreColony(parseColony(serializeColony(captureColony(a))));
 assert.equal(restored.simulation.getProgression().highestPopulation,150);assert.equal(b.simulation.getProgression().level,0);
 const p=restored.simulation.getProgression();p.highestPopulation=1;assert.equal(restored.simulation.getProgression().highestPopulation,150);
});
test('schema1 and schema2 derive only known adult population without mutating original',()=>{
 const a=createColonySession({id:'old',name:'Old'});population(a,49);
 for(const schemaVersion of [1,2]){
  const old=withoutQueenFeeding(captureColony(a));old.schemaVersion=schemaVersion;delete old.state.progression;delete old.state.construction.developmentLevel;delete old.state.gathering.developmentLevel;delete old.state.queen.developmentLevel;delete old.state.broodSupply.developmentLevel;if(schemaVersion===1)delete old.encoding;
  delete old.state.royal;const before=structuredClone(old),migrated=parseColony(wire(old));
  assert.equal(migrated.schemaVersion,9);assert.equal(migrated.state.progression.highestPopulation,50);assert.deepEqual(old,before);
 }
});
test('invalid or missing current progression is rejected rather than repaired',()=>{
 const save=captureColony(createColonySession({id:'a',name:'A'}));
 for(const highestPopulation of [0,1,11.5,NaN,Number.MAX_SAFE_INTEGER+1]){
  const s=structuredClone(save);s.state.progression={highestPopulation};assert.throws(()=>restoreColony(s));
 }
 delete save.state.progression;assert.throws(()=>restoreColony(save));
});
test('restore retains local milestones while new import and explicit replacement take source history',()=>{
 const a=createColonySession({id:'a',name:'A'}),early=captureColony(a);
 population(a,149);a.simulation.getProgression();population(a,10);
 const target={...captureColony(a),highestPopulation:150};
 assert.equal(prepareBackupRestore(early,target).state.progression.highestPopulation,150);
 assert.equal(prepareNewImport(early,'new','New').state.progression.highestPopulation,11);
 assert.equal(prepareReplacement(early,target).state.progression.highestPopulation,11);
});
