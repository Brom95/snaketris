// Keyboard + pointer input, shared direction path, and canvas fitting.
import { BOARD_W, BOARD_H, PLAYING } from './constants.js';
import { game, restart } from './state.js';

let canvas = null;

// Shared direction path: PLAYING gate + no-reverse rule. Both keyboard and
// touch feed here so they obey identical rules.
export function setDirection(d) {
  if (game.state !== PLAYING) return;
  // No-reverse rule: block the exact opposite of the current direction.
  if (d.r === -game.dir.r && d.c === -game.dir.c) return;
  game.nextDir = d;
}

export function keyToDir(key) {
  switch (key) {
    case 'arrowup': case 'w': return { r: -1, c: 0 };
    case 'arrowdown': case 's': return { r: 1, c: 0 };
    case 'arrowleft': case 'a': return { r: 0, c: -1 };
    case 'arrowright': case 'd': return { r: 0, c: 1 };
    default: return null;
  }
}

export function onKey(e) {
  const key = e.key.toLowerCase();
  if (key === 'r') {
    if (game.state !== PLAYING) restart();
    return;
  }
  if (game.state !== PLAYING) return;
  const d = keyToDir(key);
  if (!d) return;
  setDirection(d);
  e.preventDefault();
}

// ---------- Pointer input (touch + mouse) ----------
const TAP_THRESHOLD = 24; // displacement below one cell classifies as a tap
let activePointerId = null;
let pointerStart = null; // start position in logical canvas coords

// Displacement in logical canvas coords for a pointer event.
export function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width * BOARD_W,
    y: (clientY - rect.top) / rect.height * BOARD_H
  };
}

// Called by app.js after the canvas exists; stores it and registers all
// listeners. Keeps the dependency graph one-way (app -> input).
export function initInput(canvasEl) {
  canvas = canvasEl;
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('keydown', onKey);
  document.addEventListener('keydown', onKey);
}

export function fitCanvas() {
  const scale = Math.min(window.innerWidth / BOARD_W, window.innerHeight / BOARD_H, 1);
  canvas.style.width = (BOARD_W * scale) + 'px';
  canvas.style.height = (BOARD_H * scale) + 'px';
}

export function onPointerDown(e) {
  if (activePointerId !== null) return; // ignore second concurrent pointer
  activePointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  pointerStart = toLogical(e.clientX, e.clientY);
}

export function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  // Capture keeps the gesture routed to us even off-canvas; only the end
  // position matters, so no per-move work is needed.
}

export function onPointerUp(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  const end = toLogical(e.clientX, e.clientY);
  const dx = end.x - pointerStart.x;
  const dy = end.y - pointerStart.y;
  pointerStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_THRESHOLD) {
    // Tap: displacement below one cell.
    if (game.state !== PLAYING) {
      restart(); // start from IDLE, restart from GAME_OVER (score -> 0)
      return;
    }
    const tapDir = tapToDir(end.x, end.y);
    if (tapDir) setDirection(tapDir);
  } else {
    // Swipe: dominant axis of the displacement.
    setDirection(swipeToDir(dx, dy));
  }
}

export function onPointerCancel(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  pointerStart = null;
}

// Tap region mapping: dominant offset from the center decides left/right vs
// up/down; a dead-center tap is a no-op.
export function tapToDir(x, y) {
  const cx = BOARD_W / 2;
  const cy = BOARD_H / 2;
  const ox = x - cx;
  const oy = y - cy;
  if (Math.abs(ox) < TAP_THRESHOLD && Math.abs(oy) < TAP_THRESHOLD) return null;
  if (Math.abs(ox) >= Math.abs(oy)) {
    return ox < 0 ? { r: 0, c: -1 } : { r: 0, c: 1 };
  }
  return oy < 0 ? { r: -1, c: 0 } : { r: 1, c: 0 };
}

// Swipe mapping: dominant axis of the displacement.
export function swipeToDir(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? { r: 0, c: -1 } : { r: 0, c: 1 };
  }
  return dy < 0 ? { r: -1, c: 0 } : { r: 1, c: 0 };
}
