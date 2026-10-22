import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createColonySimulation } from '../src/game/simulation/colonySimulation.ts';
import { SIMULATION_CONFIG } from '../src/game/simulation/simulationConfig.ts';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≈ ${b}`);

test('live colony uses one clock, actual collectors and external resting builders, with pause', () => {
  let worked = 0;
  const simulation = createColonySimulation(createStartingWorld(), {
    otherWorkers: () => [{ id: 'builder-0', resting: true }, { id: 'builder-1', resting: false }],
    retireOtherWorker: () => {},
    advanceOtherWorkers: seconds => { worked += seconds; },
  });
  for (const resource of ['food', 'water']) simulation.resources.depositInStore(`${resource}-store`, { resource, amount: 100 });
  simulation.advance(1);
  close(simulation.resources.getStore('food-store').amount, 100 - 9.8 / 600);
  close(worked, 1);
  const before = simulation.supply.snapshot;
  const stores = simulation.resources.listStores();
  simulation.clock.setPaused(true);
  simulation.advance(600);
  assert.deepEqual(simulation.supply.snapshot, before);
  assert.deepEqual(simulation.resources.listStores(), stores);
  close(worked, 1);
});

test('integrated starvation removes real workers, preserves cargo on ground, never credits stores', () => {
  const simulation = createColonySimulation(createStartingWorld());
  for (let i = 0; i < 1200 && !simulation.gathering.getCollectors().some(worker => worker.load); i++) simulation.advance(0.1);
  assert.ok(simulation.gathering.getCollectors().some(worker => worker.load));
  const carriers = simulation.gathering.getCollectors().filter(worker => worker.load);
  // End transport to prevent fresh deliveries, retaining an actual carrier.
  const carrier = carriers[0];
  for (const worker of simulation.gathering.getCollectors()) if (worker.id !== carrier.id) simulation.gathering.retireCollector(worker.id);
  simulation.gathering.advance = () => {};
  for (const store of simulation.resources.listStores()) simulation.resources.takeFromStore(store.id, store.amount);
  simulation.supply.advance(6, { activeWorkers: 1, restingWorkers: 0, queens: 1 });
  simulation.advance(20 * 600 + 1); // fractional 5%/day eventually removes one worker
  assert.equal(simulation.gathering.getCollectors().length, 0);
  const dropped = simulation.getDroppedLoads();
  assert.equal(dropped.length, 1);
  assert.deepEqual(dropped[0].load, carrier.load);
  assert.deepEqual(dropped[0].position, carrier.position);
  assert.equal(simulation.resources.getStoreTotals('food').amount, 0);
  assert.equal(simulation.resources.getStoreTotals('water').amount, 0);
  assert.equal(simulation.supply.snapshot.workerLosses, 1);
});

test('long and framed colony updates agree on transport, consumption and shortage', () => {
  const big = createColonySimulation(createStartingWorld());
  const frames = createColonySimulation(createStartingWorld());
  big.advance(120);
  for (let i = 0; i < 1200; i++) frames.advance(0.1);
  for (const resource of ['food', 'water']) {
    close(big.resources.getStoreTotals(resource).amount, frames.resources.getStoreTotals(resource).amount);
    assert.ok(big.resources.getStoreTotals(resource).amount > 0);
    close(big.supply.snapshot[resource].shortageDays, frames.supply.snapshot[resource].shortageDays);
  }
  close(big.clock.totalGameDays, 0.2);
});

test('external builders are removed by callback and the slowdown reaches their work', () => {
  const workers = [{ id: 'builder', resting: false }];
  const factors = [];
  const simulation = createColonySimulation(createStartingWorld(), {
    otherWorkers: () => workers,
    retireOtherWorker: id => workers.splice(workers.findIndex(worker => worker.id === id), 1),
    advanceOtherWorkers: (_seconds, factor) => factors.push(factor),
  }, { ...SIMULATION_CONFIG, secondsPerGameDay: 1 });
  for (const worker of simulation.gathering.getCollectors()) simulation.gathering.retireCollector(worker.id);
  simulation.advance(27);
  assert.ok(factors.includes(0.65));
  assert.equal(workers.length, 0);
  assert.equal(simulation.supply.snapshot.workerLosses, 1);
});
