// Game state: ownership of all mutable game state + transitions.
// Every module imports `game` and mutates it in place, so there is always
// one source of truth and no stale references across module boundaries.
import { IDLE, PLAYING, GAME_OVER, ROWS, SPAWN_INTERVAL } from './constants.js';
import { initGrid } from './grid.js';

export const game = {
  state: IDLE,
  snake: [],
  pieces: [],
  score: 0,
  landedBlocks: 0,
  dir: { r: 0, c: 1 },
  nextDir: { r: 0, c: 1 },
  snakeAcc: 0,
  spawnAcc: 0,
  tick: 0
};

function resetSnake() {
  const mid = Math.floor(ROWS / 2);
  game.snake = [
    { r: mid, c: 6 },
    { r: mid, c: 5 },
    { r: mid, c: 4 },
    { r: mid, c: 3 }
  ];
  game.dir = { r: 0, c: 1 };
  game.nextDir = { r: 0, c: 1 };
}

export function resetGame() {
  game.state = IDLE;
  initGrid();
  resetSnake();
  game.pieces = [];
  game.score = 0;
  game.landedBlocks = 0;
  game.snakeAcc = 0;
  game.spawnAcc = 0;
  game.tick = 0;
}

export function startGame() {
  if (game.state === PLAYING) return;
  resetGame();
  game.state = PLAYING;
  // Prime the spawn accumulator so the first piece appears on the very next
  // update tick (matching the original immediate-spawn feel). Subsequent
  // pieces are gated by the sequential spawn logic in app.js.
  game.spawnAcc = SPAWN_INTERVAL;
}

export function restart() {
  startGame();
}

export function gameOver() {
  game.state = GAME_OVER;
}
