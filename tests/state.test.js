// state.test.js — restart-resets-everything, toMenu, gameOver.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const devices = await import('../js/devices.js');
const input = await import('../js/input.js');
const { loadBoard } = await import('../js/highscores.js');

// Wire the canvas into both input.js and devices.js (as initInput does in the real game).
input.initInput(stub.canvas);

function fresh() { state.resetGame(); }

test('restart→PLAYING (startGame) + resets both scores/snake', async () => {
  fresh();
  state.restart();
  assert.equal(state.game.state, 'PLAYING');
  assert.equal(state.game.snakeScore, 0);
  assert.equal(state.game.tetrisScore, 0);
  assert.equal(state.game.landedBlocks, 0);
  assert.equal(state.game.pieceMoveAcc, 0);
  assert.equal(state.game.snake.length, 3);
  assert.equal(state.game.snake[0].c, 6); // head at col 6
});

test('starting snake is three segments in a line on the middle row', () => {
  fresh();
  state.startGame();
  const mid = Math.floor(20 / 2);
  assert.deepEqual(state.game.snake, [
    { r: mid, c: 6 },
    { r: mid, c: 5 },
    { r: mid, c: 4 },
  ]);
});

test('restart after a game keeps three segments and zeroes both scores', () => {
  fresh();
  state.game.role = 'tetris';
  state.startGame();
  state.game.snakeScore = 7;
  state.game.tetrisScore = 12;
  state.game.landedBlocks = 30;
  state.game.completedPieces = 5;
  state.gameOver();
  state.startGame();
  assert.equal(state.game.state, 'PLAYING');
  assert.equal(state.game.snakeScore, 0);
  assert.equal(state.game.tetrisScore, 0);
  assert.equal(state.game.landedBlocks, 0);
  assert.equal(state.game.completedPieces, 0);
  assert.equal(state.game.snake.length, 3);
  assert.equal(state.game.role, 'tetris'); // role survives the reset
});

test('overflow counter is zero at start and clears on restart', () => {
  fresh();
  state.startGame();
  assert.equal(state.game.overflow, 0);
  state.game.overflow = 5;
  state.gameOver();
  state.startGame();
  assert.equal(state.game.overflow, 0);
});

test('gameOver records the score of the side the player played', () => {
  globalThis.localStorage.setItem('snaketris.highscores', '[]');
  fresh();
  state.game.role = 'tetris';
  state.startGame();
  state.game.snakeScore = 3;
  state.game.tetrisScore = 25;
  state.gameOver();
  const board = loadBoard();
  assert.equal(board.length, 1);
  assert.equal(board[0].score, 25);
  assert.equal(board[0].role, 'tetris');

  globalThis.localStorage.setItem('snaketris.highscores', '[]');
  fresh();
  state.game.role = 'snake';
  state.startGame();
  state.game.snakeScore = 9;
  state.game.tetrisScore = 2;
  state.gameOver();
  const board2 = loadBoard();
  assert.equal(board2[0].score, 9);
  assert.equal(board2[0].role, 'snake');
});

test('board tap while PLAYING steers (no crash)', async () => {
  fresh();
  state.startGame();
  devices.onPointerDown({ pointerId: 1, clientX: 120, clientY: 300 });
  input.onPointerUp({ pointerId: 1, clientX: 120, clientY: 300 });
  assert.equal(state.game.state, 'PLAYING');
});

test('R from PLAYING stays PLAYING (no crash)', async () => {
  fresh();
  state.startGame();
  input.onKey({ key: 'r', preventDefault() {} });
  assert.equal(state.game.state, 'PLAYING');
});

test('toMenu→MENU + menuSelect reset', async () => {
  fresh();
  state.startGame();
  state.toMenu();
  assert.equal(state.game.state, 'MENU');
  assert.equal(state.game.menuSelect, 0);
});

test('gameOver→GAME_OVER', async () => {
  fresh();
  state.startGame();
  state.gameOver();
  assert.equal(state.game.state, 'GAME_OVER');
});

// ---------- Two-player mode ----------
test('pickP1Role assigns P2 the remaining role and sets two-player mode', () => {
  fresh();
  state.pickP1Role('snake');
  assert.equal(state.game.p1Role, 'snake');
  assert.equal(state.game.p2Role, 'tetris');
  assert.equal(state.game.twoPlayerMode, true);

  state.resetGame();
  state.pickP1Role('tetris');
  assert.equal(state.game.p1Role, 'tetris');
  assert.equal(state.game.p2Role, 'snake');
});

test('resetGame clears the two-player fields', () => {
  fresh();
  state.pickP1Role('snake');
  assert.equal(state.game.twoPlayerMode, true);
  state.resetGame();
  assert.equal(state.game.p1Role, null);
  assert.equal(state.game.p2Role, null);
  assert.equal(state.game.twoPlayerMode, false);
});

test('gameOver in two-player mode records both sides', () => {
  globalThis.localStorage.setItem('snaketris.highscores', '[]');
  fresh();
  state.pickP1Role('snake');
  state.startGame();
  // startGame() re-runs resetGame which clears the flag; re-assert it.
  state.game.twoPlayerMode = true;
  state.game.snakeScore = 5;
  state.game.tetrisScore = 20;
  state.gameOver();
  const board = loadBoard();
  assert.equal(board.length, 2);
  // Sorted by score descending: tetris (20) first, snake (5) second.
  assert.equal(board[0].score, 20);
  assert.equal(board[0].role, 'tetris');
  assert.equal(board[1].score, 5);
  assert.equal(board[1].role, 'snake');
});

test('two-player game over keeps top-10', () => {
  globalThis.localStorage.setItem('snaketris.highscores', JSON.stringify(
    Array.from({ length: 10 }).map((_, i) => ({ score: i + 1, date: new Date().toISOString(), role: 'snake' }))
  ));
  fresh();
  state.pickP1Role('snake');
  state.startGame();
  state.game.twoPlayerMode = true;
  state.game.snakeScore = 50;
  state.game.tetrisScore = 60;
  state.gameOver();
  const board = loadBoard();
  assert.equal(board.length, 10); // still top-10 after two entries
});
