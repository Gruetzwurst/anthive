import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createWorkforceSimulation } from '../src/game/simulation/workforceSimulation.ts';

function fixture() {
  const world = createStartingWorld();
  const home = world.landmarks.nestChamberCenter;
  const builders = new Map([['builder-0', { id: 'builder-0', position: { ...home }, resting: true }], ['builder-1', { id: 'builder-1', position: { ...home }, resting: true }]]);
  const simulation = createWorkforceSimulation(world, {
    workers: () => [...builders.values()].map(worker => ({ ...worker, position: { ...worker.position } })),
    addWorker: (id, position) => builders.set(id, { id, position: { ...position }, resting: true }),
    removeWorker: id => builders.delete(id),
    retireWorker: id => builders.delete(id),
    advanceWorkers: () => {},
  });
  return { simulation, builders, home };
}

test('explicit group transfer preserves nine IDs and native specializations, applies foreign efficiency', () => {
  const { simulation, builders, home } = fixture();
  const ids = simulation.workforce.getWorkers().map(worker => worker.id).sort();
  simulation.moveWorkers('gathering', 'gathering', 'building', 2);
  simulation.advance(1);
  assert.equal(builders.size, 4);
  assert.equal(simulation.gathering.getCollectors().length, 5);
  assert.deepEqual(simulation.workforce.getWorkers().map(worker => worker.id).sort(), ids);
  const moved = simulation.getWorkers().find(worker => worker.id === 'collector-0');
  assert.equal(moved.specialization, 'gathering');
  assert.equal(moved.assignment, 'building');
  assert.equal(moved.actualWork, 'building');
  assert.equal(simulation.workforce.efficiency(moved.id, 'building'), 0.5);
  assert.deepEqual(moved.position, home);
  simulation.moveWorkers('gathering', 'building', 'gathering', 2);
  assert.equal(simulation.gathering.getCollectors().length, 7);
  assert.equal(builders.size, 2);
});

test('real carrier finishes delivery and physically returns before joining building work', () => {
  const { simulation, builders } = fixture();
  let carrier;
  for (let i = 0; i < 1200 && !carrier; i++) {
    simulation.advance(0.1);
    carrier = simulation.gathering.getCollectors().find(worker => worker.id === 'collector-0' && worker.load);
  }
  assert.ok(carrier?.load);
  const totalBefore = simulation.resources.getStoreTotals(carrier.load.resource).amount;
  simulation.moveWorkers('gathering', 'gathering', 'building', 1);
  assert.ok(simulation.getWorkers().find(worker => worker.id === 'collector-0').pending);
  assert.equal(builders.size, 2);
  const start = simulation.getWorkers().find(worker => worker.id === 'collector-0').position;
  simulation.advance(0.1);
  const next = simulation.getWorkers().find(worker => worker.id === 'collector-0').position;
  assert.ok(Math.hypot(start.x - next.x, start.y - next.y) <= 7.8001);
  simulation.advance(120);
  assert.equal(builders.size, 3);
  assert.ok(simulation.resources.getStoreTotals(carrier.load.resource).amount > totalBefore);
  assert.equal(simulation.getWorkers().find(worker => worker.id === 'collector-0').pending, false);
});

test('builder reassignment waits for its existing job, then keeps the requested group while idle', () => {
  const { simulation, builders } = fixture();
  builders.get('builder-0').resting = false;
  simulation.moveWorkers('building', 'building', 'gathering', 1);
  simulation.advance(1);
  assert.equal(builders.size, 2);
  assert.equal(simulation.getWorkers().find(worker => worker.id === 'builder-0').pending, true);
  builders.get('builder-0').resting = true;
  simulation.advance(0.1);
  assert.equal(builders.size, 1);
  assert.equal(simulation.gathering.getCollectors().length, 8);
  assert.equal(simulation.workforce.getWorker('builder-0').specialization, 'building');
});

test('care and combat assignments rest without creating later systems or changing specialization', () => {
  const { simulation } = fixture();
  simulation.moveWorkers('gathering', 'gathering', 'care', 1);
  simulation.moveWorkers('building', 'building', 'combat', 1);
  simulation.advance(1);
  for (const id of ['collector-0', 'builder-0']) {
    const worker = simulation.getWorkers().find(worker => worker.id === id);
    assert.equal(worker.actualWork, 'rest');
    assert.equal(worker.resting, true);
    assert.equal(worker.pending, false);
  }
  assert.equal(simulation.getWorkers().length, 9);
  assert.equal(simulation.workforce.getWorker('collector-0').assignment, 'care');
});

