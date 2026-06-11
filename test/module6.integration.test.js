import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';

// Configs do Módulo 6 (espelham site/modulos/06-paralelismo.html).
// Módulo conceitual: sem exercício, sem pixel-diff. Dois demos animados.
const cpuCfg = {
  mode: 'fragment',
  fragment: `uniform float u_vel;
void main() {
  vec2 cell = floor(v_uv * 12.0);
  float idx = cell.y * 12.0 + cell.x;
  float ponteiro = fract(u_time * u_vel * 0.07) * 144.0;
  float on = step(idx, ponteiro);
  vec3 c = on * vec3(fract(idx * 0.13), 0.55, 0.95);
  gl_FragColor = vec4(c, 1.0);
}`,
  uniforms: [{ name: 'u_vel', label: 'velocidade', min: 0.2, max: 3.0, value: 1.0 }],
};
const gpuCfg = {
  mode: 'fragment',
  fragment: `uniform float u_vel;
void main() {
  vec2 cell = floor(v_uv * 12.0);
  float idx = cell.y * 12.0 + cell.x;
  float on = 0.5 + 0.5 * sin(u_time * u_vel * 3.0);
  vec3 c = on * vec3(fract(idx * 0.13), 0.55, 0.95);
  gl_FragColor = vec4(c, 1.0);
}`,
  uniforms: [{ name: 'u_vel', label: 'velocidade', min: 0.2, max: 3.0, value: 1.0 }],
};

test('demo CPU: varredura sequencial (usa idx e ponteiro com u_time)', () => {
  const c = normalizeConfig(cpuCfg);
  assert.match(c.fragment, /step\(idx, ponteiro\)/);
  assert.match(c.fragment, /u_time/);
  assert.equal(c.reference, null);          // conceitual: sem pixel-diff
  assert.deepEqual(c.editableRegions, []);  // sem regiao editavel
  assert.equal(toControlSpecs(c.uniforms).length, 1);
});

test('demo GPU: todas as celulas na mesma fase (paralelo)', () => {
  const c = normalizeConfig(gpuCfg);
  assert.match(c.fragment, /0\.5 \+ 0\.5 \* sin\(u_time \* u_vel \* 3\.0\)/);
  assert.equal(c.reference, null);
});

test('a pagina HTML do Modulo 6 tem os dois demos, fecha o Marco 1 e nao tem pixel-diff', () => {
  const html = readFileSync('site/modulos/06-paralelismo.html', 'utf8');
  assert.ok(html.includes('id="pg-cpu"'), 'falta pg-cpu');
  assert.ok(html.includes('id="pg-gpu"'), 'falta pg-gpu');
  assert.ok(html.includes('exercito.svg'), 'falta o SVG do exercito');
  assert.ok(html.includes('gpu-die.svg'), 'M6 nao usa o gpu-die.svg');
  assert.ok(!html.includes('[IMAGEM:'), 'M6 nao deve ter placeholder de imagem');
  assert.ok(html.includes('Marco 1'), 'falta a amarracao do Marco 1');
  assert.ok(!html.includes('reference:'), 'M6 e conceitual: nao deve ter pixel-diff');
  assert.ok(!html.includes('exportable'), 'M6 nao tem projeto exportavel');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index marca o Marco 1 como completo e linka o M6', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('06-paralelismo.html'), 'index nao linka o M6');
  assert.ok(idx.includes('Marco 1 completo'), 'index nao marca Marco 1 completo');
});
