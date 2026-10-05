// app.js — entry point. Wires every module, owns the game loop and the
// canvas. Called once on module load (deferred `<script type="module">`),
// so the DOM is parsed by the time it runs.
import { COLS, ROWS, CELL, TICK } from './constants.js';
import { game, resetGame } from './state.js';
import { loadBoard } from './highscores.js';
import { createClock, createEngine } from './engine.js';
import { snakeSystem } from './snake.js';
import { piecesSystem } from './pieces.js';
import { initInput, fitCanvas, pollController } from './input.js';
import { initRender, render } from './render.js';
import { initUi, syncViews, interfaceBandHeight } from './ui.js';

// The ordered systems: snake steps first (so the head sees the piece where
// it was), then pieces fall and eat. app.js no longer owns per-tick game
// logic — each system does its own state check and work in declared order.
const engine = createEngine([snakeSystem, piecesSystem]);

// The context handed to each system's update(ctx). The systems read the
// shared `game` module directly; ctx is the hook for any future per-frame
// data a system needs (kept minimal now).
const ctx = { game };

// Fixed-timestep clock: accumulates frame time and yields 0..N ticks to run.
// Mirrors the accumulator pattern that lived in app.update().
const clock = createClock(TICK);

let last = performance.now();
let lastBand = -1;

// The band the interface takes from the field changes with the shown view
// (the hidden field and the overlaid readout claim none), so the field is
// re-fitted on the frame rather than only on resize. The band rarely moves,
// so the fit is skipped while it is unchanged.
function fitField(force = false) {
  const band = interfaceBandHeight();
  if (!force && band === lastBand) return;
  lastBand = band;
  fitCanvas(band);
}

// One fixed-timestep tick: advance the shared tick counter and run every
// system in declared order. The systems each guard on game.state themselves.
export function update() {
  game.tick++;
  engine.update(ctx);
}

// rAF callback: advance the clock, run that many ticks, then render.
export function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const n = clock.advance(dt);
  for (let i = 0; i < n; i++) update();
  pollController();
  render();
  syncViews(game.state === 'RECORDS' ? loadBoard() : null);
  fitField();
}

// Full setup: create/size the canvas, register input + render, seed state,
// start the loop.
export function init() {
  const canvas = document.getElementById('game');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  initRender(canvas);
  initInput(canvas);
  initUi();
  resetGame();
  syncViews(null);
  fitField(true);
  window.addEventListener('resize', () => fitField(true));
  requestAnimationFrame(frame);
}

init();
