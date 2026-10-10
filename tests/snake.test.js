import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const { game, resetGame, startGame } = await import(new URL('../js/state.js', import.meta.url));
const { moveSnake, snakeTicksPerCell, consumePieceAtHead } = await import(new URL('../js/snake.js', import.meta.url));
const { pieceTicksPerCell } = await import(new URL('../js/pieces.js', import.meta.url));
const { MAX_SNAKE_LEN } = await import(new URL('../js/constants.js', import.meta.url));

function freshStart() { resetGame(); startGame(); }

// A straight snake on the middle row, one segment short of the cap, head at
// column 6 moving right.
function cappedSnake() {
  const MID = Math.floor(20 / 2);
  game.snake = [];
  for (let i = 0; i < MAX_SNAKE_LEN - 1; i += 1) game.snake.push({ r: MID, c: 6 - i });
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
  game.pieces.length = 0;
}

test('speed relationship: snake always strictly faster than a falling piece', () => {
  for (let n = 0; n <= 200; n += 1) {
    game.completedPieces = n;
    const st = snakeTicksPerCell();
    const pt = pieceTicksPerCell();
    assert.ok(st < pt, `landed=${n} st=${st} pt=${pt}`);
  }
});

test('speed relationship: snake interval = 23 at base', () => {
  game.completedPieces = 0;
  assert.ok(Math.abs(snakeTicksPerCell() - 23) < 1e-9);
});

test('speed relationship: snake interval = 1 at cap', () => {
  game.completedPieces = 123; // floor(123/3) = 41 tiers — past the 0.9 cap
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

test('growth stops at the cap and the extra cell is recorded as overflow', () => {
  freshStart();
  cappedSnake();
  const MID = Math.floor(20 / 2);
  game.pieces.push({ shape: [[0, 0], [0, 1], [0, 2]], col: 7, row: MID });
  const s0 = game.snakeScore;

  moveSnake(); // 9 segments -> 10 (the cap)
  assert.equal(game.snake.length, MAX_SNAKE_LEN);
  assert.equal(game.overflow, 0);

  moveSnake(); // at the cap: the cell is eaten, the length stays 10
  assert.equal(game.snake.length, MAX_SNAKE_LEN);
  assert.equal(game.overflow, 1);
  assert.equal(game.snakeScore, s0 + 2);
});

test('a capped head still vacates its tail, so it may step onto the tail cell', () => {
  freshStart();
  const MID = Math.floor(20 / 2);
  // Head at column 1, tail at column 0: the head steps left onto the tail cell.
  game.snake = [
    { r: MID, c: 1 }, { r: MID, c: 2 }, { r: MID, c: 3 }, { r: MID, c: 4 },
    { r: MID, c: 5 }, { r: MID, c: 6 }, { r: MID, c: 7 }, { r: MID, c: 8 },
    { r: MID, c: 9 }, { r: MID, c: 0 },
  ];
  game.dir = { r: 0, c: -1 };
  game.nextDir = { r: 0, c: -1 };
  game.pieces.length = 0;
  game.pieces.push({ shape: [[0, 0]], col: 0, row: MID });

  moveSnake();
  assert.equal(game.state, 'PLAYING');
  assert.equal(game.snake.length, MAX_SNAKE_LEN);
  assert.equal(game.overflow, 1);
  assert.deepEqual(game.snake[0], { r: MID, c: 0 });
});

test('a piece falling onto a capped head records overflow instead of growing', () => {
  freshStart();
  const MID = Math.floor(20 / 2);
  // A full-length snake at the cap: head at column 6, tail wrapped to column 8.
  game.snake = [
    { r: MID, c: 6 }, { r: MID, c: 5 }, { r: MID, c: 4 }, { r: MID, c: 3 },
    { r: MID, c: 2 }, { r: MID, c: 1 }, { r: MID, c: 0 }, { r: MID, c: 9 },
    { r: MID, c: 8 }, { r: MID, c: 7 },
  ];
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
  game.pieces.length = 0;
  // The piece occupies the head's own cell.
  game.pieces.push({ shape: [[0, 0]], col: 6, row: MID });

  const eaten = consumePieceAtHead();
  assert.equal(eaten, 1);
  assert.equal(game.snake.length, MAX_SNAKE_LEN);
  assert.equal(game.overflow, 1);
  assert.equal(game.snakeScore, 5); // 1 cell + the whole-piece bonus
});
