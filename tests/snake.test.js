import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const { game, resetGame, startGame } = await import(new URL('../js/state.js', import.meta.url));
const { moveSnake, snakeTicksPerCell } = await import(new URL('../js/snake.js', import.meta.url));
const { pieceTicksPerCell } = await import(new URL('../js/pieces.js', import.meta.url));

function freshStart() { resetGame(); startGame(); }

test('speed relationship: snake always strictly faster than a falling piece', () => {
  for (let n = 0; n <= 200; n += 1) {
    game.landedBlocks = n;
    const st = snakeTicksPerCell();
    const pt = pieceTicksPerCell();
    assert.ok(st < pt, `landed=${n} st=${st} pt=${pt}`);
  }
});

test('speed relationship: snake interval = 23 at base', () => {
  game.landedBlocks = 0;
  assert.ok(Math.abs(snakeTicksPerCell() - 23) < 1e-9);
});

test('speed relationship: snake interval = 1 at cap', () => {
  game.landedBlocks = 205;
  assert.ok(Math.abs(snakeTicksPerCell() - 1) < 1e-9);
});

test('eating +1 per cell + growth', () => {
  freshStart();
  const MID = Math.floor(20 / 2);
  const ps = game.pieces;
  ps.length = 0;
  ps.push({ shape: [[0, 0], [0, 1], [0, 2], [0, 3]], col: 7, row: MID }); // 4-cell piece in head path
  const s0 = game.snakeScore;
  moveSnake();
  assert.equal(game.snakeScore, s0 + 1);
  assert.equal(game.snake.length, 4);
  moveSnake();
  assert.equal(game.snakeScore, s0 + 2);
  assert.equal(game.snake.length, 5);
  moveSnake();
  assert.equal(game.snakeScore, s0 + 3);
  assert.equal(game.pieces.length, 1); // piece still has one cell
  assert.equal(game.snake.length, 6);
});

test('whole-piece bonus: +4 when the last cell of a piece is eaten', () => {
  freshStart();
  const MID = Math.floor(20 / 2);
  const ps = game.pieces;
  ps.length = 0;
  ps.push({ shape: [[0, 0], [0, 1], [0, 2]], col: 7, row: MID }); // 3-cell piece in head path
  const s0 = game.snakeScore;
  moveSnake();
  moveSnake();
  moveSnake();
  assert.equal(game.pieces.length, 0);
  assert.equal(game.snakeScore, s0 + 3 + 4); // 3 cells + whole-piece bonus
  assert.equal(game.tetrisScore, 0);
  // Growth pays for cells only, not for the bonus.
  assert.equal(game.snake.length, 3 + 3);
});
