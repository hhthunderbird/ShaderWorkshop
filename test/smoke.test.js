import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok } from '../curso/assets/playground/config.js';

test('harness vivo', () => {
  assert.equal(ok(), true);
});
