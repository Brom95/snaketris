import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const app = await import(new URL('../js/app.js', import.meta.url));
const { game, resetGame, startGame } = await import(new URL('../js/state.js', import.meta.url));
const { moveSnake } = await import(new URL('../js/snake.js', import.meta.url));
const { currentFallSpeed, spawnPiece, clearFullRows } = await import(new URL('../js/pieces.js', import.meta.url));
const { setCell, getCell } = await import(new URL('../js/grid.js', import.meta.url));
const { TETROMINOES, EMPTY, SOLID } = await import(new URL('../js/constants.js', import.meta.url));

function freshStart() { resetGame(); startGame(); }

test('sequential spawn: at most one falling piece at a time', () => {
  freshStart();
  let maxPieces = 0;
  for (let t = 0; t < 2000; t++) {
    app.update();
    maxPieces = Math.max(maxPieces, game.pieces.length);
    if (game.state === 'GAME_OVER') break;
  }
  assert.ok(maxPieces <= 1, `maxPieces=${maxPieces}`);
});

test('fully consumed piece is followed by a new spawn', () => {
  freshStart();
  const MID = Math.floor(20 / 2);
  const ps = game.pieces;
  ps.length = 0;
  ps.push({ shape: [[0, 0], [0, 1], [0, 2]], col: 7, row: MID }); // I over head path
  for (let i = 0; i < 3; i++) moveSnake();
  assert.equal(game.pieces.length, 0);
  assert.equal(game.score, 3);
  let spawned = false;
  for (let t = 0; t < 300; t++) {
    app.update();
    if (game.pieces.length > 0) { spawned = true; break; }
  }
  assert.ok(spawned, 'no new piece spawned');
});

test('spawn owns an independent shape copy', () => {
  const before = JSON.stringify(TETROMINOES);
  freshStart();
  game.pieces.length = 0;
  spawnPiece();
  const p = game.pieces[0];
  assert.equal(p.shape.length, 4);
  assert.ok(TETROMINOES.every((t) => t !== p.shape), 'shape is the shared TETROMINOES array');
  p.shape.length = 0; // simulate the snake eating the piece down to nothing
  assert.ok(TETROMINOES.every((t) => t.length === 4) && JSON.stringify(TETROMINOES) === before,
    'the table lost cells');
  game.pieces.length = 0;
  spawnPiece();
  assert.equal(game.pieces[0].shape.length, 4);
});

test('difficulty ramp: 0.04 -> 0.0432 -> ... -> 0.9', () => {
  game.landedBlocks = 0;
  assert.ok(Math.abs(currentFallSpeed() - 0.04) < 1e-9);
  game.landedBlocks = 4;
  assert.ok(Math.abs(currentFallSpeed() - 0.04) < 1e-9);
  game.landedBlocks = 5;
  assert.ok(Math.abs(currentFallSpeed() - 0.04 * 1.08) < 1e-9);
  game.landedBlocks = 9;
  assert.ok(Math.abs(currentFallSpeed() - 0.04 * 1.08) < 1e-9);
  game.landedBlocks = 10;
  assert.ok(Math.abs(currentFallSpeed() - 0.04 * 1.08 * 1.08) < 1e-9);
  game.landedBlocks = 100;
  assert.ok(Math.abs(currentFallSpeed() - Math.min(0.9, 0.04 * Math.pow(1.08, 20))) < 1e-9);
});

test('line clear: full row clears +10 score, -10 landedBlocks', () => {
  freshStart();
  for (let c = 0; c < 10; c++) setCell(19, c, SOLID); // fill bottom row
  game.landedBlocks = 50;
  const s0 = game.score;
  clearFullRows();
  assert.equal(getCell(19, 0), EMPTY);
  assert.equal(getCell(19, 9), EMPTY);
  assert.equal(game.score, s0 + 10);
  assert.equal(game.landedBlocks, 40);
  // Multiple full rows in one tick.
  for (let c = 0; c < 10; c++) { setCell(18, c, SOLID); setCell(17, c, SOLID); }
  clearFullRows();
  assert.equal(getCell(18, 0), EMPTY);
  assert.equal(getCell(17, 0), EMPTY);
  assert.equal(game.score, s0 + 30);
  assert.equal(game.landedBlocks, 20);
});
