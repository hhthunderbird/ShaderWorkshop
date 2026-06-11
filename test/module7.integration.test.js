import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { cube } from '../site/assets/playground/geometry.js';

test('config do cubo normaliza em modo mesh com malha cube', () => {
  const c = normalizeConfig({ mode: 'mesh', mesh: 'cube', fragment: 'void main(){ gl_FragColor=vec4(v_uv,0.0,1.0); }' });
  assert.equal(c.mode, 'mesh');
  assert.equal(c.mesh, 'cube');
});

test('a malha cube tem 24 vertices e 36 indices', () => {
  const g = cube();
  assert.equal(g.positions.length / 3, 24);
  assert.equal(g.indices.length, 36);
});

test('a pagina do Modulo 7 tem os dois playgrounds mesh e os dispositivos', () => {
  const html = readFileSync('site/modulos/07-vertices-e-pipeline.html', 'utf8');
  assert.ok(html.includes('id="pg-cubo"'), 'falta pg-cubo');
  assert.ok(html.includes('id="pg-cor"'), 'falta pg-cor');
  assert.ok(html.includes("mode: 'mesh'"), 'falta modo mesh');
  assert.ok(html.includes('pipeline.svg'), 'falta o SVG do pipeline');
  assert.ok(!html.includes('v_normal'), 'M7 nao deve usar normal (so nasce no M10)');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
