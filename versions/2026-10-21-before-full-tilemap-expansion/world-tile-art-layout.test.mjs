import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTileArtInstruction, WORLD_TILE_ART_AREA } from '../src/game/world/worldTileArtLayout.ts';
import { worldMap } from '../src/game/world/worldMap.ts';

const solid = (terrain) => ({ terrain, state: 'unknown' });
const open = { terrain: 'topsoil', state: 'open' };

test('terrain art maps the five generated soil layers to the existing atlas frames', () => {
  const terrainKinds = ['topsoil', 'compactEarth', 'clay', 'stoneLayer', 'deepRock'];
  terrainKinds.forEach((terrain, index) => {
    const instruction = getTileArtInstruction([[solid(terrain)]], 0, 0);
    assert.equal(instruction.materialIndex, index);
    assert.ok(instruction.groundFrame >= 0 && instruction.groundFrame < 15);
  });
});

test('layer transition instructions appear at each existing generated boundary', () => {
  const upperLayers = ['topsoil', 'compactEarth', 'clay', 'stoneLayer'];
  const lowerLayers = ['compactEarth', 'clay', 'stoneLayer', 'deepRock'];
  const expectedFrames = [0, 1, 2, 3];
  lowerLayers.forEach((terrain, index) => {
    const instruction = getTileArtInstruction(
      [[solid(upperLayers[index])], [solid(terrain)]],
      0,
      1,
    );
    assert.equal(instruction.transitionFrame, expectedFrames[index]);
    assert.notEqual(instruction.groundFrame, null);
  });
});

test('tunnel edge instructions orient an existing wall edge toward a real open cell', () => {
  const map = [
    [solid('topsoil'), solid('topsoil'), solid('topsoil')],
    [solid('topsoil'), solid('compactEarth'), open],
    [solid('topsoil'), solid('topsoil'), solid('topsoil')],
  ];
  const instruction = getTileArtInstruction(map, 1, 1);
  assert.equal(instruction.wall?.openSide, 'right');
  assert.equal(instruction.wall?.materialIndex, 1);
  assert.equal(instruction.groundFrame, null);
});

test('tunnel corner instructions distinguish an inner bend from an outer corner', () => {
  const inner = [
    [open, open, solid('clay')],
    [open, solid('clay'), solid('clay')],
    [solid('clay'), solid('clay'), solid('clay')],
  ];
  const outer = [
    [solid('clay'), solid('clay'), solid('clay')],
    [solid('clay'), solid('clay'), open],
    [solid('clay'), open, solid('clay')],
  ];
  assert.equal(getTileArtInstruction(inner, 1, 1).corner?.kind, 'inner');
  assert.equal(getTileArtInstruction(outer, 1, 1).corner?.kind, 'outer');
});

test('a three-way tunnel junction still receives a corner tile', () => {
  const map = [
    [solid('clay'), open, solid('clay')],
    [open, solid('clay'), open],
    [solid('clay'), solid('clay'), solid('clay')],
  ];
  assert.notEqual(getTileArtInstruction(map, 1, 1).corner, null);
});

test('the in-game art region uses existing cells for all layers and the start-nest branches', () => {
  const columns = worldMap[0].map((_, column) => column)
    .filter((column) => column >= WORLD_TILE_ART_AREA.firstColumn && column < WORLD_TILE_ART_AREA.endColumn);
  const terrainKinds = new Set(
    worldMap.flatMap((row) => columns.map((column) => row[column].terrain))
      .filter((terrain) => ['topsoil', 'compactEarth', 'clay', 'stoneLayer', 'deepRock'].includes(terrain)),
  );
  const openBranches = worldMap.flatMap((row, rowIndex) =>
    columns.map((column) => ({ column, row: rowIndex }))
      .filter(({ column, row: rowIndex }) => worldMap[rowIndex][column].state === 'open')
      .filter(({ column, row: rowIndex }) => [
        worldMap[rowIndex]?.[column - 1],
        worldMap[rowIndex]?.[column + 1],
        worldMap[rowIndex - 1]?.[column],
        worldMap[rowIndex + 1]?.[column],
      ].filter((tile) => tile?.state === 'open').length >= 3),
  );

  assert.equal(terrainKinds.size, 5);
  assert.ok(openBranches.length > 0);
});
