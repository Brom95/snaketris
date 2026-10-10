import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Static HTML entry (task 4.2 / 5.1): the single module tag, no inline game
// script, the CSS affordances, and the #status/#ui anchors. The SRS table
// integrity check covers the 7 types, their four states and the kick offsets.
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

test('static HTML: role screen has three selectable items, main menu four', () => {
  const roleBlock = html.match(/<ul id="role-items"[^>]*>([\s\S]*?)<\/ul>/);
  assert.ok(roleBlock, 'missing #role-items list');
  assert.equal((roleBlock[1].match(/<li/g) || []).length, 3);
  const menuBlock = html.match(/<ul id="menu-items">([\s\S]*?)<\/ul>/);
  assert.equal((menuBlock[1].match(/<li/g) || []).length, 4);
});

test('static HTML: role items carry the role markers', () => {
  assert.ok(html.includes('<li id="role-item-snake" tabindex="-1">\u{1F40D} Snake</li>'));
  assert.ok(html.includes('<li id="role-item-tetris" tabindex="-1">\u{1F3D7}\u{FE0F} Tetris</li>'));
});

test('static HTML: the role screen is its own view with a title and a Back item', () => {
  const roleView = html.match(/<div id="role-view" class="view">([\s\S]*?)<\/div>/);
  assert.ok(roleView, 'missing #role-view');
  assert.ok(roleView[1].includes('<h2 id="role-title">Choose your side</h2>'));
  assert.ok(roleView[1].includes('<ul id="role-items">'));
  assert.ok(roleView[1].includes('<li id="role-back" tabindex="-1">Back</li>'));
  // The role list is no longer inside the main menu view.
  const menuBlock = html.match(/<div id="menu-view" class="view">([\s\S]*?)<\/div>/);
  assert.ok(!menuBlock[1].includes('role-items'));
});

test('static CSS: selection changes only opacity, so item geometry is fixed', () => {
  assert.ok(html.includes("#menu-items li::before { content: '\\25b6 '; opacity: 0; }"));
  assert.ok(html.includes('#menu-items li.on::before { opacity: 1; }'));
  assert.ok(html.includes("#role-items li::before { content: '\\25b6 '; opacity: 0; }"));
  assert.ok(html.includes('#role-items li.on::before { opacity: 1; }'));
  assert.ok(!html.includes('#menu-items li.on { color: #a7f3a0; font-weight'));
  assert.ok(!html.includes('#role-items li.on { color: #a7f3a0; font-weight'));
  assert.ok(html.includes('#menu-items li { font-size: 20px; padding: 20px 0; }'));
  assert.ok(html.includes('#role-items li { font-size: 20px; padding: 12px 0; }'));
});

test('static HTML: help view documents roles, bot, blocked rotation, and every input device', () => {
  assert.ok(html.includes('Play — choose Snake or Tetris'));
  assert.ok(html.includes('shift and rotate the piece'));
  assert.ok(html.includes('The bot plays the side you did not choose.'));
  assert.ok(html.includes('A blocked rotation tries the wall kicks. If every kick fails, the rotation is ignored.'));
  assert.ok(html.includes('A piece may shift sideways once per snake step.'));
  assert.ok(html.includes('Snake role: D-pad or left stick — steer'));
  assert.ok(html.includes('Tetris role: D-pad left/right — shift, up/down — rotate, A — rotate clockwise'));
  assert.ok(html.includes('Controller: A — confirm, B — back'));
});

const C = await import(new URL('../js/constants.js', import.meta.url));

test('state machine includes the role-select state', () => {
  assert.equal(C.SELECT_ROLE, 'SELECT_ROLE');
  assert.equal(C.MENU_ITEMS.length, 4);
});

test('role items and markers are defined', () => {
  assert.deepEqual(C.ROLE_ITEMS, ['Snake', 'Tetris']);
  assert.deepEqual(C.ROLE_SCREEN_ITEMS, ['Snake', 'Tetris', 'Back']);
  assert.equal(C.ROLE_MARKERS.snake, '\u{1F40D}');
  assert.equal(C.ROLE_MARKERS.tetris, '\u{1F3D7}\u{FE0F}');
});

test('scoring constants', () => {
  assert.equal(C.PIECE_BONUS, 4);
  assert.equal(C.LINE_CLEAR_POINTS, 10);
});

test('snake cap and tier palette are defined', () => {
  assert.equal(C.MAX_SNAKE_LEN, 10);
  assert.equal(C.TIER_WIDTH, 9);
  assert.equal(C.COLORS.snakeHead, '#4ade80');
  assert.equal(C.COLORS.snakeBody, '#9ca3af');
  assert.equal(C.COLORS.tierBlue, '#2563eb');
  assert.equal(C.COLORS.tierPurple, '#8b5cf6');
  assert.equal(C.COLORS.tierGold, '#facc15');
});

test('SRS table integrity: 7 types, 4 states each, 5 kick offsets per turn', () => {
  assert.equal(C.PIECE_TYPES.length, 7);
  for (const type of C.PIECE_TYPES) {
    const states = C.TETROMINOES[type];
    assert.equal(states.length, 4, `${type} has no four states`);
    assert.equal(C.PIECE_BOX[type], type === 'I' ? 4 : type === 'O' ? 2 : 3);
    for (const state of states) {
      assert.equal(state.length, 4);
      for (const [dr, dc] of state) {
        assert.ok(Number.isInteger(dr) && Number.isInteger(dc));
      }
    }
  }
  assert.equal(Object.keys(C.SRS_KICKS).length, 16);
  for (const kicks of Object.values(C.SRS_KICKS)) {
    assert.equal(kicks.length, 5);
    for (const [dc, dr] of kicks) {
      assert.ok(Number.isInteger(dc) && Number.isInteger(dr));
    }
  }
});
