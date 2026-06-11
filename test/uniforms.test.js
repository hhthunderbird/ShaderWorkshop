import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toControlSpecs, AUTO_UNIFORMS } from '../site/assets/playground/uniforms.js';

test('float vira slider com min/max/value', () => {
  const specs = toControlSpecs([
    { name: 'u_freq', label: 'Frequência', type: 'float', min: 0, max: 10, value: 3 },
  ]);
  assert.equal(specs.length, 1);
  assert.deepEqual(specs[0], {
    name: 'u_freq', label: 'Frequência', kind: 'slider',
    min: 0, max: 10, step: 0.01, value: 3,
  });
});

test('color vira control rgb com value [r,g,b]', () => {
  const specs = toControlSpecs([
    { name: 'u_cor', label: 'Cor', type: 'color', value: [1, 0, 0] },
  ]);
  assert.equal(specs[0].kind, 'color');
  assert.deepEqual(specs[0].value, [1, 0, 0]);
});

test('uniforms automaticos sao ignorados como controle', () => {
  const specs = toControlSpecs([{ name: 'u_time', type: 'float' }]);
  assert.equal(specs.length, 0);
});

test('AUTO_UNIFORMS contem u_time e u_resolution', () => {
  assert.ok(AUTO_UNIFORMS.includes('u_time'));
  assert.ok(AUTO_UNIFORMS.includes('u_resolution'));
});

test('float sem min/max usa defaults 0..1', () => {
  const s = toControlSpecs([{ name: 'u_x', label: 'X', type: 'float' }])[0];
  assert.equal(s.min, 0);
  assert.equal(s.max, 1);
  assert.equal(s.value, 0.5);
});
