import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ResourceSystem } from '../src/game/simulation/resourceSystem.ts';

const source = (overrides = {}) => ({
  id: 'food-source', resource: 'food', position: { x: 24, y: 48 }, kind: 'finite',
  capacity: 200, amount: 200, regenerationPerDay: 20, recoveryDays: 2, ...overrides,
});
const store = (overrides = {}) => ({
  id: 'food-store-a', resource: 'food', position: { x: 72, y: 96 },
  capacity: 120, amount: 0, status: 'operational', reachable: true, ...overrides,
});

test('source extraction removes only available stock and returns a real typed load', () => {
  const resources = new ResourceSystem();
  resources.addSource(source());
  assert.deepEqual(resources.takeFromSource('food-source', 5), { resource: 'food', amount: 5 });
  assert.equal(resources.getSource('food-source').amount, 195);
  resources.addSource(source({ id: 'nearly-empty', amount: 3 }));
  assert.deepEqual(resources.takeFromSource('nearly-empty', 5), { resource: 'food', amount: 3 });
  assert.equal(resources.takeFromSource('nearly-empty', 5).amount, 0);
  assert.equal(resources.getSource('nearly-empty').amount, 0);
});

test('depletion starts recovery; empty requests do not reset it; only remaining time regenerates', () => {
  const resources = new ResourceSystem();
  resources.addSource(source());
  resources.takeFromSource('food-source', 200);
  resources.advance(1);
  assert.equal(resources.getSource('food-source').recoveryDaysLeft, 1);
  assert.equal(resources.takeFromSource('food-source', 5).amount, 0);
  resources.advance(1);
  assert.equal(resources.getSource('food-source').amount, 0);
  assert.equal(resources.getSource('food-source').recoveryDaysLeft, 0);
  resources.advance(0.25);
  assert.equal(resources.getSource('food-source').amount, 5);
  resources.advance(100);
  assert.equal(resources.getSource('food-source').amount, 200);
});

test('a large recovery-crossing update matches many fractional updates', () => {
  const big = new ResourceSystem(), small = new ResourceSystem();
  for (const resources of [big, small]) {
    resources.addSource(source());
    resources.takeFromSource('food-source', 200);
  }
  big.advance(3.5);
  for (let index = 0; index < 14; index++) small.advance(0.25);
  assert.equal(big.getSource('food-source').amount, 30);
  assert.deepEqual(big.getSource('food-source'), small.getSource('food-source'));
});

test('regenerating small water sources are finite; pond water stays unlimited and JSON-safe', () => {
  const resources = new ResourceSystem();
  resources.addSource(source({ id: 'puddle', resource: 'water', capacity: 8, amount: 3, regenerationPerDay: 2, recoveryDays: 1 }));
  resources.addSource({ id: 'pond', resource: 'water', kind: 'unlimited', position: { x: 200, y: 24 } });
  assert.equal(resources.takeFromSource('puddle', 5).amount, 3);
  resources.advance(1.5);
  assert.equal(resources.getSource('puddle').amount, 1);
  const before = resources.getSource('pond');
  assert.equal(resources.takeFromSource('pond', 10000).amount, 10000);
  assert.deepEqual(resources.getSource('pond'), before);
  assert.deepEqual(JSON.parse(JSON.stringify(before)), before);
});

test('ordinary partial harvesting regenerates immediately; zero harvesting does not start recovery', () => {
  const resources = new ResourceSystem();
  resources.addSource(source());
  resources.takeFromSource('food-source', 0);
  resources.takeFromSource('food-source', 5);
  resources.advance(0.1);
  assert.equal(resources.getSource('food-source').amount, 197);
  assert.equal(resources.getSource('food-source').recoveryDaysLeft, 0);
});

test('deposits are capped per chamber and report the accepted part; withdrawals never go negative', () => {
  const resources = new ResourceSystem();
  resources.addStore(store({ amount: 118 }));
  assert.equal(resources.depositInStore('food-store-a', { resource: 'food', amount: 5 }), 2);
  assert.equal(resources.getStore('food-store-a').amount, 120);
  assert.equal(resources.depositInStore('food-store-a', { resource: 'food', amount: 1 }), 0);
  assert.deepEqual(resources.takeFromStore('food-store-a', 125), { resource: 'food', amount: 120 });
  assert.equal(resources.getStore('food-store-a').amount, 0);
});

