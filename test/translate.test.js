import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateToHLSL } from '../site/assets/playground/translate.js';

test('tipos vec -> float', () => {
  assert.equal(translateToHLSL('vec2 a; vec3 b; vec4 c;'), 'float2 a; float3 b; float4 c;');
});

test('matrizes mat -> floatNxN', () => {
  assert.equal(translateToHLSL('mat3 m; mat4 n;'), 'float3x3 m; float4x4 n;');
});

test('funcoes mix/fract/mod/texture2D', () => {
  assert.equal(
    translateToHLSL('mix(a,b,t); fract(x); mod(x,y); texture2D(s,uv);'),
    'lerp(a,b,t); frac(x); fmod(x,y); tex2D(s,uv);'
  );
});

test('gl_FragColor = X; vira return X;', () => {
  assert.equal(
    translateToHLSL('gl_FragColor = vec4(c, 1.0);'),
    'return float4(c, 1.0);'
  );
});

test('remove a linha precision', () => {
  assert.equal(
    translateToHLSL('precision mediump float;\nfloat x;'),
    'float x;'
  );
});

test('remove qualificador uniform', () => {
  assert.equal(translateToHLSL('uniform vec3 u_cor;'), 'float3 u_cor;');
});

test('nao troca dentro de identificadores (word boundary)', () => {
  assert.equal(translateToHLSL('float myvec3var = 1.0;'), 'float myvec3var = 1.0;');
  assert.equal(translateToHLSL('int modelo = 2;'), 'int modelo = 2;');
});

test('shader completo simples traduz coerente', () => {
  const glsl = `precision mediump float;
uniform vec3 u_cor;
void main() {
  vec3 c = mix(u_cor, vec3(1.0), 0.5);
  gl_FragColor = vec4(c, 1.0);
}`;
  const hlsl = translateToHLSL(glsl);
  assert.ok(hlsl.includes('float3 u_cor;'));
  assert.ok(hlsl.includes('lerp(u_cor, float3(1.0), 0.5)'));
  assert.ok(hlsl.includes('return float4(c, 1.0);'));
  assert.ok(!hlsl.includes('precision'));
  assert.ok(!hlsl.includes('gl_FragColor'));
});
