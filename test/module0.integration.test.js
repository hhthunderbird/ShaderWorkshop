import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('config do tour: fragment editavel, sem reference (so explorar)', () => {
  const c = normalizeConfig({
    mode: 'fragment',
    fragment: `void main() {
// >>> EDIT: cor
  vec3 cor = vec3(0.2, 0.6, 1.0);
// <<< EDIT
  gl_FragColor = vec4(cor, 1.0);
}`,
    editableRegions: ['cor'],
    solution: '  vec3 cor = vec3(1.0, 0.4, 0.1);',
  });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.reference, null);
  assert.deepEqual(c.editableRegions, ['cor']);
  assert.ok(c.solution.includes('vec3'));
});

test('o Modulo 0 orienta: playground, glossario de leitura, debugging, link pro M1', () => {
  const html = readFileSync('site/modulos/00-comecando.html', 'utf8');
  assert.ok(html.includes('<shader-playground'), 'falta o playground do tour');
  for (const tok of ['void main', 'gl_FragColor', 'vec3', 'float', 'step', 'mix']) {
    assert.ok(html.includes(tok), `glossario nao cobre ${tok}`);
  }
  assert.ok(html.includes('class="cuidado"'), 'falta o Cuidado! de debugging');
  assert.ok(/Reset/.test(html) && /Mostrar solu/.test(html), 'tour nao explica os botoes');
  assert.ok(html.includes('01-shaders-e-gpu.html'), 'M0 nao linka o M1');
  assert.ok(html.includes('Módulo 0'), 'breadcrumb do M0 ausente');
  assert.ok(!html.includes('de 15'), 'M0 nao deve renumerar o curso pra 15');
});

test('o index linka o Modulo 0 acima do Marco 1', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('00-comecando.html'), 'index nao linka o M0');
  assert.ok(idx.indexOf('00-comecando.html') < idx.indexOf('Marco 1'), 'M0 deve vir antes do Marco 1');
});