test('food, water, material and multiple same-type chambers keep independent stocks and capacities', () => {
  const resources = new ResourceSystem();
  resources.addStore(store());
  resources.addStore(store({ id: 'food-store-b', capacity: 30, amount: 7 }));
  resources.addStore(store({ id: 'water-store', resource: 'water' }));
  resources.addStore(store({ id: 'material-store', resource: 'buildingMaterial', capacity: 96 }));
  assert.equal(resources.depositInStore('water-store', { resource: 'food', amount: 10 }), 0);
  assert.equal(resources.depositInStore('water-store', { resource: 'water', amount: 8 }), 8);
  assert.equal(resources.depositInStore('material-store', { resource: 'buildingMaterial', amount: 5 }), 5);
  assert.deepEqual(resources.getStoreTotals('food'), { amount: 7, capacity: 150 });
  assert.equal(resources.getStore('food-store-a').amount, 0);
  assert.equal(resources.getStore('food-store-b').amount, 7);
  assert.equal(resources.getStore('water-store').amount, 8);
  assert.equal(resources.getStore('material-store').amount, 5);
});

test('unfinished or unreachable stores neither receive nor supply usable resources', () => {
  const resources = new ResourceSystem();
  for (const status of ['planned', 'excavated', 'furnishing']) {
    resources.addStore(store({ id: status, status }));
    assert.equal(resources.depositInStore(status, { resource: 'food', amount: 5 }), 0);
    assert.equal(resources.takeFromStore(status, 5).amount, 0);
  }
  resources.addStore(store({ id: 'blocked', reachable: false, amount: 5 }));
  assert.equal(resources.takeFromStore('blocked', 5).amount, 0);
  assert.equal(resources.depositInStore('blocked', { resource: 'food', amount: 2 }), 0);
  assert.equal(resources.getStore('blocked').amount, 5);
  assert.deepEqual(resources.getStoreTotals('food'), { amount: 0, capacity: 0 });
});

test('mutating registration data or returned snapshots cannot alter the resource system', () => {
  const resources = new ResourceSystem();
  const food = source(), chamber = store();
  resources.addSource(food); resources.addStore(chamber);
  food.amount = 900; food.position.x = 900; chamber.capacity = 900;
  resources.getSource('food-source').amount = -5;
  resources.getSource('food-source').position.x = -5;
  resources.getStore('food-store-a').capacity = 900;
  assert.equal(resources.getSource('food-source').amount, 200);
  assert.equal(resources.getSource('food-source').position.x, 24);
  assert.equal(resources.getStore('food-store-a').capacity, 120);
});

test('invalid operations fail before mutation; source/store IDs must exist and be unique', () => {
  const resources = new ResourceSystem();
  resources.addSource(source()); resources.addStore(store({ amount: 5 }));
  for (const value of [-1, NaN, Infinity, -Infinity]) {
    assert.throws(() => resources.takeFromSource('food-source', value), RangeError);
    assert.throws(() => resources.takeFromStore('food-store-a', value), RangeError);
    assert.throws(() => resources.depositInStore('food-store-a', { resource: 'food', amount: value }), RangeError);
    assert.throws(() => resources.advance(value), RangeError);
  }
  assert.throws(() => resources.addSource(source()), /duplicate/i);
  assert.throws(() => resources.addStore(store()), /duplicate/i);
  assert.throws(() => resources.takeFromSource('missing', 5), /unknown/i);
  assert.throws(() => resources.depositInStore('missing', { resource: 'food', amount: 5 }), /unknown/i);
  assert.throws(() => resources.addSource(source({ id: 'invalid', amount: 201 })), RangeError);
  assert.throws(() => resources.addSource(source({ id: 'invalid', regenerationPerDay: -1 })), RangeError);
  assert.throws(() => resources.addStore(store({ id: 'invalid', capacity: -1 })), RangeError);
  assert.throws(() => resources.addStore(store({ id: 'invalid', amount: 121 })), RangeError);
  assert.throws(() => resources.addStore(store({ id: 'invalid', resource: 'mineral' })), /resource/i);
  assert.equal(resources.getSource('food-source').amount, 200);
  assert.equal(resources.getStore('food-store-a').amount, 5);
});

test('extraction, partial deposit and returned remainder conserve actual resources', () => {
  const resources = new ResourceSystem();
  resources.addSource(source({ amount: 3 }));
  resources.addStore(store({ capacity: 2 }));
  const load = resources.takeFromSource('food-source', 5);
  const accepted = resources.depositInStore('food-store-a', load);
  const carriedRemainder = load.amount - accepted;
  assert.equal(resources.getSource('food-source').amount + resources.getStore('food-store-a').amount + carriedRemainder, 3);
  assert.equal(carriedRemainder, 1);
});
