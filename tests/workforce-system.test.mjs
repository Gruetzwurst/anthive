import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WorkforceSystem, SPECIALIZATIONS } from '../src/game/simulation/workforceSystem.ts';

function fixture() {
  const workforce = new WorkforceSystem();
  for (let i = 0; i < 7; i++) workforce.addWorker(`collector-${i}`, 'gathering');
  for (let i = 0; i < 2; i++) workforce.addWorker(`builder-${i}`, 'building');
  return workforce;
}

test('four permanent specializations stay distinct from explicit work assignments', () => {
  const workforce = fixture();
  assert.deepEqual(SPECIALIZATIONS, ['gathering', 'building', 'care', 'combat']);
  workforce.moveWorkers('gathering', 'gathering', 'building', 2);
  const builders = workforce.getWorkers().filter(worker => worker.assignment === 'building');
  assert.equal(builders.length, 4);
  assert.equal(builders.filter(worker => worker.specialization === 'gathering').length, 2);
  assert.equal(workforce.getWorkers().filter(worker => worker.specialization === 'gathering').length, 7);
  assert.equal(workforce.efficiency('collector-0', 'building'), 0.5);
  assert.equal(workforce.efficiency('collector-0', 'gathering'), 1);
  workforce.moveWorkers('gathering', 'building', 'rest', 1);
  assert.equal(workforce.getWorker('collector-0').specialization, 'gathering');
  assert.equal(workforce.getWorker('collector-0').assignment, 'rest');
});

test('group edits validate the entire request before moving any worker', () => {
  const workforce = fixture(), before = workforce.getWorkers();
  for (const count of [-1, 0.5, NaN, Infinity, 8]) assert.throws(() => workforce.moveWorkers('gathering', 'gathering', 'building', count));
  assert.throws(() => workforce.moveWorkers('queen', 'gathering', 'building', 1));
  assert.throws(() => workforce.moveWorkers('gathering', 'unknown', 'building', 1));
  assert.throws(() => workforce.moveWorkers('gathering', 'gathering', 'unknown', 1));
  assert.deepEqual(workforce.getWorkers(), before);
  workforce.moveWorkers('gathering', 'gathering', 'gathering', 3);
  assert.deepEqual(workforce.getWorkers(), before);
});

test('assignment remains until explicit change; snapshot edits cannot change identity or specialization', () => {
  const workforce = fixture();
  workforce.moveWorkers('building', 'building', 'care', 1);
  const copy = workforce.getWorker('builder-0');
  copy.specialization = 'care'; copy.assignment = 'combat';
  assert.equal(workforce.getWorker('builder-0').specialization, 'building');
  assert.equal(workforce.getWorker('builder-0').assignment, 'care');
  assert.equal(workforce.getWorkers().length, 9);
  assert.throws(() => workforce.addWorker('builder-0', 'combat'));
  assert.throws(() => workforce.addWorker('queen', 'queen'));
  workforce.removeWorker('builder-0');
  assert.equal(workforce.getWorkers().length, 8);
  assert.throws(() => workforce.getWorker('builder-0'));
});
