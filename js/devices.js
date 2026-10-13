// Raw input devices -> normalized intents. Each device translates its own raw
// events into a coarse intent (a direction or an action) and carries no
// state-machine logic of its own — the flow in js/input.js routes every
// intent through one navigation path. The event plumbing (listeners, pointer
// capture, the controller poll loop, the thumbstick quantization) lives in
// engine/js/devices.js; this module owns the mappings and the resolvers.

import { game } from './state.js';
import { currentControlPlayer } from './screens.js';
import { BOARD_W, BOARD_H } from './constants.js';
import {
  configureSurface,
  registerDeviceResolvers,
  attachSurface,
  surfacePoint,
  pointerDown,
  pointerMove,
  pointerEnd,
  pointerCancel,
  pollDevices,
  clearDeviceEdges,
  stickDirection,
} from '../engine/js/devices.js';

// The engine entry point for handing over resolvers, re-exported so the flow
// layer can register its own half through the same import path.
export { registerDeviceResolvers };

const TAP_THRESHOLD = 24; // displacement below one cell classifies as a tap

// The surface size is a game fact handed to the engine mechanism once, at
// module load, so the engine names no board number.
configureSurface({ width: BOARD_W, height: BOARD_H });

// ---------- Coordinate helpers (device-side) ----------
export function setCanvas(c) {
  attachSurface(c);
}

export function toLogical(clientX, clientY) {
  return surfacePoint(clientX, clientY);
}

// Keyboard raw key -> direction.
export function keyToDir(key) {
  switch (key) {
    case 'arrowup':
    case 'w':
      return { r: -1, c: 0 };
    case 'arrowdown':
    case 's':
      return { r: 1, c: 0 };
    case 'arrowleft':
    case 'a':
      return { r: 0, c: -1 };
    case 'arrowright':
    case 'd':
      return { r: 0, c: 1 };
    default:
      return null;
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

// Tap region for the falling piece: only the horizontal side of the board
// matters, so a near-centre tap shifts nothing.
export function tapToShift(x) {
  const ox = x - BOARD_W / 2;
  if (Math.abs(ox) < TAP_THRESHOLD) return 0;
  return ox < 0 ? -1 : 1;
}

// Swipe mapping: dominant axis of the displacement.
export function swipeToDir(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? { r: 0, c: -1 } : { r: 0, c: 1 };
  }
  return dy < 0 ? { r: -1, c: 0 } : { r: 1, c: 0 };
}

// ---------- Keyboard mapping ----------
// Navigation keys for the main menu and the two sub-menus below it. R starts a
// game from the main menu; Escape leaves a sub-menu.
function menuKeyIntent(k) {
  if (k === 'arrowup' || k === 'w') return { action: 'menuUp' };
  if (k === 'arrowdown' || k === 's') return { action: 'menuDown' };
  if (k === 'enter' || k === ' ') return { action: 'confirm' };
  if (game.screen.state === 'MENU' && k === 'r') return { action: 'startGame' };
  if ((game.screen.state === 'SELECT_ROLE' || game.screen.state === 'SELECT_DURATION') && k === 'escape') {
    return { action: 'toMenu' };
  }
  return null;
}

// The keyboard layout a key belongs to. js/input.js hit-tests the same helper
// when it locks a model, so one definition answers both call sites. It accepts
// the raw e.key form ("ArrowUp") and the lowercased form keyToIntent passes.
export function keyboardModelForKey(k) {
  const key = k.toLowerCase();
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') return 'wasd';
  if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') return 'arrows';
  return null;
}

// Which character a key drives. In a two-player game each player locked one
// layout, so the layout that key belongs to names the player, and that
// player's role decides whether the key steers the snake or the piece. A layout
// no player locked drives nothing. In a single-player game the one role answers.
function roleForKeyboardKey(k) {
  if (!game.screen.twoPlayerMode) return game.play.role;
  const model = keyboardModelForKey(k);
  if (model && game.screen.p1Model === model) return game.screen.p1Role || game.play.role;
  if (model && game.screen.p2Model === model) return game.screen.p2Role;
  return null;
}

// Keys while a game runs: the Tetris side steers the falling piece, the Snake
// side steers the snake. Which side a key belongs to is the player's, not one
// shared role, so two layouts drive two different characters.
function playingKeyIntent(k) {
  const role = roleForKeyboardKey(k);
  if (role === 'tetris') {
    if (k === 'arrowleft' || k === 'a') return { action: 'pieceShift', dc: -1 };
    if (k === 'arrowright' || k === 'd') return { action: 'pieceShift', dc: 1 };
    if (k === 'arrowup' || k === 'w') return { action: 'pieceRotate', cw: false };
    if (k === 'arrowdown' || k === 's') return { action: 'pieceRotate', cw: true };
    return null;
  }
  if (!role) return null;
  const d = keyToDir(k);
  return d ? { dir: d } : null;
}

// Keys in the records and help views: any of the three keys leaves the view.
function viewKeyIntent(k) {
  return k === 'enter' || k === ' ' || k === 'escape' ? { action: 'toMenu' } : null;
}

// Keys after a game ends: R or either confirm key returns to the menu.
function overKeyIntent(k) {
  return k === 'r' || k === 'enter' || k === ' ' ? { action: 'toMenu' } : null;
}

// One lookup per screen state, so the mapping reads the state instead of
// testing it. A state with no entry maps no key.
const KEY_BY_STATE = {
  MENU: menuKeyIntent,
  SELECT_DURATION: menuKeyIntent,
  SELECT_ROLE: menuKeyIntent,
  PLAYING: playingKeyIntent,
  RECORDS: viewKeyIntent,
  HELP: viewKeyIntent,
  GAME_OVER: overKeyIntent,
};

// Raw keydown -> intent. The keyboard is the only device that can produce
// every action; pointer and gamepad cover a subset.
export function keyToIntent(key) {
  const map = KEY_BY_STATE[game.screen.state];
  return map ? map(key.toLowerCase()) : null;
}

// ---------- Pointer device (touch + mouse) ----------
// A tap or swipe inside the surface produces a direction; non-game states
// produce a toMenu action. The engine owns the gesture bookkeeping and calls
// this resolver with the two ends of the gesture.
function gestureIntent(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // MENU lives entirely on the page (see onInterfacePointerUp), so a gesture
  // that ends on the board does nothing here.
  if (game.screen.state === 'MENU') return null;
  // RECORDS / HELP / GAME_OVER: return to the menu.
  if (game.screen.state === 'RECORDS' || game.screen.state === 'HELP' || game.screen.state === 'GAME_OVER') {
    return { action: 'toMenu' };
  }
  if (game.screen.state !== 'PLAYING') return null;
  if (game.play.role === 'tetris') return pieceGesture(dx, dy, end.x);
  return snakeGesture(dx, dy, end.x, end.y);
}

// Board gesture for the Tetris role: a side tap shifts the piece, a centre tap
// rotates it, a vertical swipe rotates it, a horizontal swipe shifts it.
function pieceGesture(dx, dy, x) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_THRESHOLD) {
    const dc = tapToShift(x);
    return dc === 0 ? { action: 'pieceRotate', cw: true } : { action: 'pieceShift', dc };
  }
  if (Math.abs(dy) > Math.abs(dx)) return { action: 'pieceRotate', cw: dy > 0 };
  return { action: 'pieceShift', dc: dx < 0 ? -1 : 1 };
}

