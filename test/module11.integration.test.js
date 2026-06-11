import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('demo de rasterizacao: fragment 2D usando u_time, sem reference', () => {
  const c = normalizeConfig({
    mode: 'fragment',
    fragment: 'void main(){ float i = (v_uv.x>0.5)?1.0:0.0; gl_FragColor=vec4(vec3(i*sin(u_time)),1.0); }',
  });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.reference, null);       // conceitual: sem pixel-diff
  assert.deepEqual(c.editableRegions, []); // sem exercicio
});

test('a pagina do Modulo 11 e conceitual: demo, SVG, fecha o Marco 2, sem pixel-diff', () => {
  const html = readFileSync('site/modulos/11-hardware-fixo.html', 'utf8');
  assert.ok(html.includes('id="pg-raster"'), 'falta o demo de rasterizacao');
  assert.ok(html.includes('pipeline-fixo.svg'), 'falta o SVG do pipeline fixo');
  assert.ok(html.includes('[IMAGEM:'), 'falta o placeholder do die da GPU');
  assert.ok(html.includes('Marco 2'), 'falta a amarracao do Marco 2');
  assert.ok(!html.includes('reference:'), 'M11 e conceitual: nao deve ter pixel-diff');
  assert.ok(!html.includes('exportable'), 'M11 nao tem projeto exportavel');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index marca o Marco 2 como completo e linka o M11', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('11-hardware-fixo.html'), 'index nao linka o M11');
  assert.ok(idx.includes('Marco 2 completo'), 'index nao marca Marco 2 completo');
});
