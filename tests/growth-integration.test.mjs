import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';

const DAY = 600;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≈ ${expected}`);

function fixture() {
  const world = createStartingWorld();
  const s = createWorkforceSimulation(world, (resources, traffic) => {
    const builders = new ExcavationSystem(world, resources);
    builders.setTraffic(traffic);
    for (let i = 0; i < 2; i++) builders.addBuilder(`builder-${i}`, world.landmarks.nestChamberCenter);
    return {
      workers: () => builders.getBuilders(),
      addWorker: (id, position) => builders.addBuilder(id, position),
      removeWorker: id => builders.removeBuilder(id),
      retireWorker: id => builders.removeBuilder(id),
      advanceWorkers: (seconds, factor) => builders.advance(seconds, factor),
    };
  });
  // Explicit finite test reserves in the actual furnished starting stores.
  for (const resource of ['food', 'water']) s.resources.depositInStore(`${resource}-store`, {resource, amount: 540});
  // Observe the real adult-supply call; verify its actual withdrawals against
  // the population passed by the integrated workforce, including newborns.
  s.observedBornConsumption = false;
  const advanceSupply = s.supply.advance.bind(s.supply);
  s.supply.advance = (days, population) => {
    assert.equal(population.activeWorkers + population.restingWorkers, s.getWorkers().length);
    assert.equal(population.queens, 1);
    if (s.getWorkers().some(worker => worker.id.startsWith('born-'))) s.observedBornConsumption = true;
    const before = Object.fromEntries(['food', 'water'].map(kind => [kind, s.resources.getStoreTotals(kind).amount]));
    const result = advanceSupply(days, population);
    if (!result.workerLosses) for (const kind of ['food', 'water']) {
      const demand = (population.activeWorkers + .8 * population.restingWorkers + population.queens) * days;
      close(before[kind] - s.resources.getStoreTotals(kind).amount, Math.min(before[kind], demand));
    }
    return result;
  };
  return s;
}

function invariants(s) {
  const q = s.queen.snapshot;
  assert.equal(q.laidEggs, q.bufferCount + q.assignedCount + q.bornCount + q.lostCount);
  assert.equal(new Set(q.eggs.map(egg => egg.id)).size, q.laidEggs);
  const workers = s.getWorkers();
  assert.equal(new Set(workers.map(worker => worker.id)).size, workers.length);
  assert.equal(workers.length, 9 + q.bornCount - s.supply.snapshot.workerLosses);
  const bornAlive = workers.filter(worker => worker.id.startsWith('born-')).length;
  assert.ok(bornAlive <= q.bornCount);
  assert.ok(q.bornCount - bornAlive <= s.supply.snapshot.workerLosses);
  for (const room of q.chambers) assert.ok(room.occupied >= 0 && room.occupied <= room.capacity);
  for (const egg of q.eggs.filter(egg => !egg.arrived)) assert.equal(egg.stageProgressDays, 0);
  for (const resource of ['food', 'water']) {
    const b = s.broodSupply.balance[resource];
    close(b.withdrawn, b.atChambers + b.carried + b.consumed + b.dropped + b.returned);
  }
  for (const store of s.resources.listStores()) assert.ok(store.amount >= 0 && store.amount <= store.capacity);
  const nurses = s.broodSupply.getNurses().filter(nurse => nurse.eggId);
  assert.equal(new Set(nurses.map(nurse => nurse.eggId)).size, nurses.length);
}

function runDays(s, days, step = DAY) {
  for (let day = 0; day < days; day++) {
    for (let elapsed = 0; elapsed < DAY; elapsed += step) s.advance(Math.min(step, DAY - elapsed));
    invariants(s);
  }
}

test('C5: twelve days of natural laying, physical nursing and births preserve population and cargo', () => {
  const s = fixture();
  s.moveWorkers('gathering', 'gathering', 'care', 3);
  runDays(s, 12);
  close(s.clock.totalGameDays, 12);
  const q = s.queen.snapshot;
  assert.equal(s.observedBornConsumption, true);
  assert.ok(q.bornCount >= 4, 'natural eggs must actually become workers');
  assert.ok(q.laidEggs <= 60, 'five natural eggs per day bounds growth');
  assert.equal(q.lostCount, 0);
  assert.equal(s.supply.snapshot.workerLosses, 0);
  assert.deepEqual(new Set(s.getWorkers().filter(w => w.id.startsWith('born-')).map(w => w.specialization)),
    new Set(['gathering', 'building', 'care', 'combat']));
  for (const resource of ['food', 'water']) assert.ok(s.broodSupply.balance[resource].consumed > 0);
  assert.ok(s.getWorkers().some(w => w.specialization === 'care' && w.actualWork === 'care'));
});

test('C5: twenty-five days without nurses fill the finite buffer; real care resumes transport with a measurable care bottleneck', () => {
  const s = fixture();
  runDays(s, 25);
  const q = s.queen.snapshot;
  assert.equal(q.bufferCount, 50);
  assert.equal(q.bornCount, 0);
  assert.equal(q.effectiveEggsPerDay, 0);
  assert.ok(q.eggs.every(egg => !egg.arrived && egg.stageProgressDays === 0));
  s.moveWorkers('gathering', 'gathering', 'care', 3);
  runDays(s, 8);
  assert.equal(s.queen.snapshot.bornCount, 0);
  assert.equal(s.queen.snapshot.careCapacity, 15);
  assert.equal(s.queen.snapshot.careFactor, .25);
  assert.ok(s.queen.snapshot.stageCounts.larva > 0);
  assert.ok(s.queen.snapshot.eggs.some(egg => egg.arrived));
});

test('C5: pause freezes the integrated colony and framed updates agree with daily advances', () => {
  const daily = fixture(), framed = fixture();
  for (const s of [daily, framed]) s.moveWorkers('gathering', 'gathering', 'care', 3);
  runDays(daily, 8);
  runDays(framed, 8, 10);
  assert.deepEqual(daily.queen.snapshot, framed.queen.snapshot);
  assert.deepEqual(daily.getWorkers(), framed.getWorkers());
  assert.deepEqual(daily.broodSupply.balance, framed.broodSupply.balance);
  assert.deepEqual(daily.resources.listStores(), framed.resources.listStores());
  const snapshot = () => ({queen: daily.queen.snapshot, workers: daily.getWorkers(),
    stores: daily.resources.listStores(), supply: daily.supply.snapshot,
    brood: daily.broodSupply.getRooms(), balance: daily.broodSupply.balance, days: daily.clock.totalGameDays});
  const before = structuredClone(snapshot());
  daily.clock.setPaused(true);
  daily.advance(20 * DAY);
  assert.deepEqual(snapshot(), before);
  daily.clock.setPaused(false);
  daily.advance(1);
  close(daily.clock.totalGameDays, 8 + 1 / DAY);
});


test('C5: a live colony survives a supply interruption, slows laying, and recovers without resetting brood', () => {
  const s = fixture();
  s.moveWorkers('gathering', 'gathering', 'care', 3);
  runDays(s, 3);
  const laidBefore = s.queen.snapshot.laidEggs;
  const idsBefore = s.queen.snapshot.eggs.map(egg => egg.id);
  // Preserve stock physically while making both stores unusable for eight days.
  for (const resource of ['food', 'water']) s.resources.setStoreReachable(`${resource}-store`, false);
  runDays(s, 8);
  assert.ok(s.supply.snapshot.workFactor < 1);
  assert.equal(s.supply.snapshot.eggFactor, 0);
  assert.ok(s.supply.snapshot.workerLosses > 0);
  assert.ok(s.queen.snapshot.laidEggs - laidBefore < 8 * 5);
  assert.deepEqual(s.queen.snapshot.eggs.slice(0, idsBefore.length).map(egg => egg.id), idsBefore);
  assert.ok(s.broodSupply.getRooms().some(room => room.shortage.warnings > 0));
  const losses = s.supply.snapshot.workerLosses;
  const laidAtRestore = s.queen.snapshot.laidEggs;
  for (const resource of ['food', 'water']) s.resources.setStoreReachable(`${resource}-store`, true);
  runDays(s, 3);
  assert.equal(s.supply.snapshot.workFactor, 1);
  assert.equal(s.supply.snapshot.eggFactor, 1);
  assert.equal(s.supply.snapshot.workerLosses, losses);
  assert.ok(s.queen.snapshot.laidEggs > laidAtRestore);
});
