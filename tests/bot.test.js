// bot.test.js — the bot opponent: snake pursuit policy, piece placement
// policy, and the shared-rule/throttle constraints on its actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';
import { startIn } from './helpers/game.js';

installDomStub();
const { game } = await import('../js/state.js');
const { chooseBotDir, choosePieceMove, botSystem } = await import('../js/bot.js');
const { setCell, getCell } = await import('../js/grid.js');
const { SOLID, COLS, ROWS, MAX_FALL, TETROMINOES } = await import('../js/constants.js');
const { snakeTicksPerCell } = await import('../js/snake.js');
const { piecesSystem, requestPieceShift, currentFallSpeed } = await import('../js/pieces.js');

// A fresh game with no falling piece, so each test controls the piece itself.
function freshStart(role) {
  startIn('PLAYING', role);
  game.pieces.length = 0;
  return game;
}

function placePiece(shape, col, row, type = 'O', state = 0) {
  game.pieces.length = 0;
  game.pieces.push({ type, state, shape: shape.map(([dr, dc]) => [dr, dc]), col, row });
  return game.pieces[0];
}

// Cell offsets sorted by row then column, so two shapes compare as sets.
function cells(shape) {
  return [...shape].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

// ---------- Snake pursuit ----------
test('bot never reverses: the reverse of the current direction is never chosen', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 }; // heading east
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 2, 10); // piece west of the head
  const dir = chooseBotDir();
  assert.notDeepEqual(dir, { r: 0, c: -1 }, 'bot chose the reverse direction');
});

test('bot steers toward the nearest piece cell', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 6, 9); // directly above the head
  assert.deepEqual(chooseBotDir(), { r: -1, c: 0 });
});

test('bot skips a direction blocked by a solid block', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  setCell(10, 7, SOLID); // the cell east of the head
  placePiece([[0, 0], [0, 1]], 7, 10); // target east of the head
  const dir = chooseBotDir();
  assert.notDeepEqual(dir, { r: 0, c: 1 }, 'bot walked into a solid block');
  assert.ok(getCell(10 + dir.r, 6 + dir.c) !== SOLID);
});

test('bot skips a direction blocked by its own body', () => {
  freshStart('tetris');
  game.dir = { r: 1, c: 0 };
  game.snake = [{ r: 10, c: 6 }, { r: 10, c: 5 }, { r: 10, c: 4 }];
  placePiece([[0, 0], [0, 1]], 5, 10); // nearest cell is the body cell (10,5)
  const dir = chooseBotDir();
  assert.notDeepEqual(dir, { r: 0, c: -1 }, 'bot stepped onto its own body');
  assert.ok(!game.snake.slice(1, -1).some((s) => s.r === 10 + dir.r && s.c === 6 + dir.c));
});

test('bot keeps the current direction when there is no piece', () => {
  freshStart('tetris');
  game.dir = { r: 1, c: 0 };
  assert.deepEqual(chooseBotDir(), { r: 1, c: 0 });
});

test('bot keeps the current direction when the piece is entirely above the board', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 4, -5);
  assert.deepEqual(chooseBotDir(), { r: 0, c: 1 });
});

test('bot keeps the current direction when every direction is unsafe', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  setCell(9, 6, SOLID);
  setCell(11, 6, SOLID);
  setCell(10, 5, SOLID);
  setCell(10, 7, SOLID);
  placePiece([[0, 0], [0, 1]], 2, 2);
  assert.deepEqual(chooseBotDir(), { r: 0, c: 1 });
});

test('bot prefers the tied direction that still leaves an exit', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  setCell(10, 7, SOLID); // east is blocked, so up and down tie on distance
  // Trap the cell below the head so down has no exit.
  setCell(12, 6, SOLID);
  setCell(11, 5, SOLID);
  setCell(11, 7, SOLID);
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 0, 10);
  assert.deepEqual(chooseBotDir(), { r: -1, c: 0 });
});

test('chooseBotDir is deterministic', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 3, 12);
  const a = chooseBotDir();
  const b = chooseBotDir();
  assert.deepEqual(a, b);
});

test('bot steers the snake only in Tetris role, through the shared steering path', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 6, 9);
  botSystem.update({});
  assert.deepEqual(game.nextDir, { r: -1, c: 0 });

  freshStart('snake');
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 6, 9);
  botSystem.update({});
  assert.deepEqual(game.nextDir, { r: 0, c: 1 }); // untouched
});

test('bot obeys the no-reverse rule like the player', () => {
  freshStart('tetris');
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 2, 10); // target west
  botSystem.update({});
  assert.notDeepEqual(game.nextDir, { r: 0, c: -1 });
});

// ---------- Piece placement ----------
test('bot chooses the placement that completes a row', () => {
  freshStart('snake');
  for (let c = 2; c < COLS; c++) setCell(19, c, SOLID); // bottom row missing cols 0-1
  const p = placePiece(TETROMINOES.O[0], 5, 10, 'O', 0);
  const target = choosePieceMove(p);
  assert.equal(target.col, 0);
  assert.equal(target.state, 0);
});

test('bot turns the piece when the turned shape scores better', () => {
  freshStart('snake');
  for (let c = 0; c < COLS - 1; c++) setCell(19, c, SOLID); // bottom row missing col 9
  const p = placePiece(TETROMINOES.I[0], 6, 10, 'I', 0); // horizontal I
  const target = choosePieceMove(p);
  assert.equal(target.state, 1); // vertical I fills the missing cell
  assert.equal(target.col, 7);
});

