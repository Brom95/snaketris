import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Static HTML entry (task 4.2 / 5.1): the single module tag, no inline game
// script, the CSS affordances, and the #status/#ui anchors. The TETROMINOES
// table integrity is the 7 classic tetrominoes as [dr, dc] offsets, each 4
// cells.
const html = readFileSync(fileURLToPath(new URL('../snaketris.html', import.meta.url)), 'utf8');

test('static HTML: module entry point present', () => {
  assert.ok(html.includes('<script type="module" src="js/app.js">'));
});

test('static HTML: no inline game script', () => {
  assert.ok(!html.match(/<script>\s*\/\/ snaketris/));
});

test('static HTML: touch-action none', () => {
  assert.ok(html.includes('touch-action: none'));
});

test('static HTML: user-select none', () => {
  assert.ok(html.includes('user-select: none'));
});

test('static HTML: -webkit-user-select none', () => {
  assert.ok(html.includes('-webkit-user-select: none'));
});

test('static HTML: -webkit-touch-callout none', () => {
  assert.ok(html.includes('-webkit-touch-callout: none'));
});

test('static HTML: #status line present', () => {
  assert.ok(html.includes('#status'));
});

test('static HTML: #ui interface column present', () => {
  assert.ok(html.includes('#ui'));
});

const { TETROMINOES } = await import(new URL('../js/constants.js', import.meta.url));

test('TETROMINOES table integrity (7 tetrominoes, each 4 cells)', () => {
  assert.equal(TETROMINOES.length, 7);
  for (const t of TETROMINOES) {
    assert.equal(t.length, 4);
    for (const [dr, dc] of t) {
      assert.ok(Number.isInteger(dr) && Number.isInteger(dc));
    }
  }
});
