import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createColonySimulation } from '../src/game/simulation/colonySimulation.ts';
import { buildEconomyOverview, describeSupply, describeSources } from '../src/game/ui/economyOverview.ts';

function fixture() {
  const simulation = createColonySimulation(createStartingWorld());
  simulation.resources.depositInStore('building-material-store', {resource:'buildingMaterial',amount:3});
  const options = { otherWorkerCount: 2,
    sourceReachability: new Map([['surface-food-source', true], ['pond', true]]) };
  return { simulation, options, read: () => buildEconomyOverview(simulation, options) };
}

test('HUD reads delivered usable stocks separately from sources, in-flight cargo and builder material', () => {
  const { simulation, read } = fixture();
  simulation.resources.depositInStore('food-store', { resource: 'food', amount: 12.5 });
  simulation.resources.depositInStore('water-store', { resource: 'water', amount: 7 });
  simulation.resources.addStore({ ...simulation.resources.getStore('food-store'), id: 'blocked', amount: 100, reachable: false });
  const before = simulation.resources.listStores();
  const overview = read();
  assert.deepEqual(overview.stocks.food, { amount: 12.5, capacity: 540 });
  assert.deepEqual(overview.stocks.water, { amount: 7, capacity: 540 });
  assert.equal(overview.stocks.buildingMaterial.amount, 3);
  assert.equal(overview.workerCount, 9);
  assert.equal(overview.collectorCount, 7);
  assert.deepEqual(simulation.resources.listStores(), before);
  overview.stocks.food.amount = 999;
  assert.equal(read().stocks.food.amount, 12.5);
});

test('HUD source status distinguishes real stock, recovery, unlimited water and blocked paths', () => {
  const { simulation, options, read } = fixture();
  let source = read().sources.food[0];
  assert.equal(source.amount, 200);
  assert.equal(source.regenerationPerDay, 20);
  assert.equal(source.reachable, true);
  simulation.resources.takeFromSource('surface-food-source', 200);
  source = read().sources.food[0];
  assert.equal(source.recoveryDaysLeft, 2);
  assert.match(describeSources(read().sources.food), /Erholung/);
  assert.equal(read().sources.water[0].amount, null);
  assert.match(describeSources(read().sources.water), /unbegrenzt/);
  options.sourceReachability.set('pond', false);
  assert.match(describeSources(read().sources.water), /kein Weg/);
  assert.match(describeSources([]), /keine Quelle/);
});

test('HUD reflects the real group priority, shared day and losses without granting stock', () => {
  const { simulation, read } = fixture();
  simulation.gathering.setPriority('water');
  simulation.clock.advance(900);
  const overview = read();
  assert.equal(overview.priority, 'water');
  assert.equal(overview.day, 2);
  assert.equal(overview.dayProgress, 0.5);
  assert.equal(overview.workerLosses, 0);
  assert.equal(overview.stocks.water.amount, 0);
});

test('supply labels follow independent warning, reduced, severe, risk and recovery states', () => {
  const { simulation, read } = fixture();
  assert.match(describeSupply(read().supply.food), /gut/);
  const population = { activeWorkers: 9, restingWorkers: 0, queens: 1 };
  simulation.supply.advance(1, population);
  assert.equal(read().supply.food.level, 'warning');
  simulation.supply.advance(2, population);
  assert.equal(read().supply.food.level, 'reduced');
  simulation.supply.advance(2, population);
  assert.equal(read().supply.food.level, 'severe');
  simulation.supply.advance(1.1, population);
  assert.equal(read().supply.water.level, 'risk');
  assert.match(describeSupply(read().supply.water), /Verlustrisiko/);
  simulation.resources.depositInStore('food-store', { resource: 'food', amount: 20 });
  simulation.supply.advance(0.5, population);
  assert.equal(read().supply.food.level, 'recovering');
  assert.equal(read().supply.water.level, 'risk');
  assert.match(describeSupply(read().supply.food), /Erholung 50/);
  assert.equal(read().workFactor, 0.65);
});
