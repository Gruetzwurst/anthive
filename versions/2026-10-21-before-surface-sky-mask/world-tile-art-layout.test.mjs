import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getTileArtInstruction,
  getTilemapAtlasFrame,
  TILEMAP_ART_ATLAS_FRAME_COUNT,
  WORLD_TILE_ART_AREA,
} from '../src/game/world/worldTileArtLayout.ts';
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

test('surface terrain alternates the approved grass and irregular-edge tiles', () => {
  const surfaceMap = [[
    { terrain: 'surface', state: 'discovered' },
    { terrain: 'surface', state: 'discovered' },
    { terrain: 'surface', state: 'discovered' },
  ]];
  const frames = surfaceMap[0].map((_, column) =>
    getTilemapAtlasFrame(getTileArtInstruction(surfaceMap, column, 0)),
  );

  assert.deepEqual(frames, [135, 136, 135]);
  assert.equal(TILEMAP_ART_ATLAS_FRAME_COUNT, 137);
  assert.equal(getTilemapAtlasFrame(getTileArtInstruction([[{ terrain: 'surface', state: 'open' }]], 0, 0)), -1);
});

test('tilemap frame IDs select ground, transitions, edges, corners, and empty cells', () => {
  const groundFrame = getTileArtInstruction([[solid('topsoil')]], 0, 0);
  const transitionFrame = getTileArtInstruction([[solid('topsoil')], [solid('compactEarth')]], 0, 1);
  const wallMap = [[solid('topsoil'), open]];
  const wallFrame = getTileArtInstruction(wallMap, 0, 0);
  const openFrame = getTileArtInstruction([[open]], 0, 0);

  assert.equal(getTilemapAtlasFrame(groundFrame), groundFrame.groundFrame);
  assert.equal(getTilemapAtlasFrame(transitionFrame), 15);
  assert.ok(getTilemapAtlasFrame(wallFrame) >= 19 && getTilemapAtlasFrame(wallFrame) < 79);
  assert.equal(getTilemapAtlasFrame(wallFrame), 21);
  assert.equal(getTilemapAtlasFrame(openFrame), -1);
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

test('the full in-game art map covers all existing layers and start-nest branches', () => {
  const columns = worldMap[0].map((_, column) => column)
    .filter((column) => column >= WORLD_TILE_ART_AREA.firstColumn && column < WORLD_TILE_ART_AREA.endColumn);
  const terrainKinds = new Set(
    worldMap.flatMap((row) => columns.map((column) => row[column].terrain))
      .filter((terrain) => ['topsoil', 'compactEarth', 'clay', 'stoneLayer', 'deepRock'].includes(terrain)),
  );
  const surfaceFrames = new Set(worldMap.flatMap((row, rowIndex) => row.map((tile, column) =>
    tile.terrain === 'surface' ? getTilemapAtlasFrame(getTileArtInstruction(worldMap, column, rowIndex)) : null,
  )).filter((frame) => frame !== null));
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
  assert.deepEqual([...surfaceFrames].sort(), [135, 136]);
  assert.ok(openBranches.length > 0);

  worldMap.forEach((row, rowIndex) => row.forEach((_, column) => {
    const frame = getTilemapAtlasFrame(getTileArtInstruction(worldMap, column, rowIndex));
    assert.ok(frame === -1 || (frame >= 0 && frame < TILEMAP_ART_ATLAS_FRAME_COUNT));
  }));
});
