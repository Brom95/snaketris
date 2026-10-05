// app.test.js — init wiring (rAF + buffer sizing), frame() integration,
// render() no-throw, and full-loop invariants (snake length = 4+score,
// ≤1 falling piece, valid state).
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const app = await import('../js/app.js');
const state = await import('../js/state.js');

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
  // Classic growth: snake length = 4 + score.
  assert.equal(state.game.snake.length, 4 + state.game.score);
  // Sequential spawn: at most one falling piece.
  assert.ok(state.game.pieces.length <= 1);
  // State is valid (either still PLAYING or hit GAME_OVER).
  assert.ok(['PLAYING', 'GAME_OVER'].includes(state.game.state));
});
