import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {EXCAVATION_CONFIG, CHAMBER_CONFIG} from '../src/game/simulation/simulationConfig.ts';
const c=(column,row=3)=>({column,row});
const p=(column,row=3)=>({x:(column+.5)*24,y:(row+.5)*24});
// Tiny scheduler fixtures deliberately use configurable one-cell minima; B5 tests cover production minima.
function fixture(){
 const world=createStartingWorld();world.dimensions={columns:18,rows:8,tileSize:24};
 world.tiles=Array.from({length:8},()=>Array.from({length:18},()=>({terrain:'topsoil',state:'discovered'})));
 for(let i=0;i<3;i++)world.tiles[3][i].state='open';
 const resources=new ResourceSystem();resources.addStore({id:'material',resource:'buildingMaterial',position:p(0),capacity:100,amount:0,status:'operational',reachable:true});
 const e=new ExcavationSystem(world,resources,EXCAVATION_CONFIG,Object.fromEntries(Object.keys(CHAMBER_CONFIG.minimumArea).map(type=>[type,1])));e.addBuilder('a',p(2));return {e,world,resources};
}
function until(e,predicate,limit=3000){for(let i=0;i<limit&&!predicate();i++)e.advance(.05);assert.ok(predicate());}
function invariant(e){const b=e.materials.balance;assert.ok(Math.abs(b.initial+b.produced-b.stored-b.carried-b.ground-b.consumed)<1e-8);}

test('remote earlier chamber stays blocked; later connecting tunnel unlocks original FIFO without inventing paths',()=>{
 const {e,world,resources}=fixture();
 const first=e.addOrder([c(6),c(7)],'water');
 assert.equal(e.getConstructionOrders()[0].blockReason,'unreachable');
 assert.notEqual(world.tiles[3][5].state,'open');
 const second=e.addOrder([c(3),c(4),c(5)]);
 until(e,()=>e.materials.balance.produced===3);
 until(e,()=>e.getBuilders()[0]?.job?.kind==='dig');
 assert.deepEqual(e.getBuilders()[0].job.target,c(6));
 until(e,()=>e.getOrders().length===0);
 const plans=e.getConstructionOrders();assert.deepEqual(plans.map(p=>p.id),[first,second]);
 assert.equal(plans[0].status,'blocked');assert.equal(plans[0].blockReason,'material');assert.equal(plans[0].type,'water');
 assert.equal(plans[0].materialRequired,4);assert.equal(plans[1].status,'completed');
 assert.equal(resources.listStores().length,1);assert.equal(resources.getStoreTotals('water').capacity,0);
 invariant(e);
});

test('a free chamber is excavated from its accessible edge regardless of selection order',()=>{
 const {e,world}=fixture();
 e.addOrder([c(4,4),c(4),c(3,4),c(3)],'food');
 until(e,()=>e.materials.balance.produced===1);
 assert.equal(world.tiles[3][3].state,'open');assert.notEqual(world.tiles[4][4].state,'open');
 until(e,()=>e.getOrders().length===0);assert.equal(e.getConstructionOrders()[0].excavated,4);invariant(e);
});

test('pause retains rank, finishes current tile once, bypasses safely and resumes before later new work',()=>{
 const {e}=fixture();const first=e.addOrder([c(3),c(4)]);e.advance(2);
 e.pauseOrder(first);assert.equal(e.getConstructionOrders()[0].status,'paused');
 const second=e.addOrder([c(2,2),c(3,2)]);
 until(e,()=>e.getConstructionOrders()[0].excavated===1);
 assert.equal(e.getConstructionOrders()[0].paused,true);
 until(e,()=>e.getBuilders()[0]?.job?.target?.row===2);
 e.resumeOrder(first);
 until(e,()=>e.getConstructionOrders().find(o=>o.id===second).excavated===1);
 until(e,()=>e.getBuilders()[0]?.job?.target?.row===3);
 assert.deepEqual(e.getBuilders()[0].job.target,c(4));
 until(e,()=>e.getOrders().length===0);assert.deepEqual(e.getConstructionOrders().map(p=>p.id),[first,second]);invariant(e);
});

