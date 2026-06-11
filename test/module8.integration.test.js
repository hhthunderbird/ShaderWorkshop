import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

const dotFragment = `uniform float u_ang;
void main() {
  vec2 p = v_uv - vec2(0.5);
  vec2 dir = p / (length(p) + 0.001);
  vec2 ref = vec2(cos(u_ang), sin(u_ang));
  float g = dot(dir, ref) * 0.5 + 0.5;
  gl_FragColor = vec4(vec3(g), 1.0);
}`;
const dotCfg = { mode: 'fragment', fragment: dotFragment, uniforms: [{ name: 'u_ang', label: 'direção', min: 0, max: 6.2831, value: 0 }] };

const exFragment = `void main() {
  vec2 p = v_uv - vec2(0.5);
  vec2 dir = p / (length(p) + 0.001);
// >>> EDIT: brilho
  float g = 0.5;
// <<< EDIT
  gl_FragColor = vec4(vec3(g), 1.0);
}`;
const exCfg = {
  mode: 'fragment',
  fragment: exFragment,
  editableRegions: ['brilho'],
  solution: '  float g = dot(dir, vec2(1.0, 0.0)) * 0.5 + 0.5;',
  reference: '../assets/ref/m8-dot-horizontal.png',
  tolerance: 0.06,
};

test('demo do holofote: slider de direção, fragment 2D com dot', () => {
  const c = normalizeConfig(dotCfg);
  assert.equal(c.mode, 'fragment');
  assert.match(c.fragment, /dot\(dir, ref\)/);
  assert.equal(toControlSpecs(c.uniforms).length, 1);
});

test('exercicio normaliza com referencia do dot horizontal e solucao', () => {
  const c = normalizeConfig(exCfg);
  assert.equal(c.reference, '../assets/ref/m8-dot-horizontal.png');
  assert.match(c.solution, /dot\(dir, vec2\(1\.0, 0\.0\)\) \* 0\.5 \+ 0\.5/);
});

test('regiao editavel "brilho" extrai o seed e remonta com a solucao', () => {
  assert.match(extractRegion(exFragment, 'brilho'), /float g = 0\.5;/);
  const r = reassemble(exFragment, 'brilho', exCfg.solution);
  assert.match(r, /dot\(dir, vec2\(1\.0, 0\.0\)\)/);
  assert.match(r, /vec2 dir = p \/ \(length\(p\) \+ 0\.001\);/); // setup preservado
});

test('a referencia PNG do M8 existe e e um PNG valido', () => {
  const buf = readFileSync('site/assets/ref/m8-dot-horizontal.png');
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});

test('a pagina do Modulo 8 tem os playgrounds, o SVG e os dispositivos', () => {
  const html = readFileSync('site/modulos/08-vetores-e-coordenadas.html', 'utf8');
  assert.ok(html.includes('id="pg-dot"'), 'falta pg-dot');
  assert.ok(html.includes('id="pg-ex"'), 'falta pg-ex');
  assert.ok(html.includes('>>> EDIT: brilho'), 'falta sentinela do exercicio');
  assert.ok(html.includes('m8-dot-horizontal.png'), 'falta referencia');
  assert.ok(html.includes('vetores-dot.svg'), 'falta o SVG dos vetores');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
