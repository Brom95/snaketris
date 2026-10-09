// Bot opponent: drives the side the player did not choose. Every decision is
// a pure function of the current game state, so the same state always gives
// the same answer.
import { COLS, ROWS, SOLID, PLAYING } from './constants.js';
import { game } from './state.js';
import { getCell } from './grid.js';
import { handleIntent } from './input.js';
import { requestPieceShift, shapeInState, setPieceState, shapeFits } from './pieces.js';

// Decision order for the snake: up, right, down, left. Ties are broken by this
// order, which keeps the choice deterministic.
const DIRS = [
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
];

function wrap(v, size) {
  return ((v % size) + size) % size;
}

// Shortest distance between two coordinates on the wrap-around board.
function torusDelta(a, b, size) {
  const d = Math.abs(a - b);
  return Math.min(d, size - d);
}

// Body cells that still block the board: the tail is excluded because it
// vacates on the next step. At the length cap the snake never grows, so the
// tail always vacates and its cell is free for the head to step onto.
export function bodyCells() {
  return game.snake.slice(0, game.snake.length - 1);
}

function occupiedByBody(r, c) {
  for (const seg of bodyCells()) {
    if (seg.r === r && seg.c === c) return true;
  }
  return false;
}

// A cell the head may enter: not solid and not own body.
function isSafeCell(r, c) {
  if (getCell(r, c) === SOLID) return false;
  return !occupiedByBody(r, c);
}

// Safe directions out of (r, c), ignoring the way the snake just came from.
function exitCount(r, c, cameFrom) {
  let count = 0;
  for (const d of DIRS) {
    if (d.r === -cameFrom.r && d.c === -cameFrom.c) continue;
    if (isSafeCell(wrap(r + d.r, ROWS), wrap(c + d.c, COLS))) count += 1;
  }
  return count;
}

// Nearest cell of a falling piece that lies inside the playfield. A piece
// entirely above the board has no target.
function nearestTargetCell(head) {
  let best = null;
  for (const p of game.pieces) {
    for (const [dr, dc] of p.shape) {
      const r = Math.floor(p.row + dr);
      const c = p.col + dc;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const dist = torusDelta(head.r, r, ROWS) + torusDelta(head.c, c, COLS);
      if (best === null || dist < best.dist) best = { r, c, dist };
    }
  }
  return best;
}

// Pure snake decision: the safe direction that gets closest to the piece,
// preferring a direction that still leaves an exit. Returns the current
// direction when there is no target or no safe direction.
export function chooseBotDir() {
  const head = game.snake[0];
  if (!head) return game.dir;
  const target = nearestTargetCell(head);
  if (!target) return game.dir;

  let bestDir = null;
  let bestDist = Infinity;
  let bestExits = -1;
  for (const d of DIRS) {
    if (d.r === -game.dir.r && d.c === -game.dir.c) continue;
    const nr = wrap(head.r + d.r, ROWS);
    const nc = wrap(head.c + d.c, COLS);
    if (!isSafeCell(nr, nc)) continue;
    const dist = torusDelta(nr, target.r, ROWS) + torusDelta(nc, target.c, COLS);
    const exits = exitCount(nr, nc, d);
    if (dist < bestDist || (dist === bestDist && exits > bestExits)) {
      bestDir = d;
      bestDist = dist;
      bestExits = exits;
    }
  }
  return bestDir || game.dir;
}

// Cells the piece would occupy after falling to rest in `col` with `shape`.
function landingCells(shape, col, startRow) {
  let row = startRow;
  while (shapeFits(shape, row + 1, col)) row += 1;
  const cells = [];
  for (const [dr, dc] of shape) {
    const r = Math.floor(row + dr);
    const c = col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells.push([r, c]);
  }
  return cells;
}

// Occupancy grid: every solid cell on the board plus the simulated cells.
function occupancy(cells) {
  const occ = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(getCell(r, c) === SOLID);
    occ.push(row);
  }
  for (const [r, c] of cells) occ[r][c] = true;
  return occ;
}

function countFullRows(occ) {
  let fullRows = 0;
  for (let r = 0; r < ROWS; r++) {
    if (occ[r].every((filled) => filled)) fullRows += 1;
  }
  return fullRows;
}

// Empty cells below the top filled cell of a column, and the tallest stack.
function stackStats(occ) {
  let holes = 0;
  let height = 0;
  for (let c = 0; c < COLS; c++) {
    let top = -1;
    for (let r = 0; r < ROWS; r++) {
      if (occ[r][c]) { top = r; break; }
    }
    if (top < 0) continue;
    for (let r = top + 1; r < ROWS; r++) {
      if (!occ[r][c]) holes += 1;
    }
    if (ROWS - top > height) height = ROWS - top;
  }
  return { holes, height };
}

// Heuristic for a simulated landing: full rows are good, holes and tall
// stacks are bad. Existing solid blocks are part of the stack.
function simulateScore(cells) {
  const occ = occupancy(cells);
  const { holes, height } = stackStats(occ);
  return 10 * countFullRows(occ) - 2 * holes - height;
}

// Anchor columns that keep every cell of a shape inside the playfield. The
// SRS bounding box may stick out past an edge; only the occupied cells matter.
function anchorRange(shape) {
  let minDc = 0;
  let maxDc = 0;
  for (const [, dc] of shape) {
    if (dc < minDc) minDc = dc;
    if (dc > maxDc) maxDc = dc;
  }
  // minDc is never positive, so -minDc is the first legal anchor column.
  // The `+ 0` keeps the result from being negative zero.
  return [-minDc + 0, COLS - 1 - maxDc];
}

// Pure piece decision: best (state, column) pair. Ties keep the first found,
// which is the lowest state index then the lowest column.
export function choosePieceMove(p) {
  let best = null;
  for (let state = 0; state < 4; state++) {
    const shape = shapeInState(p, state);
    const [firstCol, lastCol] = anchorRange(shape);
    for (let col = firstCol; col <= lastCol; col++) {
      if (!shapeFits(shape, p.row, col)) continue;
      const cells = landingCells(shape, col, p.row);
      if (cells.length === 0) continue;
      const score = simulateScore(cells);
      if (best === null || score > best.score) best = { score, state, col, shape };
    }
  }
  return best;
}

// One action per decision: move toward the target column, or turn the piece
// to the target state when it is already in that column.
function applyBotPieceMove(p) {
  const target = choosePieceMove(p);
  if (!target) return;
  if (p.col !== target.col) {
    requestPieceShift(target.col > p.col ? 1 : -1);
    return;
  }
  setPieceState(p, target.state);
}

export const botSystem = {
  name: 'bot',
  update(ctx) {
    if (game.state !== PLAYING) return;
    if (game.role === 'tetris') {
      // The bot steers the snake through the shared steering path.
      handleIntent({ dir: chooseBotDir() });
    } else if (game.pieces.length > 0) {
      applyBotPieceMove(game.pieces[0]);
    }
  },
};
