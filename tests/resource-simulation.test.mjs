import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createResourceSimulation } from '../src/game/simulation/resourceSimulation.ts';
import { SIMULATION_CONFIG } from '../src/game/simulation/simulationConfig.ts';

test('simulation reuses existing food source, side-view pond and actual individual chamber geometry', () => {
  const world = createStartingWorld();
  const before = JSON.stringify(world);
  const simulation = createResourceSimulation(world);
  const foodSource = world.resources.find(resource => resource.kind === 'foodSource');
  const pond = world.decorations.find(decoration => decoration.kind === 'pond');
  assert.deepEqual(simulation.resources.getSource(foodSource.id).position, foodSource.position);
  assert.deepEqual(simulation.resources.getSource(pond.id).position, pond.position);
  assert.equal(simulation.resources.getSource(pond.id).kind, 'unlimited');
  assert.equal(world.storageChambers.length, 3);
  const food = world.storageChambers.find(chamber => chamber.resource === 'food');
  const material = world.storageChambers.find(chamber => chamber.resource === 'buildingMaterial');
  assert.equal(food.areaTiles, 54);
  assert.equal(material.areaTiles, 48);
  assert.deepEqual(food.position, world.landmarks.foodStoreCenter);
  assert.deepEqual(material.position, world.landmarks.buildingMaterialStoreCenter);
  assert.equal(simulation.resources.getStore(food.id).capacity, 540);
  assert.equal(simulation.resources.getStore(material.id).capacity, 384);
  assert.deepEqual(simulation.resources.getStoreTotals('water'), { amount: 0, capacity: 540 });
  assert.equal(JSON.stringify(world), before);
});

test('time is integrated once, across recovery/day boundaries and while pausing', () => {
  const simulation = createResourceSimulation(createStartingWorld());
  const id = 'surface-food-source';
  simulation.resources.takeFromSource(id, 200);
  assert.equal(simulation.advance(1500).daysCrossed, 2);
  assert.equal(simulation.resources.getSource(id).amount, 10);
  simulation.clock.setPaused(true);
  simulation.advance(6000);
  assert.equal(simulation.resources.getSource(id).amount, 10);
  assert.equal(simulation.clock.totalGameDays, 2.5);
  simulation.clock.setPaused(false);
  simulation.advance(300);
  assert.equal(simulation.resources.getSource(id).amount, 20);
  assert.throws(() => simulation.advance(NaN), RangeError);
  assert.equal(simulation.clock.totalGameDays, 3);
  assert.equal(simulation.resources.getSource(id).amount, 20);
});

test('new simulations start independently and do not grant demo deliveries or default economic stock', () => {
  const world = createStartingWorld();
  const first = createResourceSimulation(world);
  const second = createResourceSimulation(world);
  first.resources.takeFromSource('surface-food-source', 5);
  first.advance(30);
  assert.equal(second.resources.getSource('surface-food-source').amount, 200);
  assert.equal(second.clock.totalGameDays, 0);
  assert.deepEqual(first.resources.getStoreTotals('food'), { amount: 0, capacity: 540 });
  assert.deepEqual(first.resources.getStoreTotals('buildingMaterial'), { amount: 0, capacity: 384 });
});

test('explicit initial stocks and changed balance values stay within each chamber capacity', () => {
  const world = createStartingWorld();
  const food = world.storageChambers.find(chamber => chamber.resource === 'food');
  const config = structuredClone(SIMULATION_CONFIG);
  config.secondsPerGameDay = 60;
  config.foodSource.regenerationPerDay = 12;
  config.storageCapacityPerTile.food = 2;
  const simulation = createResourceSimulation(world, config, { [food.id]: 100 });
  assert.equal(simulation.resources.getStore(food.id).amount, 100);
  assert.equal(simulation.resources.getStore(food.id).capacity, 108);
  simulation.resources.takeFromSource('surface-food-source', 12);
  simulation.advance(60);
  assert.equal(simulation.clock.totalGameDays, 1);
  assert.equal(simulation.resources.getSource('surface-food-source').amount, 200);
  assert.throws(() => createResourceSimulation(world, config, { [food.id]: 109 }), RangeError);
  assert.throws(() => createResourceSimulation(world, config, { 'missing-chamber': 1 }), /unknown/i);
});
