import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('M16: demo pg-alpha com backdrop xadrez + slider de alpha', () => {
  const html = readFileSync('site/modulos/16-transparencia.html', 'utf8');
  assert.ok(html.includes('id="pg-alpha"'), 'falta o demo pg-alpha');
  assert.ok(html.includes("backdrop: 'xadrez'"), 'pg-alpha nao usa backdrop xadrez');
  assert.ok(html.includes('u_alpha'), 'falta o slider u_alpha');
});

test('M16: exercicio pg-ex predict-observe (editavel alpha + solution, SEM pixel-diff)', () => {
  const html = readFileSync('site/modulos/16-transparencia.html', 'utf8');
  assert.ok(html.includes('id="pg-ex"'), 'falta o exercicio pg-ex');
  assert.ok(html.includes("editableRegions: ['alpha']"), 'falta a regiao editavel alpha');
  assert.ok(html.includes('solution:'), 'falta a solution do exercicio');
  assert.ok(!html.includes('reference:'), 'M16 nao deve ter reference (sem pixel-diff)');
});

test('M16: e modulo bonus (breadcrumb Bonus, NAO conta nos 14) + Cuidado de ordem', () => {
  const html = readFileSync('site/modulos/16-transparencia.html', 'utf8');
  assert.ok(html.includes('🎁 Bônus'), 'falta o breadcrumb de Bonus');
  assert.ok(!/de 14/.test(html), 'modulo bonus NAO deve se numerar "de 14"');
  assert.ok(html.includes('class="cuidado"'), 'falta o Cuidado de ordem de desenho');
});
