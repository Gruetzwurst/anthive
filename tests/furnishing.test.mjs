import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
const c=(column,row=3)=>({column,row});const p=(column,row=3)=>({x:(column+.5)*24,y:(row+.5)*24});
function fixture(initial=0,dug=false){
 const world=createStartingWorld();world.dimensions={columns:18,rows:8,tileSize:24};
 world.tiles=Array.from({length:8},()=>Array.from({length:18},()=>({terrain:'topsoil',state:'discovered'})));
 for(let i=0;i<3;i++)world.tiles[3][i].state='open';
 const cells=[];for(let row=2;row<=4;row++)for(let col=3;col<=6;col++){cells.push(c(col,row));if(dug)world.tiles[row][col].state='open';}
 const resources=new ResourceSystem();resources.addStore({id:'material',resource:'buildingMaterial',position:p(0),capacity:100,amount:initial,status:'operational',reachable:true});
 const e=new ExcavationSystem(world,resources);e.addBuilder('a',p(2));return{e,world,resources,cells};
}
function until(e,predicate,n=6000){for(let i=0;i<n&&!predicate();i++)e.advance(.05);assert.ok(predicate(),'condition not reached');}
function balanced(e){const b=e.materials.balance;assert.ok(Math.abs(b.initial+b.produced-b.ground-b.carried-b.stored-b.consumed-(b.atSites??0))<1e-8,JSON.stringify(b));}
function supply(e,amount){const id=e.materials.produce(p(0),amount);while(e.materials.getGround().some(p=>p.id===id)){e.materials.pickUp(id,'external',5);e.materials.deposit('external','material');}}

test('wide front uses different reserved tiles; a narrow front never starts a later site',()=>{
 const {e}=fixture();e.addBuilder('b',p(1));e.addOrder([c(3),c(2,2),c(3,2)]);e.addOrder([c(2,4)]);e.advance(1);
 const jobs=e.getBuilders().filter(w=>w.job?.kind==='dig');assert.equal(jobs.length,2);
 assert.equal(new Set(jobs.map(w=>`${w.job.target.column},${w.job.target.row}`)).size,2);
 assert.ok(jobs.every(w=>w.job.target.row!==4));
 const narrow=fixture().e;narrow.addBuilder('b',p(1));narrow.addOrder([c(3),c(4)]);narrow.addOrder([c(2,2)]);narrow.advance(1);
 assert.equal(narrow.getBuilders().filter(w=>w.job?.kind==='dig').length,1);balanced(e);balanced(narrow);
});

test('9 real units furnish only 9/24; 15 later units resume and complete exactly once without capacity grant',()=>{
 const {e,cells,resources}=fixture(9,true);e.addBuilder('b',p(1));const id=e.addOrder(cells,'food');
 until(e,()=>e.getConstructionOrders()[0].materialUsed===9);e.advance(20);
 let o=e.getConstructionOrders()[0];assert.equal(o.materialUsed,9);assert.equal(o.status,'blocked');assert.equal(o.blockReason,'material');
 assert.equal(resources.getStore('material').amount,0);assert.equal(resources.listStores().length,1);balanced(e);
 supply(e,15);until(e,()=>e.getConstructionOrders()[0].status==='furnished');
 o=e.getConstructionOrders()[0];assert.equal(o.materialUsed,24);assert.equal(o.materialAtSite,0);
 assert.equal(e.materials.balance.consumed,24);assert.deepEqual(e.drainCompletedChambers().map(c=>c.id),[id]);e.advance(10);assert.deepEqual(e.drainCompletedChambers(),[]);balanced(e);
});

test('actual warehouse pickup and site delivery precede consumption; fastest stocked stores combine without redistribution',()=>{
 const {world,cells,resources}=fixture(2,true);
 resources.addStore({id:'near',resource:'buildingMaterial',position:p(2),capacity:100,amount:3,status:'operational',reachable:true});
 // Construct before adding stock to keep its recorded initial balance correct.
 const engine=new ExcavationSystem(world,resources);engine.addBuilder('a',p(2));
 engine.addOrder(cells,'water');engine.advance(.05);assert.equal(engine.getBuilders()[0].job.storeId,'near');
 until(engine,()=>engine.materials.balance.carried>0);
 assert.equal(engine.materials.balance.consumed,0);assert.equal(engine.materials.balance.atSites,0);
 until(engine,()=>engine.getConstructionOrders()[0].materialUsed===5);
 assert.equal(resources.getStore('near').amount,0);assert.equal(resources.getStore('material').amount,0);balanced(engine);
 const idle=fixture(5,true);idle.e.advance(20);assert.equal(idle.resources.getStore('material').amount,5);
});

