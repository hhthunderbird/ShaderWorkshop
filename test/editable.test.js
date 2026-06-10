import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractRegion, reassemble } from '../curso/assets/playground/editable.js';

const SRC = [
  'void main() {',
  '// >>> EDIT: cor',
  '  vec3 c = vec3(1.0, 0.0, 0.0);',
  '// <<< EDIT',
  '  gl_FragColor = vec4(c, 1.0);',
  '}',
].join('\n');

test('extractRegion devolve so o miolo editavel', () => {
  assert.equal(extractRegion(SRC, 'cor'), '  vec3 c = vec3(1.0, 0.0, 0.0);');
});

test('extractRegion regiao inexistente lanca', () => {
  assert.throws(() => extractRegion(SRC, 'nao_existe'), /regiao/);
});

test('reassemble troca o miolo e preserva o resto', () => {
  const novo = reassemble(SRC, 'cor', '  vec3 c = vec3(0.0, 0.0, 1.0);');
  assert.ok(novo.includes('vec3(0.0, 0.0, 1.0)'));
  assert.ok(novo.includes('gl_FragColor = vec4(c, 1.0);'));
  assert.ok(!novo.includes('vec3(1.0, 0.0, 0.0)'));
  // sentinelas permanecem para edicoes futuras
  assert.ok(novo.includes('// >>> EDIT: cor'));
});
