import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

// Configs do Módulo 3 (espelham site/modulos/03-matematica-vira-imagem.html).
const plotFragment = `uniform float u_k;
float plot(float fx) {
  return smoothstep(fx - 0.012, fx, v_uv.y) - smoothstep(fx, fx + 0.012, v_uv.y);
}
void main() {
  float x = v_uv.x;
// >>> EDIT: funcao
  float y = smoothstep(0.3, 0.7, x);
// <<< EDIT
  vec3 bg = vec3(y);
  vec3 col = mix(bg, vec3(0.2, 0.95, 0.4), plot(y));
  gl_FragColor = vec4(col, 1.0);
}`;

const plotCfg = {
  mode: 'fragment',
  fragment: plotFragment,
  uniforms: [{ name: 'u_k', label: 'k', min: 1, max: 12, value: 4 }],
  editableRegions: ['funcao'],
};

const exFragment = `void main() {
  float x = v_uv.x;
// >>> EDIT: cor
  vec3 c = vec3(x);
// <<< EDIT
  gl_FragColor = vec4(c, 1.0);
}`;
const exCfg = {
  mode: 'fragment',
  fragment: exFragment,
  editableRegions: ['cor'],
  solution: '  vec3 c = vec3(sin(x * 6.2831) * 0.5 + 0.5);',
  reference: '../assets/ref/m3-onda-sin.png',
  tolerance: 0.06,
};

test('config "plot" normaliza com 1 slider u_k (min/max/value)', () => {
  const c = normalizeConfig(plotCfg);
  const specs = toControlSpecs(c.uniforms);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].kind, 'slider');
  assert.equal(specs[0].min, 1);
  assert.equal(specs[0].max, 12);
  assert.equal(specs[0].value, 4);
});

test('regiao editavel "funcao" do plotter extrai e remonta sem corromper plot()', () => {
  const inner = extractRegion(plotFragment, 'funcao');
  assert.match(inner, /float y = smoothstep\(0\.3, 0\.7, x\)/);
  const remontado = reassemble(plotFragment, 'funcao', '  float y = fract(x * u_k);');
  assert.match(remontado, /float y = fract\(x \* u_k\)/);
  assert.match(remontado, /float plot\(float fx\)/);      // helper preservado
  assert.match(remontado, /vec3 col = mix\(bg/);          // resto preservado
});

test('config "exercicio" normaliza com referencia da onda e solucao sin', () => {
  const c = normalizeConfig(exCfg);
  assert.equal(c.reference, '../assets/ref/m3-onda-sin.png');
  assert.equal(c.tolerance, 0.06);
  assert.match(c.solution, /sin\(x \* 6\.2831\) \* 0\.5 \+ 0\.5/);
});

test('exercicio: remontar a solucao preserva o resto do shader', () => {
  const remontado = reassemble(exFragment, 'cor', exCfg.solution);
  assert.match(remontado, /sin\(x \* 6\.2831\)/);
  assert.match(remontado, /float x = v_uv\.x;/);
  assert.match(remontado, /gl_FragColor = vec4\(c, 1\.0\);/);
});

test('a referencia PNG da onda existe e e um PNG valido', () => {
  const buf = readFileSync('site/assets/ref/m3-onda-sin.png');
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});

test('a pagina HTML do Modulo 3 contem os dois playgrounds e os dispositivos', () => {
  const html = readFileSync('site/modulos/03-matematica-vira-imagem.html', 'utf8');
  assert.ok(html.includes('id="pg-plot"'), 'falta pg-plot');
  assert.ok(html.includes('id="pg-ex"'), 'falta pg-ex');
  assert.ok(html.includes('>>> EDIT: funcao'), 'falta sentinela do plotter');
  assert.ok(html.includes('>>> EDIT: cor'), 'falta sentinela do exercicio');
  assert.ok(html.includes('m3-onda-sin.png'), 'falta referencia do exercicio');
  assert.ok(html.includes('curvas.svg'), 'falta o SVG das curvas');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
