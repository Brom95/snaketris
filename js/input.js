// Keyboard + pointer input, shared direction path, and canvas fitting.
import {
  BOARD_W, BOARD_H, PLAYING, MENU, RECORDS, HELP, GAME_OVER,
  MENU_ITEMS, MENU_ITEM_Y, MENU_ITEM_HIT_H
} from './constants.js';
import { game, toMenu, startGame } from './state.js';

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
  // MENU: arrows/W-S move the selection, Enter/Space confirms, R starts.
  if (game.state === MENU) {
    if (key === 'arrowup' || key === 'w') {
      game.menuSelect = (game.menuSelect + 2) % 3;
    } else if (key === 'arrowdown' || key === 's') {
      game.menuSelect = (game.menuSelect + 1) % 3;
    } else if (key === 'enter' || key === ' ') {
      if (game.menuSelect === 0) startGame();
      else if (game.menuSelect === 1) game.state = RECORDS;
      else game.state = HELP;
    } else if (key === 'r') {
      startGame();
    }
    e.preventDefault();
    return;
  }
  // RECORDS / HELP: return to the menu.
  if (game.state === RECORDS || game.state === HELP) {
    if (key === 'enter' || key === ' ' || key === 'escape') toMenu();
    e.preventDefault();
    return;
  }
  // GAME_OVER: R/Enter/Space back to the menu.
  if (game.state === GAME_OVER) {
    if (key === 'r' || key === 'enter' || key === ' ') toMenu();
    e.preventDefault();
    return;
  }
  // PLAYING: steering, unchanged from before.
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
  // Contain fit: scale so the whole board fits the viewport, preserving
  // aspect ratio. No upper cap — the field may enlarge on large screens so
  // it fills the smaller viewport side (e.g. full height on a desktop).
  const scale = Math.min(window.innerWidth / BOARD_W, window.innerHeight / BOARD_H);
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

  // Non-game states: act on the tap position, no steering classification.
  if (game.state === MENU) {
    // Select the item whose hit range contains the tap's logical y.
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      if (Math.abs(end.y - MENU_ITEM_Y[i]) <= MENU_ITEM_HIT_H / 2) {
        game.menuSelect = i;
        if (i === 0) startGame();
        else if (i === 1) game.state = RECORDS;
        else game.state = HELP;
      }
    }
    return;
  }
  // RECORDS / HELP / GAME_OVER: return to the menu.
  if (game.state === RECORDS || game.state === HELP || game.state === GAME_OVER) {
    toMenu();
    return;
  }
  if (game.state !== PLAYING) return;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_THRESHOLD) {
    // Tap: displacement below one cell.
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
