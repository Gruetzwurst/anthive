import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createGatheringSimulation } from '../src/game/simulation/gatheringSimulation.ts';

test('real starting-world collectors deliver food and pond water into separate chambers', () => {
  const simulation = createGatheringSimulation(createStartingWorld());
  assert.equal(simulation.gathering.getCollectors().length, 7);
  assert.equal(simulation.resources.getStoreTotals('food').amount, 0);
  assert.equal(simulation.resources.getStoreTotals('water').amount, 0);
  simulation.advance(120);
  assert.ok(simulation.resources.getStoreTotals('food').amount > 0);
  assert.ok(simulation.resources.getStoreTotals('water').amount > 0);
  assert.equal(simulation.resources.getSource('pond').kind, 'unlimited');
  assert.equal(simulation.clock.totalGameDays, 0.2);
  for (const collector of simulation.gathering.getCollectors()) {
    assert.ok(simulation.navigation.isWalkable(collector.position));
    assert.ok(!collector.load || collector.load.amount <= 5);
  }
});

test('a paused shared clock also stops movement, extraction and delivery without catch-up', () => {
  const simulation = createGatheringSimulation(createStartingWorld());
  simulation.advance(3);
  const before = simulation.gathering.getCollectors();
  const sources = simulation.resources.listSources();
  const stores = simulation.resources.listStores();
  simulation.clock.setPaused(true);
  simulation.advance(600);
  assert.deepEqual(simulation.gathering.getCollectors(), before);
  assert.deepEqual(simulation.resources.listSources(), sources);
  assert.deepEqual(simulation.resources.listStores(), stores);
  assert.equal(simulation.clock.totalGameDays, 3 / 600);
});

test('substepped large intervals match frame updates and do not overfill storage', () => {
  const world = createStartingWorld();
  const big = createGatheringSimulation(world);
  const frames = createGatheringSimulation(world);
  big.advance(120);
  for (let index = 0; index < 1200; index++) frames.advance(0.1);
  for (const resource of ['food', 'water']) {
    const a = big.resources.getStoreTotals(resource), b = frames.resources.getStoreTotals(resource);
    assert.ok(a.amount > 0, `${resource} must actually have been delivered`);
    assert.ok(Math.abs(a.amount - b.amount) < 1e-8);
    assert.ok(a.amount <= a.capacity);
  }
  assert.throws(() => big.advance(-1), RangeError);
});
