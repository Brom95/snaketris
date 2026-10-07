import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const app = await import(new URL('../js/app.js', import.meta.url));
const { game, resetGame, startGame } = await import(new URL('../js/state.js', import.meta.url));
const { moveSnake } = await import(new URL('../js/snake.js', import.meta.url));
const { currentFallSpeed, spawnPiece, clearFullRows, movePiece, rotatePiece, requestPieceShift, landPiece } = await import(new URL('../js/pieces.js', import.meta.url));
const { snakeTicksPerCell } = await import(new URL('../js/snake.js', import.meta.url));
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
  assert.equal(game.snakeScore, 3 + 4); // 3 cells + whole-piece bonus
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

test('line clear: full row clears, +10 to the Tetris side, -10 landedBlocks', () => {
  freshStart();
  for (let c = 0; c < 10; c++) setCell(19, c, SOLID); // fill bottom row
  game.landedBlocks = 50;
  const t0 = game.tetrisScore;
  const s0 = game.snakeScore;
  clearFullRows();
  assert.equal(getCell(19, 0), EMPTY);
  assert.equal(getCell(19, 9), EMPTY);
  assert.equal(game.tetrisScore, t0 + 10);
  assert.equal(game.snakeScore, s0); // the snake side is untouched
  assert.equal(game.landedBlocks, 40);
  // Multiple full rows in one tick.
  for (let c = 0; c < 10; c++) { setCell(18, c, SOLID); setCell(17, c, SOLID); }
  clearFullRows();
  assert.equal(getCell(18, 0), EMPTY);
  assert.equal(getCell(17, 0), EMPTY);
  assert.equal(game.tetrisScore, t0 + 30);
  assert.equal(game.snakeScore, s0);
  assert.equal(game.landedBlocks, 20);
});

// ---------- Sideways shift ----------
function placePiece(shape, col, row) {
  game.pieces.length = 0;
  game.pieces.push({ shape: shape.map(([dr, dc]) => [dr, dc]), col, row });
  return game.pieces[0];
}

test('movePiece: a legal shift moves exactly one cell', () => {
  freshStart();
  const p = placePiece([[0, 0], [0, 1]], 4, 10);
  assert.equal(movePiece(p, 1), true);
  assert.equal(p.col, 5);
  assert.equal(movePiece(p, -1), true);
  assert.equal(p.col, 4);
});

test('movePiece: the left and right edges block a shift', () => {
  freshStart();
  const left = placePiece([[0, 0], [0, 1]], 0, 10);
  assert.equal(movePiece(left, -1), false);
  assert.equal(left.col, 0);
  const right = placePiece([[0, 0], [0, 1]], 9, 10);
  assert.equal(movePiece(right, 1), false);
  assert.equal(right.col, 9);
});

test('movePiece: a solid block in the target cell blocks the shift', () => {
  freshStart();
  const p = placePiece([[0, 0], [0, 1]], 4, 10);
  setCell(10, 5, SOLID);
  assert.equal(movePiece(p, 1), false);
  assert.equal(p.col, 4);
});

// ---------- Rotation ----------
test('rotatePiece: every shape rotates legally in open space', () => {
  for (const shape of TETROMINOES) {
    freshStart();
    const p = placePiece(shape, 4, 10);
    assert.equal(rotatePiece(p, true), true, 'CW rotation rejected');
    assert.equal(p.shape.length, 4);
    for (const [dr, dc] of p.shape) {
      const r = Math.floor(p.row + dr);
      const c = p.col + dc;
      assert.ok(r >= 0 && r < 20 && c >= 0 && c < 10, `rotated cell out of bounds: ${r},${c}`);
    }
    assert.equal(rotatePiece(p, false), true, 'CCW rotation back rejected');
    assert.equal(p.shape.length, 4);
  }
});

test('rotatePiece: a rotation that leaves the board is rejected', () => {
  for (const shape of TETROMINOES) {
    freshStart();
    // A piece anchored at the left edge whose rotated offsets reach a
    // negative column. The horizontal I has no cell below its anchor, so it
    // is turned vertical first.
    const base = shape.some(([dr]) => dr > 0) ? shape : shape.map(([dr, dc]) => [dc, -dr]);
    const p = placePiece(base, 0, 10);
    const before = JSON.stringify([p.shape, p.row, p.col]);
    assert.equal(rotatePiece(p, true), false, 'wall-blocked CW rotation accepted');
    assert.equal(JSON.stringify([p.shape, p.row, p.col]), before, 'piece changed on a rejected rotation');
  }
});

