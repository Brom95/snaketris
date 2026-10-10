// Piece lifecycle + difficulty ramp.
import { COLS, ROWS, EMPTY, SOLID, TETROMINOES, PIECE_TYPES, PIECE_BOX, SRS_KICKS, BASE_FALL, MAX_FALL, SPAWN_INTERVAL, PLAYING, LINE_CLEAR_POINTS } from './constants.js';
import { game, gameOver } from './state.js';
import { getCell, setCell } from './grid.js';
import { consumePieceAtHead, snakeTicksPerCell } from './snake.js';

// Difficulty ramp: fall speed (cells/tick) ticks up one step every three
// completed pieces, from BASE_FALL, capped at MAX_FALL.
export function currentFallSpeed() {
  const tier = Math.floor(game.completedPieces / 3);
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
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const col = Math.floor(Math.random() * (COLS - 3)); // fits widest piece
  const row = -5; // above the top of the grid
  // Copy the state offsets: eating splices a falling piece's shape in place,
  // and the shared TETROMINOES table must stay intact for every future spawn.
  game.pieces.push({
    type,
    state: 0,
    shape: TETROMINOES[type][0].map(([dr, dc]) => [dr, dc]),
    col,
    row,
  });
}

// Shift the falling piece sideways by one cell. Blocked by the left/right
// edges, the bottom, or a solid block; returns false and leaves the piece
// unchanged then.
export function movePiece(p, dc) {
  if (!shapeFits(p.shape, p.row, p.col + dc)) return false;
  p.col += dc;
  return true;
}

// Quarter-turn one cell offset about the centre of the piece's SRS box.
function turnOffset(dr, dc, cw, size) {
  return cw ? [dc, size - 1 - dr] : [size - 1 - dc, dr];
}

// Quarter-turn the piece's own cell offsets about the centre of its SRS
// bounding box. The turn works on the cells that are still present, because
// the snake can eat part of a falling piece; reading the state table instead
// would resurrect the eaten cells.
export function turnedShape(shape, cw, type) {
  const size = PIECE_BOX[type];
  return shape.map(([dr, dc]) => turnOffset(dr, dc, cw, size));
}

// The offsets this piece would have in a given state, reached by the shortest
// path of single quarter turns. The piece is not moved.
export function shapeInState(p, state) {
  let steps = (state - p.state + 4) % 4;
  const cw = steps <= 2;
  if (!cw) steps = 4 - steps;
  let shape = p.shape;
  for (let i = 0; i < steps; i++) shape = turnedShape(shape, cw, p.type);
  return shape;
}

// Rotate the falling piece a quarter turn through the Super Rotation System.
// The turn is tried at the anchor first, then at each of the five wall-kick
// offsets in table order. The first offset that fits is applied. When every
// offset is blocked, the piece is unchanged and the function returns false.
// The fall accumulator is untouched, so a rotation never interrupts the fall.
export function rotatePiece(p, cw) {
  const from = p.state;
  const to = cw ? (from + 1) % 4 : (from + 3) % 4;
  const shape = turnedShape(p.shape, cw, p.type);
  const kicks = SRS_KICKS[(p.type === 'I' ? 'I:' : '') + from + '->' + to];
  for (const [dc, dr] of kicks) {
    const row = p.row + dr;
    const col = p.col + dc;
    if (shapeFits(shape, row, col)) {
      p.shape = shape;
      p.state = to;
      p.row = row;
      p.col = col;
      return true;
    }
  }
  return false;
}

// Move a piece to a named state by walking single quarter turns. The first
// blocked step stops the walk and returns false, leaving the piece at the
// state it reached.
export function setPieceState(p, state) {
  let steps = (state - p.state + 4) % 4;
  const cw = steps <= 2;
  if (!cw) steps = 4 - steps;
  for (let i = 0; i < steps; i++) {
    if (!rotatePiece(p, cw)) return false;
  }
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

// Clear full rows: identify every row where all COLS cells are SOLID, clear
// them to EMPTY, shift each SOLID cell above a cleared row down by one (snake
// segments untouched), and award LINE_CLEAR_POINTS per cleared row. There is
// no landed-block rollback.
export function clearFullRows() {
  const cleared = [];
  for (let r = 0; r < ROWS; r++) {
    let full = true;
    for (let c = 0; c < COLS; c++) {
      if (getCell(r, c) !== SOLID) { full = false; break; }
    }
    if (full) cleared.push(r);
  }
  for (const r of cleared) {
    for (let c = 0; c < COLS; c++) setCell(r, c, EMPTY);
  }
  // Shift SOLID cells above each cleared row down by one. Processing in
  // ascending order lets a block above several cleared rows drop once per clear.
  for (const r of cleared) {
    for (let i = r - 1; i >= 0; i--) {
      for (let c = 0; c < COLS; c++) {
        if (getCell(i, c) === SOLID) {
          setCell(i + 1, c, SOLID);
          setCell(i, c, EMPTY);
        }
      }
    }
  }
  game.tetrisScore += cleared.length * LINE_CLEAR_POINTS;
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
  game.completedPieces += 1;
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
