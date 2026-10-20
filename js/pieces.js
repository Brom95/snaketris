// Piece lifecycle + difficulty ramp.
import { COLS, ROWS, EMPTY, SOLID, COLORS, TETROMINOES, PIECE_TYPES, PIECE_BOX, SRS_KICKS, BASE_FALL, MAX_FALL, SPAWN_INTERVAL, PLAYING, LINE_CLEAR_POINTS, LANDING_CELL_POINTS } from './constants.js';
import { game, gameOver } from './state.js';
import { getCell, setCell } from './grid.js';
import { consumePieceAtHead, snakeTicksPerCell } from './snake.js';
import { nextInRange } from '../engine/js/source.js';

// Difficulty ramp: fall speed (cells/tick) ticks up one step every three
// completed pieces, from BASE_FALL, capped at MAX_FALL.
export function currentFallSpeed() {
  const tier = Math.floor(game.play.completedPieces / 3);
  return Math.min(MAX_FALL, BASE_FALL * Math.pow(1.08, tier));
}

// Ticks a falling piece needs to advance one cell.
export function pieceTicksPerCell() {
  return 1 / currentFallSpeed();
}

// Where this page draws a falling piece, one row above the cell the rules read,
// advanced by the fraction the piece's own row already carries (design D2, D3):
// the drawn cell sits inside the two rows the piece moved through and never
// sinks into the block below the row it occupies, which is what makes a piece
// read level as it lands. The column comes from the page's own slide record,
// so a shift slides and a refused shift stays put. Only a cell this page has
// left fully above the field is dropped: a straddling cell shows its visible
// part, and the canvas clip cuts it without touching the field's top margin.
function pieceDrawCells(p, motion) {
  const sweep = motion.rotation(p);
  if (sweep) {
    return sweptCells(p, sweep, motion);
  }
  const row = Math.floor(p.row);
  const phase = p.row - row;
  const col = motion.pieceCol(p);
  const cells = [];
  for (const [dr, dc] of p.shape) {
    const r = motion.step(row + dr - 1, row + dr, phase);
    const c = col + dc;
    if (r > -1 && r < ROWS && c > -1 && c < COLS) {
      cells.push({ r, c });
    }
  }
  return cells;
}

// A piece mid-turn: the cells the piece stood on when the turn started, walked
// through a quarter turn about the centre of the box the rules turn that shape
// about (task 2.2, design D2), and slid by whatever the turn, a wall kick, or the
// fall moved the box alongside it (task 2.3, design D5), so a turn that kicked
// carries its kick and a turn taken while the piece still slides keeps both
// travels. The angle is derived from the phase every frame and never stored, and
// each position is pixel-snapped once by the render layer so the coarse grid stays
// whole under a turning piece (task 2.4).


function sweptCells(p, sweep, motion) {
  const size = PIECE_BOX[p.type];
  const mid = (size - 1) / 2;
  const angle = (sweep.cw ? 1 : -1) * sweep.phase * Math.PI / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const centreRow = sweep.row + (p.row - 1 - sweep.row) * sweep.phase;
  const centreCol = sweep.col + (p.col - sweep.col) * sweep.phase;
  const cells = [];
  for (const [dr, dc] of sweep.shape) {
    const x = dc - mid;
    const y = dr - mid;
    const r = centreRow + mid + (x * sin + y * cos);
    const c = centreCol + mid + (x * cos - y * sin);
    if (r > -1 && r < ROWS && c > -1 && c < COLS) {
      cells.push({ r: motion.snap(r), c: motion.snap(c) });
    }
  }
  return cells;
}

// The piece painter, run by the engine canvas pass. It asks the canvas owner
// for the 2d context and the cell primitive, so it needs no module-level canvas.
export function paintPieces(pctx) {
  const motion = pctx.motion;
  pctx.field.context().fillStyle = COLORS.edible;
  for (const p of game.play.pieces) {
    for (const cell of pieceDrawCells(p, motion)) pctx.field.drawCell(cell.r, cell.c);
  }
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
  for (let i = 0; i < game.play.pieces.length; i++) {
    const p = game.play.pieces[i];
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
  if (game.play.pieces.length !== 0) return;
  const seed = game.play.seed;
  const type = PIECE_TYPES[nextInRange(seed, game.play.pieceDraws, PIECE_TYPES.length)];
  const col = nextInRange(seed, game.play.pieceDraws + 1, COLS - 3); // fits widest piece
  game.play.pieceDraws += 2;
  const row = -5; // above the top of the grid
  // Copy the state offsets: eating splices a falling piece's shape in place,
  // and the shared TETROMINOES table must stay intact for every future spawn.
  game.play.pieces.push({
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
  if (game.play.pieces.length === 0) return false;
  if (game.play.pieceMoveAcc < snakeTicksPerCell()) return false;
  if (!movePiece(game.play.pieces[0], dc)) return false;
  game.play.pieceMoveAcc = 0;
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
  game.play.tetrisScore += cleared.length * LINE_CLEAR_POINTS;
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
      game.play.landedBlocks += 1;
      game.play.tetrisScore += LANDING_CELL_POINTS;
      landedCells += 1;
    }
  }
  game.play.completedPieces += 1;
  const idx = game.play.pieces.indexOf(p);
  if (idx >= 0) game.play.pieces.splice(idx, 1);
  clearFullRows();
  if (landedCells === 0) gameOver('top-out');
}
// Piece fall + eating + sequential-spawn gate as an engine system. The
// accumulator (spawnAcc) and the interval live here; app.js no longer owns
// the per-tick piece handling.
export const piecesSystem = {
  name: 'pieces',
  update(ctx) {
    if (game.screen.state !== PLAYING) return;
    game.play.pieceMoveAcc += 1;
    for (const p of game.play.pieces.slice()) stepPiece(p);
    if (game.screen.state === PLAYING) consumePieceAtHead();
    game.play.spawnAcc += 1;
    if (game.play.spawnAcc >= SPAWN_INTERVAL && game.play.pieces.length === 0) {
      game.play.spawnAcc = 0;
      spawnPiece();
    }
  },
};
