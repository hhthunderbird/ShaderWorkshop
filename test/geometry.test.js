import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cube, sphere } from '../site/assets/playground/geometry.js';

test('cube: 24 vertices (4 por face), 36 indices, normais unitarias', () => {
  const g = cube();
  assert.equal(g.positions.length, 24 * 3);
  assert.equal(g.uvs.length, 24 * 2);
  assert.equal(g.normals.length, 24 * 3);
  assert.equal(g.indices.length, 36);
  for (let i = 0; i < g.normals.length; i += 3) {
    const n = Math.hypot(g.normals[i], g.normals[i + 1], g.normals[i + 2]);
    assert.ok(Math.abs(n - 1) < 1e-6, `normal unitaria, got ${n}`);
  }
  for (const p of g.positions) assert.ok(p >= -0.5001 && p <= 0.5001);
  for (const idx of g.indices) assert.ok(idx >= 0 && idx < 24);
});

test('sphere(8): normais unitarias e posicoes sobre a esfera unitaria (raio 0.5)', () => {
  const g = sphere(8);
  assert.ok(g.positions.length > 0);
  assert.equal(g.positions.length, g.normals.length);
  assert.equal(g.positions.length / 3 * 2, g.uvs.length);
  for (let i = 0; i < g.positions.length; i += 3) {
    const r = Math.hypot(g.positions[i], g.positions[i + 1], g.positions[i + 2]);
    assert.ok(Math.abs(r - 0.5) < 1e-5, `raio 0.5, got ${r}`);
    const n = Math.hypot(g.normals[i], g.normals[i + 1], g.normals[i + 2]);
    assert.ok(Math.abs(n - 1) < 1e-5, `normal unitaria, got ${n}`);
  }
  assert.equal(g.indices.length % 3, 0);
});

test('saidas sao tipadas (Float32Array / Uint16Array)', () => {
  const g = cube();
  assert.ok(g.positions instanceof Float32Array);
  assert.ok(g.indices instanceof Uint16Array);
});
