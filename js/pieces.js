// Piece lifecycle + difficulty ramp.
import { COLS, ROWS, EMPTY, SOLID, TETROMINOES, BASE_FALL, MAX_FALL, SPAWN_INTERVAL, PLAYING, LINE_CLEAR_POINTS } from './constants.js';
import { game, gameOver } from './state.js';
import { getCell, setCell } from './grid.js';
import { consumePieceAtHead, snakeTicksPerCell } from './snake.js';

// Difficulty ramp: fall speed (cells/tick) ticks up one step every five
// landed blocks, from BASE_FALL, capped at MAX_FALL.
export function currentFallSpeed() {
  const tier = Math.floor(game.landedBlocks / 5);
  return Math.min(MAX_FALL, BASE_FALL * Math.pow(1.08, tier));
}

// Ticks a falling piece needs to advance one cell.
export function pieceTicksPerCell() {
  return 1 / currentFallSpeed();
}

// Cells a falling piece currently occupies, clipped to the grid.
export function pieceCells(p) {
  const cells = [];
  for (const [dr, dc] of p.shape) {
    const r = Math.floor(p.row + dr);
    const c = p.col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      cells.push({ r, c });
    }
  }
  return cells;
}

// True when a shape at (row, col) would leave the left/right edges or the
// bottom, or overlap a solid cell. Cells above the top edge are free fall.
export function shapeFits(shape, row, col) {
  for (const [dr, dc] of shape) {
    const r = Math.floor(row + dr);
    const c = col + dc;
    if (c < 0 || c >= COLS) return false;
    if (r >= ROWS) return false;
    if (r >= 0 && getCell(r, c) === SOLID) return false;
  }
  return true;
}

// Find a falling piece occupying grid cell (r, c); returns indices or null.
export function findPieceAt(r, c) {
  for (let i = 0; i < game.pieces.length; i++) {
    const p = game.pieces[i];
    for (let j = 0; j < p.shape.length; j++) {
      const [dr, dc] = p.shape[j];
      if (Math.floor(p.row + dr) === r && p.col + dc === c) {
        return { pieceIdx: i, shapeIdx: j };
      }
    }
  }
  return null;
}

// Sequential spawn: a new piece may spawn only when no piece is falling
// (the previous one has landed and become solid, or been fully consumed).
export function spawnPiece() {
  if (game.pieces.length !== 0) return;
  const shape = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  const col = Math.floor(Math.random() * (COLS - 3)); // fits widest piece
  const row = -5; // above the top of the grid
  // Copy the shape: eating splices a falling piece's shape in place, and the
  // shared TETROMINOES table must stay intact for every future spawn.
  game.pieces.push({ shape: shape.map(([dr, dc]) => [dr, dc]), col, row });
}

// Shift the falling piece sideways by one cell. Blocked by the left/right
// edges, the bottom, or a solid block; returns false and leaves the piece
// unchanged then.
export function movePiece(p, dc) {
  if (!shapeFits(p.shape, p.row, p.col + dc)) return false;
  p.col += dc;
  return true;
}

// Rotate the falling piece a quarter turn. CW: (dr, dc) -> (dc, -dr);
// CCW: (dr, dc) -> (-dc, dr). The rotated offsets are normalised so their
// minimum row and column are 0, and the anchor is moved by the same amount
// so the piece keeps its absolute position. Rejected when the rotated shape
// would leave the left/right edges, pass the bottom, or overlap a solid block.
export function rotatePiece(p, cw) {
  const raw = p.shape.map(([dr, dc]) => (cw ? [dc, -dr] : [-dc, dr]));
  let minR = 0;
  let minC = 0;
  for (const [dr, dc] of raw) {
    if (dr < minR) minR = dr;
    if (dc < minC) minC = dc;
  }
  const shape = raw.map(([dr, dc]) => [dr - minR, dc - minC]);
  const row = p.row + minR;
  const col = p.col + minC;
  if (!shapeFits(shape, row, col)) return false;
  p.shape = shape;
  p.row = row;
  p.col = col;
  return true;
}

// Lateral shift gate: the piece may move sideways at most one cell per the
// snake's step interval. Shared by the player and the bot. A blocked attempt
// does not consume the interval.
export function requestPieceShift(dc) {
  if (game.pieces.length === 0) return false;
  if (game.pieceMoveAcc < snakeTicksPerCell()) return false;
  if (!movePiece(game.pieces[0], dc)) return false;
  game.pieceMoveAcc = 0;
  return true;
}

// Advance one piece by one tick. Lands (snaps to grid as SOLID) if the
// next position would collide with the bottom or a solid — checking the
// *next* cells prevents the piece from ever overlapping an obstacle.
export function stepPiece(p) {
  const nextRow = p.row + currentFallSpeed();
  for (const [dr, dc] of p.shape) {
    const nr = Math.floor(nextRow + dr);
    const nc = p.col + dc;
    if (nc < 0 || nc >= COLS) continue;
    // Above the grid is empty fall space; only test cells inside it.
    if (nr < 0) continue;
    if (nr >= ROWS || getCell(nr, nc) === SOLID) {
      landPiece(p);
      return;
    }
  }
  p.row = nextRow;
}

// Clear full rows: scan every row; if all COLS cells are SOLID, set them to EMPTY,
// award LINE_CLEAR_POINTS to the Tetris side per cleared row, subtract 10 from
// landedBlocks (clamp to ≥0).
export function clearFullRows() {
  for (let r = 0; r < ROWS; r++) {
    let full = true;
    for (let c = 0; c < COLS; c++) {
      if (getCell(r, c) !== SOLID) { full = false; break; }
    }
    if (!full) continue;
    for (let c = 0; c < COLS; c++) setCell(r, c, EMPTY);
    game.tetrisScore += LINE_CLEAR_POINTS;
    game.landedBlocks = Math.max(0, game.landedBlocks - 10);
  }
}

// Snap the piece to the grid as SOLID blocks and remove it from the list.
// A piece that lands with no cell inside the grid is a top-out: the game ends.
export function landPiece(p) {
  let landedCells = 0;
  for (const [dr, dc] of p.shape) {
    const r = Math.floor(p.row + dr);
    const c = p.col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      setCell(r, c, SOLID);
      game.landedBlocks += 1;
      game.tetrisScore += 1;
      landedCells += 1;
    }
  }
  const idx = game.pieces.indexOf(p);
  if (idx >= 0) game.pieces.splice(idx, 1);
  clearFullRows();
  if (landedCells === 0) gameOver();
}
// Piece fall + eating + sequential-spawn gate as an engine system. The
// accumulator (spawnAcc) and the interval live here; app.js no longer owns
// the per-tick piece handling.
export const piecesSystem = {
  name: 'pieces',
  update(ctx) {
    if (game.state !== PLAYING) return;
    game.pieceMoveAcc += 1;
    for (const p of game.pieces.slice()) stepPiece(p);
    if (game.state === PLAYING) consumePieceAtHead();
    game.spawnAcc += 1;
    if (game.spawnAcc >= SPAWN_INTERVAL && game.pieces.length === 0) {
      game.spawnAcc = 0;
      spawnPiece();
    }
  },
};