test('bot takes exactly one action per decision: one shift toward the target column', () => {
  freshStart('snake');
  for (let c = 2; c < COLS; c++) setCell(19, c, SOLID);
  const p = placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 5, 10);
  game.pieceMoveAcc = snakeTicksPerCell();
  botSystem.update({});
  assert.equal(p.col, 4); // one step toward col 0
  botSystem.update({}); // the gate blocks a second step in the same interval
  assert.equal(p.col, 4);
});

test('bot turns the piece in place when it is already in the target column', () => {
  freshStart('snake');
  for (let c = 0; c < COLS - 1; c++) setCell(19, c, SOLID); // bottom row missing col 9
  const p = placePiece(TETROMINOES.I[0], 7, 10, 'I', 0);
  botSystem.update({});
  assert.equal(p.state, 1, 'the bot did not rotate');
  assert.equal(p.col, 7);
  assert.deepEqual(cells(p.shape), cells(TETROMINOES.I[1]));
});

test('bot issues no piece action in Tetris role', () => {
  freshStart('tetris');
  const p = placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 5, 10);
  const before = JSON.stringify([p.shape, p.col, p.row]);
  game.pieceMoveAcc = snakeTicksPerCell();
  botSystem.update({});
  assert.equal(JSON.stringify([p.shape, p.col, p.row]), before);
});

test('bot does nothing when no piece is falling', () => {
  freshStart('snake');
  game.pieceMoveAcc = snakeTicksPerCell();
  botSystem.update({});
  assert.equal(game.pieces.length, 0);
});

test('bot does nothing outside PLAYING', () => {
  freshStart('snake');
  game.state = 'MENU';
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 5, 10);
  game.pieceMoveAcc = snakeTicksPerCell();
  botSystem.update({});
  assert.equal(game.pieces[0].col, 5);
});

test('choosePieceMove is deterministic', () => {
  freshStart('snake');
  const p = placePiece(TETROMINOES.T[0], 3, 8, 'T', 0);
  const a = choosePieceMove(p);
  const b = choosePieceMove(p);
  assert.deepEqual(a, b);
});

test('equal rows: the bot prefers the placement with no hole', () => {
  freshStart('snake');
  // Rows 10..19 are solid outside cols 4, 5 and 6. Col 4 is solid only from
  // row 18, cols 5 and 6 from row 16. The O piece can only start in col 4 or
  // col 5, and both land at the same height and complete the same two rows
  // (18 and 19). Only the col 4 choice covers the empty cells at (16, 4) and
  // (17, 4), so it buries two holes.
  for (let r = 10; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c !== 4 && c !== 5 && c !== 6) setCell(r, c, SOLID);
    }
  }
  for (let r = 18; r < ROWS; r++) setCell(r, 4, SOLID);
  for (let r = 16; r < ROWS; r++) {
    setCell(r, 5, SOLID);
    setCell(r, 6, SOLID);
  }
  const p = placePiece(TETROMINOES.O[0], 4, 10, 'O', 0);
  const target = choosePieceMove(p);
  assert.equal(target.state, 0);
  assert.equal(target.col, 5, 'the bot avoided the column that buries a hole');
  // 2 full rows (18, 19), 0 holes, stack height 10.
  assert.equal(target.score, 10 * 2 - 2 * 0 - 10);
});

test('equal score ties break by rotation index then column', () => {
  freshStart('snake');
  const p = placePiece(TETROMINOES.O[0], 5, 10, 'O', 0);
  const target = choosePieceMove(p);
  assert.equal(target.state, 0);
  assert.equal(target.col, 0);
});

// Lateral speed parity: the bot and the player share the pieceMoveAcc gate.
function countShifts(drive, ticks) {
  let count = 0;
  for (let t = 0; t < ticks; t++) {
    const before = game.pieces[0].col;
    drive();
    piecesSystem.update({});
    if (game.pieces[0].col !== before) count += 1;
  }
  return count;
}

function parityRun(role, ticks, landedBlocks) {
  freshStart(role);
  game.landedBlocks = landedBlocks;
  for (let c = 2; c < COLS; c++) setCell(19, c, SOLID); // target column is 0
  placePiece([[0, 0], [0, 1], [1, 0], [1, 1]], 5, 10);
  game.pieceMoveAcc = 0;
  const drive = role === 'snake'
    ? () => botSystem.update({})
    : () => requestPieceShift(-1);
  return countShifts(drive, ticks);
}

test('bot lateral speed equals the player lateral speed at base speed', () => {
  assert.equal(snakeTicksPerCell(), 23);
  const byBot = parityRun('snake', 47, 0);
  const byPlayer = parityRun('tetris', 47, 0);
  assert.equal(byBot, byPlayer);
  assert.ok(byBot > 0, 'no sideways move happened at all');
});

test('bot lateral speed equals the player lateral speed at the ramped cap', () => {
  const byBot = parityRun('snake', 6, 205);
  const byPlayer = parityRun('tetris', 6, 205);
  assert.equal(currentFallSpeed(), MAX_FALL);
  assert.equal(snakeTicksPerCell(), 1);
  assert.equal(byBot, byPlayer);
  assert.ok(byBot > 0);
});
