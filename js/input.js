// Input FLOW layer: the single state machine that consumes normalized intents
// and drives one navigation path. The raw device adapters live in
// js/devices.js; this module owns handleIntent (the collapsed nav path) +
// setDirection (byte-for-byte stable) + canvas fitting + listener registration.

import {
  BOARD_W, BOARD_H, FIELD_V_GAP, FIELD_V_GAP_MOBILE, UI_STACK_MAX_WIDTH,
  PLAYING, MENU, RECORDS, HELP, GAME_OVER,
} from './constants.js';
import { game, toMenu, startGame } from './state.js';
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

// ---------- FLOW: single state machine (collapsed nav path) ----------
// Every normalized intent routes through this one dispatcher. The three
// duplicated navigation paths (keyboard / pointer-onboard / gamepad) are
// collapsed here. setDirection is the shared steering branch, kept
// byte-for-byte stable.
export function handleIntent(intent) {
  if (!intent) return;
  // Steering: PLAYING gate + no-reverse (shared, byte-for-byte stable).
  if (intent.dir) {
    setDirection(intent.dir);
    return;
  }
  switch (intent.action) {
    case 'menuUp':
      game.menuSelect = (game.menuSelect + 2) % 3;
      break;
    case 'menuDown':
      game.menuSelect = (game.menuSelect + 1) % 3;
      break;
    case 'confirm':
      // Only valid in MENU (the interface pointer drives selection directly).
      if (game.state === MENU) {
        if (game.menuSelect === 0) startGame();
        else if (game.menuSelect === 1) game.state = RECORDS;
        else game.state = HELP;
      }
      break;
    case 'startGame':
      startGame();
      break;
    case 'toMenu':
      toMenu();
      break;
  }
}

// Shared direction path: PLAYING gate + no-reverse rule. Both keyboard and
// touch feed here so they obey identical rules.
export function setDirection(d) {
  if (game.state !== PLAYING) return;
  // No-reverse rule: block the exact opposite of the current direction.
  if (d.r === -game.dir.r && d.c === -game.dir.c) return;
  game.nextDir = d;
}

// ---------- Thin wrappers: raw event -> intent -> handleIntent ----------
// These are what initInput registers. Each produces a normalized intent via
// the device adapter in js/devices.js and routes it through handleIntent.

export function onKey(e) {
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

export function onInterfacePointerUp(e) {
  if (canvas && e.target === canvas) return; // board gestures belong to onPointerUp
  const x = e.clientX;
  const y = e.clientY;
  if (game.state === MENU) {
    for (let i = 0; i < menuItemsEls.length; i++) {
      if (!hit(menuItemsEls[i], x, y)) continue;
      game.menuSelect = i;
      if (i === 0) startGame();
      else if (i === 1) game.state = RECORDS;
      else game.state = HELP;
      return;
    }
    // The GitHub link is a real anchor: the browser navigates it itself, so a
    // click outside the items selects nothing.
    return;
  }
  if (game.state === 'RECORDS' || game.state === 'HELP' || game.state === 'GAME_OVER') {
    handleIntent({ action: 'toMenu' });
  }
}

// ---------- Gamepad poll (thin wrapper -> device adapter) ----------
// app.js calls this every frame. Delegates to the device adapter in
// js/devices.js, which produces a normalized intent (or null).
export function pollController() {
  const i = devicePoll();
  if (i) handleIntent(i);
}
