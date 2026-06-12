import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyFor, save, load } from '../site/assets/playground/localstore.js';

// mock de Storage sobre um Map
function mockStorage() {
  const m = new Map();
  return {
    setItem: (k, v) => m.set(k, String(v)),
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    removeItem: (k) => m.delete(k),
  };
}
// mock que sempre lança (localStorage bloqueado / quota)
const throwingStorage = {
  setItem: () => { throw new Error('quota'); },
  getItem: () => { throw new Error('blocked'); },
  removeItem: () => { throw new Error('blocked'); },
};

test('keyFor: deterministico, com prefixo, distingue ids', () => {
  assert.equal(keyFor('/m/12.html', 'pg-projeto'), 'shaderworkshop:/m/12.html#pg-projeto');
  assert.equal(keyFor('/m/12.html', 'pg-projeto'), keyFor('/m/12.html', 'pg-projeto'));
  assert.notEqual(keyFor('/m/12.html', 'pg-a'), keyFor('/m/12.html', 'pg-b'));
  assert.notEqual(keyFor('/m/10.html', 'pg-projeto'), keyFor('/m/12.html', 'pg-projeto'));
});

test('save/load: roundtrip e sobrescrita', () => {
  const s = mockStorage();
  const k = keyFor('/a.html', 'pg-x');
  assert.equal(load(s, k), null);            // ausente -> null
  assert.equal(save(s, k, 'float a = 0.5;'), true);
  assert.equal(load(s, k), 'float a = 0.5;');
  assert.equal(save(s, k, 'float a = 0.9;'), true);  // sobrescreve
  assert.equal(load(s, k), 'float a = 0.9;');
});

test('degrada em silencio: storage que lança nao propaga', () => {
  const k = keyFor('/a.html', 'pg-x');
  assert.equal(save(throwingStorage, k, 'x'), false);
  assert.equal(load(throwingStorage, k), null);
});
