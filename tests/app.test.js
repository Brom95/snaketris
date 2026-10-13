// app.test.js — init wiring (rAF + buffer sizing), frame() integration,
// render() no-throw, full-loop invariants (growth vs score, ≤1 falling
// piece, valid state) and the engine system order.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const app = await import('../js/app.js');
const state = await import('../js/state.js');
const { snakeTicksPerCell } = await import('../js/snake.js');
const { MAX_SNAKE_LEN } = await import('../js/constants.js');

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
  // Growth pays one segment per eaten cell until the cap; cells past the cap
  // are overflow blocks. The whole-piece bonus pays score only, so
  // score - ((min(length, MAX_SNAKE_LEN) - 3) + overflow) is a multiple of
  // PIECE_BONUS.
  assert.ok(state.game.play.snake.length >= 3);
  const eaten = Math.min(state.game.play.snake.length, MAX_SNAKE_LEN) - 3 + state.game.play.overflow;
  assert.ok(state.game.play.snakeScore >= eaten);
  assert.equal((state.game.play.snakeScore - eaten) % 4, 0);
  // Sequential spawn: at most one falling piece.
  assert.ok(state.game.play.pieces.length <= 1);
  // State is valid (either still PLAYING or hit GAME_OVER).
  assert.ok(['PLAYING', 'GAME_OVER'].includes(state.game.screen.state));
});

test('engine order: the bot does not steer the snake in Snake role', async () => {
  state.resetGame();
  state.game.play.role = 'snake';
  state.startGame();
  const before = { r: 0, c: 1 };
  state.game.play.dir = before;
  state.game.play.nextDir = before;
  for (let t = 0; t < 60; t++) app.update();
  assert.deepEqual(state.game.play.dir, before);
  assert.deepEqual(state.game.play.nextDir, before);
});

test('the registry holds the screen system last and no painting step', async () => {
  assert.deepEqual(app.systems.map((s) => s.name), ['bot', 'snake', 'pieces', 'records', 'screen']);
  for (const s of app.systems) {
    assert.equal(typeof s.name, 'string');
    assert.equal(typeof s.update, 'function');
  }
});
