import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ResourceSystem } from '../src/game/simulation/resourceSystem.ts';
import { GatheringSystem } from '../src/game/simulation/gatheringSystem.ts';

const point = x => ({ x, y: 10 });
function fixture({ stock = 200, capacity = 120 } = {}) {
  const resources = new ResourceSystem();
  resources.addSource({ id: 'food', resource: 'food', kind: 'finite', position: point(10), capacity: 200, amount: stock, regenerationPerDay: 20, recoveryDays: 2 });
  resources.addStore({ id: 'store', resource: 'food', position: point(0), capacity, amount: 0, status: 'operational', reachable: true });
  const blocked = new Set();
  const navigation = {
    findPath: (from, to) => blocked.has(to.x) ? null : [{ ...from }, { ...to }],
    canMove: (_from, to) => !blocked.has(to.x),
    sourceAccessPoints: source => [{ ...source.position }],
  };
  const gathering = new GatheringSystem(resources, navigation, {
    speed: 10, carryCapacity: 5, interactionSeconds: 0.25, retrySeconds: 1,
    priorityWeight: 2, storeCongestionSeconds: 1, storeFullnessSeconds: 1,
  });
  gathering.addCollector('a', point(0));
  return { resources, gathering, blocked };
}

test('real pickup reduces the source; only arrival and deposit increase the store', () => {
  const { resources, gathering } = fixture();
  gathering.advance(1);
  assert.equal(resources.getSource('food').amount, 200);
  assert.equal(resources.getStore('store').amount, 0);
  gathering.advance(0.25);
  assert.equal(resources.getSource('food').amount, 195);
  assert.equal(gathering.getCollectors()[0].load.amount, 5);
  assert.equal(resources.getStore('store').amount, 0);
  gathering.advance(1.25);
  assert.equal(resources.getStore('store').amount, 5);
});

test('multiple collectors cannot duplicate a partial source or overfill a small store', () => {
  const { resources, gathering } = fixture({ stock: 3, capacity: 2 });
  gathering.addCollector('b', point(0)); gathering.addCollector('c', point(0));
  gathering.advance(10);
  assert.equal(resources.getStore('store').amount, 2);
  assert.equal(resources.getSource('food').amount, 1);
  assert.equal(gathering.getCollectors().reduce((sum, ant) => sum + (ant.load?.amount ?? 0), 0), 0);
});

test('closest usable source is concentrated on, exhausted sources switch automatically', () => {
  const { resources, gathering } = fixture({ stock: 5 });
  resources.addSource({ id: 'far-food', resource: 'food', kind: 'finite', position: point(30), capacity: 20, amount: 20, regenerationPerDay: 0, recoveryDays: 2 });
  gathering.addCollector('b', point(0));
  gathering.advance(0.1);
  const targets = gathering.getCollectors().map(ant => ant.sourceId);
  assert.ok(targets.includes('food'));
  assert.ok(targets.includes('far-food')); // near stock is already fully reserved
  gathering.advance(40); // far round trips take 6.5 seconds including interactions
  assert.equal(resources.getSource('food').amount, 0);
  assert.equal(resources.getStore('store').amount, 25);
});

test('same-resource collectors prefer the fast source rather than evenly splitting sources', () => {
  const { resources, gathering } = fixture();
  resources.addSource({ id: 'far-food', resource: 'food', kind: 'finite', position: point(30), capacity: 20, amount: 20, regenerationPerDay: 0, recoveryDays: 2 });
  gathering.addCollector('b', point(0));
  gathering.advance(0.1);
  assert.deepEqual(gathering.getCollectors().map(ant => ant.sourceId), ['food', 'food']);
});

test('unreachable sources are excluded and a full nearest store redirects to another proper store', () => {
  const { resources, gathering, blocked } = fixture();
  blocked.add(10);
  gathering.advance(4);
  assert.equal(resources.getSource('food').amount, 200);
  blocked.clear();
  resources.depositInStore('store', { resource: 'food', amount: 120 });
  resources.addStore({ id: 'other', resource: 'food', position: point(20), capacity: 10, amount: 0, status: 'operational', reachable: true });
  gathering.advance(10);
  assert.equal(resources.getStore('other').amount, 10);
  assert.equal(resources.getStore('store').amount, 120);
});

