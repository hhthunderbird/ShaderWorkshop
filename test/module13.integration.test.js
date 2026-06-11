import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('demo enxame: fragment 2D, loop de pontos por u_time, sem reference', () => {
  const c = normalizeConfig({
    mode: 'fragment',
    fragment: `precision highp float;
void main(){
  vec3 cor = vec3(0.02, 0.02, 0.05);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 p = vec2(0.5 + 0.4*sin(u_time*0.7+fi*1.3), 0.5 + 0.4*cos(u_time*0.9+fi*2.1));
    cor += vec3(0.15,0.4,0.9) * (1.0 - smoothstep(0.0, 0.04, distance(v_uv, p)));
  }
  gl_FragColor = vec4(cor, 1.0);
}`,
  });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.reference, null);
  assert.deepEqual(c.editableRegions, []);
});

test('a pagina do M13 e conceitual: demo, SVG, caixa Cuidado da metafora, sem pixel-diff', () => {
  const html = readFileSync('site/modulos/13-alem-de-pixels.html', 'utf8');
  assert.ok(html.includes('id="pg-enxame"'), 'falta o demo de enxame');
  assert.ok(html.includes('m6-vs-m13.svg'), 'falta o SVG do contraste com o M6');
  assert.ok(/compute/i.test(html), 'precisa nomear compute (e dizer que NAO roda aqui)');
  assert.ok(html.includes('class="cuidado"'), 'falta a caixa Cuidado da metafora (compute != WebGL1)');
  assert.ok(!html.includes('reference:'), 'M13 e conceitual: sem pixel-diff');
  for (const cls of ['brain', 'qa', 'bullets', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index linka o M13', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('13-alem-de-pixels.html'), 'index nao linka o M13');
});
