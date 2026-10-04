// Keyboard + pointer input, shared direction path, and canvas fitting.
import {
  BOARD_W, BOARD_H, FIELD_V_GAP, PLAYING, MENU, RECORDS, HELP, GAME_OVER,
} from './constants.js';
import { game, toMenu, startGame } from './state.js';

let canvas = null;
let menuItemsEls = [];

// ---------- Controller (gamepad) input ----------
// Standard Gamepad API mapping (per design D4).
const DPAD_UP = 12;      // D-pad up (standard Gamepad API button index)
const DPAD_DOWN = 13;    // D-pad down
const DPAD_LEFT = 14;    // D-pad left
const DPAD_RIGHT = 15;   // D-pad right
const BUTTON_A = 0;      // A: confirm / accept
const BUTTON_B = 1;      // B: back / cancel
const STICK_DEADZONE = 0.3; // ignore small axis values (stick drift)

// Edge-detection state for the per-frame poll. `prevButtons` maps button
// index -> was-pressed-last-frame; `null` means "no gamepad / not yet
// polled". Cleared whenever a gamepad disconnects so stale state never
// carries across.
let prevButtons = null;
let prevStickDir = null;

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
  // Gamepad connection lifecycle (design D5): clear any leftover controller
  // poll state on connect/disconnect so no stale held state survives a gamepad
  // change. Connection state itself is derived from polling, so no index
  // bookkeeping is needed here.
  const clearControllerPrev = () => {
    prevButtons = null;
    prevStickDir = null;
  };
  window.addEventListener('gamepadconnected', clearControllerPrev);
  window.addEventListener('gamepaddisconnected', clearControllerPrev);
  // Interface elements live outside the canvas, so their pointer events never
  // reach the canvas listeners; one document-level listener covers them and
  // bails out for anything happening on the board (see onInterfacePointerUp).
  menuItemsEls = Array.from(document.querySelectorAll('#menu-items > li'));
  document.addEventListener('pointerup', onInterfacePointerUp);
}

export function fitCanvas(reserved = 0) {
  // Contain fit: scale so the whole board fits the viewport, preserving
  // aspect ratio. No upper cap — the field may enlarge on large screens so
  // it fills the smaller viewport side (e.g. full height on a desktop).
  // Reserve FIELD_V_GAP above and below: the field is inset from the top and
  // bottom viewport edges by at least one board cell of breathing room.
  // `reserved` is the extra band the stacked interface takes from the same
  // axis (0 while it shares a track beside the field); the rule is unchanged.
  const availableH = Math.max(
    window.innerHeight - 2 * FIELD_V_GAP - reserved,
    FIELD_V_GAP
  );
  const scale = Math.min(
    window.innerWidth / BOARD_W,
    availableH / BOARD_H
  );
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
  // MENU lives entirely on the page (see onInterfacePointerUp), so a gesture
  // that ends on the board does nothing here.
  if (game.state === MENU) return;
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
  if (game.state === RECORDS || game.state === HELP || game.state === GAME_OVER) {
    toMenu();
  }
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
// Quantize the left thumbstick to a single cardinal direction. The axis with
// the larger magnitude past STICK_DEADZONE wins; inside the deadzone the stick
// contributes no direction (null). This mirrors the dominant-axis logic of
// tapToDir/swipeToDir.
function stickDir(gp) {
  const ax = gp.axes[0]; // left stick X: negative -> left, positive -> right
  const ay = gp.axes[1]; // left stick Y: negative -> up, positive -> down
  const axPast = Math.abs(ax) > STICK_DEADZONE ? Math.abs(ax) : 0;
  const ayPast = Math.abs(ay) > STICK_DEADZONE ? Math.abs(ay) : 0;
  if (axPast >= ayPast) {
    return axPast === 0 ? null : { r: 0, c: ax < 0 ? -1 : 1 };
  }
  return { r: ay < 0 ? -1 : 1, c: 0 };
}

export function pollController() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
  const pads = navigator.getGamepads();
  let gp = null;
  for (let i = 0; i < pads.length; i++) {
    if (pads[i]) { gp = pads[i]; break; }
  }
  if (!gp) {
    // No gamepad: clear previous poll state so a reconnect cannot inherit
    // a stale held state (design D3).
    prevButtons = null;
    prevStickDir = null;
    return;
  }
  const buttons = gp.buttons;
  const stick = stickDir(gp);

  // Button-only pressed state. A thumbstick value must never be OR-ed into a
  // button's current/previous state: a held stick would then mark the matching
  // D-pad button as "already pressed", swallowing its edge.
  const aNow = !!buttons[BUTTON_A].pressed;
  const bNow = !!buttons[BUTTON_B].pressed;
  const upNow = !!buttons[DPAD_UP].pressed;
  const downNow = !!buttons[DPAD_DOWN].pressed;
  const leftNow = !!buttons[DPAD_LEFT].pressed;
  const rightNow = !!buttons[DPAD_RIGHT].pressed;

  const prev = prevButtons || {};
  const aEdge = aNow && !prev[BUTTON_A];
  const bEdge = bNow && !prev[BUTTON_B];
  const upEdge = upNow && !prev[DPAD_UP];
  const downEdge = downNow && !prev[DPAD_DOWN];

  const stickUp = !!stick && stick.r === -1;
  const stickDown = !!stick && stick.r === 1;
  const stickUpEdge = stickUp && !(prevStickDir && prevStickDir.r === -1);
  const stickDownEdge = stickDown && !(prevStickDir && prevStickDir.r === 1);

  if (game.state === PLAYING) {
    // Steering is the exception to edge-only: the D-pad/stick direction is
    // applied whenever held (like holding a key). D-pad takes precedence over
    // the stick when both are pressed. setDirection() is idempotent for the
    // same direction and enforces the no-reverse rule.
    let dir = null;
    if (upNow) dir = { r: -1, c: 0 };
    else if (downNow) dir = { r: 1, c: 0 };
    else if (leftNow) dir = { r: 0, c: -1 };
    else if (rightNow) dir = { r: 0, c: 1 };
    else dir = stick; // may be null
    if (dir) setDirection(dir);
  } else if (game.state === MENU) {
    // D-pad/stick up-down moves the selection (edge-only, wrapping).
    if (upEdge || stickUpEdge) game.menuSelect = (game.menuSelect + 2) % 3;
    else if (downEdge || stickDownEdge) game.menuSelect = (game.menuSelect + 1) % 3;
    // A confirms the highlighted item (edge-only), matching keyboard/touch.
    else if (aEdge) {
      if (game.menuSelect === 0) startGame();
      else if (game.menuSelect === 1) game.state = RECORDS;
      else game.state = HELP;
    }
  } else if (game.state === RECORDS || game.state === HELP) {
    // B returns to the menu (edge-only), matching keyboard/touch.
    if (bEdge) toMenu();
  } else if (game.state === GAME_OVER) {
    // A returns to the menu (edge-only), matching keyboard/touch.
    if (aEdge) toMenu();
  }

  // Update previous poll state at the end of each pass (design D3).
  prevButtons = {
    [BUTTON_A]: aNow,
    [BUTTON_B]: bNow,
    [DPAD_UP]: buttons[DPAD_UP].pressed,
    [DPAD_DOWN]: buttons[DPAD_DOWN].pressed,
    [DPAD_LEFT]: buttons[DPAD_LEFT].pressed,
    [DPAD_RIGHT]: buttons[DPAD_RIGHT].pressed
  };
  prevStickDir = stick;
}
