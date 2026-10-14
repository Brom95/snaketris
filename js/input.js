// Input FLOW layer: the single state machine that consumes normalized intents
// and drives one navigation path. The raw device adapters live in
// js/devices.js; this module owns handleIntent (the collapsed nav path) +
// setDirection (byte-for-byte stable) + canvas fitting + listener registration.

import {
  PLAYING, MENU, SELECT_WAY, SELECT_DURATION, SELECT_ROLE, SELECT_CONTROL, RECORDS, HELP, GAME_OVER, PAIRING,
} from './constants.js';
import { game } from './state.js';
import { pushIntent } from './screens.js';
import { typeChar, guestPage, duelOpen, sendIntent, confirmModel } from './netplay.js';
import { hitTargets, sizeField } from './ui.js';
import { requestPieceShift, rotatePiece } from './pieces.js';
import {
  keyToIntent,
  keyboardModelForKey,
  registerDeviceResolvers,
  setCanvas as deviceSetCanvas,
  onPointerUp as devicePointerUp,
  pollController as devicePoll,
} from './devices.js';

let canvas = null;

// ---------- FLOW: device events -> intents -> the screen system ----------
// Navigation is not decided here. Every navigation intent is pushed onto the
// screen system's queue and the screen table applies it on the next tick.
// Only the in-game actions (steering, piece control) act directly, because
// they drive the play half on the current tick.
export function handleIntent(intent, guestRole) {
  if (!intent) return;
  // In a network duel the guest page's play action is a message to the host
  // page, which is the page that runs the simulation. Navigation stays local.
  if (guestPage() && (intent.dir || intent.action === 'pieceShift' || intent.action === 'pieceRotate')) {
    if (duelOpen()) sendIntent(intent);
    return;
  }
  // An intent the other page's player sent drives that player's own role, which
  // is not this page's role: the host page drives the snake and the guest page
  // drives the piece, so the role the action belongs to arrives with it.
  const role = guestRole || game.play.role;
  // Steering: PLAYING gate + no-reverse (shared, byte-for-byte stable).
  if (intent.dir) {
    setDirection(intent.dir);
    return;
  }
  switch (intent.action) {
    case 'pieceShift':
      // The piece is human-driven when the player took the Tetris role, and in
      // a two-player duel one side always drives it. Which side a key belongs
      // to is resolved in js/devices.js, so this gate only asks whether the
      // piece has a human driver at all.
      if (game.screen.twoPlayerMode || role === 'tetris') requestPieceShift(intent.dc);
      return;
    case 'pieceRotate':
      if (game.screen.twoPlayerMode || role === 'tetris') {
        if (game.play.pieces.length > 0) rotatePiece(game.play.pieces[0], intent.cw);
      }
      return;
    case 'pairChar':
      // A typed pairing character acts here, not through navigation: the engine
      // owns the intent vocabulary and knows no code-typing verb.
      if (game.screen.state === PAIRING) typeChar(intent.char);
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
  // A paired network peer confirms one control model on its own device: on the
  // pairing step a layout key names the model this page drives, and the model
  // travels to the host so a later input resolves to the player who confirmed
  // the model that produced it.
  if (game.screen.state === PAIRING && duelOpen()) {
    const model = keyboardModelForKey(e.key);
    if (model && confirmModel(model)) {
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
// The viewport rule and the contain fit live in the engine (js/ui.js owns the
// instance); this module only hands the field element to it.
export function fitCanvas(reserved = 0) {
  sizeField(canvas, reserved);
}

// Called by app.js after the canvas exists; stores it and hands the surface to
// the engine, which registers every device listener. Keeps the dependency graph
// one-way (app -> input).
export function initInput(canvasEl) {
  canvas = canvasEl;
  deviceSetCanvas(canvasEl);
  // The flow half of the resolvers: every shape the engine produces is routed
  // through handleIntent, and the raw key/page events reach this module's own
  // handlers. Registered here, not at module load, because the mapping module
  // (js/devices.js) registers its own half first and this module imports it.
  registerDeviceResolvers({ shape: handleIntent, key: onKey, page: onInterfacePointerUp });
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
  const state = game.screen.state;
  // The selection screens hit-test the element map js/ui.js owns, in table order.
  // The pairing step hit-tests its own controls too, so Back and Pair are
  // confirmable by the same gesture as on every other screen. The way sub-menu
  // is one of the selection screens, so a tap on "Same computer" or "Network"
  // selects by the same gesture as on the duration and role sub-menus.
  if (state === MENU || state === SELECT_WAY || state === SELECT_DURATION || state === SELECT_ROLE || state === SELECT_CONTROL || state === PAIRING) {
    const el = firstHit(hitTargets(state), x, y);
    if (el) pushIntent({ action: 'select', id: el.id });
    return;
  }
  // Any click inside the remaining views returns to the menu.
  if (state === RECORDS || state === HELP || state === GAME_OVER) {
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
