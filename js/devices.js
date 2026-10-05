// Raw input devices → normalized intents. Each device translates its own raw
// events into a coarse intent (a direction or an action) and carries no
// state-machine logic of its own — the flow in js/input.js routes every
// intent through one navigation path.

import { game } from './state.js';
import { BOARD_W, BOARD_H } from './constants.js';

let canvas = null;

// Sets the canvas element the device adapters use for coordinate mapping.
export function setCanvas(c) { canvas = c; }

// ---------- Coordinate helpers (device-side) ----------
// Displacement in logical canvas coords for a pointer event.
export function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width * BOARD_W,
    y: (clientY - rect.top) / rect.height * BOARD_H
  };
}

// Keyboard raw key → direction.
export function keyToDir(key) {
  switch (key) {
    case 'arrowup': case 'w': return { r: -1, c: 0 };
    case 'arrowdown': case 's': return { r: 1, c: 0 };
    case 'arrowleft': case 'a': return { r: 0, c: -1 };
    case 'arrowright': case 'd': return { r: 0, c: 1 };
    default: return null;
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

// ---------- Keyboard device ----------
const TAP_THRESHOLD = 24; // displacement below one cell classifies as a tap

// Raw keydown → intent. The keyboard is the only device that can produce
// every action; pointer and gamepad cover a subset.
export function keyToIntent(key) {
  const k = key.toLowerCase();
  // MENU: arrows/W-S move the selection, Enter/Space confirms, R starts.
  if (game.state === 'MENU') {
    if (k === 'arrowup' || k === 'w') return { action: 'menuUp' };
    if (k === 'arrowdown' || k === 's') return { action: 'menuDown' };
    if (k === 'enter' || k === ' ') return { action: 'confirm' };
    if (k === 'r') return { action: 'startGame' };
    return null;
  }
  // RECORDS / HELP: return to the menu.
  if (game.state === 'RECORDS' || game.state === 'HELP') {
    if (k === 'enter' || k === ' ' || k === 'escape') return { action: 'toMenu' };
    return null;
  }
  // GAME_OVER: R/Enter/Space back to the menu.
  if (game.state === 'GAME_OVER') {
    if (k === 'r' || k === 'enter' || k === ' ') return { action: 'toMenu' };
    return null;
  }
  // PLAYING: steering, unchanged from before.
  const d = keyToDir(k);
  if (!d) return null;
  return { dir: d };
}

// ---------- Pointer device (touch + mouse) ----------
let activePointerId = null;
let pointerStart = null; // start position in logical canvas coords

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

// Raw pointer event → intent. A tap or swipe inside the canvas produces a
// direction; non-game states produce a toMenu action.
export function onPointerUp(e) {
  if (e.pointerId !== activePointerId) return null;
  activePointerId = null;
  const end = toLogical(e.clientX, e.clientY);
  const dx = end.x - pointerStart.x;
  const dy = end.y - pointerStart.y;
  pointerStart = null;

  // Non-game states: act on the tap position, no steering classification.
  // MENU lives entirely on the page (see onInterfacePointerUp), so a gesture
  // that ends on the board does nothing here.
  if (game.state === 'MENU') return null;
  // RECORDS / HELP / GAME_OVER: return to the menu.
  if (game.state === 'RECORDS' || game.state === 'HELP' || game.state === 'GAME_OVER') {
    return { action: 'toMenu' };
  }
  if (game.state !== 'PLAYING') return null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_THRESHOLD) {
    // Tap: displacement below one cell.
    const tapDir = tapToDir(end.x, end.y);
    if (tapDir) return { dir: tapDir };
  } else {
    // Swipe: dominant axis of the displacement.
    return { dir: swipeToDir(dx, dy) };
  }
}

export function onPointerCancel(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  pointerStart = null;
}

// ---------- Gamepad device ----------
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

// Quantize the left thumbstick to a single cardinal direction. The axis with
// the larger magnitude past STICK_DEADZONE wins; inside the deadzone the stick
// contributes no direction (null). This mirrors the dominant-axis logic of
// tapToDir/swipeToDir.
export function stickDir(gp) {
  const ax = gp.axes[0]; // left stick X: negative -> left, positive -> right
  const ay = gp.axes[1]; // left stick Y: negative -> up, positive -> down
  const axPast = Math.abs(ax) > STICK_DEADZONE ? Math.abs(ax) : 0;
  const ayPast = Math.abs(ay) > STICK_DEADZONE ? Math.abs(ay) : 0;
  if (axPast >= ayPast) {
    return axPast === 0 ? null : { r: 0, c: ax < 0 ? -1 : 1 };
  }
  return { r: ay < 0 ? -1 : 1, c: 0 };
}

// Raw poll → intent. The D-pad/stick direction is applied when held (like
// holding a key); the edge-only button state drives menu actions.
export function pollController() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
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
    return null;
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

  if (game.state === 'PLAYING') {
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
    if (dir) return { dir };
  } else if (game.state === 'MENU') {
    // D-pad/stick up-down moves the selection (edge-only, wrapping).
    if (upEdge || stickUpEdge) return { action: 'menuUp' };
    if (downEdge || stickDownEdge) return { action: 'menuDown' };
    // A confirms the highlighted item (edge-only), matching keyboard/touch.
    if (aEdge) return { action: 'confirm' };
  } else if (game.state === 'RECORDS' || game.state === 'HELP') {
    // B returns to the menu (edge-only), matching keyboard/touch.
    if (bEdge) return { action: 'toMenu' };
  } else if (game.state === 'GAME_OVER') {
    // A returns to the menu (edge-only), matching keyboard/touch.
    if (aEdge) return { action: 'toMenu' };
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
  return null;
}

// Clears the gamepad edge-detection state. Called on gamepad connect/disconnect
// (design D5) so no stale held state survives a gamepad change.
export function clearControllerPrev() {
  prevButtons = null;
  prevStickDir = null;
}
