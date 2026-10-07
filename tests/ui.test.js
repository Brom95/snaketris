// ui.test.js — the interface views: HUD readout per role, the game-over
// winner line, the records board markers, and the role sub-menu highlight.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const { game, resetGame, startGame, gameOver, toMenu } = await import('../js/state.js');
const ui = await import('../js/ui.js');
const { ROLE_MARKERS, MENU, SELECT_ROLE, PLAYING, GAME_OVER, RECORDS } = await import('../js/constants.js');

ui.initUi();

const scoreEl = stub.elements.score;
const statusEl = stub.elements.status;
const menuViewEl = stub.elements['menu-view'];
const roleListEl = stub.elements['role-items'];
const recordsViewEl = stub.elements['records-view'];
const recordsListEl = stub.elements['records-list'];

function on(el) {
  return el.classList.has('on');
}

test('HUD shows both labelled scores and no role name in either role', () => {
  resetGame();
  game.role = 'tetris';
  startGame();
  game.snakeScore = 7;
  game.tetrisScore = 12;
  ui.syncViews([]);
  assert.equal(scoreEl.textContent, 'Snake 7  ·  Tetris 12');
  assert.ok(!scoreEl.textContent.includes('You'));

  resetGame();
  game.role = 'snake';
  startGame();
  game.snakeScore = 3;
  game.tetrisScore = 0;
  ui.syncViews([]);
  assert.equal(scoreEl.textContent, 'Snake 3  ·  Tetris 0');
});

test('game-over status names the winner and shows both final scores', () => {
  resetGame();
  game.role = 'tetris';
  startGame();
  game.snakeScore = 2;
  game.tetrisScore = 12;
  gameOver();
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Tetris wins'));
  assert.ok(statusEl.textContent.includes('Snake 2, Tetris 12'));

  resetGame();
  game.role = 'snake';
  startGame();
  game.snakeScore = 9;
  game.tetrisScore = 4;
  gameOver();
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Snake wins'));

  resetGame();
  game.role = 'tetris';
  startGame();
  game.snakeScore = 5;
  game.tetrisScore = 5;
  gameOver();
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Draw'));
});

test('every records entry carries its role marker, legacy entries included', () => {
  resetGame();
  game.state = RECORDS;
  ui.syncViews([
    { score: 40, date: '2024-01-01T00:00:00.000Z' },
    { score: 25, date: '2026-09-01T00:00:00.000Z', role: 'tetris' },
    { score: 9, date: '2026-09-02T00:00:00.000Z', role: 'snake' },
  ]);
  const rows = recordsListEl.children.map((li) => li.textContent);
  assert.equal(rows.length, 3);
  assert.ok(rows[0].startsWith(ROLE_MARKERS.snake));
  assert.ok(rows[1].startsWith(ROLE_MARKERS.tetris));
  assert.ok(rows[2].startsWith(ROLE_MARKERS.snake));
});

test('the role list is visible only in SELECT_ROLE and follows roleSelect', () => {
  resetGame();
  game.state = MENU;
  game.menuSelect = 0;
  game.roleSelect = 1;
  ui.syncViews([]);
  assert.ok(on(menuViewEl));
  assert.ok(!on(roleListEl));
  assert.ok(on(stub.menuItems[0]));

  game.state = SELECT_ROLE;
  ui.syncViews([]);
  assert.ok(on(menuViewEl));
  assert.ok(on(roleListEl));
  assert.ok(!on(stub.menuItems[0]));
  assert.ok(!on(stub.menuItems[1]));
  assert.ok(!on(stub.menuItems[2]));
  assert.ok(on(stub.roleItems[1]));
  assert.ok(!on(stub.roleItems[0]));

  game.roleSelect = 0;
  ui.syncViews([]);
  assert.ok(on(stub.roleItems[0]));
  assert.ok(!on(stub.roleItems[1]));
});

test('the field and score are on screen only while playing or after game over', () => {
  resetGame();
  game.state = MENU;
  ui.syncViews([]);
  assert.ok(!on(stub.elements['game']));
  assert.ok(!on(scoreEl));

  startGame();
  ui.syncViews([]);
  assert.equal(game.state, PLAYING);
  assert.ok(on(stub.elements['game']));
  assert.ok(on(scoreEl));
  assert.ok(!on(statusEl));

  gameOver();
  ui.syncViews([]);
  assert.equal(game.state, GAME_OVER);
  assert.ok(on(statusEl));

  toMenu();
  ui.syncViews([]);
  assert.equal(game.state, MENU);
  assert.ok(!on(recordsViewEl));
});
