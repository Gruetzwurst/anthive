import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {BroodSupplySystem} from '../src/game/simulation/broodSupplySystem.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
const p=c=>({x:(c+.5)*24,y:84});
const room=(id='a',larvae=20)=>({id,specialization:'gathering',capacity:40,operational:true,position:p(8),larvae});
function fixture(larvae=20){const world=createStartingWorld();world.dimensions={columns:16,rows:7,tileSize:24};world.decorations=[];world.tiles=Array.from({length:7},()=>Array.from({length:16},()=>({terrain:'topsoil',state:'discovered'})));for(let c=0;c<14;c++)world.tiles[3][c].state='open';
 const resources=new ResourceSystem();for(const resource of ['food','water'])resources.addStore({id:resource,resource,position:p(0),capacity:200,amount:200,status:'operational',reachable:true});
 const s=new BroodSupplySystem(resources,new CollectorNavigation(world));s.syncRooms([room('a',larvae)]);s.addNurse('n',p(0));return{s,resources,world};}
function until(s,predicate){for(let i=0;i<5000&&!predicate();i++)s.advanceWorkers(.05);assert.ok(predicate(),'condition not reached');}
function balance(s){for(const resource of ['food','water']){const b=s.balance[resource];assert.ok(Math.abs(b.withdrawn-b.atChambers-b.carried-b.consumed-b.dropped-b.returned)<1e-8,JSON.stringify(b));}}
test('real pickup precedes arrival, single-resource loads stay within five, and reservoirs are separate from general stores',()=>{
 const {s,resources}=fixture();assert.equal(s.getRooms()[0].food.amount,0);until(s,()=>s.getNurses()[0].load!==null);
 const load=s.getNurses()[0].load;assert.ok(load.amount<=5);assert.equal(resources.getStore(load.resource).amount,200-load.amount);assert.equal(s.getRooms()[0][load.resource].amount,0);
 until(s,()=>s.getRooms()[0].food.amount===20&&s.getRooms()[0].water.amount===20);assert.equal(resources.listStores().length,2);balance(s);
});
test('only actual larval room stocks are consumed, fractions work and half-full triggers sustained refill to target',()=>{
 const {s}=fixture(10);until(s,()=>s.getRooms()[0].food.amount===10&&s.getRooms()[0].water.amount===10);
 s.consume(.5,[room('a',10)]);assert.equal(s.getRooms()[0].food.amount,7.5);assert.equal(s.getRooms()[0].food.refilling,false);
 s.consume(.5,[room('a',10)]);assert.equal(s.getRooms()[0].food.amount,5);assert.equal(s.getRooms()[0].food.refilling,true);
 until(s,()=>s.getRooms()[0].food.amount===10&&s.getRooms()[0].water.amount===10);assert.equal(s.balance.food.consumed,5);balance(s);
});
test('zero larvae need no new deliveries or consumption; falling target preserves existing delivered resources',()=>{
 const {s,resources}=fixture();until(s,()=>s.getRooms()[0].food.amount===20&&s.getRooms()[0].water.amount===20);
 s.consume(100,[room('a',0)]);s.advanceWorkers(20);assert.equal(s.getRooms()[0].food.target,0);assert.equal(s.getRooms()[0].food.amount,20);assert.equal(resources.getStore('food').amount,180);balance(s);
});
test('parallel nurses reserve exact demand without duplicated withdrawals or overfilling',()=>{
 const {s}=fixture(7);for(let i=0;i<8;i++)s.addNurse('extra'+i,p(0));s.advanceWorkers(100);
 assert.equal(s.getRooms()[0].food.amount,7);assert.equal(s.getRooms()[0].water.amount,7);assert.equal(s.balance.food.withdrawn,7);assert.equal(s.balance.water.withdrawn,7);balance(s);
});
test('empty or blocked warehouses do not supply phantom stock and missing resources are recorded separately',()=>{
 const {s,resources,world}=fixture();resources.takeFromStore('food',200);world.tiles[3][4].state='discovered';s.advanceWorkers(30);s.consume(1,[room()]);
 assert.equal(s.getRooms()[0].food.amount,0);assert.equal(s.getRooms()[0].water.amount,0);assert.equal(s.balance.food.withdrawn,0);assert.equal(s.getRooms()[0].food.unmet,10);assert.equal(s.getRooms()[0].water.unmet,10);balance(s);
});
test('different rooms retain separate stocks and unreachable rooms receive none',()=>{
 const {s}=fixture(10);s.syncRooms([room('a',10),{...room('b',10),position:p(10),operational:false}]);s.advanceWorkers(100);
 assert.equal(s.getRooms().find(r=>r.id==='a').food.amount,10);assert.equal(s.getRooms().find(r=>r.id==='b').food.amount,0);balance(s);
});
test('reassignment finishes real cargo delivery before leaving; removal drops actual cargo without loss',()=>{
 const {s}=fixture();until(s,()=>s.getNurses()[0].load!==null);s.setNursingEnabled('n',false);until(s,()=>s.getNurses()[0].readyToLeave);assert.equal(s.getNurses()[0].load,null);balance(s);
 s.setNursingEnabled('n',true);until(s,()=>s.getNurses()[0].load!==null);const load=s.getNurses()[0].load;s.removeNurse('n');assert.equal(s.getDroppedLoads()[0].load.amount,load.amount);balance(s);
});
test('larval-stage boundaries charge exactly three days, not egg or pupal time, even in one large update',()=>{
 const {s}=fixture(2);until(s,()=>s.getRooms()[0].food.amount===2&&s.getRooms()[0].water.amount===2);
 const q=new QueenSystem(),r=room();q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(.2,1,[]);q.advance(0,0,[r],1);
 q.advance(6,0,[r],1,days=>s.consume(days,q.getLarvalRooms()));
 assert.equal(q.snapshot.bornCount,1);assert.equal(s.balance.food.consumed,1.5);assert.equal(s.balance.water.consumed,1.5);assert.equal(s.getRooms()[0].food.amount,.5);balance(s);
});
test('blocked destination returns actual cargo to a reachable real store without duplicating stock',()=>{
 const {s,world}=fixture();until(s,()=>s.getNurses()[0].load!==null);s.setNursingEnabled('n',false);world.tiles[3][5].state='discovered';
 until(s,()=>s.getNurses()[0].readyToLeave);assert.ok(s.balance.food.returned+s.balance.water.returned>0);balance(s);
});
test('delivery already underway preserves its real cargo when larvae disappear; it creates no further order',()=>{
 const {s}=fixture();until(s,()=>s.getNurses()[0].load!==null);s.syncRooms([room('a',0)]);s.advanceWorkers(100);
 assert.equal(s.balance.food.withdrawn+s.balance.water.withdrawn,5);assert.equal(s.balance.food.atChambers+s.balance.water.atChambers,5);balance(s);
});
test('warehouse choice uses actual travel duration and accepts real partial loads',()=>{
 const {s,resources}=fixture();s.removeNurse('n');s.addNurse('n',p(5));resources.addStore({id:'near-food',resource:'food',position:p(6),capacity:10,amount:3,status:'operational',reachable:true});
 s.advanceWorkers(.01);assert.equal(s.getNurses()[0].job.storeId,'near-food');until(s,()=>s.getNurses()[0].load!==null);
 assert.equal(s.getNurses()[0].load.amount,3);assert.equal(resources.getStore('near-food').amount,0);balance(s);
});
test('room metadata synchronization cannot import invented stock from a modified public snapshot',()=>{
 const {s}=fixture();const copy=s.getRooms();copy[0].food.amount=999;s.syncRooms(copy);assert.equal(s.getRooms()[0].food.amount,0);balance(s);
});
