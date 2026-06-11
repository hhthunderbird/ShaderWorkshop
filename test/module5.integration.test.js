import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

// Configs do Módulo 5 (espelham site/modulos/05-dando-vida-animacao.html).
const pulsoFragment = `uniform float u_vel;
void main() {
  float d = length(v_uv - vec2(0.5));
  float r = 0.25 + 0.12 * sin(u_time * u_vel);
  float shape = smoothstep(r, r - 0.02, d);
  vec3 cor = vec3(shape) * vec3(1.0, 0.35, 0.45);
  gl_FragColor = vec4(cor, 1.0);
}`;
const pulsoCfg = {
  mode: 'fragment',
  fragment: pulsoFragment,
  uniforms: [{ name: 'u_vel', label: 'velocidade', min: 0.2, max: 5.0, value: 2.0 }],
};

const projetoFragment = `uniform float u_vel;
void main() {
  float t = u_time * u_vel;
  vec2 p = v_uv;
// >>> EDIT: arte
  float d = length(p - vec2(0.5, 0.5));
  float pulso = 0.3 + 0.1 * sin(t);
  float forma = smoothstep(pulso, pulso - 0.02, d);
  vec3 cor = forma * vec3(0.6 + 0.4 * sin(t), 0.5, 1.0);
// <<< EDIT
  gl_FragColor = vec4(cor, 1.0);
}`;
const projetoCfg = {
  mode: 'fragment',
  fragment: projetoFragment,
  uniforms: [{ name: 'u_vel', label: 'velocidade', min: 0.2, max: 5.0, value: 1.5 }],
  editableRegions: ['arte'],
  exportable: true,
};

test('demo "pulso" usa u_time (animado) e tem slider de velocidade', () => {
  const c = normalizeConfig(pulsoCfg);
  assert.match(c.fragment, /sin\(u_time \* u_vel\)/);
  const specs = toControlSpecs(c.uniforms);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].kind, 'slider');
});

test('Projeto-Vitoria normaliza como exportavel, editavel, sem referencia', () => {
  const c = normalizeConfig(projetoCfg);
  assert.equal(c.exportable, true);
  assert.deepEqual(c.editableRegions, ['arte']);
  assert.equal(c.reference, null); // projeto aberto: sem pixel-diff
});

test('regiao editavel "arte" extrai o template e remonta sem quebrar o frame', () => {
  const inner = extractRegion(projetoFragment, 'arte');
  assert.match(inner, /float forma = smoothstep/);
  const remontado = reassemble(projetoFragment, 'arte', '  vec3 cor = vec3(1.0, 0.0, 0.0);');
  assert.match(remontado, /vec3 cor = vec3\(1\.0, 0\.0, 0\.0\);/);
  assert.match(remontado, /float t = u_time \* u_vel;/);       // setup preservado
  assert.match(remontado, /gl_FragColor = vec4\(cor, 1\.0\);/); // saida preservada
});

test('a pagina HTML do Modulo 5 tem os playgrounds, o projeto exportavel e os dispositivos', () => {
  const html = readFileSync('site/modulos/05-dando-vida-animacao.html', 'utf8');
  assert.ok(html.includes('id="pg-pulso"'), 'falta pg-pulso');
  assert.ok(html.includes('id="pg-projeto"'), 'falta pg-projeto');
  assert.ok(html.includes('exportable: true'), 'falta o flag exportable no projeto');
  assert.ok(html.includes('>>> EDIT: arte'), 'falta sentinela do projeto');
  assert.ok(html.includes('relogio.svg'), 'falta o SVG do fluxo u_time');
  assert.ok(!html.includes('reference:'), 'M5 nao deve ter pixel-diff (projeto aberto)');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
