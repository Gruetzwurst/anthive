import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PersistenceController,newPersistenceTiming} from '../src/game/persistence/persistenceController.ts';
function fixture(timing=newPersistenceTiming()){
 const writes=[],session={id:'test',revision:0,persistenceTiming:timing};let failure=false;
 const controller=new PersistenceController(session,{save:async(s,options)=>{if(failure)throw Error('quota');writes.push({timing:structuredClone(s.persistenceTiming),slot:options?.backupSlot});s.revision++;return {savedAt:'now'};}},{acquire:async()=>true,release:()=>{}},()=>{});
 return {controller,session,writes,fail:()=>{failure=true;}};
}
test('autosave and staggered backups use active real seconds at 180 and 360 minutes',async()=>{
 const {controller:c,writes}=fixture();await c.start();
 for(let m=1;m<=370;m++){c.tick(m*60000,false);await c.flush();}
 assert.equal(writes.length,74);
 const at=m=>writes.find(w=>w.timing.activeSeconds===m*60)?.slot;
 assert.equal(at(5),undefined);assert.equal(at(15),1);assert.equal(at(60),2);assert.equal(at(65),1);
 assert.equal(at(180),3);assert.equal(at(185),2);assert.equal(at(190),1);
 assert.equal(at(360),3);assert.equal(at(365),2);assert.equal(at(370),1);
});
test('pause, hidden time and restart do not add offline time or reset intervals',async()=>{
 const f=fixture();await f.controller.start();f.controller.tick(120000,false);f.controller.tick(240000,true);
 f.controller.setVisible(false);f.controller.tick(9999999,false);f.controller.setVisible(true);f.controller.tick(10000000,false);
 assert.equal(f.session.persistenceTiming.activeSeconds,120);await f.controller.flush();
 const next=fixture(structuredClone(f.session.persistenceTiming));await next.controller.start();next.controller.tick(180000,false);await next.controller.flush();
 assert.equal(next.session.persistenceTiming.activeSeconds,300);assert.equal(next.writes.at(-1).slot,undefined);
});
test('manual and background saves preserve backup schedules; failed writes preserve success timers',async()=>{
 const f=fixture();await f.controller.start();f.controller.tick(60000,false);
 await f.controller.manual();await f.controller.background();assert.ok(f.writes.every(w=>w.slot===undefined));assert.equal(f.session.persistenceTiming.lastAutosaveActiveSeconds,0);
 f.fail();f.controller.tick(300000,false);await f.controller.flush();assert.equal(f.session.persistenceTiming.lastAutosaveActiveSeconds,0);assert.equal(f.session.revision,2);
});
test('read-only tab cannot save',async()=>{
 const session={id:'x',revision:0,persistenceTiming:newPersistenceTiming()};let wrote=false;
 const c=new PersistenceController(session,{save:async()=>{wrote=true;}},{acquire:async()=>false,release:()=>{}},()=>{});
 await c.start();await assert.rejects(c.manual());c.tick(999999,false);await c.flush();assert.equal(wrote,false);
});
test('a lost browser lock prevents subsequent writes',async()=>{
 const f=fixture();const lock={held:true,acquire:async()=>true,release:()=>{}};let writes=0;
 const c=new PersistenceController(f.session,{save:async()=>{writes++;return {savedAt:new Date().toISOString()};}},lock,()=>{});
 await c.start();lock.held=false;await assert.rejects(c.manual());assert.equal(writes,0);
});
test('overlapping triggers serialize revisions and preserve time accrued during a write',async()=>{
 const f=fixture();let release;const writes=[];
 const c=new PersistenceController(f.session,{save:async(s,options)=>{writes.push(s.revision);if(writes.length===1)await new Promise(done=>{release=done;});s.revision++;return {savedAt:new Date().toISOString()};}},{acquire:async()=>true,release:()=>{}},()=>{});
 await c.start();const first=c.manual();await Promise.resolve();await Promise.resolve();
 c.tick(300000,false);c.tick(301000,false);release();await first;await c.flush();
 assert.deepEqual(writes,[0,1]);assert.equal(f.session.persistenceTiming.activeSeconds,301);assert.equal(f.session.persistenceTiming.lastAutosaveActiveSeconds,301);
});
test('unavailable database reports an error and releases the writer lock before gameplay saves',async()=>{
 const f=fixture(),statuses=[];let released=false;
 const c=new PersistenceController(f.session,{ready:async()=>{throw Error('Speicher gesperrt');},save:async()=>{throw Error('must not write');}},{acquire:async()=>true,release:()=>{released=true;}},s=>statuses.push(s));
 await c.start();assert.equal(statuses.at(-1).kind,'error');assert.equal(released,true);await assert.rejects(c.manual());
});