test('store fills during a trip: carried leftovers survive and resume when capacity returns', () => {
  const { resources, gathering } = fixture({ capacity: 5 });
  gathering.advance(1.25);
  resources.depositInStore('store', { resource: 'food', amount: 4 });
  gathering.advance(4);
  assert.equal(resources.getStore('store').amount, 5);
  assert.equal(gathering.getCollectors()[0].load.amount, 4);
  assert.equal(resources.getSource('food').amount, 195);
  resources.takeFromStore('store', 5);
  gathering.advance(3);
  assert.ok(resources.getStore('store').amount >= 4);
});

test('a path becoming blocked mid-delivery keeps the load and does not credit a phantom arrival', () => {
  const { resources, gathering, blocked } = fixture();
  gathering.advance(1.25);
  blocked.add(0);
  gathering.advance(5);
  assert.equal(resources.getStore('store').amount, 0);
  assert.equal(gathering.getCollectors()[0].load.amount, 5);
  blocked.clear();
  gathering.advance(3);
  assert.ok(resources.getStore('store').amount >= 5);
});

test('food, water and balanced priorities preserve both resources and never exclude the other forever', () => {
  for (const priority of ['food', 'water', 'balanced']) {
    const { resources, gathering } = fixture();
    resources.addSource({ id: 'pond', resource: 'water', kind: 'unlimited', position: point(12) });
    resources.addStore({ id: 'water-store', resource: 'water', position: point(0), capacity: 120, amount: 0, status: 'operational', reachable: true });
    gathering.setPriority(priority);
    gathering.advance(0.1);
    assert.equal(gathering.getCollectors()[0].sourceId, priority === 'water' ? 'pond' : 'food');
    gathering.advance(200);
    assert.equal(resources.getStore('store').amount, 120);
    assert.equal(resources.getStore('water-store').amount, 120);
    assert.equal(gathering.priority, priority);
  }
});

test('all storage full causes idle, reopening capacity automatically resumes the same assignment', () => {
  const { resources, gathering } = fixture({ capacity: 5 });
  resources.depositInStore('store', { resource: 'food', amount: 5 });
  gathering.advance(10);
  assert.equal(gathering.getCollectors()[0].phase, 'idle');
  assert.equal(resources.getSource('food').amount, 200);
  resources.takeFromStore('store', 5);
  gathering.advance(5);
  assert.equal(resources.getStore('store').amount, 5);
});

test('fractional and large transport steps conserve resources and snapshots cannot mutate workers', () => {
  const a = fixture(), b = fixture();
  a.gathering.advance(20);
  for (let index = 0; index < 200; index++) b.gathering.advance(0.1);
  assert.equal(a.resources.getStore('store').amount, b.resources.getStore('store').amount);
  const ant = a.gathering.getCollectors()[0];
  ant.position.x = 10000; if (ant.load) ant.load.amount = 10000;
  assert.notEqual(a.gathering.getCollectors()[0].position.x, 10000);
  const total = a.resources.getSource('food').amount + a.resources.getStore('store').amount
    + a.gathering.getCollectors().reduce((sum, worker) => sum + (worker.load?.amount ?? 0), 0);
  assert.equal(total, 200);
  assert.throws(() => a.gathering.advance(-1), RangeError);
  assert.throws(() => a.gathering.setPriority('unknown'), /priority/i);
  assert.throws(() => a.gathering.addCollector('a', point(0)), /duplicate/i);
});

test('adult work factor slows travel and interaction without advancing resource stocks', () => {
  const { gathering, resources } = fixture();
  gathering.advance(1, 0.5);
  assert.equal(gathering.getCollectors()[0].position.x, 5);
  gathering.advance(1, 0.5);
  gathering.advance(0.25, 0.5);
  assert.equal(resources.getSource('food').amount, 200);
  gathering.advance(0.25, 0.5);
  assert.equal(gathering.getCollectors()[0].load.amount, 5);
  const before = gathering.getCollectors();
  gathering.advance(10, 0);
  assert.deepEqual(gathering.getCollectors(), before);
});

test('retiring a carrier releases reservations and returns the actual undelivered load', () => {
  const { gathering, resources } = fixture();
  gathering.advance(1.25);
  const retired = gathering.retireCollector('a');
  assert.equal(retired.load.amount, 5);
  assert.equal(retired.position.x, 10);
  assert.equal(gathering.getCollectors().length, 0);
  assert.equal(resources.getSource('food').amount, 195);
  assert.equal(resources.getStore('store').amount, 0);
  gathering.addCollector('b', point(0));
  gathering.advance(3);
  assert.equal(resources.getStore('store').amount, 5);
  assert.equal(gathering.retireCollector('missing'), undefined);
});
