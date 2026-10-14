import { installDomStub } from './tests/helpers/dom-stub.js';
import { startIn } from './tests/helpers/game.js';

installDomStub();
const { game } = await import('./js/state.js');
const { setCell, getCell } = await import('./js/grid.js');
const { SOLID, EMPTY, COLS, ROWS, TETROMINOES } = await import('./js/constants.js');
const { shapeInState, shapeFits, landingCells, currentFallSpeed } = await import('./js/pieces.js');

function freshStart(role) {
  startIn('PLAYING', role);
  game.pieces.length = 0;
  return game;
}

const DIRS = [
  { r: -1, c: 0 }, // up
  { r: 0, c: 1 }, // right
  { r: 1, c: 0 }, // down
  { r: 0, c: -1 }, // left
];
function wrap(v, n) { return ((v % n) + n) % n; }
function torusDelta(a, b, n) {
  const d = Math.abs(a - b);
  return Math.min(d, n - d);
}
function isSafeCell(r, c) { return !occupiedByBody(r, c); }
function occupiedByBody(r, c) {
  for (const seg of game.snake) {
    if (seg.r === r && seg.c === c) return true;
  }
  return false;
}
function bodyCells() { return game.snake.slice(1); }
function landingCells2(shape, col, startRow) {
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
function occupancy(cells) {
  const occ = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(getCell(r, c) === SOLID);
    occ.push(row);
  }
  for (const seg of bodyCells()) {
    if (seg.r >= 0 && seg.r < ROWS && seg.c >= 0 && seg.c < COLS) {
      occ[seg.r][seg.c] = true;
    }
  }
  const head = game.snake[0];
  if (head) {
    const nr = wrap(head.r + game.dir.r, ROWS);
    const nc = wrap(head.c + game.dir.c, COLS);
    occ[nr][nc] = true;
  }
  for (const [r, c] of cells) occ[r][c] = true;
  return occ;
}
function countFullRows(occ) {
  let n = 0;
  for (let r = 0; r < ROWS; r++) if (occ[r].every((f) => f)) n += 1;
  return n;
}
function stackStats(occ) {
  let holes = 0;
  let height = 0;
  for (let c = 0; c < COLS; c++) {
    let top = -1;
    for (let r = 0; r < ROWS; r++) { if (occ[r][c]) { top = r; break; } }
    if (top < 0) continue;
    for (let r = top + 1; r < ROWS; r++) { if (!occ[r][c]) holes += 1; }
    if (ROWS - top > height) height = ROWS - top;
  }
  return { holes, height };
}
function simulateScore(cells) {
  const baseOcc = occupancy([]);
  const occ = occupancy(cells);
  const newFull = countFullRows(occ) - countFullRows(baseOcc);
  const { holes, height } = stackStats(occ);
  let snakePenalty = 0;
  for (const [r, c] of cells) { if (baseOcc[r][c]) snakePenalty += 1; }
  let rowProgress = 0;
  for (let r = 0; r < ROWS; r++) {
    const baseRowFull = baseOcc[r].every((f) => f);
    if (baseRowFull) continue;
    let filled = 0;
    for (let c = 0; c < COLS; c++) { if (occ[r][c]) filled += 1; }
    if (filled >= COLS - 2 && !baseRowFull) rowProgress += 1;
  }
  return { score: 10 * newFull + 3 * rowProgress - 2 * holes - height - snakePenalty, newFull, rowProgress, holes, height, snakePenalty };
}

freshStart('snake');
game.dir = { r: 0, c: 1 };
game.snake = [{ r: 17, c: 5 }, { r: 17, c: 4 }, { r: 17, c: 3 }];
for (let c = 2; c < COLS; c++) setCell(19, c, SOLID);
for (let c = 0; c < COLS; c++) setCell(17, c, SOLID);
setCell(17, 4, EMPTY); setCell(17, 5, EMPTY);
setCell(18, 6, SOLID); setCell(18, 7, SOLID);

const O = TETROMINOES.O[0];
const piece = { type: 'O', state: 0, shape: O.map((x) => [x[0], x[1]]), col: 0, row: 10 };
console.log('base occ (grid+body+next):');
const baseOcc = occupancy([]);
for (let r = 0; r < ROWS; r++) {
  const row = [];
  for (let c = 0; c < COLS; c++) row.push(baseOcc[r][c] ? '#' : '.');
  console.log(String(r).padStart(2), row.join(' '));
}
console.log('base full rows:', countFullRows(baseOcc));

// Which row does the O at col 0 actually reach?
console.log('col 0 lands at rows 15-16 (row 17 cols 0,1 block the fall).');
console.log('col 6 lands at rows 15-16 (row 17 cols 6,7 block the fall).');
console.log('Col 4 lands at rows 17-18, overlapping the snake body (17,4) and head (17,5) -> score -4, wins.');
console.log('The test comment says col 0 completes row 19, but row 17 blocks it. Setup is broken.');

for (let state = 0; state < 4; state++) {
  const shape = shapeInState(piece, state);
  for (let col = 0; col <= COLS - 2; col++) {
    if (!shapeFits(shape, 10, col)) continue;
    const cells = landingCells2(shape, col, 10);
    const s = simulateScore(cells);
    console.log(`state ${state} col ${col} landing=[${cells.map((x) => x.join(':')).join(',')}] -> ${JSON.stringify(s)}`);
  }
}
