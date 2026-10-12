// Input FLOW layer: the single state machine that consumes normalized intents
// and drives one navigation path. The raw device adapters live in
// js/devices.js; this module owns handleIntent (the collapsed nav path) +
// setDirection (byte-for-byte stable) + canvas fitting + listener registration.

import {
  BOARD_W, BOARD_H, FIELD_V_GAP, FIELD_V_GAP_MOBILE, UI_STACK_MAX_WIDTH,
  PLAYING, MENU, SELECT_ROLE, SELECT_CONTROL, RECORDS, HELP, GAME_OVER,
} from './constants.js';
import { game } from './state.js';
import { pushIntent } from './screens.js';
import { requestPieceShift, rotatePiece } from './pieces.js';
import {
  keyToIntent,
  setCanvas as deviceSetCanvas,
  onPointerDown as devicePointerDown,
  onPointerMove as devicePointerMove,
  onPointerUp as devicePointerUp,
  onPointerCancel as devicePointerCancel,
  pollController as devicePoll,
  clearControllerPrev,
} from './devices.js';

let canvas = null;
let menuItemsEls = [];
let roleItemsEls = [];
let controlItemsEls = [];

// ---------- FLOW: device events -> intents -> the screen system ----------
// Navigation is not decided here. Every navigation intent is pushed onto the
// screen system's queue and the screen table applies it on the next tick.
// Only the in-game actions (steering, piece control) act directly, because
// they drive the play half on the current tick.
export function handleIntent(intent) {
  if (!intent) return;
  // Steering: PLAYING gate + no-reverse (shared, byte-for-byte stable).
  if (intent.dir) {
    setDirection(intent.dir);
    return;
  }
  switch (intent.action) {
    case 'pieceShift':
      if (game.play.role === 'tetris') requestPieceShift(intent.dc);
      return;
    case 'pieceRotate':
      if (game.play.role === 'tetris' && game.play.pieces.length > 0) {
        rotatePiece(game.play.pieces[0], intent.cw);
      }
      return;
    default:
      pushIntent(intent);
  }
}

// Shared direction path: PLAYING gate + no-reverse rule. Both keyboard and
// touch feed here so they obey identical rules.
export function setDirection(d) {
  if (game.screen.state !== PLAYING) return;
  // No-reverse rule: block the exact opposite of the current direction.
  if (d.r === -game.play.dir.r && d.c === -game.play.dir.c) return;
  game.play.nextDir = d;
}

// ---------- Thin wrappers: raw event -> intent -> handleIntent ----------
// These are what initInput registers. Each produces a normalized intent via
// the device adapter in js/devices.js and routes it through handleIntent.

// Map a layout key to its model name ('wasd' or 'arrows'), or null when the
// key is not a layout key.
function keyboardModelForKey(k) {
  if (k === 'w' || k === 'a' || k === 's' || k === 'd') return 'wasd';
  if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') return 'arrows';
  return null;
}

export function onKey(e) {
  // In SELECT_CONTROL with two-player mode: any layout key locks the current
  // player's choice; Enter/Space asks the screen system to start. The table
  // rejects a start while a player has no model.
  if (game.screen.state === SELECT_CONTROL && game.screen.twoPlayerMode) {
    const model = keyboardModelForKey(e.key);
    if (model) {
      pushIntent({ action: 'lockModel', model });
      e.preventDefault();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      pushIntent({ action: 'confirm' });
      e.preventDefault();
      return;
    }
  }
  const i = keyToIntent(e.key);
  if (i) {
    handleIntent(i);
    e.preventDefault();
  }
}

export function onPointerUp(e) {
  const i = devicePointerUp(e);
  if (i) handleIntent(i);
}

