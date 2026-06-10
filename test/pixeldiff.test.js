import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare } from '../site/assets/playground/pixeldiff.js';

const px = (r, g, b) => Uint8ClampedArray.from([r, g, b, 255]);

test('identico => score 1, pass true', () => {
  const a = px(100, 50, 200);
  const r = compare(a, px(100, 50, 200), 0.06);
  assert.equal(r.score, 1);
  assert.equal(r.pass, true);
});

test('oposto => score 0, pass false', () => {
  const r = compare(px(0, 0, 0), px(255, 255, 255), 0.06);
  assert.equal(r.score, 0);
  assert.equal(r.pass, false);
});

test('diferenca pequena dentro da tolerancia passa', () => {
  const r = compare(px(250, 250, 250), px(255, 255, 255), 0.06);
  assert.equal(r.pass, true);
  assert.ok(r.score > 0.94);
});

test('tamanhos diferentes lancam erro', () => {
  assert.throws(
    () => compare(px(0, 0, 0), Uint8ClampedArray.from([0, 0, 0, 255, 0, 0, 0, 255]), 0.06),
    /tamanho/
  );
});
