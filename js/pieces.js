// Piece lifecycle + difficulty ramp.
import { COLS, ROWS, SOLID, TETROMINOES, BASE_FALL, MAX_FALL } from './constants.js';
import { game } from './state.js';
import { getCell, setCell } from './grid.js';

// Difficulty ramp: fall speed (cells/tick) ticks up one step per two
// landed blocks, from a base of 0.08, capped at MAX_FALL.
export function currentFallSpeed() {
  const tier = Math.floor(game.landedBlocks / 2);
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
  game.pieces.push({ shape, col, row });
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

// Snap the piece to the grid as SOLID blocks and remove it from the list.
export function landPiece(p) {
  for (const [dr, dc] of p.shape) {
    const r = Math.floor(p.row + dr);
    const c = p.col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      setCell(r, c, SOLID);
      game.landedBlocks += 1;
    }
  }
  const idx = game.pieces.indexOf(p);
  if (idx >= 0) game.pieces.splice(idx, 1);
}
