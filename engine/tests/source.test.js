// engine/tests/source.test.js — the seeded source contract.
// A draw is a function of (seed, call count): no hidden state, no browser
// entropy, so two runs over one seed answer the same values in the same order.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { nextValue, nextInRange } from '../js/source.js';

test('one seed and one call count answer one value', async () => {
  const first = nextValue(20240601, 0);
  const again = nextValue(20240601, 0);
  assert.strictEqual(first, again);
  assert.ok(Number.isInteger(first), 'the answer is an integer');
});

test('two runs with one seed draw five equal values in the same order', async () => {
  const seed = 20240601;
  const runA = [0, 1, 2, 3, 4].map((callCount) => nextValue(seed, callCount));
  const runB = [0, 1, 2, 3, 4].map((callCount) => nextValue(seed, callCount));
  assert.deepEqual(runA, runB);
  assert.equal(new Set(runA).size, 5, 'one seed answers five distinct values');
});

test('a seed changes only the sequence', async () => {
  const atZero = nextValue(20240601, 0);
  const otherSeed = nextValue(20240602, 0);
  assert.notEqual(atZero, otherSeed);
  const callCount = 7;
  assert.equal(nextValue(20240601, callCount), nextValue(20240601, callCount));
});

test('the source answers a non-negative 31-bit integer', async () => {
  for (const callCount of [0, 1, 5, 40, 999]) {
    const value = nextValue(20240601, callCount);
    assert.ok(value >= 0 && value < 2 ** 31, 'the answer is a non-negative 31-bit integer');
    assert.ok(Number.isInteger(value), 'the answer has no fractional part');
  }
});

test('nextInRange stays inside the bound', async () => {
  for (const bound of [1, 7, 10, 100]) {
    for (const callCount of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const drawn = nextInRange(20240601, callCount, bound);
      assert.ok(drawn >= 0 && drawn < bound, `the draw ${drawn} sits inside the bound ${bound}`);
    }
  }
});

test('a bound of zero or less answers zero and never throws', async () => {
  assert.strictEqual(nextInRange(20240601, 0, 0), 0);
  assert.strictEqual(nextInRange(20240601, 3, -4), 0);
});

test('the source reads no browser entropy', async () => {
  const src = await readFile(new URL('../js/source.js', import.meta.url), 'utf8');
  assert.strictEqual(src.includes('Math.random'), false);
  assert.strictEqual(src.includes('Date.now'), false);
  assert.strictEqual(src.includes('performance.'), false);
});
