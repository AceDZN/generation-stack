import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevelParam } from '../src/host.ts';

test('?level=N is 1-based and bounded by the authored levels', () => {
  assert.equal(parseLevelParam('?level=1', 18), 0);
  assert.equal(parseLevelParam('?level=18', 18), 17);
  assert.equal(parseLevelParam('?level=19', 18), null);
  assert.equal(parseLevelParam('?level=0', 18), null);
  assert.equal(parseLevelParam('?level=abc', 18), null);
  assert.equal(parseLevelParam('?level=2.5', 18), null);
  assert.equal(parseLevelParam('', 18), null);
});
