import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

// Configs do Módulo 2 (espelham site/modulos/02-pixel-e-cor.html).
const baseFragment = `void main() {
// >>> EDIT: cor
  vec3 c = vec3(v_uv.x, v_uv.y, 0.0);
// <<< EDIT
  gl_FragColor = vec4(c, 1.0);
}`;

const gradCfg = {
  mode: 'fragment',
  fragment: baseFragment,
  editableRegions: ['cor'],
};

const exCfg = {
  mode: 'fragment',
  fragment: baseFragment,
  editableRegions: ['cor'],
  solution: '  vec3 c = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), v_uv.x);',
  reference: '../assets/ref/m2-gradiente-rb.png',
  tolerance: 0.06,
};

test('config "gradiente" normaliza sem controles (so editor)', () => {
  const c = normalizeConfig(gradCfg);
  assert.equal(c.mode, 'fragment');
  assert.deepEqual(c.editableRegions, ['cor']);
  assert.equal(toControlSpecs(c.uniforms).length, 0);
});

test('config "exercicio" normaliza com referencia e solucao', () => {
  const c = normalizeConfig(exCfg);
  assert.equal(c.reference, '../assets/ref/m2-gradiente-rb.png');
  assert.equal(c.tolerance, 0.06);
  assert.match(c.solution, /mix\(vec3\(1\.0, 0\.0, 0\.0\), vec3\(0\.0, 0\.0, 1\.0\), v_uv\.x\)/);
});

test('regiao editavel "cor" extrai e remonta com a solucao do gradiente', () => {
  const inner = extractRegion(baseFragment, 'cor');
  assert.match(inner, /vec3 c = vec3\(v_uv\.x, v_uv\.y, 0\.0\)/);
  const remontado = reassemble(baseFragment, 'cor', exCfg.solution);
  assert.match(remontado, /mix\(vec3\(1\.0, 0\.0, 0\.0\)/);
  assert.match(remontado, /gl_FragColor = vec4\(c, 1\.0\);/); // resto preservado
});

test('a referencia PNG do exercicio existe e e um PNG valido', () => {
  const buf = readFileSync('site/assets/ref/m2-gradiente-rb.png');
  // assinatura PNG
  assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});

test('a pagina HTML do Modulo 2 contem os dois playgrounds e o exercicio', () => {
  const html = readFileSync('site/modulos/02-pixel-e-cor.html', 'utf8');
  assert.ok(html.includes('id="pg-grad"'), 'falta pg-grad');
  assert.ok(html.includes('id="pg-ex"'), 'falta pg-ex');
  assert.ok(html.includes('>>> EDIT: cor'), 'falta sentinela editavel');
  assert.ok(html.includes('m2-gradiente-rb.png'), 'falta referencia do exercicio');
  assert.ok(html.includes('uv-grid.svg'), 'falta o SVG da grade UV');
  // dispositivos Head First obrigatorios (§3 do spec)
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
