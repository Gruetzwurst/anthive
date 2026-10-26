import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {GatheringSystem} from '../src/game/simulation/gatheringSystem.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
const cells=(width=4,height=3)=>Array.from({length:width*height},(_,i)=>({column:3+i%width,row:2+Math.floor(i/width)}));
function fixture(){
 const world=createStartingWorld();world.dimensions={columns:24,rows:10,tileSize:24};
 world.tiles=Array.from({length:10},()=>Array.from({length:24},()=>({terrain:'topsoil',state:'open'})));
 world.storageChambers=[];world.chamberFootprints=[];world.landmarks.nestChamberCenter={x:12,y:84};
 const resources=new ResourceSystem();resources.addStore({id:'material',resource:'buildingMaterial',position:{x:12,y:84},capacity:1000,amount:300,status:'operational',reachable:true});
 const e=new ExcavationSystem(world,resources);e.addBuilder('a',{x:60,y:84});return{world,resources,e};
}
function finish(e,id){for(let i=0;i<20000&&e.getConstructionOrders().find(o=>o.id===id).status!=='furnished';i++)e.advance(.05);assert.equal(e.getConstructionOrders().find(o=>o.id===id).status,'furnished');}

test('type-specific minimums reject before creating orders; tunnels remain one tile',()=>{
 const {e}=fixture();for(const [type,area] of [['food',12],['water',12],['buildingMaterial',12],['brood-gathering',20],['brood-building',20],['brood-care',20],['brood-combat',20],['rest',16]]){
  assert.throws(()=>e.addOrder(cells(1,area-1).map((c,i)=>({column:3+i%6,row:2+Math.floor(i/6)})),type),/mindestens/);
 }assert.equal(e.getConstructionOrders().length,0);assert.equal(e.addOrder([{column:3,row:2}]),1);
});
test('a connected L shape is valid; no capacity until completely furnished; repeated updates do not duplicate stores',()=>{
 const {e,resources}=fixture();const shape=[...cells(5,2),{column:3,row:4},{column:3,row:5}];const id=e.addOrder(shape,'food');
 assert.equal(resources.getStoreTotals('food').capacity,0);e.advance(10);assert.equal(resources.getStoreTotals('food').capacity,0);
 finish(e,id);assert.deepEqual(resources.getStoreTotals('food'),{amount:0,capacity:120});e.advance(20);
 const o=e.getConstructionOrders()[0];assert.equal(o.capacity,120);assert.equal(o.operational,true);assert.equal(resources.listStores().filter(s=>s.resource==='food').length,1);
 assert.equal(e.drainCompletedChambers().length,1);assert.equal(e.drainCompletedChambers().length,0);
});
for(const [type,w,h,capacity] of [['water',5,3,150],['buildingMaterial',4,3,96],['brood-gathering',5,4,40],['brood-building',5,4,40],['brood-care',5,4,40],['brood-combat',5,4,40],['rest',4,4,32]])test(`${type} supplies only its own capacity`,()=>{
 const {e,resources}=fixture();const id=e.addOrder(cells(w,h),type);finish(e,id);assert.equal(e.getConstructionOrders()[0].capacity,capacity);
 const room=e.chambers.getChambers()[0];assert.equal(room.type,type);assert.equal(room.capacity,capacity);
 if(type.startsWith('brood')||type==='rest')assert.equal(resources.listStores().length,1);
});
test('individual stores accept actual deliveries; unreachable furnished room loses access and regains it without losing stock',()=>{
 const {e,world,resources}=fixture();const id=e.addOrder(cells(),'water');finish(e,id);
 const room=e.chambers.getChambers()[0];assert.equal(resources.depositInStore(room.storeId,{resource:'water',amount:200}),120);
 world.tiles[3][0].state='discovered';e.chambers.refreshAccess();assert.equal(e.getConstructionOrders()[0].operational,false);assert.equal(resources.getStoreTotals('water').capacity,0);
 assert.equal(resources.getStore(room.storeId).amount,120);world.tiles[3][0].state='open';e.chambers.refreshAccess();assert.deepEqual(resources.getStoreTotals('water'),{amount:120,capacity:120});
 const copy=e.chambers.getChambers();copy[0].type='food';copy[0].cells[0].row=99;assert.equal(e.chambers.getChambers()[0].type,'water');assert.equal(e.chambers.getChambers()[0].cells[0].row,2);
});
test('existing start chamber footprints and finished rooms cannot be reused as a different room',()=>{
 const {e,world}=fixture();world.chamberFootprints=[cells()];assert.throws(()=>e.addOrder(cells(),'food'),/Kammer/);
 world.chamberFootprints=[];const id=e.addOrder(cells(),'water');finish(e,id);assert.throws(()=>e.addOrder(cells(),'food'),/Kammer/);
 assert.throws(()=>e.cancelOrder(id));
});
test('two finished stores retain separate stocks and actual collectors deliver into a newly built store',()=>{
 const {e,world,resources}=fixture();const first=e.addOrder(cells(),'food');finish(e,first);
 const second=e.addOrder(cells().map(c=>({...c,column:c.column+7})),'food');finish(e,second);
 const [a,b]=e.chambers.getChambers();resources.depositInStore(a.storeId,{resource:'food',amount:120});
 resources.addSource({id:'source',resource:'food',kind:'finite',position:{x:252,y:84},capacity:5,amount:5,regenerationPerDay:0,recoveryDays:2});
 const gathering=new GatheringSystem(resources,new CollectorNavigation(world));gathering.addCollector('collector',{x:252,y:84});
 gathering.advance(10);assert.equal(resources.getStore(a.storeId).amount,120);assert.equal(resources.getStore(b.storeId).amount,5);
 assert.equal(resources.getStoreTotals('food').capacity,240);assert.equal(resources.getSource('source').amount,0);
});
test('generated starting rooms carry exact protected footprints, excluding connection tunnels',()=>{
 const world=createStartingWorld(),e=new ExcavationSystem(world,new ResourceSystem());
 assert.deepEqual(world.chamberFootprints.map(c=>c.length),[44,54,48,54,24,24,24,24]);
 for(const room of world.chamberFootprints)assert.throws(()=>e.addOrder(room,'food'),/bereits eine Kammer/);
});
