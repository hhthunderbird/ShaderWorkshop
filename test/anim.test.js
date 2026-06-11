import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceTime, defaultPlaying } from '../site/assets/playground/anim.js';

test('advanceTime soma dt quando playing', () => {
  assert.equal(advanceTime(1.0, 0.5, true), 1.5);
});
test('advanceTime congela quando pausado', () => {
  assert.equal(advanceTime(1.0, 0.5, false), 1.0);
});
test('advanceTime acumula ao longo de varios frames', () => {
  let t = 0;
  for (let i = 0; i < 4; i++) t = advanceTime(t, 0.25, true);
  assert.equal(t, 1.0);
});
test('advanceTime com dt 0 nao muda', () => {
  assert.equal(advanceTime(2.0, 0, true), 2.0);
});
test('defaultPlaying: toca se nao-reduced, pausa se reduced', () => {
  assert.equal(defaultPlaying(false), true);
  assert.equal(defaultPlaying(true), false);
});
