import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPondProfile } from '../src/game/world/pondProfile.ts';

test('side-view water stays level and below both banks on uneven terrain', () => {
  const surface = column => column < 10 ? 8 : 10;
  const profile = createPondProfile(10.5 * 24, 24, 1, surface);
  assert.equal(profile.columns.length, 13);
  assert.ok(profile.columns.every(column => column.surfaceY === profile.waterY));
  assert.ok(profile.waterY >= 10 * 24);
  assert.ok(profile.columns.every(column => column.clearFromY <= profile.waterY));
  assert.ok(profile.columns.every(column => column.bottomY > profile.waterY));
  assert.ok(profile.columns[6].bottomY > profile.columns[0].bottomY);
  assert.ok(profile.columns[6].bottomY > profile.columns[12].bottomY);
});

test('pond profile follows scaled tile size without extending water above ground', () => {
  const profile = createPondProfile(120, 24, 0.5, () => 7);
  assert.equal(profile.columns[0].width, 12);
  assert.equal(profile.columns.at(-1).x + 12 - profile.columns[0].x, 156);
  assert.ok(profile.waterY >= 168);
  assert.ok(profile.columns.every(column => column.clearFromY === 168));
});
