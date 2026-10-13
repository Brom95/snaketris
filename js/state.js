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
import { screenFields, applyGameOverScreen } from './screens.js';
import { state, configureState, resetState } from '../engine/js/state.js';

// The engine skeleton holds the two containers; this module registers the
// game's field tables into it and hands out the same binding every other
// module already imports.
export const game = state;

// The gameplay fields, as [name, initial] pairs. The engine refills them on
// every reset and never names one of them itself.
const PLAY_FIELDS = [
  ['snake', []],
  ['pieces', []],
  ['snakeScore', 0],
  ['tetrisScore', 0],
  ['landedBlocks', 0],
  ['completedPieces', 0], // pieces that either landed or were fully consumed
  ['overflow', 0], // eaten cells beyond MAX_SNAKE_LEN, each recolours one segment
  ['dir', { r: 0, c: 1 }],
  ['nextDir', { r: 0, c: 1 }],
  ['snakeAcc', 0],
  ['spawnAcc', 0],
  ['pieceMoveAcc', 0],
  ['tick', 0], // the engine owns this slot: it advances it once per tick
  ['gameOverReason', null], // 'snake-death' | 'top-out' | 'time-up' | null
  ['role', 'snake'], // the side the player drives; the bot drives the other
  ['result', null], // the finished game waiting for the records layer
  ['durationMinutes', DURATION_MINUTES[0]],
  ['durationTicks', DURATION_MINUTES[0] * TICKS_PER_MINUTE],
];

// The engine refills both halves from the tables, then runs this hook so the
// game can rebuild what no table can express: the grid and the starting snake.
configureState({
  play: PLAY_FIELDS,
  screen: screenFields(),
  afterReset: () => {
    initGrid();
    resetSnake();
  },
});

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

// The engine skeleton refills both halves from the registered tables and runs
// the afterReset hook above, so this module names no reset step.
export function resetGame() {
  resetState();
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

// The countdown as a registry system. It declares only endTick, so the engine
// runs it in the closing phase; its position in the systems list fixes that
// closing order and not the update order.
export const countdownSystem = {
  name: 'countdown',
  endTick(ctx) {
    advanceCountdown();
  },
};

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
