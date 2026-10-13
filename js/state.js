// Game state: the gameplay half (`game.play`) plus the navigation half
// (`game.screen`) under one root object. Every module imports `game` and
// mutates it in place, so there is one source of truth and no stale
// references across module boundaries. The halves are separate objects, so
// each reset and each read names the half it belongs to. The screen layer
// (js/screens.js) owns the navigation half's shape, its initial values and
// every navigation transition; this module owns the state and the gameplay
// entry points.
import { PLAYING, ROWS, SPAWN_INTERVAL, DURATION_MINUTES, TICKS_PER_MINUTE } from './constants.js';
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
    gameOverReason: null, // why the last game ended: 'snake-death' | 'top-out' | 'time-up' | null
    role: 'snake', // the side the player drives; the bot drives the other
    // The finished game reported to the records layer: an array of
    // { score, role } entries, or null when nothing is waiting. The core
    // writes this field only; the records layer is the only board writer.
    result: null,
    // The match length the player chose before play, in minutes. A match cannot
    // start without it: every path into play passes through the duration screen.
    durationMinutes: DURATION_MINUTES[0],
    // The countdown budget in engine ticks, never wall-clock seconds.
    durationTicks: DURATION_MINUTES[0] * TICKS_PER_MINUTE,
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
  const durationMinutes = game.play.durationMinutes;
  // Preserve the locked control models and their pads across the reset so the
  // SHARED screen can re-show both layouts after a game ends (two-player mode).
  const p1Model = game.screen.p1Model;
  const p2Model = game.screen.p2Model;
  const p1Pad = game.screen.p1Pad;
  const p2Pad = game.screen.p2Pad;
  resetGame();
  // resetGame clears the menu state; the role chosen before the game is kept.
  game.play.role = role;
  // The duration is re-derived from the minutes chosen before play. A two-player
  // rematch returns to the SHARED step, which sits after the duration screen, so
  // the budget has to survive the reset; a single-player rematch re-asks it.
  game.play.durationMinutes = durationMinutes;
  game.play.durationTicks = durationMinutes * TICKS_PER_MINUTE;
  if (twoPlayer) {
    game.screen.twoPlayerMode = true;
    game.screen.p1Role = role;
    game.screen.p2Role = role === 'snake' ? 'tetris' : 'snake';
    game.screen.p1Model = p1Model;
    game.screen.p2Model = p2Model;
    game.screen.p1Pad = p1Pad;
    game.screen.p2Pad = p2Pad;
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
  // The first reason set wins. A crash on the same tick as the countdown keeps
  // the crash reason, so the countdown can never turn a loss into a win.
  if (game.play.gameOverReason) return;
  game.play.gameOverReason = reason;
  game.play.result = finishedResult();
  // The screen layer decides which screen the interface shows after a game.
  applyGameOverScreen();
}

// The countdown runs after the gameplay systems so a crash on the final tick
// claims its own reason first. Measured in engine ticks, never wall-clock
// seconds: the fixed-timestep accumulator stops while the tab is hidden, and a
// Date.now() countdown would skip the time the player never played.
export function advanceCountdown() {
  if (game.screen.state !== PLAYING) return;
  if (game.play.tick < game.play.durationTicks) return;
  gameOver('time-up');
}

// The seconds the interface shows: the tick budget left, rounded up so the
// readout opens at the full minute and reaches 0 only on the final tick.
export function remainingSeconds() {
  const ticksLeft = game.play.durationTicks - game.play.tick;
  if (ticksLeft <= 0) return 0;
  return Math.ceil((ticksLeft / TICKS_PER_MINUTE) * 60);
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
