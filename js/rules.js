// snaketris — game rules. Every value here names a snaketris concept: a cell
// identity, a screen state, a scoring rule, a piece shape. The engine receives
// none of them. Only TICK comes from elsewhere, because one minute of engine
// time is a rule stated in the engine's own unit.

import { TICK } from './config.js';

// Grid cell identities
export const EMPTY = 0;
export const SNAKE = 1;
export const EDIBLE = 2;
export const SOLID = 3;

// State machine
export const MENU = 'MENU';
export const SELECT_DURATION = 'SELECT_DURATION';
export const SELECT_ROLE = 'SELECT_ROLE';
export const SELECT_CONTROL = 'SELECT_CONTROL';
export const SELECT_WAY = 'SELECT_WAY';
export const PLAYING = 'PLAYING';
export const GAME_OVER = 'GAME_OVER';
export const RECORDS = 'RECORDS';
export const HELP = 'HELP';
export const PAIRING = 'PAIRING';

// The end reason a network match carries when its peer link closed. The
// records layer writes nothing for it: an abandoned match is not a finished
// game.
export const PEER_LEFT = 'peer-left';

// The share link carries the trimmed offer blob in its URL fragment. A blob
// longer than this cap cannot travel in a link, so the step falls back to the
// short readable code. The cap must stay within the QR encoder's version-40
// byte capacity, or painting the link throws.
export const PAIRING_FRAGMENT_CAP = 1024;

// How many characters the short readable pairing code has.
export const PAIRING_CODE_LENGTH = 6;

// The one-item-at-a-time control flow steps. The game enters GAME_CONTROL_P1
// when two-player mode starts, moves to GAME_CONTROL_P2 once P1 locks a model,
// and to GAME_CONTROL_START once P2 locks a model.
export const GAME_CONTROL_INIT = 'GAME_CONTROL_INIT';
export const GAME_CONTROL_P1 = 'GAME_CONTROL_P1';
export const GAME_CONTROL_P2 = 'GAME_CONTROL_P2';
export const GAME_CONTROL_START = 'GAME_CONTROL_START';

// Timing (fixed-timestep)
export const SPAWN_INTERVAL = 60; // new piece every N ticks

// The selectable match durations, in the order they appear as page elements in
// snaketris.html.
export const DURATION_MINUTES = [1, 3, 5];

// One minute of engine time in ticks. A match counts down in ticks, never in
// wall-clock seconds: the fixed-timestep accumulator stops advancing while the
// tab is hidden, so a Date.now() countdown would skip time the player did not
// play.
export const TICKS_PER_MINUTE = 60 / TICK; // 3600 ticks at TICK = 1/60

// Piece fall speed model (cells/tick)
export const BASE_FALL = 0.04; // base piece fall speed, cells per tick
export const MAX_FALL = 0.9; // hard cap so pieces never tunnel a cell
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
export const PIECE_BONUS = 4; // extra points for eating a whole piece
export const LINE_CLEAR_POINTS = 10; // points for one cleared row
export const LANDING_CELL_POINTS = 2; // points for one landed solid block

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
