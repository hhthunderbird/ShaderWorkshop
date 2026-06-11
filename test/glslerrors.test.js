import { test } from 'node:test';
import assert from 'node:assert/strict';
import { friendlyError } from '../site/assets/playground/glslerrors.js';

test('undeclared identifier -> causa + token', () => {
  const d = friendlyError("ERROR: 0:3: 'cor' : undeclared identifier");
  assert.match(d, /não foi declarado/);
  assert.ok(d.includes('cor'));
});

test('syntax error -> fala de ponto-e-virgula/parenteses', () => {
  const d = friendlyError("ERROR: 0:5: '' : syntax error");
  assert.match(d, /digitação|ponto-e-vírgula|parêntese/);
});

test('tipos que nao batem (constructor)', () => {
  const d = friendlyError("ERROR: 0:4: 'constructor' : not enough data provided for construction");
  assert.match(d, /tipos/);
});

test('funcao inexistente -> dica de funcao com token', () => {
  const d = friendlyError("ERROR: 0:2: 'foo' : no matching overloaded function found");
  assert.match(d, /função/);
  assert.ok(d.includes('foo'));
});

test('redefinition -> declarado duas vezes', () => {
  const d = friendlyError("ERROR: 0:6: 'x' : redefinition");
  assert.match(d, /duas vezes/);
});

test('log irreconhecivel ou vazio -> fallback', () => {
  assert.match(friendlyError('algo estranho sem padrao'), /não compilou/);
  assert.match(friendlyError(''), /não compilou/);
});

test('undeclared sem token -> fallback sem aspas vazias', () => {
  const d = friendlyError("ERROR: 0:1: '' : undeclared identifier");
  assert.match(d, /não compilou/);
  assert.ok(!d.includes("''"));
});

test('pula WARNING e acha a primeira linha ERROR:', () => {
  const log = "WARNING: 0:1: blah\nERROR: 0:3: 'cor' : undeclared identifier";
  assert.match(friendlyError(log), /não foi declarado/);
});
