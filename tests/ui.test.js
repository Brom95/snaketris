// ui.test.js — the interface views: HUD readout per role, the game-over
// winner line, the records board markers, and the role sub-menu highlight.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const { game, resetGame, startGame, gameOver } = await import('../js/state.js');
const { toMenu } = await import('../js/screens.js');
const ui = await import('../js/ui.js');
const input = await import('../js/input.js');
const { ROLE_MARKERS, MENU, SELECT_ROLE, PLAYING, GAME_OVER, RECORDS } = await import('../js/constants.js');
const { FIELD_V_GAP, FIELD_V_GAP_MOBILE, BOARD_W, BOARD_H } = await import('../js/constants.js');

ui.initUi();

const scoreEl = stub.elements.score;
const statusEl = stub.elements.status;
const menuViewEl = stub.elements['menu-view'];
const roleViewEl = stub.elements['role-view'];
const recordsViewEl = stub.elements['records-view'];
const recordsListEl = stub.elements['records-list'];

function on(el) {
  return el.classList.has('on');
}

test('HUD shows both labelled scores and no role name in either role', () => {
  resetGame();
  game.play.role = 'tetris';
  startGame();
  game.play.snakeScore = 7;
  game.play.tetrisScore = 12;
  ui.syncViews([]);
  assert.equal(scoreEl.textContent, 'Snake 7  ·  Tetris 12');
  assert.ok(!scoreEl.textContent.includes('You'));

  resetGame();
  game.play.role = 'snake';
  startGame();
  game.play.snakeScore = 3;
  game.play.tetrisScore = 0;
  ui.syncViews([]);
  assert.equal(scoreEl.textContent, 'Snake 3  ·  Tetris 0');
});

test('game-over status names the winner and shows both final scores', () => {
  resetGame();
  game.play.role = 'tetris';
  startGame();
  game.play.snakeScore = 2;
  game.play.tetrisScore = 12;
  gameOver();
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Tetris wins'));
  assert.ok(statusEl.textContent.includes('Snake 2, Tetris 12'));

  resetGame();
  game.play.role = 'snake';
  startGame();
  game.play.snakeScore = 9;
  game.play.tetrisScore = 4;
  gameOver();
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Snake wins'));

  resetGame();
  game.play.role = 'tetris';
  startGame();
  game.play.snakeScore = 5;
  game.play.tetrisScore = 5;
  gameOver();
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Draw'));
});

test('a side that kills itself hands the win to the opponent whatever the scores', () => {
  resetGame();
  game.play.role = 'snake';
  startGame();
  game.play.snakeScore = 20;
  game.play.tetrisScore = 3;
  gameOver('snake-death');
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Tetris wins'));

  resetGame();
  game.play.role = 'tetris';
  startGame();
  game.play.snakeScore = 1;
  game.play.tetrisScore = 30;
  gameOver('top-out');
  ui.syncViews([]);
  assert.ok(statusEl.textContent.includes('Snake wins'));
});

test('every records entry carries its role marker, legacy entries included', () => {
  resetGame();
  game.screen.state = RECORDS;
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

test('the role screen replaces the menu screen and highlights the chosen role', () => {
  resetGame();
  game.screen.state = MENU;
  game.screen.menuSelect = 0;
  game.screen.roleSelect = 1;
  ui.syncViews([]);
  assert.ok(on(menuViewEl));
  assert.ok(!on(roleViewEl));
  assert.ok(on(stub.menuItems[0]));

  game.screen.state = SELECT_ROLE;
  ui.syncViews([]);
  assert.ok(!on(menuViewEl));
  assert.ok(on(roleViewEl));
  assert.ok(!on(stub.menuItems[0]));
  assert.ok(!on(stub.menuItems[1]));
  assert.ok(!on(stub.menuItems[2]));
  assert.ok(on(stub.roleItems[1]));
  assert.ok(!on(stub.roleItems[0]));

  game.screen.roleSelect = 0;
  ui.syncViews([]);
  assert.ok(on(stub.roleItems[0]));
  assert.ok(!on(stub.roleItems[1]));
});

test('the field and score are on screen only while playing or after game over', () => {
  resetGame();
  game.screen.state = MENU;
  ui.syncViews([]);
  assert.ok(!on(stub.elements['game']));
  assert.ok(!on(scoreEl));

  startGame();
  ui.syncViews([]);
  assert.equal(game.screen.state, PLAYING);
  assert.ok(on(stub.elements['game']));
  assert.ok(on(scoreEl));
  assert.ok(!on(statusEl));

  gameOver();
  ui.syncViews([]);
  assert.equal(game.screen.state, GAME_OVER);
  assert.ok(on(statusEl));

  toMenu();
  ui.syncViews([]);
  assert.equal(game.screen.state, MENU);
  assert.ok(!on(recordsViewEl));
});

test('the interface band and the field fit read one viewport rule', () => {
  stub.window.innerWidth = 360;
  stub.window.innerHeight = 740;
  const rule = ui.layoutRule();
  assert.equal(rule.stacked, true);
  assert.equal(rule.gap, FIELD_V_GAP_MOBILE);

  const band = ui.interfaceBandHeight();
  assert.equal(band, stub.elements.ui.getBoundingClientRect().height + FIELD_V_GAP_MOBILE);

  input.initInput(stub.canvas);
  input.fitCanvas(band);
  const scale = Math.min(
    stub.window.innerWidth / BOARD_W,
    (stub.window.innerHeight - 2 * rule.gap - band) / BOARD_H
  );
  assert.equal(stub.canvas.style.width, (BOARD_W * scale) + 'px');
  assert.equal(stub.canvas.style.height, (BOARD_H * scale) + 'px');
});