for(const phase of ['loading','unloading','furnishing'])test(`cancel during ${phase} conserves stock, cargo, site material and real consumption`,()=>{
 const {e,cells}=fixture(24,true);const id=e.addOrder(cells,'rest');
 until(e,()=>{const j=e.getBuilders()[0].job;return phase==='loading'?j?.kind==='withdraw'&&j.phase==='loading':phase==='unloading'?j?.kind==='deliverSite'&&j.phase==='unloading':j?.phase==='furnishing';});
 const used=e.materials.balance.consumed;e.cancelOrder(id);e.advance(20);
 assert.equal(e.getConstructionOrders()[0].status,'cancelled');assert.equal(e.materials.balance.consumed,used);
 assert.equal(e.materials.balance.atSites,0);balanced(e);
});

test('pause retains partial furnishing and delivered goods; death releases the tile for a replacement',()=>{
 const {e,cells}=fixture(24,true);const id=e.addOrder(cells,'water');
 until(e,()=>e.getBuilders()[0].job?.phase==='furnishing');e.advance(.5);e.pauseOrder(id);e.advance(5);
 const used=e.getConstructionOrders()[0].materialUsed;assert.equal(used,1);e.advance(5);assert.equal(e.getConstructionOrders()[0].materialUsed,used);
 e.resumeOrder(id);until(e,()=>e.getBuilders()[0].job?.phase==='furnishing');e.advance(.5);e.removeBuilder('a');e.addBuilder('b',p(2));
 until(e,()=>e.getConstructionOrders()[0].status==='furnished');assert.equal(e.materials.balance.consumed,24);balanced(e);
});

test('furnishing obeys combined work factor and individual foreign efficiency',()=>{
 const {e,cells}=fixture(24,true);e.addOrder(cells,'food');until(e,()=>e.getBuilders()[0].job?.phase==='furnishing');
 const before=e.getBuilders()[0].job.progress;e.advance(1,.5,()=>true,()=>.5);
 assert.ok(Math.abs(e.getBuilders()[0].job.progress-before-.25)<1e-8);balanced(e);
});

test('fractional site stock below one unit cannot be consumed without matching furnishing progress',()=>{
 const {e,cells}=fixture(.75,true);e.addOrder(cells,'food');e.advance(30);
 assert.equal(e.materials.balance.consumed,0);assert.equal(e.getConstructionOrders()[0].materialUsed,0);
 assert.equal(e.materials.balance.atSites,.75);balanced(e);
});

test('parallel suppliers reserve real stock and exact site need without overdelivery or duplicate consumption',()=>{
 const {e,cells}=fixture(30,true);for(const id of ['b','c','d','f'])e.addBuilder(id,p(1));e.addOrder(cells,'food');
 until(e,()=>e.getConstructionOrders()[0].status==='furnished');e.advance(20);
 assert.equal(e.materials.balance.consumed,24);assert.equal(e.materials.balance.stored,6);
 assert.equal(e.materials.balance.carried,0);assert.equal(e.materials.balance.atSites,0);balanced(e);
});

test('a material-blocked earlier room allows new excavation and resumes when a real store delivery arrives',()=>{
 const {e,cells}=fixture(1,true);const first=e.addOrder(cells,'food');
 until(e,()=>e.getConstructionOrders()[0].materialUsed===1);const second=e.addOrder([c(7),c(8),c(9)]);
 until(e,()=>e.materials.balance.produced>=1);until(e,()=>e.getConstructionOrders()[0].materialUsed>=2);
 assert.ok(e.getConstructionOrders().find(o=>o.id===second));assert.equal(e.getConstructionOrders()[0].id,first);balanced(e);
});
