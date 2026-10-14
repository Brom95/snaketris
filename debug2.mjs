// Debug harness: compute per-column simulateScore for a given grid geometry.
import { installDomStub } from './tests/helpers/dom-stub.js';
import { startIn } from './tests/helpers/game.js';

installDomStub();
const { initGrid } = await import('./js/grid.js');
initGrid();
const { game } = await import('./js/state.js');
const { _debugSimScore, choosePieceMove } = await import('./js/bot.js');
const { setCell, getCell } = await import('./js/grid.js');
const { EMPTY, SOLID, COLS, ROWS, TETROMINOES } = await import('./js/constants.js');

function freshStart(role) {
  startIn('PLAYING', role);
  game.pieces.length = 0;
  return game;
}
function clearBoard() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) setCell(r, c, EMPTY);
}
function placePiece(shape, col, row, type = 'O', state = 0) {
  game.pieces.length = 0;
  game.pieces.push({ type, state, shape: shape.map(([dr, dc]) => [dr, dc]), col, row });
  return game.pieces[0];
}

// ---- Geometry under test ----
// Row 17 cols 0-5 SOLID (6 cells). Shelf row 18 cols 6,7,8. Row 19 floor.
// col 6's O fills (17,6),(17,7) -> row 17 has 8 filled (rowProgress +1) and
// lands on next cell (17,6) -> penalty -1. Net 0. col 7 fills (17,7),(17,8)
// -> row 17 has 8 filled (rowProgress +1), no penalty. Net +1. So col 7 beats
// col 6 by exactly the penalty. Without penalty col 6 wins the centre tie-break.
clearBoard();
freshStart('snake');
game.dir = { r: 0, c: 1 }; // snake moves east
game.snake = [{ r: 17, c: 5 }, { r: 17, c: 4 }, { r: 17, c: 3 }]; // next cell (17,6)
for (let c = 0; c < 6; c++) setCell(17, c, SOLID); // row 17 left half
for (let c = 6; c < 9; c++) setCell(18, c, SOLID); // shelf cols 6-8
for (let c = 0; c < COLS; c++) setCell(19, c, SOLID); // floor

const shape = TETROMINOES.O[0];
const startRow = 10;
for (let col = 0; col < COLS; col++) {
  let ok = true;
  for (const [dr, dc] of shape) { const r = startRow + dr; const c = col + dc; if (c < 0 || c >= COLS || r < 0 || r >= ROWS) ok = false; }
  if (!ok) continue;
  const { cells, score } = _debugSimScore(shape, col, startRow);
  console.log('col', col, 'score', score, 'cells', JSON.stringify(cells));
}

const p = placePiece(shape, 0, startRow, 'O', 0);
console.log('chosen:', JSON.stringify(choosePieceMove(p)));