// Board gesture for the Snake role: a tap steers toward the tapped region, a
// swipe steers along its dominant axis.
function snakeGesture(dx, dy, x, y) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < TAP_THRESHOLD) {
    const dir = tapToDir(x, y);
    return dir ? { dir } : null;
  }
  return { dir: swipeToDir(dx, dy) };
}

// Thin wrappers over the engine gesture mechanism: each answers one raw event
// and returns the shape it produced, or null.
export function onPointerDown(e) {
  return pointerDown(e);
}

export function onPointerMove(e) {
  return pointerMove(e);
}

export function onPointerUp(e) {
  return pointerEnd(e);
}

export function onPointerCancel(e) {
  return pointerCancel(e);
}

// ---------- Gamepad device ----------
// Standard Gamepad API mapping (per design D4).
// The button indices and the deadzone live in the engine; the meaning of each
// signal set lives here.

// The role one physical gamepad drives: the player who locked THAT pad. A pad
// nobody owns drives nothing, so two players need two distinct pads. Outside a
// two-player game the single role answers.
function roleForPad(padId) {
  if (!game.screen.twoPlayerMode) return game.play.role;
  if (game.screen.p1Pad === padId) return game.screen.p1Role || game.play.role;
  if (game.screen.p2Pad === padId) return game.screen.p2Role;
  return null;
}

