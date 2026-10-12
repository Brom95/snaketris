// Bot opponent: drives the side the player did not choose. Every decision is
// a pure function of the current game state, so the same state always gives
// the same answer.
import { COLS, ROWS, SOLID, PLAYING } from './constants.js';
import { game } from './state.js';
import { getCell } from './grid.js';
import { handleIntent } from './input.js';
import { requestPieceShift, shapeInState, setPieceState, shapeFits, currentFallSpeed } from './pieces.js';
import { snakeTicksPerCell } from './snake.js';

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

// How far the snake can still get from (r, c): the number of distinct safe
// cells reachable within `depth` steps over the wrap grid, never reversing
// onto the cell it just came from. A corner-hug or self-trap reaches few or
// no cells; open board reaches many. Bounded, so it stays cheap at 60 Hz.
function exitCount(r, c, cameFrom, depth = 3) {
  const seen = new Set([`${r},${c}`]);
  let frontier = [[r, c]];
  for (let step = 0; step < depth; step++) {
    const next = [];
    for (const [rr, cc] of frontier) {
      for (const d of DIRS) {
        if (d.r === -cameFrom.r && d.c === -cameFrom.c) continue; // never reverse
        const nr = wrap(rr + d.r, ROWS);
        const nc = wrap(cc + d.c, COLS);
        if (!isSafeCell(nr, nc)) continue;
        const key = `${nr},${nc}`;
        if (!seen.has(key)) { seen.add(key); next.push([nr, nc]); }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return seen.size - 1;
}

// Nearest cell of a falling piece that lies inside the playfield, predicted
// one step ahead. The piece moves before the head arrives, so the goal is the
// cell the piece will occupy after one fall step (`currentFallSpeed`), not the
// cell it occupies now. A piece entirely above the board has no target.
export function nearestTargetCell(head) {
  const speed = currentFallSpeed();
  let best = null;
  for (const p of game.pieces) {
    for (const [dr, dc] of p.shape) {
      const r = Math.floor(p.row + dr + speed);
      const c = p.col + dc;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const dist = torusDelta(head.r, r, ROWS) + torusDelta(head.c, c, COLS);
      if (best === null || dist < best.dist) best = { r, c, dist };
    }
  }
  return best;
}

// Pure snake decision: the safe direction that gets closest to the piece,
// preferring a direction that still leaves an exit, and keeping the current
// heading unless another direction strictly improves the goal (anti-oscillation).
// Returns the current direction when there is no target or no safe direction.
export function chooseBotDir() {
  const head = game.snake[0];
  if (!head) return game.dir;
  const target = nearestTargetCell(head);
  // When no falling piece remains, the snake must not chase a cell that is
  // already solid (a piece that just landed). If the current direction leads
  // into a solid cell, steer to a safe direction instead.
  if (!target) {
    const hr = head.r;
    const hc = head.c;
    // If the current direction is safe, keep it. Otherwise steer to a safe
    // direction (the first safe one in DIRS order).
    const curR = wrap(hr + game.dir.r, ROWS);
    const curC = wrap(hc + game.dir.c, COLS);
    if (isSafeCell(curR, curC)) return game.dir;
    for (const d of DIRS) {
      const nr = wrap(hr + d.r, ROWS);
      const nc = wrap(hc + d.c, COLS);
      if (isSafeCell(nr, nc)) return d;
    }
    return game.dir;
  }

  // Cells where a falling piece will come to rest, treated as unsafe (stepping
  // there risks being hit by the landed block).
  const landingSet = new Set();
  for (const p of game.pieces) {
    const cells = landingCells(p.shape, p.col, Math.floor(p.row));
    for (const [r, c] of cells) landingSet.add(`${r},${c}`);
  }

  // Goal of a direction: distance to the target (lower is better) and how far
  // the snake can still travel from the next cell (survival). A direction that
  // keeps at least three further steps "has an exit."
  const goalOf = (nr, nc, cameFrom) => {
    const dist = torusDelta(nr, target.r, ROWS) + torusDelta(nc, target.c, COLS);
    const exits = exitCount(nr, nc, cameFrom);
    return { dist, exits, hasExit: exits >= 3 };
  };

  // Safe directions (not the reverse of the current heading, not onto a landing
  // cell).
  const candidates = [];
  for (const d of DIRS) {
    if (d.r === -game.dir.r && d.c === -game.dir.c) continue;
    const nr = wrap(head.r + d.r, ROWS);
    const nc = wrap(head.c + d.c, COLS);
    if (!isSafeCell(nr, nc)) continue;
    if (landingSet.has(`${nr},${nc}`)) continue;
    candidates.push({ d, nr, nc });
  }
  if (candidates.length === 0) return game.dir;

  // The current direction counts as an option only when it is safe to keep.
  const curNr = wrap(head.r + game.dir.r, ROWS);
  const curNc = wrap(head.c + game.dir.c, COLS);
  const currentInPlay = isSafeCell(curNr, curNc) && !landingSet.has(`${curNr},${curNc}`);
  const currentGoal = currentInPlay ? goalOf(curNr, curNc, game.dir) : null;

  // Strict improvement: a direction that keeps an exit beats one that does not;
  // a tie on exit breaks by distance to the target. Equal values are not
  // strictly better, so the current heading is kept (anti-oscillation).
  const better = (a, b) =>
    a.hasExit !== b.hasExit ? a.hasExit
    : a.dist !== b.dist ? a.dist < b.dist
    : false;

  // Best non-current candidate.
  let best = null;
  for (const cand of candidates) {
    if (cand.d.r === game.dir.r && cand.d.c === game.dir.c) continue;
    const g = goalOf(cand.nr, cand.nc, cand.d);
    if (best === null || better(g, best.goal)) best = { d: cand.d, goal: g };
  }

  // Steer away from a blocked/landing current direction when a safe option
  // exists; otherwise keep it.
  if (!currentInPlay) return best ? best.d : game.dir;
  // Hysteresis: only deviate when a candidate strictly improves the goal.
  return best && better(best.goal, currentGoal) ? best.d : game.dir;
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

// Occupancy grid: solid blocks plus the simulated cells. The snake is NOT in
// this grid. A snake cell is not a solid block: it does not fill a row, so a
// row the snake is sitting in never reads as complete, and it does not bury a
// hole or raise the stack. The snake is scored separately, as a small penalty.
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

// A cell the snake blocks now: its body, or the cell the head steps into next.
// The snake moves before a falling piece lands, so the predicted cell counts.
function snakeCellAt(r, c) {
  const head = game.snake[0];
  if (head && wrap(head.r + game.dir.r, ROWS) === r && wrap(head.c + game.dir.c, COLS) === c) {
    return true;
  }
  return bodyCells().some((seg) => seg.r === r && seg.c === c);
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

// Heuristic for a simulated landing: new full rows are good (already-full
// rows give no credit), holes and tall stacks are bad, and landing on snake
// body cells is penalized. Also rewards filling a row that is close to being
// completed (a "near-complete" bonus).
// The snake moves before the piece lands, so it can eat a landing cell it reaches
// in the meantime. The cost is one per reachable cell, so it is capped by the
// piece's cell count and only breaks ties between equal boards.
function snakeEatPenalty(cells, row) {
  const head = game.snake[0];
  if (!head) return 0;
  let landRow = -Infinity;
  for (const [r, c] of cells) {
    if (r > landRow) landRow = r;
  }
  const fallCells = Math.max(0, landRow - Math.floor(row));
  const reach = (fallCells / currentFallSpeed()) / snakeTicksPerCell();
  let penalty = 0;
  for (const [r, c] of cells) {
    const d = torusDelta(head.r, r, ROWS) + torusDelta(head.c, c, COLS);
    if (d <= reach) penalty += 1;
  }
  return penalty;
}

function simulateScore(cells, row) {
  const baseOcc = occupancy([]);
  const occ = occupancy(cells);
  const newFull = countFullRows(occ) - countFullRows(baseOcc);
  const { holes, height } = stackStats(occ);
  let snakePenalty = 0;
  for (const [r, c] of cells) {
    if (snakeCellAt(r, c)) snakePenalty += 1;
  }
  // Row progress: for each row that is not yet full but has most of its
  // cells filled, reward placing the piece there.
  let rowProgress = 0;
  for (let r = 0; r < ROWS; r++) {
    const baseRowFull = baseOcc[r].every((f) => f);
    if (baseRowFull) continue;
    let filled = 0;
    for (let c = 0; c < COLS; c++) {
      if (occ[r][c]) filled += 1;
    }
    if (filled >= COLS - 2 && !baseRowFull) rowProgress += 1;
  }
  return 10 * newFull + 3 * rowProgress - 2 * holes - height - snakePenalty -
    snakeEatPenalty(cells, row);
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

// Pure piece decision: best (state, column) pair. Ties prefer the column
// closest to center, then the lowest state index.
// How quickly the snake can reach a landing: the smallest wrap-around distance
// from the head to any of the piece's landing cells. Larger means the snake
// reaches those cells least (and latest). Null when there is no snake to deny
// food to, so the caller falls back to the centre tie-break.
function snakeFarthestDistance(cells) {
  const head = game.snake[0];
  if (!head) return null;
  let best = Infinity;
  for (const [r, c] of cells) {
    const d = torusDelta(head.r, r, ROWS) + torusDelta(head.c, c, COLS);
    if (d < best) best = d;
  }
  return best;
}
export function choosePieceMove(p) {
  let best = null;
  for (let state = 0; state < 4; state++) {
    const shape = shapeInState(p, state);
    const [firstCol, lastCol] = anchorRange(shape);
    for (let col = firstCol; col <= lastCol; col++) {
      if (!shapeFits(shape, p.row, col)) continue;
      const cells = landingCells(shape, col, p.row);
      if (cells.length === 0) continue;
      const score = simulateScore(cells, p.row);
      if (best === null || score > best.score ||
          (score === best.score && Math.abs(col - (COLS - 1) / 2) < Math.abs(best.col - (COLS - 1) / 2))) {
        best = { score, state, col, shape };
      }
    }
  }
  return best;
}

// One action per decision: move toward the target column, or turn the piece
// to the target state when it is already in that column.
function applyBotPieceMove(p) {
  const target = choosePieceMove(p);
  if (!target) return;
  // Always try to rotate, not only when in the target column.
  setPieceState(p, target.state);
  if (p.col !== target.col) {
    requestPieceShift(target.col > p.col ? 1 : -1);
  }
}

export const botSystem = {
  name: 'bot',
  update(ctx) {
    if (game.twoPlayerMode) return; // both sides are human; no bot
    if (game.state !== PLAYING) return;
    if (game.role === 'tetris') {
      // The bot steers the snake through the shared steering path.
      handleIntent({ dir: chooseBotDir() });
    } else if (game.pieces.length > 0) {
      applyBotPieceMove(game.pieces[0]);
    }
  },
};
