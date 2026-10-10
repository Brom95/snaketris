import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const app = await import(new URL('../js/app.js', import.meta.url));
const { game, resetGame, startGame } = await import(new URL('../js/state.js', import.meta.url));
const { moveSnake } = await import(new URL('../js/snake.js', import.meta.url));
const { currentFallSpeed, spawnPiece, clearFullRows, movePiece, rotatePiece, turnedShape, shapeInState, setPieceState, stepPiece, requestPieceShift, landPiece } = await import(new URL('../js/pieces.js', import.meta.url));
const { snakeTicksPerCell } = await import(new URL('../js/snake.js', import.meta.url));
const { setCell, getCell } = await import(new URL('../js/grid.js', import.meta.url));
const { TETROMINOES, PIECE_TYPES, EMPTY, SOLID, ROWS, COLS } = await import(new URL('../js/constants.js', import.meta.url));

function freshStart() { resetGame(); startGame(); }

// Cell offsets sorted by row then column, so two shapes compare as sets.
function cells(shape) {
  return [...shape].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

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

test('spawn owns an independent shape copy and starts in state 0', () => {
  const before = JSON.stringify(TETROMINOES);
  freshStart();
  game.pieces.length = 0;
  spawnPiece();
  const p = game.pieces[0];
  assert.ok(PIECE_TYPES.includes(p.type), 'spawned piece has no type');
  assert.equal(p.state, 0);
  assert.equal(p.shape.length, 4);
  assert.notEqual(p.shape, TETROMINOES[p.type][0], 'shape is the shared table array');
  p.shape.length = 0; // simulate the snake eating the piece down to nothing
  assert.equal(JSON.stringify(TETROMINOES), before, 'the table lost cells');
  game.pieces.length = 0;
  spawnPiece();
  assert.equal(game.pieces[0].shape.length, 4);
});

test('difficulty ramp: one step per three completed pieces, capped at 0.9', () => {
  game.completedPieces = 0;
  assert.ok(Math.abs(currentFallSpeed() - 0.04) < 1e-9);
  game.completedPieces = 2;
  assert.ok(Math.abs(currentFallSpeed() - 0.04) < 1e-9);
  game.completedPieces = 3;
  assert.ok(Math.abs(currentFallSpeed() - 0.04 * 1.08) < 1e-9);
  game.completedPieces = 5;
  assert.ok(Math.abs(currentFallSpeed() - 0.04 * 1.08) < 1e-9);
  game.completedPieces = 6;
  assert.ok(Math.abs(currentFallSpeed() - 0.04 * 1.08 * 1.08) < 1e-9);
  game.completedPieces = 123; // floor(123/3) = 41 tiers — past the 0.9 cap
  assert.ok(Math.abs(currentFallSpeed() - Math.min(0.9, 0.04 * Math.pow(1.08, 41))) < 1e-9);
});

test('line clear: full row clears, +10 to the Tetris side, no landed-block rollback', () => {
  freshStart();
  for (let c = 0; c < 10; c++) setCell(19, c, SOLID); // fill bottom row
  setCell(18, 3, SOLID); // a solid block above the cleared row
  game.landedBlocks = 50;
  const t0 = game.tetrisScore;
  const s0 = game.snakeScore;
  clearFullRows();
  assert.equal(getCell(19, 0), EMPTY);
  assert.equal(getCell(19, 9), EMPTY);
  assert.equal(game.tetrisScore, t0 + 10);
  assert.equal(game.snakeScore, s0); // the snake side is untouched
  assert.equal(game.landedBlocks, 50); // no rollback on clear
  // The solid block above the cleared row dropped by one.
  assert.equal(getCell(18, 3), EMPTY);
  assert.equal(getCell(19, 3), SOLID);
});

test('two full rows in one tick: blocks above both drop by two, snake stays put', () => {
  freshStart();
  // Fill rows 18 and 17 completely; a solid block sits at row 16 above both.
  for (let c = 0; c < 10; c++) { setCell(18, c, SOLID); setCell(17, c, SOLID); }
  setCell(16, 4, SOLID); // solid above both cleared rows
  game.snake = [{ r: 16, c: 5 }]; // a snake segment above both cleared rows
  const t0 = game.tetrisScore;
  const s0 = game.snakeScore;
  clearFullRows();
  // Both rows cleared.
  assert.equal(getCell(18, 0), EMPTY);
  assert.equal(getCell(17, 0), EMPTY);
  // The solid at row 16 dropped by two (one per cleared row) to row 18.
  assert.equal(getCell(16, 4), EMPTY);
  assert.equal(getCell(18, 4), SOLID);
  // Each cleared row awards +10; the snake side is untouched.
  assert.equal(game.tetrisScore, t0 + 20);
  assert.equal(game.snakeScore, s0);
  // Snake segments do not move on a line clear.
  assert.deepEqual(game.snake, [{ r: 16, c: 5 }]);
});

// ---------- Sideways shift ----------
function placePiece(shape, col, row, type = 'O', state = 0) {
  game.pieces.length = 0;
  game.pieces.push({ type, state, shape: shape.map(([dr, dc]) => [dr, dc]), col, row });
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

// ---------- Rotation (Super Rotation System) ----------
test('the table holds four states per piece, and O is identical in all four', () => {
  for (const type of PIECE_TYPES) {
    assert.equal(TETROMINOES[type].length, 4, `${type} has no four states`);
    for (const state of TETROMINOES[type]) {
      assert.equal(state.length, 4);
      for (const [dr, dc] of state) {
        assert.ok(Number.isInteger(dr) && Number.isInteger(dc));
      }
    }
  }
  assert.deepEqual(TETROMINOES.O[0], TETROMINOES.O[3]);
});

test('a quarter turn of the real cells reproduces the next table state', () => {
  for (const type of PIECE_TYPES) {
    for (let state = 0; state < 4; state++) {
      const turned = turnedShape(TETROMINOES[type][state], true, type);
      assert.deepEqual(cells(turned), cells(TETROMINOES[type][(state + 1) % 4]),
        `${type} state ${state} CW turn does not match state ${(state + 1) % 4}`);
    }
  }
});

test('rotatePiece: every piece turns legally in open space and returns to state 0 after four turns', () => {
  for (const type of PIECE_TYPES) {
    freshStart();
    const p = placePiece(TETROMINOES[type][0], 4, 10, type, 0);
    const original = cells(p.shape);
    for (let turn = 0; turn < 4; turn++) {
      assert.equal(rotatePiece(p, true), true, `${type} CW turn ${turn} rejected`);
      assert.equal(p.state, (turn + 1) % 4, `${type} state did not advance`);
      assert.equal(p.shape.length, 4);
      for (const [dr, dc] of p.shape) {
        const r = Math.floor(p.row + dr);
        const c = p.col + dc;
        assert.ok(r >= 0 && r < ROWS && c >= 0 && c < COLS, `${type} turned cell out of bounds: ${r},${c}`);
      }
    }
    assert.equal(p.state, 0);
    assert.deepEqual(cells(p.shape), original, `${type} did not return to its spawn shape`);
  }
});

test('the O rotation is a no-op: same cells, same anchor', () => {
  freshStart();
  const p = placePiece(TETROMINOES.O[0], 4, 10, 'O', 0);
  assert.equal(rotatePiece(p, true), true);
  assert.deepEqual(cells(p.shape), cells(TETROMINOES.O[0]));
  assert.equal(p.row, 10);
  assert.equal(p.col, 4);
});

test('a wall-blocked turn succeeds through a wall kick', () => {
  freshStart();
  // Vertical I anchored at col 7 occupies column 9. Turning it horizontal
  // would need columns 7..10, so the second kick moves the anchor to col 6.
  const p = placePiece(TETROMINOES.I[1], 7, 10, 'I', 1);
  assert.equal(rotatePiece(p, true), true, 'the kick was not tried');
  assert.equal(p.state, 2);
  assert.equal(p.col, 6);
  assert.equal(p.row, 10);
  assert.deepEqual(cells(p.shape), cells(TETROMINOES.I[2]));
});

test('a turn with every kick blocked leaves the piece unchanged', () => {
  for (const type of PIECE_TYPES) {
    freshStart();
    const p = placePiece(TETROMINOES[type][0], 4, 10, type, 0);
    // Fill the whole board solid except the cells the piece itself occupies.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) setCell(r, c, SOLID);
    }
    for (const [dr, dc] of p.shape) setCell(Math.floor(p.row + dr), p.col + dc, EMPTY);
    const before = JSON.stringify([cells(p.shape), p.row, p.col]);
    const accepted = rotatePiece(p, true);
    if (type === 'O') {
      assert.equal(accepted, true, 'the O no-op turn was rejected');
    } else {
      assert.equal(accepted, false, `${type} rotation accepted with no free cell`);
    }
    assert.equal(JSON.stringify([cells(p.shape), p.row, p.col]), before, 'piece changed on a rejected rotation');
  }
});

test('setPieceState walks single turns to the requested state', () => {
  freshStart();
  const p = placePiece(TETROMINOES.T[0], 4, 10, 'T', 0);
  assert.equal(setPieceState(p, 2), true);
  assert.equal(p.state, 2);
  assert.deepEqual(cells(p.shape), cells(TETROMINOES.T[2]));
  assert.equal(setPieceState(p, 0), true);
  assert.equal(p.state, 0);
  assert.deepEqual(cells(p.shape), cells(TETROMINOES.T[0]));
});

test('shapeInState reports a state without moving the piece', () => {
  freshStart();
  const p = placePiece(TETROMINOES.L[0], 4, 10, 'L', 0);
  const before = JSON.stringify([p.shape, p.row, p.col, p.state]);
  assert.deepEqual(cells(shapeInState(p, 3)), cells(TETROMINOES.L[3]));
  assert.equal(JSON.stringify([p.shape, p.row, p.col, p.state]), before);
});

test('rotation keeps cells the snake already ate gone', () => {
  freshStart();
  const p = placePiece(TETROMINOES.T[0], 4, 10, 'T', 0);
  p.shape.splice(0, 1); // the snake ate one cell of the falling piece
  assert.equal(rotatePiece(p, true), true);
  assert.equal(p.shape.length, 3, 'rotation resurrected an eaten cell');
});

test('a rotation does not interrupt the fall', () => {
  freshStart();
  game.completedPieces = 0;
  const p = placePiece(TETROMINOES.T[0], 4, 10, 'T', 0);
  const speed = currentFallSpeed();
  assert.equal(rotatePiece(p, true), true);
  const row = p.row;
  stepPiece(p);
  assert.ok(Math.abs(p.row - (row + speed)) < 1e-9, 'the piece did not fall one step after rotating');
});

// ---------- Shift cooldown gate ----------
test('shift gate: two presses inside one interval move the piece one cell', () => {
  freshStart();
  game.completedPieces = 0;
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
  game.completedPieces = 0;
  const p = placePiece([[0, 0], [0, 1]], 0, 10);
  game.pieceMoveAcc = snakeTicksPerCell();
  assert.equal(requestPieceShift(-1), false);
  assert.equal(game.pieceMoveAcc, snakeTicksPerCell());
  assert.equal(requestPieceShift(1), true);
  assert.equal(p.col, 1);
});

test('shift gate: the interval follows the speed ramp', () => {
  freshStart();
  game.completedPieces = 0;
  const base = snakeTicksPerCell();
  assert.ok(Math.abs(base - 23) < 1e-9);
  game.completedPieces = 123; // floor(123/3) = 41 tiers — past the 0.9 cap
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