// Intent while a game runs. In Tetris role the piece is steered: left/right
// shift (held, like a key), up/down rotate (edge-only, so one press is one
// quarter turn). In Snake role steering is the exception to edge-only: the
// D-pad/stick direction applies whenever held, D-pad taking precedence over
// the stick. setDirection() enforces the no-reverse rule.
function playingIntent(role, s) {
  return role === 'tetris' ? pieceSteerIntent(s) : snakeSteerIntent(s);
}

// Snake role: a held D-pad direction wins, the thumbstick fills in when no
// D-pad button is pressed.
function snakeSteerIntent(s) {
  const dir = heldDpadDir(s) || s.stick;
  return dir ? { dir } : null;
}

function heldDpadDir(s) {
  if (s.upNow) return { r: -1, c: 0 };
  if (s.downNow) return { r: 1, c: 0 };
  if (s.leftNow) return { r: 0, c: -1 };
  if (s.rightNow) return { r: 0, c: 1 };
  return null;
}

// Tetris role: left/right shift the piece while held; up/down rotate, edge-only,
// so one press is one quarter turn.
function pieceSteerIntent(s) {
  // A is the dedicated clockwise-rotation button, so it wins over a held
  // shift direction. One intent per frame keeps the poll contract stable.
  if (s.aEdge) return { action: 'pieceRotate', cw: true };
  let dc = 0;
  if (s.leftNow) dc = -1;
  else if (s.rightNow) dc = 1;
  else if (s.stick) dc = s.stick.c;
  if (dc) return { action: 'pieceShift', dc };
  if (s.upEdge || s.stickUpEdge) return { action: 'pieceRotate', cw: false };
  if (s.downEdge || s.stickDownEdge) return { action: 'pieceRotate', cw: true };
  return null;
}

// Intent in the main menu and the sub-menus below it: up/down move the highlight
// (edge-only), A confirms, B leaves the sub-menu for the menu.
function menuIntent(state, s) {
  if (s.upEdge || s.stickUpEdge) return { action: 'menuUp' };
  if (s.downEdge || s.stickDownEdge) return { action: 'menuDown' };
  if (s.aEdge) return { action: 'confirm' };
  if (state === 'SELECT_ROLE' || state === 'SELECT_DURATION') {
    if (s.bEdge) return { action: 'toMenu' };
  }
  return null;
}

// State-dependent intent for one poll. Edge-only buttons drive menu actions;
// the D-pad/stick direction is applied while held.
function chooseIntent(state, role, s) {
  if (state === 'PLAYING') return playingIntent(role, s);
  if (state === 'MENU' || state === 'SELECT_ROLE' || state === 'SELECT_DURATION') return menuIntent(state, s);
  // Two-player control screen: A locks the next player's gamepad model, and
  // names the pad they pressed with so the lock claims that device. Once both
  // players have locked, A starts the game. Edge-only, one press.
  if (state === 'SELECT_CONTROL' && game.screen.twoPlayerMode) {
    const player = currentControlPlayer();
    if (player) return { action: 'lockModel', model: 'gamepad', pad: s.padId };
    return { action: 'confirm' };
  }
  // B returns to the menu from the records and help views; A does the same
  // after a game ends. Both are edge-only, matching keyboard and touch.
  if (state === 'RECORDS' || state === 'HELP') return s.bEdge ? { action: 'toMenu' } : null;
  if (state === 'GAME_OVER') return s.aEdge ? { action: 'toMenu' } : null;
  return null;
}

// One pad's signal set -> intent. The pad's owner decides which character it
// steers; a pad nobody owns drives no character while a game runs, but it can
// still act on the navigation screens, where the action names no character.
function padIntent(s) {
  const state = game.screen.state;
  const role = roleForPad(s.padId);
  if (!(role !== null || state !== 'PLAYING')) return null;
  return chooseIntent(state, role, s);
}

// Raw poll -> intent. The engine owns the poll loop and the edge detection;
// this module supplies the mapping through the resolver slot.
export function pollController() {
  return pollDevices();
}

// Clears the gamepad edge-detection state for every connected pad. Called on
// gamepad connect/disconnect (design D5) so no stale held state survives a
// gamepad change.
export function clearControllerPrev() {
  clearDeviceEdges();
}

// The engine quantizes the thumbstick; the name stays here so a caller of the
// device layer reads one vocabulary.
export function stickDir(gp) {
  return stickDirection(gp);
}

// The mapping resolvers the engine mechanism calls. Registered at module load,
// so a device test that never opens a page still maps a gesture or a poll.
registerDeviceResolvers({ gesture: gestureIntent, pad: padIntent });
