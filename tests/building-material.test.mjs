import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ResourceSystem } from '../src/game/simulation/resourceSystem.ts';
import { BuildingMaterialSystem } from '../src/game/simulation/buildingMaterialSystem.ts';

function fixture(capacity = 20) {
  const resources = new ResourceSystem();
  for (const [id, resource] of [['material', 'buildingMaterial'], ['food', 'food']]) resources.addStore({
    id, resource, position: {x:0,y:0}, capacity, amount:0, status:'operational', reachable:true,
  });
  const material = new BuildingMaterialSystem(resources, 5);
  return { resources, material };
}
function balanced(material) {
  const b = material.balance;
  assert.ok(Math.abs(b.initial + b.produced - b.ground - b.carried - b.stored - b.consumed) < 1e-8, JSON.stringify(b));
}

test('material remains at its real site until pickup and arrives only through actual deposit', () => {
  const { resources, material } = fixture();
  const pile = material.produce({x:10,y:20}, 7);
  assert.equal(resources.getStore('material').amount,0);
  assert.equal(material.pickUp(pile, 'a', 7),5);
  assert.equal(material.getCarried('a'),5);
  assert.equal(material.getGround()[0].amount,2);
  assert.equal(material.deposit('a','food'),0);
  assert.equal(material.getCarried('a'),5);
  assert.equal(material.deposit('a','material'),5);
  assert.equal(material.getCarried('a'),0);
  assert.equal(resources.getStore('material').amount,5);
  balanced(material);
});

test('partial deposits, multiple carriers, real consumption and death conserve all material', () => {
  const { resources, material } = fixture(3);
  const pile = material.produce({x:10,y:20},9);
  assert.equal(material.pickUp(pile,'a',5),5);
  assert.equal(material.pickUp(pile,'b',5),4);
  assert.equal(material.deposit('a','material'),3);
  assert.equal(material.getCarried('a'),2);
  assert.equal(material.deposit('b','material'),0);
  material.dropCarrier('a',{x:5,y:8});
  assert.equal(material.consumeFromStore('material',2),2);
  assert.equal(material.deposit('b','material'),2);
  assert.equal(resources.getStore('material').amount,3);
  assert.equal(material.getCarried('b'),2);
  assert.equal(material.getGround().reduce((sum,p)=>sum+p.amount,0),2);
  balanced(material);
});

test('pickup cannot duplicate exhausted piles; returned data cannot mutate balances', () => {
  const { material } = fixture();
  const id = material.produce({x:1,y:1},4);
  assert.equal(material.pickUp(id,'a',5),4);
  assert.equal(material.pickUp(id,'b',5),0);
  material.dropCarrier('a',{x:2,y:2});
  const snapshot = material.getGround(); snapshot[0].amount=999; snapshot[0].position.x=999;
  assert.equal(material.getGround()[0].amount,4);
  assert.equal(material.getGround()[0].position.x,2);
  for (const amount of [-1, NaN, Infinity]) assert.throws(()=>material.produce({x:1,y:1},amount));
  assert.equal(material.balance.produced,4);
  balanced(material);
});
