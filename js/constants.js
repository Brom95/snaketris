// snaketris — constants shim. The three owners of these values live beside this
// file: config.js holds the parameters the engine receives at construction,
// rules.js holds the game rules, copy.js holds the page copy. This file stays
// so every existing `from './constants.js'` import keeps working unchanged; a
// consumer that knows which owner it wants may import that one directly.
// These are re-exports only: they create no local binding here.

export {
  COLS,
  ROWS,
  CELL,
  TICK,
  BOARD_W,
  BOARD_H,
  FIELD_V_GAP,
  FIELD_V_GAP_MOBILE,
  UI_STACK_MAX_WIDTH,
  UI_COLUMN_MIN,
  twoPlayerOffered,
} from './config.js';

export {
  EMPTY,
  SNAKE,
  EDIBLE,
  SOLID,
  MENU,
  SELECT_DURATION,
  SELECT_ROLE,
  SELECT_CONTROL,
  PLAYING,
  GAME_OVER,
  RECORDS,
  HELP,
  GAME_CONTROL_INIT,
  GAME_CONTROL_P1,
  GAME_CONTROL_P2,
  GAME_CONTROL_START,
  SPAWN_INTERVAL,
  DURATION_MINUTES,
  TICKS_PER_MINUTE,
  BASE_FALL,
  MAX_FALL,
  SNAKE_SPEED_DELTA,
  MIN_SNAKE_TICKS,
  MAX_SNAKE_LEN,
  TIER_WIDTH,
  PIECE_BONUS,
  LINE_CLEAR_POINTS,
  LANDING_CELL_POINTS,
  TETROMINOES,
  PIECE_TYPES,
  PIECE_BOX,
  SRS_KICKS,
} from './rules.js';

export {
  MENU_ITEMS,
  ROLE_ITEMS,
  ROLE_MARKERS,
  ROLE_SCREEN_ITEMS,
  CONTROL_SCREEN_ITEMS,
  GAME_CONTROL_KEYBOARD_MODELS,
  GAME_CONTROL_KEYBOARD_MODEL_NAMES,
  GAME_CONTROL_PLAYER_MARKERS,
  GAME_CONTROL_MODEL_EMOJI,
  GITHUB_URL,
  DURATION_SCREEN_ITEMS,
  COLORS,
} from './copy.js';
