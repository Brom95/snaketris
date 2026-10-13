// The game grid: one instance of the engine grid, sized by the game's board
// constants. Cell identities are the game's: EMPTY | SNAKE | EDIBLE | SOLID.
import { COLS, ROWS, EMPTY } from './constants.js';
import { createGrid } from '../engine/js/grid.js';

const gridInstance = createGrid({ cols: COLS, rows: ROWS, empty: EMPTY });

export function initGrid() {
  gridInstance.init();
}

export function getCell(row, col) {
  return gridInstance.getCell(row, col);
}

// Full grid snapshot for bulk rendering (render.js).
export function getGrid() {
  return gridInstance.getGrid();
}

export function setCell(row, col, id) {
  gridInstance.setCell(row, col, id);
}