test('rotatePiece: a rotation into a solid block is rejected', () => {
  for (const shape of TETROMINOES) {
    freshStart();
    const p = placePiece(shape, 4, 10);
    // Fill the whole board solid except the cells the piece itself occupies.
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 10; c++) setCell(r, c, SOLID);
    }
    for (const [dr, dc] of p.shape) setCell(Math.floor(p.row + dr), p.col + dc, EMPTY);
    const before = JSON.stringify([p.shape, p.row, p.col]);
    assert.equal(rotatePiece(p, true), false, 'solid-blocked rotation accepted');
    assert.equal(JSON.stringify([p.shape, p.row, p.col]), before, 'piece changed on a rejected rotation');
  }
});

// ---------- Shift cooldown gate ----------
test('shift gate: two presses inside one interval move the piece one cell', () => {
  freshStart();
  game.landedBlocks = 0;
  const p = placePiece([[0, 0], [0, 1]], 4, 10);
  const interval = snakeTicksPerCell();
  game.pieceMoveAcc = interval;
  assert.equal(requestPieceShift(1), true);
  assert.equal(p.col, 5);
  assert.equal(requestPieceShift(1), false); // the interval was consumed
  assert.equal(p.col, 5);
  for (let i = 0; i < interval; i++) game.pieceMoveAcc += 1;
  assert.equal(requestPieceShift(1), true);
  assert.equal(p.col, 6);
});

test('shift gate: a blocked shift does not consume the interval', () => {
  freshStart();
  game.landedBlocks = 0;
  const p = placePiece([[0, 0], [0, 1]], 0, 10);
  game.pieceMoveAcc = snakeTicksPerCell();
  assert.equal(requestPieceShift(-1), false);
  assert.equal(game.pieceMoveAcc, snakeTicksPerCell());
  assert.equal(requestPieceShift(1), true);
  assert.equal(p.col, 1);
});

test('shift gate: the interval follows the speed ramp', () => {
  freshStart();
  game.landedBlocks = 0;
  const base = snakeTicksPerCell();
  assert.ok(Math.abs(base - 23) < 1e-9);
  game.landedBlocks = 205; // ramped to the 0.9 cap
  const fast = snakeTicksPerCell();
  assert.ok(Math.abs(fast - 1) < 1e-9);
  const p = placePiece([[0, 0], [0, 1]], 4, 10);
  game.pieceMoveAcc = 0;
  assert.equal(requestPieceShift(1), false);
  game.pieceMoveAcc = 1;
  assert.equal(requestPieceShift(1), true);
  assert.equal(p.col, 5);
});

// ---------- Landing and top-out ----------
test('landing pays the Tetris side +1 per solid cell and not the snake side', () => {
  freshStart();
  game.pieces.length = 0;
  const p = { shape: [[0, 0], [0, 1], [1, 0], [1, 1]], col: 4, row: 18 };
  game.pieces.push(p);
  const t0 = game.tetrisScore;
  const s0 = game.snakeScore;
  landPiece(p);
  assert.equal(game.tetrisScore, t0 + 4);
  assert.equal(game.snakeScore, s0);
  assert.equal(game.landedBlocks, 4);
  assert.equal(game.pieces.length, 0);
  assert.equal(game.state, 'PLAYING');
});

test('top-out: a piece that lands with no cell in the grid ends the game', () => {
  freshStart();
  game.pieces.length = 0;
  const p = { shape: [[0, 0], [0, 1], [1, 0], [1, 1]], col: 4, row: -2 }; // fully above row 0
  game.pieces.push(p);
  landPiece(p);
  assert.equal(game.state, 'GAME_OVER');
  assert.equal(game.landedBlocks, 0);
});

test('a partial landing does not end the game', () => {
  freshStart();
  game.pieces.length = 0;
  const p = { shape: [[0, 0], [0, 1], [1, 0], [1, 1]], col: 4, row: -1 }; // two cells above, two inside
  game.pieces.push(p);
  landPiece(p);
  assert.equal(game.state, 'PLAYING');
  assert.equal(game.landedBlocks, 2);
  assert.equal(game.tetrisScore, 2);
});
