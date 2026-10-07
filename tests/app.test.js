// app.test.js — init wiring (rAF + buffer sizing), frame() integration,
// render() no-throw, full-loop invariants (growth vs score, ≤1 falling
// piece, valid state) and the engine system order.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const app = await import('../js/app.js');
const state = await import('../js/state.js');
const { chooseBotDir } = await import('../js/bot.js');
const { snakeTicksPerCell } = await import('../js/snake.js');

test('init wired rAF (rafCb === frame)', async () => {
  assert.equal(stub.rafCb(), app.frame);
});

test('canvas buffer sized to COLS×CELL × ROWS×CELL', async () => {
  assert.equal(stub.canvas.width, 240); // COLS * CELL
  assert.equal(stub.canvas.height, 480); // ROWS * CELL
});

test('frame() integration no-throw (3 frames)', async () => {
  state.startGame();
  for (let t = 0; t < 3; t++) {
    app.frame(t * 16.67); // ~16ms apart
  }
  assert.equal(true, true); // no-throw
});

test('render() no-throw', async () => {
  const render = await import('../js/render.js');
  state.startGame();
  render.render();
  assert.equal(true, true); // no-throw
});

test('full-loop invariants (1000 ticks)', async () => {
  state.resetGame();
  state.startGame();
  for (let t = 0; t < 1000; t++) {
    app.update();
  }
  // Growth pays one segment per eaten cell; the whole-piece bonus pays score
  // only, so score - (length - 3) is a multiple of PIECE_BONUS.
  assert.ok(state.game.snake.length >= 3);
  assert.ok(state.game.snakeScore >= state.game.snake.length - 3);
  assert.equal((state.game.snakeScore - (state.game.snake.length - 3)) % 4, 0);
  // Sequential spawn: at most one falling piece.
  assert.ok(state.game.pieces.length <= 1);
  // State is valid (either still PLAYING or hit GAME_OVER).
  assert.ok(['PLAYING', 'GAME_OVER'].includes(state.game.state));
});

test('engine order: the bot decides before the snake steps', async () => {
  state.resetGame();
  state.game.role = 'tetris';
  state.startGame();
  state.game.pieces.length = 0;
  // A piece resting directly above the head: the bot must turn up.
  state.game.pieces.push({ shape: [[0, 0], [0, 1], [1, 0], [1, 1]], col: 6, row: 9 });
  state.game.snakeAcc = snakeTicksPerCell() - 1; // the snake steps this tick
  app.update();
  assert.deepEqual(state.game.dir, { r: -1, c: 0 });
  assert.equal(state.game.snakeAcc, 0); // the snake stepped after the bot chose
});

test('engine order: the bot does not steer the snake in Snake role', async () => {
  state.resetGame();
  state.game.role = 'snake';
  state.startGame();
  const before = { r: 0, c: 1 };
  state.game.dir = before;
  state.game.nextDir = before;
  for (let t = 0; t < 60; t++) app.update();
  assert.deepEqual(state.game.dir, before);
  assert.deepEqual(state.game.nextDir, before);
});
