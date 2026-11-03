import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony} from '../src/game/persistence/colonySession.ts';
import {prepareNewImport,prepareReplacement,prepareBackupRestore,suggestImportName} from '../src/game/persistence/colonyTransfer.ts';
import {newPersistenceTiming} from '../src/game/persistence/persistenceController.ts';

test('new import keeps simulation but replaces local identity and backup timers without mutating source',()=>{
 const source=captureColony(createColonySession({id:'source',name:'Alpha'}));source.revision=9;source.persistenceTiming.activeSeconds=6000;
 const before=structuredClone(source),copy=prepareNewImport(source,'new-id','Alpha Import');
 assert.equal(copy.id,'new-id');assert.equal(copy.name,'Alpha Import');assert.equal(copy.revision,0);
 assert.deepEqual(copy.persistenceTiming,newPersistenceTiming());assert.deepEqual(copy.state,source.state);assert.deepEqual(source,before);
});
test('restore preserves local identity and active history while replacement restarts local backup slots',()=>{
 const old=captureColony(createColonySession({id:'target',name:'Heute'})),backup=structuredClone(old);
 old.revision=12;old.persistenceTiming.activeSeconds=12000;old.persistenceTiming.lastAutosaveActiveSeconds=11700;
 backup.name='Früher';backup.state.clock.elapsedSeconds=100;
 const restored=prepareBackupRestore(backup,old);
 assert.equal(restored.id,'target');assert.equal(restored.name,'Heute');assert.equal(restored.revision,13);
 assert.equal(restored.state.clock.elapsedSeconds,100);assert.equal(restored.persistenceTiming.activeSeconds,12000);
 assert.equal(restored.persistenceTiming.lastAutosaveActiveSeconds,12000);assert.deepEqual(restored.persistenceTiming.backupDue,old.persistenceTiming.backupDue);
 const replaced=prepareReplacement(backup,old);
 assert.equal(replaced.id,'target');assert.equal(replaced.name,'Früher');assert.equal(replaced.revision,13);
 assert.deepEqual(replaced.persistenceTiming.backupDue,{1:12900,2:15600,3:22800});
});
test('import name suggestions avoid collisions and invalid files are rejected before preparation',()=>{
 assert.equal(suggestImportName('Alpha',[{name:'Alpha'},{name:'Alpha (Import)'}]),'Alpha (Import 2)');
 assert.throws(()=>prepareNewImport({schemaVersion:99},'new','Name'));
 const s=captureColony(createColonySession({id:'x',name:'X'}));assert.throws(()=>prepareNewImport(s,'','Name'));assert.throws(()=>prepareNewImport(s,'new',' '));
});
