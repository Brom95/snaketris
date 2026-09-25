// app.js — entry point. Wires every module, owns the game loop and the
// canvas. Called once on module load (deferred `<script type="module">`),
// so the DOM is parsed by the time it runs.
import { COLS, ROWS, CELL, TICK, SPAWN_INTERVAL } from './constants.js';
import { game, resetGame } from './state.js';
import { spawnPiece, stepPiece } from './pieces.js';
import { moveSnake, snakeTicksPerCell } from './snake.js';
import { initInput, fitCanvas } from './input.js';
import { initRender, render } from './render.js';

let acc = 0;
let last = performance.now();

// Fixed-timestep update body. Runs at a constant TICK, decoupled from
// render() via requestAnimationFrame. The tab-visibility pause is handled by
// rAF stopping while hidden (dt is clamped on resume).
export function update() {
  if (game.state !== 'PLAYING') return;
  game.tick++;
  // slice: pieces can be removed (landed) inside stepPiece.
  for (const p of game.pieces.slice()) stepPiece(p);

  // Sequential spawn: a new piece may spawn only when no piece is falling
  // AND the spawn interval has elapsed. spawnAcc keeps counting while a
  // piece is on the board, so the next spawn fires as soon as the previous
  // one lands or is fully consumed.
  game.spawnAcc += 1;
  if (game.spawnAcc >= SPAWN_INTERVAL && game.pieces.length === 0) {
    game.spawnAcc = 0;
    spawnPiece();
  }

  // Snake step: interval derived from the current piece fall speed
  // (snakeTicksPerCell = max(1, pieceTicksPerCell - 2)), possibly fractional.
  game.snakeAcc += 1;
  if (game.snakeAcc >= snakeTicksPerCell()) {
    game.snakeAcc -= snakeTicksPerCell();
    moveSnake();
  }
}

// rAF callback: advance the fixed-timestep accumulator, then render.
export function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  acc += dt;
  while (acc >= TICK) {
    acc -= TICK;
    update();
  }
  render();
}

// Full setup: create/size the canvas, register input + render, seed state,
// start the loop.
export function init() {
  const canvas = document.getElementById('game');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  initRender(canvas);
  initInput(canvas);
  resetGame();
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  requestAnimationFrame(frame);
}

init();
