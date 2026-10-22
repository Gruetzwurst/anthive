import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ResourceSystem } from '../src/game/simulation/resourceSystem.ts';
import { AdultSupplySystem } from '../src/game/simulation/adultSupplySystem.ts';

const population = { activeWorkers: 9, restingWorkers: 0, queens: 1 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);
function fixture(food = 0, water = 0) {
  const resources = new ResourceSystem();
  for (const [resource, amount] of [['food', food], ['water', water]]) resources.addStore({
    id: resource, resource, amount, capacity: 10000, position: { x: 0, y: 0 }, status: 'operational', reachable: true,
  });
  return { resources, supply: new AdultSupplySystem(resources) };
}
function refill(resources, amount = 1000) {
  for (const resource of ['food', 'water']) resources.depositInStore(resource, { resource, amount });
}

test('adults consume fractions from actual stores; queen and resting workers counted separately', () => {
  const { resources, supply } = fixture(100, 100);
  supply.advance(0.5, { activeWorkers: 2, restingWorkers: 5, queens: 1 });
  close(resources.getStore('food').amount, 96.5);
  close(resources.getStore('water').amount, 96.5);
  assert.equal(supply.snapshot.workFactor, 1);
});

test('sources, unreachable stores and construction material cannot satisfy adult demand', () => {
  const { resources, supply } = fixture();
  resources.addSource({ id: 'pond', resource: 'water', position: { x: 0, y: 0 }, kind: 'unlimited' });
  resources.addStore({ id: 'blocked', resource: 'food', position: { x: 0, y: 0 }, amount: 100, capacity: 100, reachable: false, status: 'operational' });
  supply.advance(3, population);
  close(supply.snapshot.food.shortageDays, 3);
  close(supply.snapshot.water.shortageDays, 3);
  close(supply.snapshot.workFactor, 0.85);
  close(resources.getStore('blocked').amount, 100);
  assert.equal(resources.getStore('food').amount, 0);
});

test('only uncovered time counts; two full warning days then stages, worst resource wins', () => {
  const { supply } = fixture(10, 0);
  supply.advance(2, population);
  close(supply.snapshot.food.shortageDays, 1);
  close(supply.snapshot.water.shortageDays, 2);
  close(supply.snapshot.workFactor, 1);
  supply.advance(0.01, population);
  close(supply.snapshot.workFactor, 0.85);
  close(supply.snapshot.eggFactor, 0.75);
  supply.advance(2, population);
  close(supply.snapshot.workFactor, 0.65);
  close(supply.snapshot.eggFactor, 0);
  assert.equal(supply.snapshot.workerLosses, 0);
});

test('recovery is gradual and independent; a short delivery cannot erase prolonged shortage', () => {
  const { resources, supply } = fixture();
  supply.advance(5, population);
  resources.depositInStore('food', { resource: 'food', amount: 5 });
  supply.advance(0.5, population);
  close(supply.snapshot.food.workFactor, 0.825);
  close(supply.snapshot.water.workFactor, 0.65);
  close(supply.snapshot.workFactor, 0.65);
  supply.advance(0.1, population);
  close(supply.snapshot.food.shortageDays, 5.1);
  close(supply.snapshot.food.workFactor, 0.65);
  refill(resources);
  supply.advance(0.5, population);
  close(supply.snapshot.workFactor, 0.825);
  supply.advance(0.5, population);
  close(supply.snapshot.workFactor, 1);
  close(supply.snapshot.food.shortageDays, 0);
  close(supply.snapshot.water.shortageDays, 0);
});

test('losses start after six complete shortage days: 5 percent once, queen excluded', () => {
  const { supply } = fixture();
  const adults = { activeWorkers: 100, restingWorkers: 0, queens: 1 };
  assert.equal(supply.advance(6, adults).workerLosses, 0);
  assert.equal(supply.advance(1, adults).workerLosses, 4); // 5% of surviving workers; fractional fifth retained
  assert.equal(supply.snapshot.workerLosses, 4);
  const queenOnly = fixture().supply;
  assert.equal(queenOnly.advance(100, { activeWorkers: 0, restingWorkers: 0, queens: 1 }).workerLosses, 0);
});

test('small colony losses accumulate; mortality is independent of update partitioning', () => {
  const big = fixture().supply, frames = fixture().supply;
  const pop = { activeWorkers: 9, restingWorkers: 0, queens: 1 };
  big.advance(6, pop); frames.advance(6, pop);
  assert.equal(big.advance(1, pop).workerLosses, 0);
  let alive = 9;
  for (let index = 0; index < 100; index++) alive -= frames.advance(0.01, { ...pop, activeWorkers: alive }).workerLosses;
  big.advance(4, pop);
  for (let index = 0; index < 400; index++) alive -= frames.advance(0.01, { ...pop, activeWorkers: alive }).workerLosses;
  assert.equal(big.snapshot.workerLosses, frames.snapshot.workerLosses);
  assert.equal(big.snapshot.workerLosses, 2);
});

test('usable stores can jointly supply demand and invalid input cannot mutate stocks', () => {
  const { resources, supply } = fixture(3, 100);
  resources.addStore({ ...resources.getStore('food'), id: 'food2', amount: 20 });
  supply.advance(1, population);
  close(resources.getStore('food').amount + resources.getStore('food2').amount, 13);
  close(supply.snapshot.food.shortageDays, 0);
  const before = resources.listStores();
  assert.throws(() => supply.advance(-1, population));
  assert.throws(() => supply.advance(1, { ...population, activeWorkers: NaN }));
  assert.deepEqual(resources.listStores(), before);
});
