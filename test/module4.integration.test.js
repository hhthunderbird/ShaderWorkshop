import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

// Configs do Módulo 4 (espelham site/modulos/04-formas-e-padroes.html).
const circFragment = `uniform float u_r;
uniform float u_cx;
uniform float u_cy;
void main() {
  float d = length(v_uv - vec2(u_cx, u_cy));
  float shape = smoothstep(u_r, u_r - 0.015, d);
  gl_FragColor = vec4(vec3(shape), 1.0);
}`;
const circCfg = {
  mode: 'fragment',
  fragment: circFragment,
  uniforms: [
    { name: 'u_r', label: 'raio', min: 0.05, max: 0.45, value: 0.25 },
    { name: 'u_cx', label: 'centro X', min: 0.0, max: 1.0, value: 0.5 },
    { name: 'u_cy', label: 'centro Y', min: 0.0, max: 1.0, value: 0.5 },
  ],
};

const exFragment = `void main() {
  float d1 = length(v_uv - vec2(0.35, 0.5));
  float d2 = length(v_uv - vec2(0.65, 0.5));
  float c1 = smoothstep(0.25, 0.24, d1);
  float c2 = smoothstep(0.25, 0.24, d2);
// >>> EDIT: combina
  float shape = c1;
// <<< EDIT
  gl_FragColor = vec4(vec3(shape), 1.0);
}`;
const exCfg = {
  mode: 'fragment',
  fragment: exFragment,
  editableRegions: ['combina'],
  solution: '  float shape = max(c1, c2);',
  reference: '../assets/ref/m4-dois-circulos.png',
  tolerance: 0.06,
};

test('config "circulo" normaliza com 3 sliders (raio, centro X, centro Y)', () => {
  const c = normalizeConfig(circCfg);
  const specs = toControlSpecs(c.uniforms);
  assert.equal(specs.length, 3);
  assert.ok(specs.every((s) => s.kind === 'slider'));
  assert.deepEqual(specs.map((s) => s.value), [0.25, 0.5, 0.5]);
  assert.equal(specs[0].min, 0.05);
  assert.equal(specs[0].max, 0.45);
});

test('regiao editavel "combina" extrai o c1 e remonta com max sem corromper o resto', () => {
  const inner = extractRegion(exFragment, 'combina');
  assert.match(inner, /float shape = c1;/);
  const remontado = reassemble(exFragment, 'combina', exCfg.solution);
  assert.match(remontado, /float shape = max\(c1, c2\);/);
  assert.match(remontado, /float d1 = length\(v_uv - vec2\(0\.35, 0\.5\)\)/); // setup preservado
  assert.match(remontado, /gl_FragColor = vec4\(vec3\(shape\), 1\.0\);/);     // saida preservada
});

test('config "exercicio" normaliza com referencia e solucao de uniao', () => {
  const c = normalizeConfig(exCfg);
  assert.equal(c.reference, '../assets/ref/m4-dois-circulos.png');
  assert.equal(c.tolerance, 0.06);
  assert.match(c.solution, /max\(c1, c2\)/);
});

test('a referencia PNG dos dois circulos existe e e um PNG valido', () => {
  const buf = readFileSync('site/assets/ref/m4-dois-circulos.png');
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});

test('a pagina HTML do Modulo 4 contem os dois playgrounds e os dispositivos', () => {
  const html = readFileSync('site/modulos/04-formas-e-padroes.html', 'utf8');
  assert.ok(html.includes('id="pg-circ"'), 'falta pg-circ');
  assert.ok(html.includes('id="pg-ex"'), 'falta pg-ex');
  assert.ok(html.includes('>>> EDIT: combina'), 'falta sentinela do exercicio');
  assert.ok(html.includes('m4-dois-circulos.png'), 'falta referencia do exercicio');
  assert.ok(html.includes('formas.svg'), 'falta o SVG das formas');
  assert.ok(html.includes('class="magnets"'), 'falta o dispositivo code magnets');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
