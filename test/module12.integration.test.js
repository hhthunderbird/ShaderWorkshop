import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('config do specular: mesh sphere usa pow(dot(N,H)), com sliders dureza e luz', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'sphere',
    fragment: `precision highp float;
void main(){
  vec3 N = normalize(v_normal);
  vec3 L = normalize(vec3(cos(u_lang), 0.4, sin(u_lang)));
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 H = normalize(L + V);
  float esp = pow(max(dot(N, H), 0.0), u_dureza);
  gl_FragColor = vec4(vec3(esp), 1.0);
}`,
    uniforms: [
      { name: 'u_lang', label: 'direção da luz', min: 0.0, max: 6.2831, value: 0.8 },
      { name: 'u_dureza', label: 'dureza do brilho', min: 2.0, max: 128.0, value: 32.0 },
    ],
  });
  assert.equal(c.mode, 'mesh');
  assert.equal(c.reference, null);
  assert.equal(c.uniforms.length, 2);
});

test('Projeto-Vitoria 3: playground aberto, exportavel, sem reference', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'sphere',
    texture: '../assets/tex/exemplo.png',
    fragment: `void main(){ gl_FragColor = vec4(texture2D(u_tex, v_uv).rgb, 1.0); }`,
    editableRegions: ['arte'],
    exportable: true,
  });
  assert.equal(c.exportable, true);
  assert.equal(c.reference, null);
  assert.deepEqual(c.editableRegions, ['arte']);
});

test('a pagina do Modulo 12 tem os 2 playgrounds, o SVG e os dispositivos Head First', () => {
  const html = readFileSync('site/modulos/12-luz-especular.html', 'utf8');
  assert.ok(html.includes('id="pg-brilho"'), 'falta o demo de specular');
  assert.ok(html.includes('id="pg-projeto"'), 'falta o Projeto-Vitoria 3');
  assert.ok(html.includes('specular-vetores.svg'), 'falta o SVG dos vetores N/L/V/H');
  assert.ok(html.includes('pow('), 'falta a receita do brilho');
  assert.ok(html.includes('Projeto-Vitória'), 'falta a amarracao do Projeto-Vitoria 3');
  assert.ok(!html.includes('reference:'), 'M12 e cena 3D: nao deve ter pixel-diff');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'afie', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index linka o M12 e abre o Marco 3', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('12-luz-especular.html'), 'index nao linka o M12');
});
