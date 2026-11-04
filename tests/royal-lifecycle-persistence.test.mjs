import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony,restoreColony,serializeColony,parseColony} from '../src/game/persistence/colonySession.ts';
import {squareTemplate} from '../src/game/simulation/constructionPlanning.ts';
function fixture(){
 const a=createColonySession({id:'royal-life',name:'Royal Life'});a.simulation.restoreProgression({highestPopulation:50});a.syncConstruction();
 const w=a.world,s=w.dimensions.tileSize;
 let cells;
 for(const column of [100,80,60,40,200,220]){const c=squareTemplate('queen','small',{column,row:28});if(a.excavation.validateOrder(c,'queen').valid){cells=c;break;}}
 assert.ok(cells);let col=Math.floor(w.landmarks.nestChamberCenter.x/s),row=Math.floor(w.landmarks.nestChamberCenter.y/s);
 while(col!==cells[0].column){w.tiles[row][col].state='open';col+=Math.sign(cells[0].column-col);}while(row!==cells[0].row){w.tiles[row][col].state='open';row+=Math.sign(cells[0].row-row);}
 for(const c of cells)w.tiles[c.row][c.column].state='open';a.simulation.traffic.invalidateTopology();
 const pile=a.excavation.materials.produce(w.landmarks.buildingMaterialStoreCenter,132);
 while(a.excavation.materials.getGround().some(p=>p.id===pile)){a.excavation.materials.pickUp(pile,'builder-0',5);a.excavation.materials.deposit('builder-0','building-material-store');}
 a.excavation.addOrder(cells,'queen');for(let n=0;n<20000&&a.excavation.getConstructionOrders()[0].status!=='furnished';n++)a.excavation.advance(.25);
 assert.equal(a.excavation.getConstructionOrders()[0].status,'furnished');a.syncConstruction();
 for(let n=0;n<5000&&!a.royal.getEggs()[0].arrived;n++)a.simulation.broodSupply.advanceWorkers(.05);
 assert.equal(a.royal.getEggs()[0].arrived,true);return a;
}
function advance(a,days,nurses=1){const q=a.simulation.queen,b=a.simulation.broodSupply;q.advance(days,0,q.snapshot.chambers,nurses,d=>{for(const loss of b.consume(d,q.getLarvalRooms()))q.loseLarvae(loss.roomId,loss.count);},b);b.syncRooms(q.getLarvalRooms());}
function feed(a){for(const k of ['food','water'])a.simulation.resources.depositInStore(`${k}-store`,{resource:k,amount:100});const b=a.simulation.broodSupply;b.syncRooms(a.simulation.queen.getLarvalRooms());for(let i=0;i<5000;i++)b.advanceWorkers(.1);}
function roundtrip(a){const save=captureColony(a),b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);return b;}
test('real nurses supply royal larvae at twice the daily rate, with conserved stock and no royal deaths',()=>{
 const a=fixture();advance(a,.2);assert.equal(a.royal.getEggs()[0].stage,'larva');
 advance(a,20);assert.equal(a.royal.getEggs()[0].stageProgressDays,0);assert.equal(a.simulation.broodSupply.shortage.get(a.royal.getEggs()[0].roomId).losses,0);
 feed(a);const before=a.simulation.broodSupply.balance;advance(a,.1);const after=a.simulation.broodSupply.balance;
 for(const k of ['food','water']){assert.ok(Math.abs(after[k].consumed-before[k].consumed-.1)<1e-7);assert.ok(Math.abs(after[k].withdrawn-after[k].atChambers-after[k].carried-after[k].consumed-after[k].dropped-after[k].returned)<1e-7);}
 assert.ok(Math.abs(a.royal.getEggs()[0].stageProgressDays-.1)<1e-7);
});
test('egg, larva, pupa and adult queen persist exactly, then new queen eggs resume from her own chamber',()=>{
 let a=fixture();advance(a,.1);a=roundtrip(a);advance(a,.1);feed(a);advance(a,.3);a=roundtrip(a);
 advance(a,.3);assert.equal(a.royal.getEggs()[0].stage,'pupa');a=roundtrip(a);advance(a,.4);assert.equal(a.simulation.queen.queenCount,2);a=roundtrip(a);
 assert.equal(a.simulation.getProgression().population,a.simulation.workforce.size+2);
 const q=a.simulation.queen;q.advance(.1,1,q.snapshot.chambers,1);a=roundtrip(a);a.simulation.queen.advance(.1,1,a.simulation.queen.snapshot.chambers,1);
 const eggs=a.simulation.queen.snapshot.eggs;assert.equal(eggs.length,2);const extra=eggs.find(e=>e.sourceQueenId!=='queen-1');assert.ok(extra);assert.deepEqual(extra.origin,a.royal.getEggs()[0].position);roundtrip(a);
});
test('unreachable royal chambers pause development and adult laying without duplicate queens',()=>{
 const a=fixture(),royal=a.royal,r=royal.snapshot.chambers[0];
 royal.syncRooms([{id:r.orderId,cells:[{column:r.position.x/24-.5,row:r.position.y/24-.5}],operational:false}]);advance(a,4);assert.equal(royal.getEggs()[0].stageProgressDays,0);
 a.syncConstruction();advance(a,.2);feed(a);advance(a,1);assert.equal(a.simulation.queen.queenCount,2);
 royal.syncRooms([{id:r.orderId,cells:[{column:r.position.x/24-.5,row:r.position.y/24-.5}],operational:false}]);
 a.simulation.queen.advance(.4,1,a.simulation.queen.snapshot.chambers,1);assert.ok(a.simulation.queen.snapshot.eggs.every(e=>e.sourceQueenId==='queen-1'));
});
test('schema7 royal eggs migrate without advancing time or modifying original and reject forged lifecycle data',()=>{
 const a=fixture(),old=captureColony(a);old.schemaVersion=7;delete old.state.queen.additionalQueens;
 for(const e of old.state.queen.eggs)delete e.sourceQueenId;
 for(const e of old.state.royal.eggs.values()){delete e.stage;delete e.stageProgressDays;}
 for(const r of old.state.broodSupply.rooms.values())delete r.royal;
 const original=structuredClone(old),wire=JSON.stringify(old,(_k,v)=>v instanceof Map?{$map:[...v]}:v instanceof Set?{$set:[...v]}:v),loaded=parseColony(wire);
 assert.equal(loaded.schemaVersion,8);assert.deepEqual(old,original);assert.equal(loaded.state.royal.eggs.values().next().value.stage,'egg');assert.equal(loaded.state.royal.eggs.values().next().value.stageProgressDays,0);
 roundtrip(restoreColony(loaded));const bad=structuredClone(old);bad.state.queen.additionalQueens=new Map([['fake',{}]]);assert.throws(()=>restoreColony(bad));
});
test('save validation rejects missing or forged adults, sources and impossible royal development',()=>{
 const a=fixture();advance(a,.2);feed(a);advance(a,1);const save=captureColony(a);
 for(const mutate of [s=>s.state.queen.additionalQueens.clear(),s=>s.state.royal.eggs.values().next().value.stage='egg',s=>s.state.royal.eggs.values().next().value.stageProgressDays=-1,s=>s.state.queen.additionalQueens.values().next().value.roomId='fake']){const bad=structuredClone(save);mutate(bad);assert.throws(()=>restoreColony(bad));}
 a.simulation.queen.advance(.2,1,a.simulation.queen.snapshot.chambers,1);const bad=captureColony(a);bad.state.queen.eggs[0].sourceQueenId='fake';assert.throws(()=>restoreColony(bad));
});
test('queen birth records the population peak before same-step worker starvation losses',()=>{
 const a=fixture();advance(a,.2);feed(a);advance(a,.6);advance(a,.3999);
 const g=a.simulation,engines=g.exportWorkforceState();
 while(g.workforce.size<148){const id=`peak-${g.workforce.size}`;g.workforce.addWorker(id,'combat');engines.states.set(id,{engine:'parked',position:{...a.world.landmarks.nestChamberCenter}});}
 g.restoreWorkforceState(engines);assert.equal(g.getProgression().population,149);
 for(const k of ['food','water'])g.resources.takeFromStore(`${k}-store`,10000);
 const supply=g.supply.exportState();supply.lossProgress=.9999;
 for(const state of Object.values(supply.states))Object.assign(state,{shortageDays:7,workFactor:.65,eggFactor:0});
 g.supply.restoreState(supply);g.clock.setPaused(false);g.advance(.1);
 assert.equal(g.queen.queenCount,2);assert.ok(g.workforce.size<148);assert.equal(g.getProgression().highestPopulation,150);
});
