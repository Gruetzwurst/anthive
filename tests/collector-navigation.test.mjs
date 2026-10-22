import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findGridPath } from '../src/game/world/gridPathfinding.ts';
import { CollectorNavigation } from '../src/game/world/collectorNavigation.ts';
import { createStartingWorld } from '../src/game/world/worldGenerator.ts';

test('shared grid search preserves cardinal tunnel paths and rejects diagonal-only access', () => {
  const open = new Set(['0,0', '1,0', '1,1']);
  const allowed = ({ column, row }) => open.has(`${column},${row}`);
  assert.deepEqual(findGridPath({ column: 0, row: 0 }, { column: 1, row: 1 }, allowed), [
    { column: 0, row: 0 }, { column: 1, row: 0 }, { column: 1, row: 1 },
  ]);
  open.delete('1,0');
  assert.equal(findGridPath({ column: 0, row: 0 }, { column: 1, row: 1 }, allowed), null);
});

test('collectors follow connected surface contours and tunnels, never solid earth', () => {
  const world = createStartingWorld();
  const nav = new CollectorNavigation(world);
  const path = nav.findPath(world.landmarks.nestChamberCenter, world.landmarks.surfaceFoodSource);
  assert.ok(path?.length > 2);
  for (const point of path) assert.equal(nav.isWalkable(point), true);
  for (let index = 1; index < path.length; index++) assert.ok(nav.canMove(path[index - 1], path[index]));
  assert.equal(nav.findPath(world.landmarks.nestChamberCenter, { x: 5 * 24, y: 60 * 24 }), null);
});

test('pond access is on reachable dry banks, not a path through the painted water', () => {
  const world = createStartingWorld();
  const nav = new CollectorNavigation(world);
  const pond = world.decorations.find(item => item.kind === 'pond');
  const accesses = nav.sourceAccessPoints({ ...pond, resource: 'water' });
  assert.equal(accesses.length, 2);
  assert.ok(accesses.some(point => nav.findPath(world.landmarks.nestChamberCenter, point)));
  assert.equal(nav.findPath(accesses[0], accesses[1]), null);
  assert.ok(accesses.every(point => point.x !== pond.position.x));
});

test('new water chamber is connected and preserves all pre-existing chamber positions', () => {
  const world = createStartingWorld();
  const nav = new CollectorNavigation(world);
  const water = world.storageChambers.find(chamber => chamber.resource === 'water');
  assert.ok(water);
  assert.equal(water.areaTiles, 54);
  assert.deepEqual(water.position, world.landmarks.waterStoreCenter);
  for (const chamber of world.storageChambers) {
    assert.ok(nav.findPath(world.landmarks.nestChamberCenter, chamber.position));
  }
  assert.equal(world.landmarks.foodStoreCenter.x, 176.5 * 24);
  assert.equal(world.landmarks.buildingMaterialStoreCenter.x, 150 * 24);
});
