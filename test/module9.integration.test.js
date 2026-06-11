import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { extractRegion, reassemble } from '../site/assets/playground/editable.js';

test('demo 2D de textura: modo fragment com config.texture e sampler', () => {
  const c = normalizeConfig({
    mode: 'fragment',
    texture: '../assets/tex/exemplo.png',
    fragment: 'uniform sampler2D u_tex;\nvoid main(){ gl_FragColor = texture2D(u_tex, v_uv); }',
  });
  assert.equal(c.texture, '../assets/tex/exemplo.png');
});

test('demo 3D: cubo texturizado (mesh + texture)', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'cube', texture: '../assets/tex/exemplo.png',
    fragment: 'void main(){ gl_FragColor = texture2D(u_tex, v_uv); }',
  });
  assert.equal(c.mode, 'mesh');
  assert.equal(c.texture, '../assets/tex/exemplo.png');
});

test('exercicio fract: regiao editavel "repete" remonta com a solucao', () => {
  const frag = `void main() {\n// >>> EDIT: repete\n  vec3 c = vec3(v_uv.x);\n// <<< EDIT\n  gl_FragColor = vec4(c, 1.0);\n}`;
  assert.match(extractRegion(frag, 'repete'), /vec3 c = vec3\(v_uv\.x\);/);
  const r = reassemble(frag, 'repete', '  vec3 c = vec3(fract(v_uv.x * 3.0));');
  assert.match(r, /fract\(v_uv\.x \* 3\.0\)/);
  assert.match(r, /gl_FragColor = vec4\(c, 1\.0\);/);
});

test('a referencia PNG do M9 e a textura de exemplo existem e sao PNGs validos', () => {
  for (const f of ['site/assets/ref/m9-fract-uv.png', 'site/assets/tex/exemplo.png']) {
    const buf = readFileSync(f);
    assert.deepEqual([...buf.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], f);
  }
});

test('a pagina do Modulo 9 tem os 3 playgrounds, a textura e os dispositivos', () => {
  const html = readFileSync('site/modulos/09-texturas-e-uv.html', 'utf8');
  assert.ok(html.includes('id="pg-tex"'), 'falta pg-tex');
  assert.ok(html.includes('id="pg-cubo-tex"'), 'falta pg-cubo-tex');
  assert.ok(html.includes('id="pg-ex"'), 'falta pg-ex');
  assert.ok(html.includes("texture: '../assets/tex/exemplo.png'"), 'falta a textura de exemplo');
  assert.ok(html.includes('m9-fract-uv.png'), 'falta referencia do exercicio');
  assert.ok(html.includes('uv-molde.svg'), 'falta o SVG do molde UV');
  for (const cls of ['afie', 'brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
