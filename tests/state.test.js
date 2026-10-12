// state.test.js — restart-resets-everything, toMenu, gameOver.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const screens = await import('../js/screens.js');
const { SELECT_ROLE } = await import('../js/constants.js');
const devices = await import('../js/devices.js');
const input = await import('../js/input.js');

// Wire the canvas into both input.js and devices.js (as initInput does in the real game).
input.initInput(stub.canvas);

function fresh() { state.resetGame(); }

test('restart→PLAYING (startGame) + resets both scores/snake', async () => {
  fresh();
  state.restart();
  assert.equal(state.game.screen.state, 'PLAYING');
  assert.equal(state.game.play.snakeScore, 0);
  assert.equal(state.game.play.tetrisScore, 0);
  assert.equal(state.game.play.landedBlocks, 0);
  assert.equal(state.game.play.pieceMoveAcc, 0);
  assert.equal(state.game.play.snake.length, 3);
  assert.equal(state.game.play.snake[0].c, 6); // head at col 6
});

test('starting snake is three segments in a line on the middle row', () => {
  fresh();
  state.startGame();
  const mid = Math.floor(20 / 2);
  assert.deepEqual(state.game.play.snake, [
    { r: mid, c: 6 },
    { r: mid, c: 5 },
    { r: mid, c: 4 },
  ]);
});

test('restart after a game keeps three segments and zeroes both scores', () => {
  fresh();
  state.game.play.role = 'tetris';
  state.startGame();
  state.game.play.snakeScore = 7;
  state.game.play.tetrisScore = 12;
  state.game.play.landedBlocks = 30;
  state.game.play.completedPieces = 5;
  state.gameOver();
  state.startGame();
  assert.equal(state.game.screen.state, 'PLAYING');
  assert.equal(state.game.play.snakeScore, 0);
  assert.equal(state.game.play.tetrisScore, 0);
  assert.equal(state.game.play.landedBlocks, 0);
  assert.equal(state.game.play.completedPieces, 0);
  assert.equal(state.game.play.snake.length, 3);
  assert.equal(state.game.play.role, 'tetris'); // role survives the reset
});

test('overflow counter is zero at start and clears on restart', () => {
  fresh();
  state.startGame();
  assert.equal(state.game.play.overflow, 0);
  state.game.play.overflow = 5;
  state.gameOver();
  state.startGame();
  assert.equal(state.game.play.overflow, 0);
});

test('gameOver reports the score of the side the player played', () => {
  fresh();
  state.game.play.role = 'tetris';
  state.startGame();
  state.game.play.snakeScore = 3;
  state.game.play.tetrisScore = 25;
  state.gameOver();
  assert.deepEqual(state.game.play.result, [{ score: 25, role: 'tetris' }]);

  fresh();
  state.game.play.role = 'snake';
  state.startGame();
  state.game.play.snakeScore = 9;
  state.game.play.tetrisScore = 2;
  state.gameOver();
  assert.deepEqual(state.game.play.result, [{ score: 9, role: 'snake' }]);
});

test('board tap while PLAYING steers (no crash)', async () => {
  fresh();
  state.startGame();
  devices.onPointerDown({ pointerId: 1, clientX: 120, clientY: 300 });
  input.onPointerUp({ pointerId: 1, clientX: 120, clientY: 300 });
  assert.equal(state.game.screen.state, 'PLAYING');
});

test('R from PLAYING stays PLAYING (no crash)', async () => {
  fresh();
  state.startGame();
  input.onKey({ key: 'r', preventDefault() {} });
  assert.equal(state.game.screen.state, 'PLAYING');
});

test('toMenu→MENU + menuSelect reset', async () => {
  fresh();
  state.startGame();
  screens.toMenu();
  assert.equal(state.game.screen.state, 'MENU');
  assert.equal(state.game.screen.menuSelect, 0);
});

test('gameOver→GAME_OVER', async () => {
  fresh();
  state.startGame();
  state.gameOver();
  assert.equal(state.game.screen.state, 'GAME_OVER');
});