// ---------- Canvas fitting + listener registration ----------
export function fitCanvas(reserved = 0) {
  // Contain fit: scale so the whole board fits the viewport, preserving
  // aspect ratio. No upper cap — the field may enlarge on large screens so
  // it fills the smaller viewport side (e.g. full height on a desktop).
  // Reserve FIELD_V_GAP above and below: the field is inset from the top and
  // bottom viewport edges by at least one board cell of breathing room.
  // On narrow viewports the reservation is halved so the board starts higher.
  const gap = window.innerWidth <= UI_STACK_MAX_WIDTH ? FIELD_V_GAP_MOBILE : FIELD_V_GAP;
  const availableH = Math.max(
    window.innerHeight - 2 * gap - reserved,
    gap
  );
  const scale = Math.min(
    window.innerWidth / BOARD_W,
    availableH / BOARD_H
  );
  canvas.style.width = (BOARD_W * scale) + 'px';
  canvas.style.height = (BOARD_H * scale) + 'px';
}

// Called by app.js after the canvas exists; stores it and registers all
// listeners. Keeps the dependency graph one-way (app -> input).
export function initInput(canvasEl) {
  canvas = canvasEl;
  deviceSetCanvas(canvasEl);
  canvas.addEventListener('pointerdown', devicePointerDown);
  canvas.addEventListener('pointermove', devicePointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', devicePointerCancel);
  canvas.addEventListener('keydown', onKey);
  document.addEventListener('keydown', onKey);
  // Gamepad connection lifecycle (design D5): clear any leftover controller
  // poll state on connect/disconnect so no stale held state survives a gamepad
  // change. Connection state itself is derived from polling, so no index
  // bookkeeping is needed here.
  window.addEventListener('gamepadconnected', clearControllerPrev);
  window.addEventListener('gamepaddisconnected', clearControllerPrev);
  // Interface elements live outside the canvas, so their pointer events never
  // reach the canvas listeners; one document-level listener covers them and
  // bails out for anything happening on the board (see onInterfacePointerUp).
  menuItemsEls = Array.from(document.querySelectorAll('#menu-items > li'));
  roleItemsEls = Array.from(document.querySelectorAll('#role-items > li'));
  controlItemsEls = Array.from(document.querySelectorAll('#control-items > li'));
  document.addEventListener('pointerup', onInterfacePointerUp);
}

// ---------- Interface (page) pointer input ----------
// The interface lives outside the canvas, so its hit areas are the boxes the
// browser laid out rather than coordinates this module owns.
function hit(el, x, y) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// The first interface element whose box contains the pointer, or null.
function firstHit(items, x, y) {
  for (const el of items) {
    if (hit(el, x, y)) return el;
  }
  return null;
}

// A click names the element the pointer landed on; the screen table decides
// what that element does.
export function onInterfacePointerUp(e) {
  if (canvas && e.target === canvas) return; // board gestures belong to onPointerUp
  const x = e.clientX;
  const y = e.clientY;
  if (game.screen.state === MENU) {
    const el = firstHit(menuItemsEls, x, y);
    if (el) pushIntent({ action: 'select', id: el.id });
    return;
  }
  if (game.screen.state === SELECT_ROLE) {
    const el = firstHit(roleItemsEls, x, y);
    if (el) pushIntent({ action: 'select', id: el.id });
    return;
  }
  if (game.screen.state === SELECT_CONTROL) {
    const el = firstHit(controlItemsEls, x, y);
    if (el) {
      pushIntent({ action: 'select', id: el.id });
      return;
    }
    for (const id of ['control-back', 'control-reassign-p1', 'control-reassign-p2']) {
      const control = document.getElementById(id);
      if (control && hit(control, x, y)) {
        pushIntent({ action: 'select', id });
        return;
      }
    }
    return;
  }
  if (game.screen.state === RECORDS || game.screen.state === HELP || game.screen.state === GAME_OVER) {
    pushIntent({ action: 'toMenu' });
  }
}

// ---------- Gamepad poll (thin wrapper -> device adapter) ----------
// app.js calls this every frame. Delegates to the device adapter in
// js/devices.js, which produces a normalized intent (or null).
export function pollController() {
  const i = devicePoll();
  if (i) handleIntent(i);
}
