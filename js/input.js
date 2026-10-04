// Keyboard + pointer input, shared direction path, and canvas fitting.
import {
  BOARD_W, BOARD_H, FIELD_V_GAP, PLAYING, MENU, RECORDS, HELP, GAME_OVER,
  MENU_ITEMS, MENU_ITEM_Y, MENU_ITEM_HIT_H,
  GITHUB_ICON_Y, GITHUB_ICON_HIT_H, GITHUB_URL,
} from './constants.js';
import { game, toMenu, startGame } from './state.js';

let canvas = null;

// ---------- Controller (gamepad) input ----------
// Standard Gamepad API mapping (per design D4).
const DPAD_UP = 11;      // D-pad up
const DPAD_DOWN = 12;    // D-pad down
const DPAD_LEFT = 13;    // D-pad left
const DPAD_RIGHT = 14;   // D-pad right
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
}

export function fitCanvas() {
  // Contain fit: scale so the whole board fits the viewport, preserving
  // aspect ratio. No upper cap — the field may enlarge on large screens so
  // it fills the smaller viewport side (e.g. full height on a desktop).
  // Reserve FIELD_V_GAP above and below: the field is inset from the top and
  // bottom viewport edges by at least one board cell of breathing room.
  const scale = Math.min(
    window.innerWidth / BOARD_W,
    (window.innerHeight - 2 * FIELD_V_GAP) / BOARD_H
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
  if (game.state === MENU) {
    // Select the item whose hit range contains the tap's logical y.
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      if (Math.abs(end.y - MENU_ITEM_Y[i]) <= MENU_ITEM_HIT_H / 2) {
        game.menuSelect = i;
        if (i === 0) startGame();
        else if (i === 1) game.state = RECORDS;
        else game.state = HELP;
        return;
      }
    }
    // GitHub icon: only if no menu item matched.
    if (Math.abs(end.y - GITHUB_ICON_Y) <= GITHUB_ICON_HIT_H / 2) {
      window.open(GITHUB_URL, '_blank');
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
  const gp = navigator.getGamepads()[0];
  if (!gp) {
    // No gamepad: clear previous poll state so a reconnect cannot inherit
    // a stale held state (design D3).
    prevButtons = null;
    prevStickDir = null;
    return;
  }
  const buttons = gp.buttons;
  const stick = stickDir(gp);

  // Current + previous per-input pressed state.
  const aNow = !!buttons[BUTTON_A].pressed;
  const bNow = !!buttons[BUTTON_B].pressed;
  const upNow = buttons[DPAD_UP].pressed || (stick && stick.r === -1);
  const downNow = buttons[DPAD_DOWN].pressed || (stick && stick.r === 1);
  const leftNow = buttons[DPAD_LEFT].pressed || (stick && stick.c === -1);
  const rightNow = buttons[DPAD_RIGHT].pressed || (stick && stick.c === 1);

  const prev = prevButtons || {};
  const prevUp = prev[DPAD_UP] || (prevStickDir && prevStickDir.r === -1);
  const prevDown = prev[DPAD_DOWN] || (prevStickDir && prevStickDir.r === 1);
  const prevLeft = prev[DPAD_LEFT] || (prevStickDir && prevStickDir.c === -1);
  const prevRight = prev[DPAD_RIGHT] || (prevStickDir && prevStickDir.c === 1);

  // Edge detection: only the unpressed -> pressed transition fires an action.
  const aEdge = aNow && !prev[BUTTON_A];
  const bEdge = bNow && !prev[BUTTON_B];
  const upEdge = upNow && !prevUp;
  const downEdge = downNow && !prevDown;
  const leftEdge = leftNow && !prevLeft;
  const rightEdge = rightNow && !prevRight;

  if (game.state === PLAYING) {
    // Steering is the exception to edge-only: the D-pad/stick direction is
    // applied whenever held (like holding a key). D-pad takes precedence over
    // the stick when both are pressed. setDirection() is idempotent for the
    // same direction and enforces the no-reverse rule.
    let dir = null;
    if (buttons[DPAD_UP].pressed) dir = { r: -1, c: 0 };
    else if (buttons[DPAD_DOWN].pressed) dir = { r: 1, c: 0 };
    else if (buttons[DPAD_LEFT].pressed) dir = { r: 0, c: -1 };
    else if (buttons[DPAD_RIGHT].pressed) dir = { r: 0, c: 1 };
    else dir = stick; // may be null
    if (dir) setDirection(dir);
  } else if (game.state === MENU) {
    // D-pad/stick up-down moves the selection (edge-only, wrapping).
    if (upEdge) game.menuSelect = (game.menuSelect + 2) % 3;
    else if (downEdge) game.menuSelect = (game.menuSelect + 1) % 3;
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
