import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { ResourceSystem } from '../src/game/simulation/resourceSystem.ts';
import { ExcavationSystem } from '../src/game/simulation/excavationSystem.ts';

const cell = column => ({column,row:2});
const point = column => ({x:(column+.5)*24,y:2.5*24});
function fixture(terrain='topsoil', capacity=20, initial=0) {
  const world=createStartingWorld();
  world.dimensions={columns:16,rows:5,tileSize:24};
  world.tiles=Array.from({length:5},()=>Array.from({length:16},()=>({terrain,state:'discovered'})));
  for(let col=0;col<3;col++) world.tiles[2][col].state='open';
  const resources=new ResourceSystem();
  resources.addStore({id:'material',resource:'buildingMaterial',position:point(0),amount:initial,capacity,status:'operational',reachable:true});
  const excavation=new ExcavationSystem(world,resources);
  excavation.setDiggingGrade(3);
  excavation.addBuilder('a',point(2));
  return {world,resources,excavation};
}
function until(excavation,predicate,limit=3000) {
  for(let i=0;i<limit&&!predicate();i++) excavation.advance(.1);
  assert.ok(predicate(),'condition must occur within simulated limit');
}
function balanced(e) { const b=e.materials.balance; assert.ok(Math.abs(b.initial+b.produced-b.ground-b.carried-b.stored-b.consumed)<1e-8,JSON.stringify(b)); }

for(const [terrain,seconds,yieldAmount] of [['topsoil',6,1],['compactEarth',12,2],['clay',18,3],['stone',30,4],['stoneLayer',30,4],['deepRock',36,5]]) {
  test(`${terrain}: actual removal after ${seconds}s generates exactly ${yieldAmount} material once`,()=>{
    const {world,excavation}=fixture(terrain);
    excavation.addOrder([cell(3)]);
    excavation.advance(seconds-.01);
    assert.notEqual(world.tiles[2][3].state,'open');
    assert.equal(excavation.materials.balance.produced,0);
    excavation.advance(.01);
    assert.equal(world.tiles[2][3].state,'open');
    assert.equal(excavation.materials.balance.produced,yieldAmount);
    excavation.advance(50);
    assert.equal(excavation.materials.balance.produced,yieldAmount);
    balanced(excavation);
  });
}

test('full five-unit load triggers transport; four units continue digging and final partial is delivered',()=>{
  const {excavation}=fixture();
  excavation.addOrder([3,4,5,6,7].map(cell));
  until(excavation,()=>excavation.materials.getCarried('a')===4);
  assert.equal(excavation.materials.balance.stored,0);
  until(excavation,()=>excavation.materials.balance.stored===5);
  assert.equal(excavation.materials.balance.produced,5);
  assert.ok(excavation.getBuilders().every(worker=>worker.load<=5));
  balanced(excavation);
  const partial=fixture().excavation; partial.addOrder([3,4,5,6].map(cell));
  until(partial,()=>partial.materials.balance.stored===4);
  balanced(partial);
});

test('full store does not stop digging or block open tunnels; later capacity enables old pile collection',()=>{
  const {world,excavation}=fixture('topsoil',5,5);
  excavation.addOrder([3,4,5,6,7,8].map(cell));
  until(excavation,()=>excavation.materials.balance.produced===6);
  assert.equal(excavation.materials.balance.ground,6);
  assert.equal(excavation.materials.balance.stored,5);
  assert.ok([3,4,5,6,7,8].every(col=>world.tiles[2][col].state==='open'));
  excavation.materials.consumeFromStore('material',5);
  until(excavation,()=>excavation.materials.balance.stored===5);
  assert.equal(excavation.materials.balance.ground,1);
  balanced(excavation);
});

test('old piles wait for executable digging, but hard-locked orders allow cleanup',()=>{
  const {excavation}=fixture();
  excavation.materials.produce(point(2),3);
  excavation.addOrder([cell(3)]); excavation.advance(.1);
  assert.equal(excavation.getBuilders()[0].job.kind,'dig');
  assert.equal(excavation.materials.balance.ground,3);
  const blocked=fixture('stone').excavation;
  blocked.setDiggingGrade(0); blocked.materials.produce(point(2),3); blocked.addOrder([cell(3)]);
  until(blocked,()=>blocked.materials.balance.stored===3);
  assert.equal(blocked.materials.balance.produced,3);
  balanced(blocked);
});

test('multiple builders do not duplicate excavation or a pile and partial store acceptance retains leftovers',()=>{
  const {excavation}=fixture('stone',2);
  excavation.addBuilder('b',point(1)); excavation.addOrder([cell(3)]);
  until(excavation,()=>excavation.materials.balance.stored===2);
  assert.equal(excavation.materials.balance.produced,4);
  assert.equal(excavation.materials.balance.ground+excavation.materials.balance.carried,2);
  excavation.materials.consumeFromStore('material',2);
  until(excavation,()=>excavation.materials.balance.stored===2);
  balanced(excavation);
});

test('blocked delivery retains cargo; removing its carrier drops it at the actual position',()=>{
  const {world,excavation}=fixture('deepRock');
  excavation.addOrder([cell(3)]);
  until(excavation,()=>excavation.materials.getCarried('a')===5);
  world.tiles[2][1].state='discovered';
  excavation.advance(5);
  assert.equal(excavation.materials.balance.stored,0);
  assert.equal(excavation.materials.getCarried('a'),5);
  const position=excavation.getBuilders()[0].position;
  excavation.removeBuilder('a');
  assert.equal(excavation.materials.balance.carried,0);
  assert.deepEqual(excavation.materials.getGround()[0].position,position);
  assert.equal(excavation.materials.balance.ground,5);
  balanced(excavation);
});

test('requested reassignment completes current excavation and partial delivery without taking another job',()=>{
  const {excavation}=fixture();
  excavation.addOrder([cell(3),cell(4)]); excavation.advance(2);
  until({advance:s=>excavation.advance(s,1,()=>false)},()=>excavation.materials.balance.stored===1);
  assert.equal(excavation.materials.balance.produced,1);
  assert.equal(excavation.getBuilders()[0].readyToLeave,true);
  balanced(excavation);
});


test('a store filling during travel preserves cargo and redirects to another reachable material chamber',()=>{
  const {excavation,resources}=fixture('deepRock',5);
  resources.addStore({id:'other',resource:'buildingMaterial',position:point(1),amount:0,capacity:5,status:'operational',reachable:true});
  excavation.addOrder([cell(3)]);
  until(excavation,()=>excavation.getBuilders()[0].job?.kind==='deliver');
  const first=excavation.getBuilders()[0].job.storeId;
  // Fill using existing real ground material, not a fabricated stock credit.
  const pile=excavation.materials.produce(point(0),5);
  excavation.materials.pickUp(pile,'external',5);
  excavation.materials.deposit('external',first);
  until(excavation,()=>excavation.materials.balance.stored===10);
  assert.equal(excavation.materials.balance.carried,0);
  balanced(excavation);
});

test('large and framed excavation steps agree with combined shortage and foreign-work slowdown',()=>{
  const large=fixture().excavation, framed=fixture().excavation;
  for(const e of [large,framed])e.addOrder([3,4,5,6,7].map(cell));
  large.advance(150,.5,()=>true,()=>.5);
  for(let i=0;i<3000;i++)framed.advance(.05,.5,()=>true,()=>.5);
  assert.deepEqual(large.materials.balance,framed.materials.balance);
  assert.equal(large.materials.balance.stored,5);
  large.advance(100,0);
  assert.deepEqual(large.materials.balance,framed.materials.balance);
  balanced(large);balanced(framed);
});
