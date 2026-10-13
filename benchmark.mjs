// Bot-vs-bot balance probe. Run it with `npm run benchmark`.
//
// It answers one question the unit tests cannot: how well do the two bots play
// against each other over a full minute of real rules? Both sides are driven by
// the real decision functions — chooseBotDir for the snake through the shared
// steering path (js/input.js handleIntent, so the PLAYING gate and the no-reverse
// rule apply), choosePieceMove for the falling piece — and the systems run in the
// same order as the engine registry: bot decision, snakeSystem, piecesSystem.
// A minute is 3600 ticks (TICK = 1/60). Each run gets its own seeded LCG, so the
// runs see different piece sequences and the aggregate is reproducible.

import { installDomStub } from './tests/helpers/dom-stub.js';
installDomStub();
import { resetGame, startGame } from './js/state.js';
import { game } from './js/state.js';
import { chooseBotDir, choosePieceMove } from './js/bot.js';
import { handleIntent } from './js/input.js';
import { snakeSystem } from './js/snake.js';
import { piecesSystem, setPieceState, requestPieceShift } from './js/pieces.js';
import { PLAYING, LINE_CLEAR_POINTS, LANDING_CELL_POINTS } from './js/constants.js';

// Per-run LCG (seed 20240601 family), installed as Math.random so spawnPiece
// sees the same sequence the real game would.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x80000000;
  };
}

// Drive both sides with the real bot decision functions.
function bothBots() {
  if (game.screen.state !== PLAYING) return;
  // Steer the snake through the shared steering path (PLAYING gate + no-reverse).
  handleIntent({ dir: chooseBotDir() });
  // Drive the falling piece: rotate to target, then shift one cell.
  const p = game.play.pieces[0];
  if (!p) return;
  const target = choosePieceMove(p);
  if (!target) return;
  setPieceState(p, target.state);
  if (p.col !== target.col) requestPieceShift(target.col > p.col ? 1 : -1);
}

const TICKS_PER_MINUTE = 3600; // TICK = 1/60

function runGame(seed) {
  Math.random = makeRng(seed);
  resetGame();
  game.play.role = 'snake'; // the snake side is the scripted driver; the piece side is scripted too
  startGame();
  let diedSide = null;
  let diedAt = null;
  for (let t = 0; t < TICKS_PER_MINUTE; t++) {
    game.play.tick++;
    bothBots();
    const beforeSnake = game.screen.state;
    snakeSystem.update();
    if (game.screen.state !== PLAYING && beforeSnake === PLAYING) {
      diedSide = 'snake';
      diedAt = t;
      break;
    }
    const beforePieces = game.screen.state;
    piecesSystem.update();
    if (game.screen.state !== PLAYING && beforePieces === PLAYING) {
      diedSide = 'tetris';
      diedAt = t;
      break;
    }
  }
  return {
    seed,
    snakeScore: game.play.snakeScore,
    tetrisScore: game.play.tetrisScore,
    snakeLen: game.play.snake.length,
    completedPieces: game.play.completedPieces,
    landedBlocks: game.play.landedBlocks,
    ticksPlayed: diedSide == null ? TICKS_PER_MINUTE : diedAt,
    survived: diedSide == null,
    diedSide,
    diedAt,
  };
}

const SEEDS = [20240601, 111, 222, 333, 444, 555, 666, 777, 888, 999, 1024, 4096];
const games = [];
for (const seed of SEEDS) {
  games.push(runGame(seed));
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// A landed block pays 3 points and a cleared row pays LINE_CLEAR_POINTS, so the
// row count follows from the score once the landed cells are taken out.
function describe(g) {
  const winner = g.diedSide === 'snake' ? 'tetris'
    : g.diedSide === 'tetris' ? 'snake'
    : g.snakeScore > g.tetrisScore ? 'snake' : g.snakeScore < g.tetrisScore ? 'tetris' : 'draw';
  const survived = g.survived ? 'survived full minute' : `died: ${g.diedSide} at tick ${g.diedAt}`;
  const attempted = g.completedPieces * 4;
  const eaten = attempted - g.landedBlocks;
  const rowsCleared = (g.tetrisScore - LANDING_CELL_POINTS * g.landedBlocks) / LINE_CLEAR_POINTS;
  return `seed ${String(g.seed).padStart(8)} | snake ${String(g.snakeScore).padStart(4)} tetris ${String(g.tetrisScore).padStart(4)} ` +
    `| ${winner.padEnd(6)} | ${survived} | snakeLen=${g.snakeLen} completed=${g.completedPieces} landed=${g.landedBlocks} ` +
    `eaten=${eaten}(${((eaten / attempted) * 100).toFixed(0)}%) rows=${rowsCleared} ticks=${g.ticksPlayed}`;
}

console.log('--- per game ---');
for (const g of games) console.log(describe(g));

console.log('\n--- aggregate ---');
const snakeScores = games.map((g) => g.snakeScore);
const tetrisScores = games.map((g) => g.tetrisScore);
console.log(`snake  : mean=${mean(snakeScores).toFixed(1)} median=${median(snakeScores)}`);
console.log(`tetris : mean=${mean(tetrisScores).toFixed(1)} median=${median(tetrisScores)}`);

let snakeWins = 0;
let tetrisWins = 0;
let draws = 0;
let snakeDied = 0;
let tetrisDied = 0;
let survivedFull = 0;
for (const g of games) {
  const winner = g.diedSide === 'snake' ? 'tetris'
    : g.diedSide === 'tetris' ? 'snake'
    : g.snakeScore > g.tetrisScore ? 'snake' : g.snakeScore < g.tetrisScore ? 'tetris' : 'draw';
  if (winner === 'snake') snakeWins++;
  else if (winner === 'tetris') tetrisWins++;
  else draws++;
  if (g.diedSide === 'snake') snakeDied++;
  if (g.diedSide === 'tetris') tetrisDied++;
  if (g.survived) survivedFull++;
}
const n = games.length;
console.log(`snake wins: ${snakeWins} | tetris wins: ${tetrisWins} | draws: ${draws}`);
console.log(`snake died: ${snakeDied}/${n} | tetris died: ${tetrisDied}/${n} | both survived: ${survivedFull}/${n}`);
