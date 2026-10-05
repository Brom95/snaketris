// state.test.js — restart-resets-everything, toMenu, gameOver.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const devices = await import('../js/devices.js');
const input = await import('../js/input.js');

// Wire the canvas into both input.js and devices.js (as initInput does in the real game).
input.initInput(stub.canvas);

function fresh() { state.resetGame(); }

test('restart→PLAYING (startGame) + resets score/snake', async () => {
  fresh();
  state.restart();
  assert.equal(state.game.state, 'PLAYING');
  assert.equal(state.game.score, 0);
  assert.equal(state.game.landedBlocks, 0);
  assert.equal(state.game.snake.length, 4);
  assert.equal(state.game.snake[0].c, 6); // head at col 6
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
