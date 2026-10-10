// Game state: ownership of all mutable game state + transitions.
// Every module imports `game` and mutates it in place, so there is always
// one source of truth and no stale references across module boundaries.
import { MENU, PLAYING, GAME_OVER, ROWS, SPAWN_INTERVAL } from './constants.js';
import { initGrid } from './grid.js';
import { recordScore } from './highscores.js';

export const game = {
  state: MENU,
  menuSelect: 0,
  roleSelect: 0,
  role: 'snake',
  p1Role: null,
  p2Role: null,
  twoPlayerMode: false,
  p1Model: null,
  p2Model: null,
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
  game.p1Model = null;
  game.p2Model = null;
}

// Confirm a player's control model. P1 sets their own; P2 is constrained by
// P1's choice (no two players pick the same WASD/Arrows). Gamepad is always
// shareable. Returns true on success, false if the model is blocked.
export function confirmControlModel(player, model) {
  if (player === 1) {
    game.p1Model = model;
    return true;
  }
  // P2: keyboard models are exclusive with P1; gamepad is shareable.
  if (model !== 'gamepad' && game.p1Model === model) return false;
  game.p2Model = model;
  return true;
}

export function startGame() {
  if (game.state === PLAYING) return;
  const role = game.role;
  const twoPlayer = game.twoPlayerMode;
  resetGame();
  // resetGame clears the menu state; the role chosen before the game is kept.
  game.role = role;
  if (twoPlayer) {
    game.twoPlayerMode = true;
    game.p1Role = role;
    game.p2Role = role === 'snake' ? 'tetris' : 'snake';
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

// P1 picks a role; P2 auto-gets the other. Sets the two-player mode flag
// and assigns both roles.
export function pickP1Role(role) {
  game.p1Role = role;
  game.p2Role = (role === 'snake') ? 'tetris' : 'snake';
  game.twoPlayerMode = true;
}

export function gameOver() {
  if (game.twoPlayerMode) {
    recordScore(game.snakeScore, 'snake');
    recordScore(game.tetrisScore, 'tetris');
  } else {
    const playerScore = game.role === 'tetris' ? game.tetrisScore : game.snakeScore;
    recordScore(playerScore, game.role);
  }
  game.state = GAME_OVER;
}
