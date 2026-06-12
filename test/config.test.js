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

test('backdrop: string conhecida vira valor, desconhecida/ausente vira null', () => {
  const base = { fragment: 'void main(){ gl_FragColor = vec4(1.0); }' };
  assert.equal(normalizeConfig({ ...base, backdrop: 'xadrez' }).backdrop, 'xadrez');
  assert.equal(normalizeConfig({ ...base, backdrop: 'inexistente' }).backdrop, null);
  assert.equal(normalizeConfig(base).backdrop, null);
});

test('exportable: so true quando explicitamente true', () => {
  assert.equal(normalizeConfig({ fragment: 'x', exportable: true }).exportable, true);
  assert.equal(normalizeConfig({ fragment: 'x', exportable: 'sim' }).exportable, false);
  assert.equal(normalizeConfig({ fragment: 'x' }).exportable, false);
});

test('exige fragment', () => {
  assert.throws(() => normalizeConfig({}), /fragment/);
});

test('mode mesh NAO exige vertex (motor fornece MESH_VERTEX padrao)', () => {
  const c = normalizeConfig({ mode: 'mesh', fragment: 'void main(){ gl_FragColor=vec4(v_uv,0.0,1.0); }' });
  assert.equal(c.mode, 'mesh');
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

test('mesh: cube/sphere/quad sao validos; default mesh continua quad', () => {
  assert.equal(normalizeConfig({ fragment: 'x' }).mesh, 'quad');
  assert.equal(normalizeConfig({ mode: 'mesh', fragment: 'x', mesh: 'cube' }).mesh, 'cube');
  assert.equal(normalizeConfig({ mode: 'mesh', fragment: 'x', mesh: 'sphere' }).mesh, 'sphere');
});

test('light: default direcional; aceita override vec3', () => {
  assert.deepEqual(normalizeConfig({ fragment: 'x' }).light, [0.5, 0.7, 1.0]);
  assert.deepEqual(normalizeConfig({ fragment: 'x', light: [1, 0, 0] }).light, [1, 0, 0]);
});

test('texture: null por padrao; aceita url string', () => {
  assert.equal(normalizeConfig({ fragment: 'x' }).texture, null);
  assert.equal(normalizeConfig({ fragment: 'x', texture: '' }).texture, null);
  assert.equal(normalizeConfig({ fragment: 'x', texture: '../assets/tex/exemplo.png' }).texture, '../assets/tex/exemplo.png');
});
