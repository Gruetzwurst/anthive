import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameClock } from '../src/game/simulation/gameClock.ts';

test('600 seconds are one day; subsequent updates count only newly crossed days', () => {
  const clock = new GameClock();
  assert.deepEqual(clock.advance(599), {
    elapsedGameDays: 599 / 600, daysCrossed: 0, totalGameDays: 599 / 600, dayFraction: 599 / 600,
  });
  assert.deepEqual(clock.advance(1), {
    elapsedGameDays: 1 / 600, daysCrossed: 1, totalGameDays: 1, dayFraction: 0,
  });
  assert.deepEqual(clock.advance(1500), {
    elapsedGameDays: 2.5, daysCrossed: 2, totalGameDays: 3.5, dayFraction: 0.5,
  });
});

test('day length is configurable and fractional frame updates preserve the day boundary', () => {
  const clock = new GameClock(60);
  for (let index = 0; index < 600; index++) clock.advance(0.1);
  assert.equal(clock.totalGameDays, 1);
  assert.equal(clock.dayFraction, 0);
});

test('paused time does not catch up after resuming', () => {
  const clock = new GameClock();
  clock.advance(300);
  clock.setPaused(true);
  assert.deepEqual(clock.advance(900), {
    elapsedGameDays: 0, daysCrossed: 0, totalGameDays: 0.5, dayFraction: 0.5,
  });
  clock.setPaused(false);
  assert.equal(clock.advance(300).totalGameDays, 1);
});

test('invalid times and day lengths fail without changing elapsed time', () => {
  for (const value of [-1, NaN, Infinity, -Infinity]) {
    assert.throws(() => new GameClock(value), RangeError);
    const clock = new GameClock();
    clock.advance(300);
    assert.throws(() => clock.advance(value), RangeError);
    assert.equal(clock.totalGameDays, 0.5);
  }
  assert.throws(() => new GameClock(0), RangeError);
  assert.equal(new GameClock().advance(0).totalGameDays, 0);
});
