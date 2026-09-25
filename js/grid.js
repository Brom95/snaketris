// Grid model: one grid, every cell carries an identity.
import { COLS, ROWS, EMPTY } from './constants.js';

// grid[row][col] — every cell carries an identity:
// EMPTY | SNAKE | EDIBLE | SOLID
// Snakes and falling pieces are tracked in their own lists; the grid
// holds EMPTY/SOLID (plus the SNAKE/EDIBLE identities for completeness).
let grid = [];

export function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(COLS).fill(EMPTY));
  }
}

export function getCell(row, col) {
  return grid[row][col];
}

// Full grid snapshot for bulk rendering (render.js).
export function getGrid() {
  return grid;
}

export function setCell(row, col, id) {
  grid[row][col] = id;
}
