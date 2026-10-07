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

test('static HTML: role sub-menu has exactly two items, main menu three', () => {
  const roleBlock = html.match(/<ul id="role-items"[^>]*>([\s\S]*?)<\/ul>/);
  assert.ok(roleBlock, 'missing #role-items list');
  assert.equal((roleBlock[1].match(/<li/g) || []).length, 2);
  const menuBlock = html.match(/<ul id="menu-items">([\s\S]*?)<\/ul>/);
  assert.equal((menuBlock[1].match(/<li/g) || []).length, 3);
});

test('static HTML: role items carry the role markers', () => {
  assert.ok(html.includes('<li id="role-item-snake" tabindex="-1">\u{1F40D} Snake</li>'));
  assert.ok(html.includes('<li id="role-item-tetris" tabindex="-1">\u{1F3D7}\u{FE0F} Tetris</li>'));
});

test('static HTML: help view documents roles, bot, blocked rotation, and every input device', () => {
  assert.ok(html.includes('Play — choose Snake or Tetris'));
  assert.ok(html.includes('shift and rotate the piece'));
  assert.ok(html.includes('The bot plays the side you did not choose.'));
  assert.ok(html.includes('A rotation that hits a wall or a block is ignored.'));
  assert.ok(html.includes('A piece may shift sideways once per snake step.'));
  assert.ok(html.includes('Snake role: D-pad or left stick — steer'));
  assert.ok(html.includes('Tetris role: D-pad left/right — shift, up/down — rotate'));
  assert.ok(html.includes('Controller: A — confirm, B — back'));
});

const C = await import(new URL('../js/constants.js', import.meta.url));

test('state machine includes the role-select state', () => {
  assert.equal(C.SELECT_ROLE, 'SELECT_ROLE');
  assert.equal(C.MENU_ITEMS.length, 3);
});

test('role items and markers are defined', () => {
  assert.deepEqual(C.ROLE_ITEMS, ['Snake', 'Tetris']);
  assert.equal(C.ROLE_MARKERS.snake, '\u{1F40D}');
  assert.equal(C.ROLE_MARKERS.tetris, '\u{1F3D7}\u{FE0F}');
});

test('scoring constants', () => {
  assert.equal(C.PIECE_BONUS, 4);
  assert.equal(C.LINE_CLEAR_POINTS, 10);
});

test('TETROMINOES table integrity (7 tetrominoes, each 4 cells)', () => {
  assert.equal(C.TETROMINOES.length, 7);
  for (const t of C.TETROMINOES) {
    assert.equal(t.length, 4);
    for (const [dr, dc] of t) {
      assert.ok(Number.isInteger(dr) && Number.isInteger(dc));
    }
  }
});
