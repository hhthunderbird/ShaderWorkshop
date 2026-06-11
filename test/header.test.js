import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withHeader, hasDeclaration, withHeaderMesh } from '../site/assets/playground/header.js';

test('injeta varying v_uv quando o shader USA mas nao declara (regressao do M1/M2)', () => {
  const src = `void main() {\n  vec3 c = vec3(v_uv.x, v_uv.y, 0.0);\n  gl_FragColor = vec4(c, 1.0);\n}`;
  const out = withHeader(src);
  assert.match(out, /varying vec2 v_uv;/);
  // a declaracao deve vir ANTES do main
  assert.ok(out.indexOf('varying vec2 v_uv;') < out.indexOf('void main'));
});

test('NAO duplica v_uv quando o aluno ja declarou', () => {
  const src = `varying vec2 v_uv;\nvoid main() { gl_FragColor = vec4(v_uv, 0.0, 1.0); }`;
  const out = withHeader(src);
  assert.equal(out.match(/varying vec2 v_uv;/g).length, 1);
});

test('injeta precision quando ausente, preserva quando presente', () => {
  assert.match(withHeader('void main(){}'), /^precision mediump float;/);
  const comPrec = 'precision highp float;\nvoid main(){}';
  assert.ok(!withHeader(comPrec).startsWith('precision mediump'));
});

test('NAO duplica uniform u_cor declarado pelo aluno (so usa, sem auto-uniforms)', () => {
  const src = `uniform vec3 u_cor;\nvoid main() { gl_FragColor = vec4(u_cor, 1.0); }`;
  const out = withHeader(src);
  assert.equal(out.match(/uniform vec3 u_cor;/g).length, 1); // nao mexe no do aluno
});

test('hasDeclaration distingue declaracao de mero uso', () => {
  assert.equal(hasDeclaration('varying vec2 v_uv;', 'v_uv'), true);
  assert.equal(hasDeclaration('vec3 c = vec3(v_uv.x, 0.0, 0.0);', 'v_uv'), false);
  assert.equal(hasDeclaration('uniform float u_time;', 'u_time'), true);
});

test('hasDeclaration detecta declaracao com qualificador de precisao (nao duplica)', () => {
  assert.equal(hasDeclaration('uniform mediump vec2 u_resolution;', 'u_resolution'), true);
  assert.equal(hasDeclaration('varying highp vec2 v_uv;', 'v_uv'), true);
  // e withHeader nao re-injeta nesse caso
  const src = 'uniform mediump vec2 u_resolution;\nvoid main(){ gl_FragColor = vec4(u_resolution, 0.0, 1.0); }';
  assert.equal((withHeader(src).match(/u_resolution;/g) || []).length, 1);
});

test('withHeaderMesh injeta varyings 3D e uniforms quando ausentes', () => {
  const src = `void main(){ gl_FragColor = vec4(v_normal * 0.5 + 0.5, 1.0); }`;
  const out = withHeaderMesh(src);
  assert.match(out, /varying vec3 v_normal;/);
  assert.match(out, /varying vec2 v_uv;/);
  assert.match(out, /varying vec3 v_worldPos;/);
  assert.match(out, /uniform vec3 u_lightDir;/);
  assert.ok(out.indexOf('varying vec3 v_normal;') < out.indexOf('void main'));
});

test('withHeaderMesh nao duplica o que o aluno ja declarou', () => {
  const src = `varying vec3 v_normal;\nvoid main(){ gl_FragColor = vec4(v_normal,1.0); }`;
  const out = withHeaderMesh(src);
  assert.equal((out.match(/varying vec3 v_normal;/g) || []).length, 1);
});

test('withHeaderMesh injeta uniform u_cameraPos quando ausente (specular do M12)', () => {
  const src = `void main(){ vec3 V = normalize(u_cameraPos - v_worldPos); gl_FragColor = vec4(V, 1.0); }`;
  const out = withHeaderMesh(src);
  assert.match(out, /uniform vec3 u_cameraPos;/);
  assert.ok(out.indexOf('uniform vec3 u_cameraPos;') < out.indexOf('void main'));
});

test('withHeaderMesh nao duplica u_cameraPos se o aluno ja declarou', () => {
  const src = `uniform vec3 u_cameraPos;\nvoid main(){ gl_FragColor = vec4(u_cameraPos, 1.0); }`;
  const out = withHeaderMesh(src);
  assert.equal((out.match(/uniform vec3 u_cameraPos;/g) || []).length, 1);
});

test('withHeader: precision do aluno vem ANTES dos uniforms injetados (senao: No precision specified)', () => {
  const src = `precision highp float;\nvoid main(){ gl_FragColor = vec4(v_uv, 0.0, 1.0); }`;
  const out = withHeader(src);
  assert.ok(out.indexOf('precision') < out.indexOf('uniform float u_time;'), 'precision deve vir antes dos uniforms');
  assert.equal((out.match(/precision\s+\w+\s+float/g) || []).length, 1, 'nao duplica precision');
  assert.ok(/^precision highp float;/.test(out), 'preserva a precision highp do aluno');
});

test('withHeaderMesh: precision do aluno vem antes dos uniforms (M12 specular)', () => {
  const src = `precision highp float;\nuniform float u_dureza;\nvoid main(){ gl_FragColor = vec4(vec3(u_dureza), 1.0); }`;
  const out = withHeaderMesh(src);
  assert.ok(out.indexOf('precision') < out.indexOf('uniform float u_time;'), 'precision antes dos uniforms');
  assert.equal((out.match(/precision\s+\w+\s+float/g) || []).length, 1, 'nao duplica precision');
});

test('splitPrecision tolera comentario de linha antes de precision (regressao FIX4)', () => {
  const src = `// minha versão\nprecision highp float;\nvoid main(){ gl_FragColor = vec4(1.0); }`;
  const out = withHeader(src);
  assert.equal((out.match(/precision\s+\w+\s+float/g) || []).length, 1, 'exatamente uma precision');
  assert.ok(/precision highp float/.test(out), 'deve ser highp');
  assert.ok(out.indexOf('precision highp float') < out.indexOf('uniform float u_time;'), 'precision antes de u_time');
});
