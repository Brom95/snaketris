// Game state: ownership of all mutable game state + transitions.
// Every module imports `game` and mutates it in place, so there is always
// one source of truth and no stale references across module boundaries.
import { MENU, PLAYING, GAME_OVER, SELECT_CONTROL, ROWS, SPAWN_INTERVAL,
  GAME_CONTROL_P1, GAME_CONTROL_P2, GAME_CONTROL_START } from './constants.js';
import { initGrid } from './grid.js';
import { recordScore } from './highscores.js';

export const game = {
  state: MENU,
  menuSelect: 0,
  roleSelect: 0,
  controlSelect: 0,
  role: 'snake',
  p1Role: null,
  p2Role: null,
  twoPlayerMode: false,
  p1Selection: null,
  p2Selection: null,
  p1Model: null,
  p2Model: null,
  controlError: '', // error message shown when P2 tries same layout as P1
  controlConfirmed: false, // true when both players confirm without conflict
  gameControlStep: GAME_CONTROL_P1, // current one-item-at-a-time control step
  snake: [],
  pieces: [],
  snakeScore: 0,
  tetrisScore: 0,
  landedBlocks: 0,
  completedPieces: 0, // pieces that either landed or were fully consumed
  // Eaten cells beyond MAX_SNAKE_LEN. Each one recolours one body segment.
  overflow: 0,
  dir: { r: 0, c: 1 },
  nextDir: { r: 0, c: 1 },
  snakeAcc: 0,
  spawnAcc: 0,
  pieceMoveAcc: 0,
  tick: 0
};

function resetSnake() {
  const mid = Math.floor(ROWS / 2);
  game.snake = [
    { r: mid, c: 6 },
    { r: mid, c: 5 },
    { r: mid, c: 4 }
  ];
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
}

export function resetGame() {
  game.state = MENU;
  game.menuSelect = 0;
  game.roleSelect = 0;
  initGrid();
  resetSnake();
  game.pieces = [];
  game.snakeScore = 0;
  game.tetrisScore = 0;
  game.landedBlocks = 0;
  game.completedPieces = 0;
  game.overflow = 0;
  game.snakeAcc = 0;
  game.spawnAcc = 0;
  game.pieceMoveAcc = 0;
  game.tick = 0;
  game.p1Role = null;
  game.p2Role = null;
  game.twoPlayerMode = false;
  game.p1Selection = null;
  game.p2Selection = null;
  game.p1Model = null;
  game.p2Model = null;
  game.controlError = '';
  game.controlConfirmed = false;
  game.gameControlStep = GAME_CONTROL_P1;
}

// True when a player has locked a model. A locked model is final until the
// player reassigns. Kept in state.js so both input.js and ui.js read it the
// same way.
export function controlModelAssigned(player) {
  const model = player === 1 ? game.p1Model : game.p2Model;
  return model != null;
}

// Lock a player's control model from a single key press. Sets the selection
// and the locked model, clears any previous conflict error, and advances the
// control step. Returns true on success, or false when P2 tried to reuse P1's
// keyboard layout. Gamepad is always shareable.
export function lockControlModel(player, model) {
  game.controlError = '';
  // P2: keyboard models are exclusive with P1's locked model; gamepad is
  // shareable.
  if (player === 2 && model !== 'gamepad' && game.p1Model === model) {
    game.controlError = 'P2: cannot use the same layout as P1';
    return false;
  }
  if (player === 1) {
    game.p1Selection = model;
    game.p1Model = model;
  } else {
    game.p2Selection = model;
    game.p2Model = model;
  }
  advanceControlStep();
  return true;
}

// Move the one-item-at-a-time step forward. P1 locking moves to P2; P2 locking
// moves to the SHARED (Start) step.
function advanceControlStep() {
  if (!controlModelAssigned(1)) {
    game.gameControlStep = GAME_CONTROL_P1;
  } else if (!controlModelAssigned(2)) {
    game.gameControlStep = GAME_CONTROL_P2;
  } else {
    game.gameControlStep = GAME_CONTROL_START;
  }
}

// Reassign: clear a player's selection and model so they can pick a new layout,
// and send them back to their own screen.
export function reassignP1() {
  game.p1Selection = null;
  game.p1Model = null;
  game.gameControlStep = GAME_CONTROL_P1;
}

export function reassignP2() {
  game.p2Selection = null;
  game.p2Model = null;
  game.gameControlStep = GAME_CONTROL_P2;
}

export function startGame() {
  if (game.state === PLAYING) return;
  const role = game.role;
  const twoPlayer = game.twoPlayerMode;
  // Preserve the locked control models across the reset so the SHARED screen
  // can re-show both layouts after a game ends (two-player mode).
  const p1Model = game.p1Model;
  const p2Model = game.p2Model;
  resetGame();
  // resetGame clears the menu state; the role chosen before the game is kept.
  game.role = role;
  if (twoPlayer) {
    game.twoPlayerMode = true;
    game.p1Role = role;
    game.p2Role = role === 'snake' ? 'tetris' : 'snake';
    game.p1Model = p1Model;
    game.p2Model = p2Model;
  }
  game.state = PLAYING;
  // Prime the spawn accumulator so the first piece appears on the very next
  // update tick (matching the original immediate-spawn feel). Subsequent
  // pieces are gated by the sequential spawn logic in app.js.
  game.spawnAcc = SPAWN_INTERVAL;
}

export function restart() {
  startGame();
}

export function toMenu() {
  game.state = MENU;
  game.menuSelect = 0;
  game.roleSelect = 0;
}

// Back from SELECT_CONTROL returns to the role selection screen.
export function backToRoleSelect() {
  game.state = 'SELECT_ROLE';
}

// P1 picks a role; P2 auto-gets the other. Sets the two-player mode flag
// and assigns both roles. The one-item-at-a-time control flow starts on P1.
export function pickP1Role(role) {
  game.p1Role = role;
  game.p2Role = (role === 'snake') ? 'tetris' : 'snake';
  game.twoPlayerMode = true;
  game.gameControlStep = GAME_CONTROL_P1;
}

export function gameOver() {
  if (game.twoPlayerMode) {
    recordScore(game.snakeScore, 'snake');
    recordScore(game.tetrisScore, 'tetris');
  } else {
    const playerScore = game.role === 'tetris' ? game.tetrisScore : game.snakeScore;
    recordScore(playerScore, game.role);
  }
  // In two-player mode the game-over overlay returns to the SHARED screen, not
  // the main menu.
  if (game.twoPlayerMode) {
    game.state = GAME_CONTROL_START;
  } else {
    game.state = GAME_OVER;
  }
}

// Who locks the next control model: 1, 2, or null when both are locked.
export function currentControlPlayer() {
  if (!controlModelAssigned(1)) return 1;
  if (!controlModelAssigned(2)) return 2;
  return null;
}
