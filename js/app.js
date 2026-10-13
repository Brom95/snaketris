// app.js — entry point. Wires every module, owns the game loop and the
// canvas. Called once on module load (deferred `<script type="module">`),
// so the DOM is parsed by the time it runs.
import { TICK } from './constants.js';
import { game, resetGame, countdownSystem } from './state.js';
import { loadBoard, recordsSystem } from './highscores.js';
import { createClock } from '../engine/js/clock.js';
import { createEngine } from '../engine/js/registry.js';
import { botSystem } from './bot.js';
import { snakeSystem } from './snake.js';
import { piecesSystem } from './pieces.js';
import { screenSystem, selectedBoardMinutes } from './screens.js';
import { initInput, fitCanvas, pollController } from './input.js';
import { initRender, render } from './render.js';
import { initUi, syncViews, interfaceBandHeight } from './ui.js';

// The ordered systems: the bot decides first (its direction is applied before
// the snake steps), then the snake steps, then the pieces fall and eat, then
// the countdown (which declares only endTick, so its place fixes the closing
// order and not the update order), then the records owner persists a result
// the core reported, and last the screen system drains the navigation intents
// the devices produced. The records step runs before navigation so a same-tick
// restart cannot drop a reported result. The registry holds no painting step:
// canvas painting and page painting run once per rendered frame in frame(),
// not once per tick.
export const systems = [botSystem, snakeSystem, piecesSystem, countdownSystem, recordsSystem, screenSystem];
const engine = createEngine(systems);

// The context handed to each system's phase call. The engine reads the state
// root through it: ctx.state.play.tick is the tick slot it owns, ctx.state.screen
// is the navigation half it resets.
const ctx = { state: game };

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

// One fixed-timestep tick: the engine advances the tick slot it owns, runs
// every system's update in declared order, then runs every endTick in declared
// order. No entry point calls a system directly and none increments the tick.
export function update() {
  engine.update(ctx);
  engine.endTick(ctx);
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
  syncViews(game.screen.state === 'RECORDS' ? loadBoard(selectedBoardMinutes()) : null);
  fitField();
}

// Full setup: create/size the canvas, register input + render, seed state,
// start the loop. The engine canvas owner sizes the buffer when the element
// is attached, so the entry point names no board numbers.
export function init() {
  const canvas = document.getElementById('game');
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
