import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identity, multiply, perspective, translation, rotateY, mat3FromMat4 } from '../site/assets/playground/mat4.js';

const approx = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const approxArr = (a, b, eps = 1e-5) => { assert.equal(a.length, b.length); for (let i = 0; i < a.length; i++) approx(a[i], b[i], eps); };

test('identity é a matriz identidade 4x4', () => {
  approxArr(identity(), [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
});

test('multiply por identidade devolve a propria matriz', () => {
  const m = translation(2, 3, 4);
  approxArr(multiply(m, identity()), m);
  approxArr(multiply(identity(), m), m);
});

test('translation coloca a translacao na 4a coluna (column-major)', () => {
  approxArr(translation(2, 3, 4), [1,0,0,0, 0,1,0,0, 0,0,1,0, 2,3,4,1]);
});

test('rotateY(PI/2) gira +X para -Z (column-major, regra da mao direita)', () => {
  const m = rotateY(Math.PI / 2);
  approx(m[0], 0); approx(m[2], -1);
});

test('multiply compoe na ordem A*B (aplica B depois A)', () => {
  const r = rotateY(Math.PI / 2);
  const t = translation(1, 0, 0);
  const m = multiply(t, r);
  approx(m[12], 1); approx(m[13], 0); approx(m[14], 0);
});

test('perspective produz matriz com -1 em [11] (w = -z)', () => {
  const p = perspective(Math.PI / 2, 1, 0.1, 100);
  approx(p[11], -1);
  approx(p[5], 1);
});

test('mat3FromMat4 extrai a 3x3 superior-esquerda (column-major)', () => {
  const m = [1,2,3,0, 4,5,6,0, 7,8,9,0, 10,11,12,1];
  approxArr(mat3FromMat4(m), [1,2,3, 4,5,6, 7,8,9]);
});
