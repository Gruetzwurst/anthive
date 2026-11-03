import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony,serializeColony,parseColony,restoreColony} from '../src/game/persistence/colonySession.ts';
import {migrateColonySave} from '../src/game/persistence/colonyMigration.ts';
function legacy(save){const copy=structuredClone(save);copy.schemaVersion=1;delete copy.encoding;return copy;}
const wire=s=>JSON.stringify(s,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v);
test('known schema1 migrates on a copy, preserving all simulation state and existing timers',()=>{
 const a=createColonySession({id:'old',name:'Alt'});a.simulation.advance(130);
 const original=legacy(captureColony(a)),before=structuredClone(original),result=migrateColonySave(original);
 assert.equal(result.migrated,true);assert.equal(result.fromVersion,1);assert.equal(result.save.schemaVersion,2);assert.equal(result.save.encoding,'map-set-v1');
 assert.deepEqual(result.save.state,original.state);assert.deepEqual(result.save.persistenceTiming,original.persistenceTiming);assert.deepEqual(original,before);
 const b=restoreColony(parseColony(wire(original)));a.simulation.advance(.37);b.simulation.advance(.37);assert.deepEqual(captureColony(b),captureColony(a));
});
test('known D1.1 saves without timer initialize future intervals without offline catchup',()=>{
 const s=legacy(captureColony(createColonySession({id:'old',name:'Alt'})));s.state.clock.elapsedSeconds=420;delete s.persistenceTiming;
 const result=migrateColonySave(s).save;
 assert.deepEqual(result.persistenceTiming,{activeSeconds:420,lastAutosaveActiveSeconds:420,backupDue:{1:1320,2:4020,3:11220}});
 assert.equal(result.state.clock.elapsedSeconds,420);assert.ok(!Object.hasOwn(s,'persistenceTiming'));
});
test('unknown versions, missing canonical encoding and invalid existing legacy timers are rejected',()=>{
 const s=captureColony(createColonySession({id:'x',name:'X'}));
 assert.throws(()=>migrateColonySave({...s,schemaVersion:99}));assert.throws(()=>migrateColonySave({...s,schemaVersion:0}));
 const noCodec=structuredClone(s);delete noCodec.encoding;assert.throws(()=>parseColony(wire(noCodec)));
 const old=legacy(s);old.persistenceTiming.activeSeconds=-1;assert.throws(()=>parseColony(wire(old)));
 assert.deepEqual(parseColony(serializeColony(s)),s);
});
