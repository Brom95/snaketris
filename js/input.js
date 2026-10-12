// Input FLOW layer: the single state machine that consumes normalized intents
// and drives one navigation path. The raw device adapters live in
// js/devices.js; this module owns handleIntent (the collapsed nav path) +
// setDirection (byte-for-byte stable) + canvas fitting + listener registration.

import {
  BOARD_W, BOARD_H, FIELD_V_GAP, FIELD_V_GAP_MOBILE, UI_STACK_MAX_WIDTH,
  PLAYING, MENU, SELECT_ROLE, SELECT_CONTROL, RECORDS, HELP, GAME_OVER,
  MENU_ITEMS, ROLE_ITEMS, ROLE_SCREEN_ITEMS, CONTROL_SCREEN_ITEMS,
} from './constants.js';
import { game, startGame } from './state.js';
import {
  toMenu, lockControlModel, currentControlPlayer, backToRoleSelect, reassignP1, reassignP2,
} from './screens.js';
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

// ---------- FLOW: single state machine (collapsed nav path) ----------
// Move the highlight one step in the active list: the role list in the
// sub-menu, the main menu list otherwise. Wrapping keeps the ends reachable.
function moveSelection(step) {
  if (game.screen.state === SELECT_ROLE) {
    game.screen.roleSelect = (game.screen.roleSelect + step + ROLE_SCREEN_ITEMS.length) % ROLE_SCREEN_ITEMS.length;
  } else if (game.screen.state === SELECT_CONTROL) {
    game.screen.controlSelect = (game.screen.controlSelect + step + CONTROL_SCREEN_ITEMS.length) % CONTROL_SCREEN_ITEMS.length;
  } else {
    game.screen.menuSelect = (game.screen.menuSelect + step + MENU_ITEMS.length) % MENU_ITEMS.length;
  }
}

// Confirm the highlighted item. In MENU it opens the matching view; in
// SELECT_ROLE it locks the role and starts the game (or goes to control screen);
// in SELECT_CONTROL it starts the game when both players have confirmed.
function confirmSelection() {
  if (game.screen.state === MENU) {
    if (game.screen.menuSelect === 0) game.screen.state = SELECT_ROLE;
    else if (game.screen.menuSelect === 1) {
      game.screen.twoPlayerMode = true;
      game.screen.state = SELECT_ROLE;
    }
    else if (game.screen.menuSelect === 2) game.screen.state = RECORDS;
    else if (game.screen.menuSelect === 3) game.screen.state = HELP;
  } else if (game.screen.state === SELECT_ROLE) {
    if (game.screen.roleSelect === ROLE_SCREEN_ITEMS.length - 1) {
      toMenu();
      return;
    }
    game.play.role = ROLE_ITEMS[game.screen.roleSelect].toLowerCase();
    if (game.screen.twoPlayerMode) {
      game.screen.state = SELECT_CONTROL;
    } else {
      startGame();
    }
  } else if (game.screen.state === SELECT_CONTROL) {
    // Start item: start the game once both players have locked a model.
    if (game.screen.p1Model && game.screen.p2Model) {
      startGame();
      return;
    }
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
      if (game.screen.state === MENU) game.screen.state = SELECT_ROLE;
      else startGame();
      break;
    case 'pieceShift':
      if (game.play.role === 'tetris') requestPieceShift(intent.dc);
      break;
    case 'pieceRotate':
      if (game.play.role === 'tetris' && game.play.pieces.length > 0) {
        rotatePiece(game.play.pieces[0], intent.cw);
      }
      break;
    case 'toMenu':
      toMenu();
      break;
    case 'lockModel':
      // Any layout key immediately locks the current player's choice.
      if (game.screen.state === SELECT_CONTROL && game.screen.twoPlayerMode) {
        const player = currentControlPlayer();
        if (player) {
          lockControlModel(player, intent.model);
        }
      }
      break;
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
  // In SELECT_CONTROL with two-player mode: any layout key immediately locks
  // the current player's choice. Once both have locked, Enter/Space starts
  // the game. There is no separate confirm step.
  if (game.screen.state === SELECT_CONTROL && game.screen.twoPlayerMode) {
    const k = e.key;
    const model = keyboardModelForKey(k);
    if (model) {
      // Layout key: lock the current player's choice in one press.
      lockControlModel(currentControlPlayer(), model);
      e.preventDefault();
      return;
    }
    if ((k === ' ' || k === 'Enter') && game.screen.p1Model && game.screen.p2Model) {
      // Start key: only once both players have locked a model.
      handleIntent({ action: 'confirm' });
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

// Index of the first item whose box contains the pointer, or -1 for none.
function firstHit(items, x, y) {
  for (let i = 0; i < items.length; i++) {
    if (hit(items[i], x, y)) return i;
  }
  return -1;
}

// A click on a main-menu item selects it and opens its view.
function openMenuItem(i) {
  game.screen.menuSelect = i;
  if (i === 0) game.screen.state = SELECT_ROLE;
  else if (i === 1) {
    game.screen.twoPlayerMode = true;
    game.screen.state = SELECT_ROLE;
  }
  else if (i === 2) game.screen.state = RECORDS;
  else if (i === 3) game.screen.state = HELP;
}

export function onInterfacePointerUp(e) {
  if (canvas && e.target === canvas) return; // board gestures belong to onPointerUp
  const x = e.clientX;
  const y = e.clientY;
  if (game.screen.state === MENU) {
    // The GitHub link is a real anchor: the browser navigates it itself, so a
    // click outside the items selects nothing.
    const item = firstHit(menuItemsEls, x, y);
    if (item >= 0) openMenuItem(item);
    return;
  }
  if (game.screen.state === SELECT_ROLE) {
    // Back is a normal item in the list, so confirming index 2 returns to the
    // menu through the same path as a role choice.
    const item = firstHit(roleItemsEls, x, y);
    if (item >= 0) {
      game.screen.roleSelect = item;
      handleIntent({ action: 'confirm' });
    }
    return;
  }
  if (game.screen.state === SELECT_CONTROL) {
    const item = firstHit(controlItemsEls, x, y);
    if (item >= 0) {
      // The Start item starts the game once both players have locked a model.
      if (item === CONTROL_SCREEN_ITEMS.length - 1) {
        if (game.screen.p1Model && game.screen.p2Model) {
          startGame();
        }
        return;
      }
      // P1/P2 items lock their model via a layout key, not a click.
      return;
    }
    // Separate Back button: hit-test the element directly.
    const backEl = document.getElementById('control-back');
    if (backEl && hit(backEl, x, y)) {
      backToRoleSelect();
      return;
    }
    // Reassign buttons: clear a player's selection so they can pick again.
    const reP1 = document.getElementById('control-reassign-p1');
    if (reP1 && hit(reP1, x, y)) {
      reassignP1();
      return;
    }
    const reP2 = document.getElementById('control-reassign-p2');
    if (reP2 && hit(reP2, x, y)) {
      reassignP2();
      return;
    }
    return;
  }
  if (game.screen.state === RECORDS || game.screen.state === HELP || game.screen.state === GAME_OVER) {
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
