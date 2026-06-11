import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { toControlSpecs } from '../site/assets/playground/uniforms.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

test('demo da luz: esfera (mesh) com slider de direcao da luz', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'sphere',
    fragment: 'uniform float u_lang;\nvoid main(){ float d=max(dot(normalize(v_normal), vec3(0.0,1.0,0.0)),0.0); gl_FragColor=vec4(vec3(d),1.0); }',
    uniforms: [{ name: 'u_lang', label: 'direção da luz', min: 0, max: 6.2831, value: 0.8 }],
  });
  assert.equal(c.mesh, 'sphere');
  assert.ok(toControlSpecs(c.uniforms).some((s) => s.name === 'u_lang'));
});

test('Projeto-Vitoria 2: mesh cubo, textura, exportavel, sem reference', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'cube', texture: '../assets/tex/exemplo.png', exportable: true,
    fragment: 'void main(){ gl_FragColor = texture2D(u_tex, v_uv); }',
    editableRegions: ['arte'],
  });
  assert.equal(c.exportable, true);
  assert.equal(c.texture, '../assets/tex/exemplo.png');
  assert.equal(c.reference, null); // projeto aberto, sem pixel-diff
  assert.deepEqual(c.editableRegions, ['arte']);
});

test('regiao editavel "arte" do projeto remonta sem quebrar o frame', () => {
  const frag = `void main() {\n  vec3 N = normalize(v_normal);\n// >>> EDIT: arte\n  vec3 final = vec3(1.0);\n// <<< EDIT\n  gl_FragColor = vec4(final, 1.0);\n}`;
  const r = reassemble(frag, 'arte', '  vec3 final = texture2D(u_tex, v_uv).rgb;');
  assert.match(r, /texture2D\(u_tex, v_uv\)\.rgb/);
  assert.match(r, /vec3 N = normalize\(v_normal\);/);
  assert.match(r, /gl_FragColor = vec4\(final, 1\.0\);/);
});

test('a pagina do Modulo 10 tem os 2 playgrounds, o SVG, projeto exportavel e dispositivos', () => {
  const html = readFileSync('site/modulos/10-normais-e-luz.html', 'utf8');
  assert.ok(html.includes('id="pg-luz"'), 'falta pg-luz');
  assert.ok(html.includes('id="pg-projeto"'), 'falta pg-projeto');
  assert.ok(html.includes('exportable: true'), 'falta o flag exportable no projeto');
  assert.ok(html.includes('max(dot(N, L), 0.0)') || html.includes('max(dot(N,L), 0.0)'), 'falta a luz difusa');
  assert.ok(html.includes('normal-luz.svg'), 'falta o SVG normal/luz');
  assert.ok(!html.includes('reference:'), 'M10 nao tem pixel-diff (cena 3D iluminada)');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('M10 tem exercicio predict-observe da difusa: editavel + solution, SEM pixel-diff', () => {
  const html = readFileSync('site/modulos/10-normais-e-luz.html', 'utf8');
  assert.ok(html.includes('id="pg-exercicio"'), 'falta o exercicio predict-observe');
  assert.ok(html.includes("editableRegions: ['luz']"), 'falta a regiao editavel luz');
  assert.ok(html.includes('max(dot(N, L), 0.0)'), 'falta a solucao da difusa');
  assert.ok(!html.includes('reference:'), 'M10 e cena 3D: nenhum playground pode ter reference');
});
