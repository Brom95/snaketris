// snaketris — shared constants. No imports.

// Grid cell identities
export const EMPTY = 0;
export const SNAKE = 1;
export const EDIBLE = 2;
export const SOLID = 3;

// Logical grid size (cells), scaled to CSS pixels.
// Classic Tetris proportions: 10 wide × 20 tall.
export const COLS = 10;
export const ROWS = 20;
export const CELL = 24; // cell size in CSS pixels

// State machine
export const MENU = 'MENU';
export const PLAYING = 'PLAYING';
export const GAME_OVER = 'GAME_OVER';
export const RECORDS = 'RECORDS';
export const HELP = 'HELP';

// The menu labels, in the order they appear as page elements in snaketris.html.
export const MENU_ITEMS = ['Play', 'Records', 'How to Play'];

// URL for the GitHub repository.
export const GITHUB_URL = 'https://github.com/Brom95/snaketris';

// Timing (fixed-timestep)
export const TICK = 1 / 60;        // fixed update step, seconds
export const SPAWN_INTERVAL = 60;  // new piece every N ticks

// Piece fall speed model (cells/tick)
export const BASE_FALL = 0.04;     // base piece fall speed, cells per tick
export const MAX_FALL = 0.9;       // hard cap so pieces never tunnel a cell
// The snake moves SNAKE_SPEED_DELTA ticks/cell faster than the piece;
// it is never slower than MIN_SNAKE_TICKS ticks/cell.
export const SNAKE_SPEED_DELTA = 2;
export const MIN_SNAKE_TICKS = 1;

// Native (logical) board size in CSS pixels. The buffer is never resized;
// only the CSS display size is scaled to fit the viewport (fitCanvas).
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;

// Vertical gap (screen px) reserved between the field and the top/bottom
// viewport edges: breathing room left above and below the board. Two native
// cells ≈ one displayed cell at 1080 p (displayed cell ≈ 49 px) and more at
// smaller viewports.
export const FIELD_V_GAP = 2 * CELL;
// On narrow viewports (≤ UI_STACK_MAX_WIDTH) the top/bottom reservation is
// halved so the board starts higher on screen.
export const FIELD_V_GAP_MOBILE = CELL;

// Page layout (viewport px). The interface column is sized by its own rule and
// never follows the field's scale; both values are mirrored verbatim in the
// page CSS (snaketris.html): the `#ui` width and the stacking breakpoint.
export const UI_STACK_MAX_WIDTH = 760; // at or below this viewport width the interface stacks above the field
export const UI_COLUMN_MIN = 320; // mirrors `#ui { width: min(320px, 92vw) }`

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
  [[0, 2], [1, 2], [2, 1], [2, 2]], // J
];
