import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

// Configs do Módulo 1 (espelham site/modulos/01-shaders-e-gpu.html).
// Guardam contra erro de sentinela/uniform sem precisar de navegador.
const corCfg = {
  mode: 'fragment',
  fragment: `uniform vec3 u_cor;
void main() {
  gl_FragColor = vec4(u_cor, 1.0);
}`,
  uniforms: [{ name: 'u_cor', label: 'Cor da tela', type: 'color', value: [0.2, 0.6, 1.0] }],
};

const exFragment = `void main() {
// >>> EDIT: cor
  vec3 c = vec3(v_uv.x, v_uv.y, 0.0);
// <<< EDIT
  gl_FragColor = vec4(c, 1.0);
}`;
const exCfg = {
  mode: 'fragment',
  fragment: exFragment,
  editableRegions: ['cor'],
  solution: '  float m = step(0.5, v_uv.x);\n  vec3 c = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), m);',
  reference: '../assets/ref/m1-meio-a-meio.png',
  tolerance: 0.06,
};

test('config "cor" normaliza e gera 1 controle de cor', () => {
  const c = normalizeConfig(corCfg);
  const specs = toControlSpecs(c.uniforms);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].kind, 'color');
  assert.deepEqual(specs[0].value, [0.2, 0.6, 1.0]);
});

test('config "exercicio" normaliza com referencia e tolerancia', () => {
  const c = normalizeConfig(exCfg);
  assert.equal(c.reference, '../assets/ref/m1-meio-a-meio.png');
  assert.equal(c.tolerance, 0.06);
  assert.equal(c.solution, exCfg.solution);
});

test('regiao editavel "cor" extrai e remonta sem corromper o resto', () => {
  const inner = extractRegion(exFragment, 'cor');
  assert.match(inner, /vec3 c = vec3\(v_uv\.x/);
  const remontado = reassemble(exFragment, 'cor', exCfg.solution);
  assert.match(remontado, /step\(0\.5, v_uv\.x\)/);
  assert.match(remontado, /gl_FragColor = vec4\(c, 1\.0\);/); // resto preservado
});

test('a pagina HTML do Modulo 1 contem os dois playgrounds e o exercicio', () => {
  const html = readFileSync('site/modulos/01-shaders-e-gpu.html', 'utf8');
  assert.ok(html.includes('id="pg-cor"'), 'falta pg-cor');
  assert.ok(html.includes('id="pg-ex"'), 'falta pg-ex');
  assert.ok(html.includes('>>> EDIT: cor'), 'falta sentinela editavel');
  assert.ok(html.includes('m1-meio-a-meio.png'), 'falta referencia do exercicio');
  assert.ok(html.includes('[IMAGEM:'), 'falta placeholder de imagem');
  // dispositivos Head First obrigatorios (§3 do spec)
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
