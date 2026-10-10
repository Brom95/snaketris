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
export const SELECT_ROLE = 'SELECT_ROLE';
export const PLAYING = 'PLAYING';
export const GAME_OVER = 'GAME_OVER';
export const RECORDS = 'RECORDS';
export const HELP = 'HELP';

// The menu labels, in the order they appear as page elements in snaketris.html.
export const MENU_ITEMS = ['Play', 'Records', 'How to Play'];

// The two roles, in the order they appear as page elements in snaketris.html.
// Each role's marker is shown on the role sub-menu item and on every record
// entry, so the same glyph is used in both places.
export const ROLE_ITEMS = ['Snake', 'Tetris'];
export const ROLE_MARKERS = { snake: '\u{1F40D}', tetris: '\u{1F3D7}\u{FE0F}' };

// The role screen's selectable items in page order: the two roles plus Back.
// The arrow cycles over this list; only the first two entries are roles.
export const ROLE_SCREEN_ITEMS = ['Snake', 'Tetris', 'Back'];

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

// Snake size: one head plus MAX_SNAKE_LEN - 1 body segments. Growth stops at
// the cap; every later eaten cell is recorded as one overflow block, which
// drives the body colour tiers.
export const MAX_SNAKE_LEN = 10;
export const TIER_WIDTH = MAX_SNAKE_LEN - 1; // body segments one tier colours

// Scoring
export const PIECE_BONUS = 4;       // extra points for eating a whole piece
export const LINE_CLEAR_POINTS = 10; // points for one cleared row

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
  snakeHead: '#4ade80',
  snakeBody: '#9ca3af',
  tierBlue: '#2563eb',
  tierPurple: '#8b5cf6',
  tierGold: '#facc15',
  edible: '#7dd3fc',
  solid: '#f97316',
  text: '#e8ecf4',
  overlay: 'rgba(11,14,20,0.8)',
};

// The seven classic tetrominoes in Super Rotation System order. Each entry
// holds the four rotation states of one piece; state 0 is the spawn state.
// Offsets are [dr, dc] from the top-left corner of the piece's bounding box:
// 4x4 for I, 2x2 for O, 3x3 for T, S, Z, L and J.
export const TETROMINOES = {
  I: [
    [[1, 0], [1, 1], [1, 2], [1, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 1], [1, 1], [2, 1], [3, 1]],
  ],
  O: [
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
  ],
  T: [
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 1], [1, 2], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  L: [
    [[0, 0], [1, 0], [2, 0], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 0]],
    [[0, 1], [0, 2], [1, 2], [2, 2]],
    [[1, 2], [2, 0], [2, 1], [2, 2]],
  ],
  J: [
    [[0, 2], [1, 2], [2, 1], [2, 2]],
    [[1, 0], [2, 0], [2, 1], [2, 2]],
    [[0, 0], [0, 1], [1, 0], [2, 0]],
    [[0, 0], [0, 1], [0, 2], [1, 2]],
  ],
};

// The piece types, in the order they appear in TETROMINOES.
export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];

// Side of the SRS bounding box of each piece. A turn rotates a cell offset
// about the centre of this box.
export const PIECE_BOX = { I: 4, O: 2, T: 3, S: 3, Z: 3, L: 3, J: 3 };

// Wall-kick offsets [dc, dr] tried in order for every state transition.
// T, S, Z, L and J share one table; I has its own. Keys are 'from->to', and
// the I keys are prefixed with 'I:'. The published SRS tables use (x, y) with
// y pointing up, so the grid offset is (dc, dr) = (x, -y).
export const SRS_KICKS = {
  '0->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1->0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1->2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  'I:0->1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  'I:1->0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  'I:1->2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  'I:2->1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  'I:2->3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  'I:3->2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  'I:3->0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  'I:0->3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};
