import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  terrainDefinitions,
  isOpenTile,
  isDiggableTile,
  TILE_SIZE,
  worldMap,
  worldResources,
  worldSize,
} from '../src/game/world/worldMap.ts';
import { diggingGradeAt, startingWorld, surfaceRow } from '../src/game/world/worldGenerator.ts';

test('world cells keep terrain and traversal state as separate data', () => {
  assert.equal(typeof worldMap[0][0], 'object');
  assert.ok('terrain' in worldMap[0][0]);
  assert.ok('state' in worldMap[0][0]);
});

test('starting world keeps the confirmed tile and pixel dimensions', () => {
  assert.equal(worldMap.length, 120);
  assert.equal(worldMap[0].length, 320);
  assert.equal(worldMap.flat().every((cell) => typeof cell === 'object' && 'terrain' in cell && 'state' in cell), true);
  assert.deepEqual(worldSize, { width: 7680, height: 2880 });
});

test('all start-nest landmarks and world cells stay within the configured bounds', () => {
  const { columns, rows } = startingWorld.dimensions;
  assert.equal(startingWorld.tiles.length, rows);
  assert.ok(startingWorld.tiles.every((row) => row.length === columns));
  const { broodChamberCenters, ...mainLandmarks } = startingWorld.landmarks;
  const landmarks = [...Object.values(mainLandmarks), ...Object.values(broodChamberCenters)];
  for (const point of landmarks) {
    assert.ok(point.x >= 0 && point.x < worldSize.width, `landmark x=${point.x} is in bounds`);
    assert.ok(point.y >= 0 && point.y < worldSize.height, `landmark y=${point.y} is in bounds`);
  }
});

test('resources are stored separately from terrain and tile state', () => {
  assert.equal(worldResources.length, 1);
  assert.equal(worldResources[0].kind, 'foodSource');
  assert.equal(worldMap.flat().some((cell) => 'resource' in cell), false);
});

test('five soil layers are placed by depth without changing existing test grades', () => {
  const column = 0;
  const surface = surfaceRow(column);
  const bands = [
    [10, 'topsoil', 0],
    [30, 'compactEarth', 1],
    [60, 'clay', 2],
    [80, 'stoneLayer', 3],
    [100, 'deepRock', 3],
  ];
  for (const [depth, terrain, grade] of bands) {
    assert.ok(terrainDefinitions[terrain]);
    assert.equal(worldMap[surface + depth][column].terrain, terrain);
    assert.equal(diggingGradeAt(column, surface + depth), grade);
  }
});

test('start nest contains all seven named chambers in one connected open area', () => {
  const { landmarks } = startingWorld;
  assert.ok(landmarks.queenChamberCenter);
  assert.ok(landmarks.broodChamberCenters);
  const chambers = [
    landmarks.queenChamberCenter,
    landmarks.foodStoreCenter,
    landmarks.buildingMaterialStoreCenter,
    ...Object.values(landmarks.broodChamberCenters),
  ];
  assert.equal(chambers.length, 7);

  const toCell = ({ x, y }) => ({ column: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) });
  const start = toCell(landmarks.queenChamberCenter);
  const key = ({ column, row }) => `${column},${row}`;
  const visited = new Set([key(start)]);
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const { column, row } = queue[index];
    for (const next of [
      { column: column - 1, row },
      { column: column + 1, row },
      { column, row: row - 1 },
      { column, row: row + 1 },
    ]) {
      if (worldMap[next.row]?.[next.column]?.state !== 'open' || visited.has(key(next))) continue;
      visited.add(key(next));
      queue.push(next);
    }
  }
  for (const chamber of chambers) assert.ok(visited.has(key(toCell(chamber))));
});

test('starting underground stays mostly solid instead of becoming a cave network', () => {
  const openCount = worldMap.flat().filter((cell) => cell.state === 'open').length;
  assert.ok(openCount < 500);
  assert.ok(worldMap.flat().filter((cell) => cell.state === 'unknown').length > 30_000);
});

test('rubble is a closed tile for pathfinding until it becomes open', () => {
  assert.equal(isOpenTile({ terrain: 'soil', state: 'rubble' }), false);
  assert.equal(isOpenTile({ terrain: 'soil', state: 'open' }), true);
});

test('only closed diggable tiles remain valid targets', () => {
  assert.equal(typeof isDiggableTile, 'function');
  assert.equal(isDiggableTile({ terrain: 'stone', state: 'open' }), false);
  assert.equal(isDiggableTile({ terrain: 'stone', state: 'discovered' }), true);
  assert.equal(isDiggableTile({ terrain: 'soil', state: 'unknown' }), true);
  assert.equal(isDiggableTile({ terrain: 'stone', state: 'rubble' }), false);
});
