// Game state: the gameplay half (`game.play`) plus the navigation half
// (`game.screen`) under one root object. Every module imports `game` and
// mutates it in place, so there is one source of truth and no stale
// references across module boundaries. The halves are separate objects, so
// each reset and each read names the half it belongs to. The screen layer
// (js/screens.js) owns the navigation half's shape, its initial values and
// every navigation transition; this module owns the state and the gameplay
// entry points.
import { PLAYING, ROWS, SPAWN_INTERVAL } from './constants.js';
import { initGrid } from './grid.js';
import { newScreen, resetScreen, applyGameOverScreen } from './screens.js';

export const game = {
  play: {
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
    tick: 0,
    gameOverReason: null, // why the last game ended: 'snake-death' | 'top-out' | null
    role: 'snake', // the side the player drives; the bot drives the other
    // The finished game reported to the records layer: an array of
    // { score, role } entries, or null when nothing is waiting. The core
    // writes this field only; the records layer is the only board writer.
    result: null,
  },
  screen: newScreen(),
};

function resetSnake() {
  const mid = Math.floor(ROWS / 2);
  game.play.snake = [
    { r: mid, c: 6 },
    { r: mid, c: 5 },
    { r: mid, c: 4 }
  ];
  game.play.dir = { r: 0, c: 1 };
  game.play.nextDir = { r: 0, c: 1 };
}

// The gameplay half: grid, snake, pieces, scores, accumulators.
function resetPlay() {
  initGrid();
  resetSnake();
  game.play.pieces = [];
  game.play.snakeScore = 0;
  game.play.tetrisScore = 0;
  game.play.landedBlocks = 0;
  game.play.completedPieces = 0;
  game.play.overflow = 0;
  game.play.snakeAcc = 0;
  game.play.spawnAcc = 0;
  game.play.pieceMoveAcc = 0;
  game.play.tick = 0;
  game.play.gameOverReason = null;
  game.play.result = null;
}

// The navigation half lives in js/screens.js: `resetScreen` replaces it with a
// fresh one, so no navigation constant is named here.
export function resetGame() {
  resetPlay();
  resetScreen();
}

export function startGame() {
  if (game.screen.state === PLAYING) return;
  const role = game.play.role;
  const twoPlayer = game.screen.twoPlayerMode;
  // Preserve the locked control models across the reset so the SHARED screen
  // can re-show both layouts after a game ends (two-player mode).
  const p1Model = game.screen.p1Model;
  const p2Model = game.screen.p2Model;
  resetGame();
  // resetGame clears the menu state; the role chosen before the game is kept.
  game.play.role = role;
  if (twoPlayer) {
    game.screen.twoPlayerMode = true;
    game.screen.p1Role = role;
    game.screen.p2Role = role === 'snake' ? 'tetris' : 'snake';
    game.screen.p1Model = p1Model;
    game.screen.p2Model = p2Model;
  }
  game.screen.state = PLAYING;
  // Prime the spawn accumulator so the first piece appears on the very next
  // update tick (matching the original immediate-spawn feel). Subsequent
  // pieces are gated by the sequential spawn logic in app.js.
  game.play.spawnAcc = SPAWN_INTERVAL;
}

export function restart() {
  startGame();
}

// The core reports the finished game; it never writes the records board. A
// two-player duel reports both sides, a single-player game reports the side
// the player drove. The records layer persists this report once.
export function gameOver(reason) {
  game.play.gameOverReason = reason;
  game.play.result = finishedResult();
  // The screen layer decides which screen the interface shows after a game.
  applyGameOverScreen();
}

function finishedResult() {
  if (game.screen.twoPlayerMode) {
    return [
      { score: game.play.snakeScore, role: 'snake' },
      { score: game.play.tetrisScore, role: 'tetris' },
    ];
  }
  const role = game.play.role;
  const score = role === 'tetris' ? game.play.tetrisScore : game.play.snakeScore;
  return [{ score: score, role: role }];
}
