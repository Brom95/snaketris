// snaketris — shared constants. No imports.

// Grid cell identities
export const EMPTY = 0;
export const SNAKE = 1;
export const EDIBLE = 2;
export const SOLID = 3;

// Logical grid size (cells), scaled to CSS pixels
export const COLS = 24;
export const ROWS = 30;
export const CELL = 24; // cell size in CSS pixels

// State machine
export const IDLE = 'IDLE';
export const PLAYING = 'PLAYING';
export const GAME_OVER = 'GAME_OVER';

// Timing (fixed-timestep)
export const TICK = 1 / 60;        // fixed update step, seconds
export const SPAWN_INTERVAL = 60;  // new piece every N ticks

// Piece fall speed model (cells/tick)
export const BASE_FALL = 0.08;     // base piece fall speed, cells per tick
export const MAX_FALL = 0.9;       // hard cap so pieces never tunnel a cell
// The snake moves SNAKE_SPEED_DELTA ticks/cell faster than the piece;
// it is never slower than MIN_SNAKE_TICKS ticks/cell.
export const SNAKE_SPEED_DELTA = 2;
export const MIN_SNAKE_TICKS = 1;

// Native (logical) board size in CSS pixels. The buffer is never resized;
// only the CSS display size is scaled to fit the viewport (fitCanvas).
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;

// Palette
export const COLORS = {
  bg: '#0b0e14',
  grid: 'rgba(255,255,255,0.05)',
  snake: '#4ade80',
  snakeHead: '#a7f3a0',
  edible: '#7dd3fc',
  solid: '#f97316',
  text: '#e8ecf4',
  overlay: 'rgba(11,14,20,0.8)',
};

// The seven classic tetrominoes as [dr, dc] offsets from the anchor.
export const TETROMINOES = [
  [[0, 0], [0, 1], [0, 2], [0, 3]], // I
  [[0, 0], [0, 1], [1, 0], [1, 1]], // O
  [[0, 1], [1, 0], [1, 1], [1, 2]], // T
  [[0, 1], [0, 2], [1, 0], [1, 1]], // S
  [[0, 0], [0, 1], [1, 1], [1, 2]], // Z
  [[0, 0], [1, 0], [2, 0], [2, 1]], // L
  [[0, 2], [1, 0], [2, 0], [2, 1]], // J
];
