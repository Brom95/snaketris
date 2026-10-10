// Input FLOW layer: the single state machine that consumes normalized intents
// and drives one navigation path. The raw device adapters live in
// js/devices.js; this module owns handleIntent (the collapsed nav path) +
// setDirection (byte-for-byte stable) + canvas fitting + listener registration.

import {
  BOARD_W, BOARD_H, FIELD_V_GAP, FIELD_V_GAP_MOBILE, UI_STACK_MAX_WIDTH,
  PLAYING, MENU, SELECT_ROLE, RECORDS, HELP, GAME_OVER,
  MENU_ITEMS, ROLE_ITEMS, ROLE_SCREEN_ITEMS,
} from './constants.js';
import { game, toMenu, startGame, confirmControlModel } from './state.js';
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

// ---------- FLOW: single state machine (collapsed nav path) ----------
// Move the highlight one step in the active list: the role list in the
// sub-menu, the main menu list otherwise. Wrapping keeps the ends reachable.
function moveSelection(step) {
  if (game.state === SELECT_ROLE) {
    game.roleSelect = (game.roleSelect + step + ROLE_SCREEN_ITEMS.length) % ROLE_SCREEN_ITEMS.length;
  } else {
    game.menuSelect = (game.menuSelect + step + MENU_ITEMS.length) % MENU_ITEMS.length;
  }
}

// Confirm the highlighted item. In MENU it opens the matching view; in
// SELECT_ROLE it locks the role and starts the game.
function confirmSelection() {
  if (game.state === MENU) {
    if (game.menuSelect === 0) game.state = SELECT_ROLE;
    else if (game.menuSelect === 1) {
      game.twoPlayerMode = true;
      game.state = SELECT_ROLE;
    }
    else if (game.menuSelect === 2) game.state = RECORDS;
    else if (game.menuSelect === 3) game.state = HELP;
  } else if (game.state === SELECT_ROLE) {
    if (game.roleSelect === ROLE_SCREEN_ITEMS.length - 1) {
      toMenu();
      return;
    }
    game.role = ROLE_ITEMS[game.roleSelect].toLowerCase();
    startGame();
  }
}

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
      moveSelection(-1);
      break;
    case 'menuDown':
      moveSelection(1);
      break;
    case 'confirm':
      // Only valid in MENU / SELECT_ROLE (the interface pointer drives
      // selection directly).
      confirmSelection();
      break;
    case 'startGame':
      // R in the main menu opens the role sub-menu; anywhere else it starts.
      if (game.state === MENU) game.state = SELECT_ROLE;
      else startGame();
      break;
    case 'pieceShift':
      if (game.role === 'tetris') requestPieceShift(intent.dc);
      break;
    case 'pieceRotate':
      if (game.role === 'tetris' && game.pieces.length > 0) {
        rotatePiece(game.pieces[0], intent.cw);
      }
      break;
    case 'toMenu':
      toMenu();
      break;
    case 'confirmP1Model':
      if (game.state === SELECT_ROLE && game.twoPlayerMode) {
        confirmControlModel(1, intent.model);
      }
      break;
    case 'confirmP2Model':
      if (game.state === SELECT_ROLE && game.twoPlayerMode) {
        confirmControlModel(2, intent.model);
      }
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
  // In SELECT_ROLE with two-player mode, WASD keys confirm P1's model and
  // arrow keys confirm P2's. The keys also drive navigation (fall-through).
  if (game.state === SELECT_ROLE && game.twoPlayerMode) {
    const k = e.key;
    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      handleIntent({ action: 'confirmP1Model', model: 'wasd' });
    } else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      handleIntent({ action: 'confirmP2Model', model: 'arrows' });
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

// Index of the first item whose box contains the pointer, or -1 for none.
function firstHit(items, x, y) {
  for (let i = 0; i < items.length; i++) {
    if (hit(items[i], x, y)) return i;
  }
  return -1;
}

// A click on a main-menu item selects it and opens its view.
function openMenuItem(i) {
  game.menuSelect = i;
  if (i === 0) game.state = SELECT_ROLE;
  else if (i === 1) {
    game.twoPlayerMode = true;
    game.state = SELECT_ROLE;
  }
  else if (i === 2) game.state = RECORDS;
  else if (i === 3) game.state = HELP;
}

export function onInterfacePointerUp(e) {
  if (canvas && e.target === canvas) return; // board gestures belong to onPointerUp
  const x = e.clientX;
  const y = e.clientY;
  if (game.state === MENU) {
    // The GitHub link is a real anchor: the browser navigates it itself, so a
    // click outside the items selects nothing.
    const item = firstHit(menuItemsEls, x, y);
    if (item >= 0) openMenuItem(item);
    return;
  }
  if (game.state === SELECT_ROLE) {
    // Back is a normal item in the list, so confirming index 2 returns to the
    // menu through the same path as a role choice.
    const item = firstHit(roleItemsEls, x, y);
    if (item >= 0) {
      game.roleSelect = item;
      handleIntent({ action: 'confirm' });
    }
    return;
  }
  if (game.state === RECORDS || game.state === HELP || game.state === GAME_OVER) {
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