// ---------- Two-player mode ----------
test('pickP1Role assigns P2 the remaining role and sets two-player mode', () => {
  fresh();
  screens.pickP1Role('snake');
  assert.equal(state.game.screen.p1Role, 'snake');
  assert.equal(state.game.screen.p2Role, 'tetris');
  assert.equal(state.game.screen.twoPlayerMode, true);

  state.resetGame();
  screens.pickP1Role('tetris');
  assert.equal(state.game.screen.p1Role, 'tetris');
  assert.equal(state.game.screen.p2Role, 'snake');
});

test('resetGame clears the two-player fields', () => {
  fresh();
  screens.pickP1Role('snake');
  assert.equal(state.game.screen.twoPlayerMode, true);
  state.resetGame();
  assert.equal(state.game.screen.p1Role, null);
  assert.equal(state.game.screen.p2Role, null);
  assert.equal(state.game.screen.twoPlayerMode, false);
});

test('gameOver in two-player mode reports both sides', () => {
  fresh();
  screens.pickP1Role('snake');
  state.startGame();
  // startGame() re-runs resetGame which clears the flag; re-assert it.
  state.game.screen.twoPlayerMode = true;
  state.game.play.snakeScore = 5;
  state.game.play.tetrisScore = 20;
  state.gameOver();
  assert.deepEqual(state.game.play.result, [
    { score: 5, role: 'snake' },
    { score: 20, role: 'tetris' },
  ]);
});

// The top-10 board write is asserted in tests/records.test.js: the records
// layer, not the core, performs it.

// ---------- Single-key-press control lock ----------
test('a layout key locks both selection and model in one call', () => {
  fresh();
  const ok = screens.lockControlModel(1, 'wasd');
  assert.equal(ok, true);
  // The same key press sets the selection AND the locked model at once.
  assert.equal(state.game.screen.p1Selection, 'wasd');
  assert.equal(state.game.screen.p1Model, 'wasd');
});

test('re-assigning then locking replaces the previous model', () => {
  fresh();
  screens.lockControlModel(1, 'wasd');
  assert.equal(state.game.screen.p1Model, 'wasd');
  // Reassign clears the locked model, so a fresh key press can replace it.
  screens.reassignP1();
  assert.equal(state.game.screen.p1Model, null);
  screens.lockControlModel(1, 'arrows');
  assert.equal(state.game.screen.p1Model, 'arrows');
});

test('locking both players advances currentControlPlayer to null', () => {
  fresh();
  assert.equal(screens.currentControlPlayer(), 1);
  screens.lockControlModel(1, 'wasd');
  assert.equal(screens.currentControlPlayer(), 2);
  screens.lockControlModel(2, 'arrows');
  assert.equal(screens.currentControlPlayer(), null);
});

test('conflict error when P2 picks same keyboard layout as P1', () => {
  fresh();
  screens.lockControlModel(1, 'wasd');
  const result = screens.lockControlModel(2, 'wasd');
  assert.equal(result, false);
  assert.equal(state.game.screen.controlError, 'P2: cannot use the same layout as P1');
});

test('gamepad is shareable when P1 already uses a keyboard layout', () => {
  fresh();
  screens.lockControlModel(1, 'wasd');
  // P2 may reuse the gamepad model even though P1 locked a keyboard layout.
  const result = screens.lockControlModel(2, 'gamepad');
  assert.equal(result, true);
  assert.equal(state.game.screen.controlError, '');
  assert.equal(state.game.screen.p2Model, 'gamepad');
});

// ---------- The split halves ----------
test('a write to one half changes no field of the other half', () => {
  fresh();
  state.startGame();
  const screenBefore = JSON.parse(JSON.stringify(state.game.screen));
  state.game.play.snakeScore = 11;
  state.game.play.snake = [{ r: 1, c: 1 }];
  state.game.play.tick = 9;
  assert.deepEqual(state.game.screen, screenBefore);

  const playBefore = JSON.parse(JSON.stringify(state.game.play));
  state.game.screen.menuSelect = 3;
  state.game.screen.state = 'HELP';
  state.game.screen.p2Model = 'gamepad';
  assert.deepEqual(state.game.play, playBefore);
});

test('backToRoleSelect writes the shared screen constant, not a raw string', () => {
  fresh();
  screens.backToRoleSelect();
  assert.equal(state.game.screen.state, SELECT_ROLE);
});