for(const phase of ['digging','loading','deliver'])test(`cancel during ${phase} keeps actual terrain, material and no usable chamber`,()=>{
 const {e,world,resources}=fixture();const id=e.addOrder([3,4,5,6,7,8].map(x=>c(x)),'food');
 until(e,()=>{const j=e.getBuilders()[0]?.job;return phase==='deliver'?j?.kind==='deliver':j?.phase===phase;});
 const produced=e.materials.balance.produced,open=world.tiles.flat().filter(t=>t.state==='open').length;
 e.cancelOrder(id);e.advance(50);
 assert.equal(e.materials.balance.produced,produced);assert.equal(world.tiles.flat().filter(t=>t.state==='open').length,open);
 assert.equal(e.getConstructionOrders()[0].status,'cancelled');assert.equal(e.getOrders().length,0);
 assert.equal(resources.listStores().length,1);assert.equal(e.getBuilders()[0].readyToLeave,true);invariant(e);
});

test('a reserved current tile does not start a later simultaneous site; lowering grade saves partial progress',()=>{
 const {e,world}=fixture();world.tiles[3][3].terrain='stone';e.setDiggingGrade(3);
 const first=e.addOrder([c(3)]);e.addOrder([c(2,2)]);e.addBuilder('b',p(1));e.advance(2);
 assert.equal(e.getBuilders().filter(w=>w.job?.kind==='dig').length,1);
 e.setDiggingGrade(0);e.advance(1);
 assert.ok(e.getConstructionOrders().find(o=>o.id===first).partialDigSeconds>1.9);
 e.pauseOrder(2);e.setDiggingGrade(3);
 until(e,()=>e.getBuilders().some(w=>w.job?.target?.column===3));
 assert.ok(e.getBuilders().find(w=>w.job?.target?.column===3).job.progress>=2);
 invariant(e);
});

test('blocked warnings occur on problem transitions, never every update or for deliberate pause',()=>{
 const {e,world}=fixture();world.tiles[3][3].terrain='stone';const id=e.addOrder([c(3)]);
 assert.equal(e.drainConstructionNotices().length,1);e.advance(1);assert.deepEqual(e.drainConstructionNotices(),[]);
 e.pauseOrder(id);e.advance(1);assert.deepEqual(e.drainConstructionNotices(),[]);
 e.resumeOrder(id);assert.deepEqual(e.drainConstructionNotices(),[]);
 e.setDiggingGrade(3);e.advance(.1);e.setDiggingGrade(0);
 assert.equal(e.drainConstructionNotices().length,1);
 e.advance(1);assert.deepEqual(e.drainConstructionNotices(),[]);
});

test('invalid plans/actions and snapshot mutation cannot corrupt queue or chamber type',()=>{
 const {e}=fixture();assert.throws(()=>e.addOrder([c(3),c(7)],'food'));
 assert.throws(()=>e.addOrder([c(3)],'queen'));assert.equal(e.getOrders().length,0);
 const id=e.addOrder([c(3),c(4)],'rest');const view=e.getConstructionOrders();view[0].type='food';view[0].cells[0].row=99;
 assert.equal(e.getConstructionOrders()[0].type,'rest');assert.equal(e.getConstructionOrders()[0].cells[0].row,3);
 assert.throws(()=>e.pauseOrder(999));e.cancelOrder(id);assert.throws(()=>e.resumeOrder(id));
});

for(const phase of ['walking','loading','deliver'])test(`pause during ${phase} preserves pending work and cargo through resume`,()=>{
 const {e}=fixture();e.removeBuilder('a');e.addBuilder('a',p(0));
 const id=e.addOrder([3,4,5,6,7,8].map(x=>c(x)));
 until(e,()=>{const j=e.getBuilders()[0]?.job;return phase==='deliver'?j?.kind==='deliver':j?.phase===phase;});
 const produced=e.materials.balance.produced;e.pauseOrder(id);e.advance(30);
 assert.equal(e.materials.balance.produced,produced);assert.equal(e.materials.balance.carried,0);
 assert.equal(e.getConstructionOrders()[0].status,'paused');invariant(e);
 e.resumeOrder(id);until(e,()=>e.getOrders().length===0);
 assert.equal(e.materials.balance.produced,6);invariant(e);
});

test('lost builder releases reservation while a replacement keeps partial excavation progress',()=>{
 const {e,world}=fixture();world.tiles[3][3].terrain='stone';e.setDiggingGrade(3);
 e.addOrder([c(3)]);e.advance(2);e.removeBuilder('a');
 assert.ok(e.getConstructionOrders()[0].partialDigSeconds>1.9);
 e.addBuilder('b',p(2));e.advance(.1);
 assert.ok(e.getBuilders()[0].job.progress>=2);
 until(e,()=>e.materials.balance.stored===4);assert.equal(e.materials.balance.produced,4);invariant(e);
});
