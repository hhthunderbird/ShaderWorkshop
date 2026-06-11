import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('preenche defaults', () => {
  const c = normalizeConfig({ fragment: 'void main(){}' });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.mesh, 'quad');
  assert.deepEqual(c.uniforms, []);
  assert.deepEqual(c.editableRegions, []);
  assert.equal(c.reference, null);
  assert.equal(c.tolerance, 0.06);
  assert.equal(c.exportable, false);
});

test('exportable: so true quando explicitamente true', () => {
  assert.equal(normalizeConfig({ fragment: 'x', exportable: true }).exportable, true);
  assert.equal(normalizeConfig({ fragment: 'x', exportable: 'sim' }).exportable, false);
  assert.equal(normalizeConfig({ fragment: 'x' }).exportable, false);
});

test('exige fragment', () => {
  assert.throws(() => normalizeConfig({}), /fragment/);
});

test('mode mesh exige vertex', () => {
  assert.throws(
    () => normalizeConfig({ mode: 'mesh', fragment: 'x' }),
    /vertex/
  );
});

test('rejeita mode invalido', () => {
  assert.throws(
    () => normalizeConfig({ mode: 'foo', fragment: 'x' }),
    /mode/
  );
});

test('clampa tolerance em 0..1', () => {
  assert.equal(normalizeConfig({ fragment: 'x', tolerance: 2 }).tolerance, 1);
  assert.equal(normalizeConfig({ fragment: 'x', tolerance: -1 }).tolerance, 0);
});
