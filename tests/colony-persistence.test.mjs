import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony,restoreColony,serializeColony,parseColony} from '../src/game/persistence/colonySession.ts';

test('full colony roundtrip preserves all state and continued simulation without starter duplicates',()=>{
 const a=createColonySession({id:'alpha',name:'Alpha'});
 a.simulation.advance(181.37);
 const save=captureColony(a);
 const b=restoreColony(parseColony(serializeColony(save)));
 assert.deepEqual(captureColony(b),save);
 assert.notEqual(a.world,b.world);assert.notEqual(a.world.tiles,b.world.tiles);
 for(let i=0;i<12;i++){a.simulation.advance(.37);b.simulation.advance(.37);}
 assert.deepEqual(captureColony(b),captureColony(a));
 assert.equal(b.simulation.getWorkers().length,a.simulation.getWorkers().length);
});
test('two colonies never share a mutable world, stock or clock',()=>{
 const a=createColonySession({id:'a',name:'A'}),b=createColonySession({id:'b',name:'B'});
 const before=captureColony(b);a.simulation.advance(2);a.world.tiles[0][0].state='discovered';
 assert.deepEqual(captureColony(b),before);
});
test('invalid versions, duplicate workers and broken references are rejected without mutating original',()=>{
 const a=createColonySession({id:'a',name:'A'}),s=captureColony(a);
 assert.throws(()=>restoreColony({...s,schemaVersion:99}));
 const invalid=structuredClone(s);invalid.state.workforce.workers.set('ghost',{id:'ghost',specialization:'care',assignment:'care'});
 assert.throws(()=>restoreColony(invalid));assert.deepEqual(captureColony(a),s);
 assert.throws(()=>parseColony('{broken'));
});
test('missing recovery state, negative inventory and unknown transport targets are rejected',()=>{
 const a=createColonySession({id:'a',name:'A'});a.simulation.advance(1);
 const save=captureColony(a);
 for(const mutate of [s=>delete s.state.adultSupply.states,s=>s.state.clock.elapsedSeconds=-1,s=>s.state.resources.stores.values().next().value.amount=-1,s=>s.state.gathering.workers.values().next().value.storeId='missing']){
  const invalid=structuredClone(save);mutate(invalid);assert.throws(()=>restoreColony(invalid));
 }
});
test('construction preserves ongoing dig, cargo and later completion after roundtrip',()=>{
 const a=createColonySession({id:'build',name:'Bau'});
 const home=a.world.landmarks.nestChamberCenter,size=a.world.dimensions.tileSize;
 let target;
 for(let r=1;r<a.world.tiles.length-1&&!target;r++)for(let c=1;c<a.world.tiles[r].length-1&&!target;c++){
  if(a.world.tiles[r][c].state!=='open'&&a.world.tiles[r][c].terrain==='topsoil'&&[[c-1,r],[c+1,r],[c,r-1],[c,r+1]].some(([x,y])=>a.world.tiles[y][x].state==='open'))target={column:c,row:r};
 }
 assert.ok(target);a.excavation.addOrder([target]);a.simulation.advance(.7);
 const b=restoreColony(parseColony(serializeColony(captureColony(a))));
 for(let i=0;i<30;i++){a.simulation.advance(.3);b.simulation.advance(.3);}
 assert.deepEqual(captureColony(b),captureColony(a));
 assert.ok(a.excavation.getConstructionOrders()[0].excavated>0);
});
test('unsupported rules, missing jobs and corrupt buffer copies cannot enter the model',()=>{
 const a=createColonySession({id:'strict',name:'Strict'});a.simulation.advance(130);
 const save=captureColony(a);
 for(const mutate of [s=>s.state.gathering.config.speed=0,s=>s.state.construction.config.baseDigSeconds=-1,s=>delete s.state.gathering.workers.values().next().value.remainingAction,s=>{if(s.state.queen.buffer.length)s.state.queen.buffer[0].stage='dead';else s.state.queen.buffer.push({id:'egg-999',arrived:false});}]){
  const invalid=structuredClone(save);mutate(invalid);assert.throws(()=>restoreColony(invalid));
 }
});
test('egg carriers, larval food cargo and birth history continue exactly after reload',()=>{
 const a=createColonySession({id:'brood',name:'Brut'}),observed=new Set();
 for(let second=0;second<700;second++){
  a.simulation.advance(1);
  const nurses=a.simulation.broodSupply.getNurses();
  const event=nurses.some(n=>n.eggId)?'egg-carrier':nurses.some(n=>n.load)?'nurse-cargo':a.simulation.queen.snapshot.bornCount?'birth':a.simulation.queen.snapshot.stageCounts.larva?'larva':null;
  if(!event||observed.has(event))continue;
  observed.add(event);const b=restoreColony(parseColony(serializeColony(captureColony(a))));
  for(let i=0;i<8;i++){a.simulation.advance(.25);b.simulation.advance(.25);}
  assert.deepEqual(captureColony(b),captureColony(a),event);
 }
 assert.deepEqual(observed,new Set(['egg-carrier','larva','nurse-cargo','birth']));
});
test('pending group reassignment keeps cargo, desired assignment and actual engine distinct',()=>{
 const a=createColonySession({id:'groups',name:'Gruppen'});
 let loaded;
 for(let i=0;i<100&&!loaded;i++){a.simulation.advance(.5);loaded=a.simulation.gathering.getCollectors().find(c=>c.load);}
 assert.ok(loaded);a.simulation.moveWorkers('gathering','gathering','care',7);
 const b=restoreColony(parseColony(serializeColony(captureColony(a))));
 assert.ok(b.simulation.getWorkers().some(w=>w.pending));
 a.simulation.advance(10);b.simulation.advance(10);assert.deepEqual(captureColony(b),captureColony(a));
});
test('review regressions: incomplete jobs, contradictory order copies and invalid quotas are rejected',()=>{
 const a=createColonySession({id:'review',name:'Review'}),save=captureColony(a);
 for(const mutate of [
  s=>{s.state.construction.builders.values().next().value.job={kind:'dig',phase:'digging',path:[],pathIndex:0,progress:0,duration:1};},
  s=>{s.state.queen.quotas={gathering:0,building:0,care:0,combat:0};},
  s=>{s.state.queen.quotas={gathering:101,building:0,care:0,combat:0};},
  s=>{s.state.broodSupply.nurses.values().next().value.job={kind:'pickup',phase:'interaction',path:[],index:0,progress:0,amount:1};},
 ]){const invalid=structuredClone(save);mutate(invalid);assert.throws(()=>restoreColony(invalid));}
});
test('furnished rest rooms, physical occupancy and material balance survive reload',()=>{
 const a=createColonySession({id:'rest',name:'Ruhe'});
 const w=a.world;w.dimensions={columns:20,rows:12,tileSize:24};
 w.tiles=Array.from({length:12},()=>Array.from({length:20},()=>({terrain:'soil',state:'open'})));
 w.chamberFootprints=[];w.broodChambers=[];w.resources=[];w.decorations=[];
 w.landmarks.nestChamberCenter={x:36,y:60};w.landmarks.queenChamberCenter={x:36,y:60};
 w.storageChambers=[{id:'building-material-store',resource:'buildingMaterial',position:{x:36,y:60},areaTiles:100}];
 const s=createColonySession({id:'rest',name:'Ruhe'},w),sim=s.simulation;
 sim.workforce.addWorker('builder-0','building');s.excavation.addBuilder('builder-0',{x:36,y:60});
 sim.workforce.addWorker('idle','gathering');sim.gathering.addCollector('idle',{x:36,y:60});
 sim.restoreWorkforceState({states:new Map([['builder-0',{engine:'building',position:{x:36,y:60}}],['idle',{engine:'gathering',position:{x:36,y:60}}]]),rest:{reservations:new Map(),tileSize:24}});
 s.excavation.materials.produce({x:36,y:60},128);
 s.excavation.addOrder(Array.from({length:16},(_,i)=>({column:8+i%4,row:3+Math.floor(i/4)})),'rest');
 const seen=new Set();
 for(let i=0;i<240;i++){
  sim.advance(1);const kind=s.excavation.getBuilders()[0]?.job?.kind;
  if(kind&&!seen.has(kind)){
   seen.add(kind);const copy=restoreColony(parseColony(serializeColony(captureColony(s))));
   sim.advance(.1);copy.simulation.advance(.1);assert.deepEqual(captureColony(copy),captureColony(s),kind);
  }
 }
 assert.ok(seen.has('furnish'));assert.ok(seen.has('withdraw'));assert.ok(seen.has('deliverSite'));
 assert.equal(s.excavation.chambers.getChambers().length,1);
 sim.moveWorkers('building','building','rest',1);sim.advance(10);
 assert.ok(sim.getWorkers().some(w=>w.rest?.occupied));
 const b=restoreColony(parseColony(serializeColony(captureColony(s))));
 sim.advance(.7);b.simulation.advance(.7);assert.deepEqual(captureColony(b),captureColony(s));
});
test('adult shortage history is not reset on restore',()=>{
 const a=createColonySession({id:'shortage',name:'Mangel'});
 a.simulation.moveWorkers('gathering','gathering','rest',7);a.simulation.advance(180);
 const state=captureColony(a);assert.ok(state.state.adultSupply.states.food.shortageDays>0);
 const b=restoreColony(parseColony(serializeColony(state)));
 a.simulation.advance(1.7);b.simulation.advance(1.7);assert.deepEqual(captureColony(b),captureColony(a));
});
test('400-worker snapshot size and roundtrip are measured without shared population',t=>{
 const a=createColonySession({id:'large',name:'400'}),s=a.simulation;
 const engines=s.exportWorkforceState();
 for(let i=s.getWorkers().length;i<400;i++){
  const id=`population-${i}`;s.workforce.addWorker(id,'combat');
  engines.states.set(id,{engine:'parked',position:{...a.world.landmarks.nestChamberCenter}});
 }
 s.restoreWorkforceState(engines);
 const start=performance.now(),save=captureColony(a),text=serializeColony(save),captured=performance.now();
 const b=restoreColony(parseColony(text)),loaded=performance.now();
 assert.equal(b.simulation.getWorkers().length,400);assert.deepEqual(captureColony(b),save);
 t.diagnostic(`400 workers: ${new TextEncoder().encode(text).length} bytes; capture+encode ${(captured-start).toFixed(1)} ms; parse+restore ${(loaded-captured).toFixed(1)} ms (Node, no browser FPS claim)`);
});
test('unknown rest rooms and inconsistent reservation sets are rejected',()=>{
 const s=captureColony(createColonySession({id:'bad-rest',name:'Bad rest'}));
 s.state.engines.rest.reservations.set('collector-0',{roomId:'missing',spotId:'missing:1,1:0',occupied:true,position:{x:36,y:60},target:{x:36,y:60},path:[],index:0});
 assert.throws(()=>restoreColony(s));
 const other=captureColony(createColonySession({id:'bad-reservation',name:'Bad reservation'}));other.state.construction.reservations.add('1,1');
 assert.throws(()=>restoreColony(other));
});