test('all resting adults are counted once and use the existing A3 consumption discount', () => {
  const { simulation } = fixture();
  simulation.moveWorkers('gathering', 'gathering', 'rest', 7);
  simulation.moveWorkers('building', 'building', 'rest', 2);
  simulation.advance(1); // short initial return walk
  for (const resource of ['food', 'water']) simulation.resources.depositInStore(`${resource}-store`, { resource, amount: 100 });
  simulation.advance(600);
  assert.ok(Math.abs(simulation.resources.getStoreTotals('food').amount - 91.8) < 1e-7);
  assert.ok(Math.abs(simulation.resources.getStoreTotals('water').amount - 91.8) < 1e-7);
  assert.equal(simulation.getWorkers().length, 9);
});

test('pause stops pending walking and worker deaths remove registry entries exactly once', () => {
  const { simulation } = fixture();
  simulation.advance(10);
  simulation.moveWorkers('gathering', 'gathering', 'rest', 7);
  const before = simulation.getWorkers();
  simulation.clock.setPaused(true);
  simulation.advance(600);
  assert.deepEqual(simulation.getWorkers(), before);
  simulation.clock.setPaused(false);
  simulation.advance(120);
  simulation.moveWorkers('building', 'building', 'rest', 2);
  for (const store of simulation.resources.listStores()) simulation.resources.takeFromStore(store.id, store.amount);
  simulation.supply.advance(6, { activeWorkers: 0, restingWorkers: 9, queens: 1 });
  simulation.advance(3 * 600);
  assert.equal(simulation.supply.snapshot.workerLosses, 1);
  assert.equal(simulation.getWorkers().length, 8);
  assert.equal(simulation.workforce.getWorkers().length, 8);
});

test('a returning collector cannot also receive a full builder step in the same time interval', () => {
  const world = createStartingWorld();
  const builders = new Map();
  let addedAt = null, simulation;
  simulation = createWorkforceSimulation(world, {
    workers: () => [...builders.values()],
    addWorker: (id, position) => {
      addedAt = simulation.clock.totalGameDays;
      builders.set(id, { id, position, resting: true });
    },
    removeWorker: id => builders.delete(id), retireWorker: id => builders.delete(id),
    advanceWorkers: () => {
      if (builders.size) assert.notEqual(simulation.clock.totalGameDays, addedAt, 'one worker may not work in two engines during the same interval');
    },
  });
  simulation.moveWorkers('gathering', 'gathering', 'building', 1);
  simulation.advance(1);
  assert.equal(builders.size, 1);
});

test('without suitable sources collectors rest and resume gathering without changing group or specialization', () => {
  const world = createStartingWorld();
  const source = world.resources.find(item => item.kind === 'foodSource');
  world.resources = [];
  world.decorations = world.decorations.filter(item => item.kind !== 'pond');
  const simulation = createWorkforceSimulation(world, {
    workers: () => [], addWorker: () => { throw Error('No automatic foreign work'); },
    removeWorker: () => {}, retireWorker: () => {}, advanceWorkers: () => {},
  });
  for (const resource of ['food', 'water']) simulation.resources.depositInStore(`${resource}-store`, { resource, amount: 100 });
  simulation.advance(600);
  assert.ok(simulation.getWorkers().every(worker => worker.resting && worker.assignment === 'gathering' && worker.specialization === 'gathering'));
  assert.ok(Math.abs(simulation.resources.getStoreTotals('food').amount - 93.4) < 1e-7);
  simulation.resources.addSource({ id: source.id, resource: 'food', kind: 'finite', position: source.position,
    amount: 200, capacity: 200, regenerationPerDay: 20, recoveryDays: 2 });
  const stock = simulation.resources.getStoreTotals('food').amount;
  simulation.advance(120);
  assert.ok(simulation.resources.getStoreTotals('food').amount > stock);
  assert.ok(simulation.getWorkers().every(worker => worker.assignment === 'gathering' && worker.specialization === 'gathering'));
});

test('unchanged native groups preserve the existing multi-day transport and consumption economy', async () => {
  const { createColonySimulation } = await import('../src/game/simulation/colonySimulation.ts');
  const { simulation, builders } = fixture();
  const original = createColonySimulation(createStartingWorld(), {
    otherWorkers: () => [...builders.values()].map(worker => ({ id: worker.id, resting: worker.resting })),
    retireOtherWorker: () => {}, advanceOtherWorkers: () => {},
  });
  simulation.advance(1800); original.advance(1800);
  for (const resource of ['food', 'water']) {
    assert.ok(Math.abs(simulation.resources.getStoreTotals(resource).amount - original.resources.getStoreTotals(resource).amount) < 1e-8);
  }
  assert.deepEqual(simulation.supply.snapshot, original.supply.snapshot);
  assert.equal(simulation.workforce.getWorkers().length, 9);
});
