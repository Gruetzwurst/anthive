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
  nestChamberCenter,
  foodStoreCenter,
  buildingMaterialStoreCenter,
  stoneOutcropCenter,
} from '../src/game/world/worldMap.ts';

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

test('starting rooms remain open and the underground remains mostly closed', () => {
  const stateAt = (point) => worldMap[Math.floor(point.y / TILE_SIZE)][Math.floor(point.x / TILE_SIZE)].state;
  assert.equal(stateAt(nestChamberCenter), 'open');
  assert.equal(stateAt(foodStoreCenter), 'open');
  assert.equal(stateAt(buildingMaterialStoreCenter), 'open');
  assert.equal(worldMap[Math.floor(stoneOutcropCenter.y / TILE_SIZE)][Math.floor(stoneOutcropCenter.x / TILE_SIZE)].terrain, 'stone');
  assert.ok(worldMap.flat().filter((cell) => cell.state === 'unknown').length > 30_000);
});

test('resources are stored separately from terrain and tile state', () => {
  assert.equal(worldResources.length, 1);
  assert.equal(worldResources[0].kind, 'foodSource');
  assert.equal(worldMap.flat().some((cell) => 'resource' in cell), false);
});

test('future soil layers are defined without appearing in the starting world', () => {
  for (const layer of ['topsoil', 'compactEarth', 'clay', 'stoneLayer', 'deepRock']) {
    assert.ok(terrainDefinitions[layer]);
  }
  assert.equal(worldMap.flat().some((cell) => ['topsoil', 'compactEarth', 'clay', 'stoneLayer', 'deepRock'].includes(cell.terrain)), false);
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
