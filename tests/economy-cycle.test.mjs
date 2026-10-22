import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';
import { createColonySimulation } from '../src/game/simulation/colonySimulation.ts';
import { SIMULATION_CONFIG } from '../src/game/simulation/simulationConfig.ts';

for (const priority of ['balanced', 'food', 'water']) test(`eight actual-length game days remain playable with ${priority} priority`, () => {
  const workers = [{ id: 'builder-0', resting: true }, { id: 'builder-1', resting: true }];
  const simulation = createColonySimulation(createStartingWorld(), {
    otherWorkers: () => workers,
    retireOtherWorker: id => workers.splice(workers.findIndex(worker => worker.id === id), 1),
    advanceOtherWorkers: () => {},
  });
  simulation.gathering.setPriority(priority);
  for (let day = 1; day <= 8; day++) {
    simulation.advance(SIMULATION_CONFIG.secondsPerGameDay);
    for (const resource of ['food', 'water']) {
      const stock = simulation.resources.getStoreTotals(resource);
      assert.ok(stock.amount >= 0);
      if (day === 1 || day === 8) assert.ok(stock.amount > 0, `${resource} delivered/replenished on day ${day}`);
      assert.ok(stock.amount <= stock.capacity);
    }
    assert.equal(simulation.gathering.priority, priority);
    assert.equal(simulation.supply.snapshot.workerLosses, 0);
    if (day >= 2) assert.equal(simulation.supply.snapshot.workFactor, 1);
  }
  assert.equal(simulation.clock.totalGameDays, 8);
  assert.equal(simulation.gathering.getCollectors().length, 7);
});


test('actual source depletion pauses food pickup, then regeneration and collection resume', () => {
  const simulation = createColonySimulation(createStartingWorld());
  // Explicit test setup exhausts the source; no new production start stocks.
  simulation.resources.takeFromSource('surface-food-source', 200);
  simulation.advance(600);
  assert.ok(Math.abs(simulation.resources.getSource('surface-food-source').recoveryDaysLeft - 1) < 1e-8);
  assert.equal(simulation.resources.getStoreTotals('food').amount, 0);
  simulation.advance(2.5 * 600);
  assert.equal(simulation.resources.getSource('surface-food-source').recoveryDaysLeft, 0);
  assert.ok(simulation.resources.getStoreTotals('food').amount > 0);
  assert.equal(simulation.supply.snapshot.workerLosses, 0);
});
