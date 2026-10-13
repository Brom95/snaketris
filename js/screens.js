// The screen table: one declarative source of truth for every screen of the
// interface. Each screen states its items in page order, and every item names
// the page element it is, its label, its marker, its key hints, and the screen
// or transition it opens. Back and reassign controls are declared per screen.
//
// Data only. Labels and markers come from constants.js; the ids are the page
// element ids declared in snaketris.html, so the table and the page cannot
// drift apart silently (tests/screens.test.js checks every id against the page).

import {
  MENU, SELECT_ROLE, SELECT_CONTROL, PLAYING, GAME_OVER, RECORDS, HELP,
  MENU_ITEMS, ROLE_ITEMS, ROLE_SCREEN_ITEMS, CONTROL_SCREEN_ITEMS,
  ROLE_MARKERS,
  GAME_CONTROL_P1, GAME_CONTROL_P2, GAME_CONTROL_START,
  GAME_CONTROL_PLAYER_MARKERS,
  twoPlayerOffered,
} from './constants.js';

// The transitions an item can ask for. The screen system is the only module
// that interprets them; no input module branches on a screen.
export const TRANSITIONS = {
  open: 'open', // move to the item's `opens` screen
  'select-role': 'select-role', // open the role sub-menu
  'two-player': 'two-player', // arm two-player mode, then open the role sub-menu
  'pick-role': 'pick-role', // lock the item's role, then continue the flow
  'back-menu': 'back-menu', // return to the main menu
  'back-role-select': 'back-role-select', // leave the control screen for the role screen
  'lock-model': 'lock-model', // lock the item's player's control model
  reassign: 'reassign', // clear one player's selection and model
  'start-game': 'start-game', // start when the flow allows it
};

// cursor: 'arrow' — one item is highlighted and the arrow cycles over `items`.
// cursor: 'step'  — exactly one item is on screen, chosen by its `step`.
export const SCREENS = [
  {
    id: MENU,
    view: 'menu-view',
    field: false,
    cursor: 'arrow',
    selection: 'menuSelect',
    items: [
      {
        id: 'menu-item-play',
        label: MENU_ITEMS[0],
        marker: null,
        hints: null,
        action: TRANSITIONS['select-role'],
        opens: SELECT_ROLE,
      },
      {
        id: 'menu-item-two-player',
        label: MENU_ITEMS[1],
        marker: null,
        hints: null,
        action: TRANSITIONS['two-player'],
        opens: SELECT_ROLE,
        requiresWide: true,
      },
      {
        id: 'menu-item-records',
        label: MENU_ITEMS[2],
        marker: null,
        hints: null,
        action: TRANSITIONS.open,
        opens: RECORDS,
      },
      {
        id: 'menu-item-help',
        label: MENU_ITEMS[3],
        marker: null,
        hints: null,
        action: TRANSITIONS.open,
        opens: HELP,
      },
    ],
    controls: [],
  },
  {
    id: SELECT_ROLE,
    view: 'role-view',
    field: false,
    cursor: 'arrow',
    selection: 'roleSelect',
    items: [
      {
        id: 'role-item-snake',
        label: ROLE_SCREEN_ITEMS[0],
        marker: ROLE_MARKERS[ROLE_ITEMS[0].toLowerCase()],
        role: ROLE_ITEMS[0].toLowerCase(),
        hints: null,
        action: TRANSITIONS['pick-role'],
      },
      {
        id: 'role-item-tetris',
        label: ROLE_SCREEN_ITEMS[1],
        marker: ROLE_MARKERS[ROLE_ITEMS[1].toLowerCase()],
        role: ROLE_ITEMS[1].toLowerCase(),
        hints: null,
        action: TRANSITIONS['pick-role'],
      },
      {
        id: 'role-back',
        label: ROLE_SCREEN_ITEMS[2],
        marker: null,
        hints: null,
        action: TRANSITIONS['back-menu'],
      },
    ],
    controls: [],
  },
  {
    id: SELECT_CONTROL,
    view: 'control-view',
    field: false,
    cursor: 'step',
    selection: 'controlSelect',
    items: [
      {
        id: 'control-item-p1',
        label: CONTROL_SCREEN_ITEMS[0],
        marker: GAME_CONTROL_PLAYER_MARKERS[1],
        step: GAME_CONTROL_P1,
        player: 1,
        hints: 'W / A / S / D  ·  \u2191 \u2193 \u2190 \u2192  ·  \u{1F3D7}',
        action: TRANSITIONS['lock-model'],
      },
      {
        id: 'control-item-p2',
        label: CONTROL_SCREEN_ITEMS[1],
        marker: GAME_CONTROL_PLAYER_MARKERS[2],
        step: GAME_CONTROL_P2,
        player: 2,
        hints: 'W / A / S / D  ·  \u2191 \u2193 \u2190 \u2192  ·  \u{1F3D7}',
        action: TRANSITIONS['lock-model'],
      },
      {
        id: 'control-item-start',
        label: CONTROL_SCREEN_ITEMS[2],
        marker: '\u{25B6}\u{FE0F}',
        step: GAME_CONTROL_START,
        hints: 'Enter / Space',
        action: TRANSITIONS['start-game'],
      },
    ],
    controls: [
      {
        id: 'control-back',
        label: 'Back',
        marker: '\u2B05\u{FE0F}',
        action: TRANSITIONS['back-role-select'],
      },
      {
        id: 'control-reassign-p1',
        label: 'Reassign P1',
        marker: GAME_CONTROL_PLAYER_MARKERS[1],
        player: 1,
        action: TRANSITIONS.reassign,
      },
      {
        id: 'control-reassign-p2',
        label: 'Reassign P2',
        marker: GAME_CONTROL_PLAYER_MARKERS[2],
        player: 2,
        action: TRANSITIONS.reassign,
      },
    ],
  },
  {
    id: PLAYING,
    view: null,
    field: true,
    cursor: 'none',
    selection: null,
    items: [],
    controls: [],
  },
  {
    id: GAME_OVER,
    view: null,
    field: true,
    cursor: 'none',
    selection: null,
    items: [],
    controls: [
      { id: 'status', label: 'Menu', marker: null, action: TRANSITIONS['back-menu'] },
    ],
  },
  {
    id: RECORDS,
    view: 'records-view',
    field: false,
    cursor: 'none',
    selection: null,
    items: [],
    controls: [
      { id: 'records-return', label: 'Menu', marker: null, action: TRANSITIONS['back-menu'] },
    ],
  },
  {
    id: HELP,
    view: 'help-view',
    field: false,
    cursor: 'none',
    selection: null,
    items: [],
    controls: [
      { id: 'help-return', label: 'Menu', marker: null, action: TRANSITIONS['back-menu'] },
    ],
  },
];

// One screen entry per id, so the screen system can look a screen up by the
// current navigation state.
export const SCREEN_BY_ID = SCREENS.reduce((acc, row) => {
  acc[row.id] = row;
  return acc;
}, {});

// The item of a step-driven screen for one control step, or null.
export function itemForStep(screenId, step) {
  const row = SCREEN_BY_ID[screenId];
  if (!row) return null;
  for (const item of row.items) {
    if (item.step === step) return item;
  }
  return null;
}

// The screen a menu item opens, or null when the item runs a transition that
// stays on the navigation flow.
export function opensScreen(screenId, index) {
  const row = SCREEN_BY_ID[screenId];
  if (!row) return null;
  return row.items[index]?.opens ?? null;
}

// ---------- The navigation state machine ----------
// Every transition below reads and writes the navigation half only. No
// gameplay field changes here, and no page element, pointer coordinate, key
// code or device state is read here.
import { game, startGame } from './state.js';

// A fresh navigation half: the main menu, no selections, nothing locked.
// A hoisted function declaration, so state.js can call it while building the
// root `game` object even when this module is mid-evaluation.
export function newScreen() {
  return {
    state: MENU,
    menuSelect: 0,
    roleSelect: 0,
    controlSelect: 0,
    p1Role: null,
    p2Role: null,
    twoPlayerMode: false,
    p1Selection: null,
    p2Selection: null,
    p1Model: null,
    p2Model: null,
    // The physical gamepad each player owns, by Gamepad API id. A pad drives
    // only the player who locked it, so two players need two distinct pads.
    p1Pad: null,
    p2Pad: null,
    controlError: '',
    controlConfirmed: false,
    gameControlStep: GAME_CONTROL_P1,
  };
}

// Replace the navigation half with a fresh one. The root `game` object stays
// the same, so every module that imported it sees the new half.
export function resetScreen() {
  game.screen = newScreen();
}

// The screen the interface shows once a game ends: the shared Start step in
// two-player mode, the game-over overlay otherwise. game.screen.state must hold
// a screen id the screen table resolves; a bare step constant hides every view.
export function applyGameOverScreen() {
  if (!game.screen.twoPlayerMode) {
    game.screen.state = GAME_OVER;
    return;
  }
  game.screen.state = SELECT_CONTROL;
  game.screen.gameControlStep = GAME_CONTROL_START;
}

// True when a player has locked a model. A locked model is final until the
// player reassigns.
export function controlModelAssigned(player) {
  const model = player === 1 ? game.screen.p1Model : game.screen.p2Model;
  return model != null;
}

// Move the one-item-at-a-time step forward. P1 locking moves to P2; P2 locking
// moves to the SHARED (Start) step.
function advanceControlStep() {
  if (!controlModelAssigned(1)) {
    game.screen.gameControlStep = GAME_CONTROL_P1;
  } else if (!controlModelAssigned(2)) {
    game.screen.gameControlStep = GAME_CONTROL_P2;
  } else {
    game.screen.gameControlStep = GAME_CONTROL_START;
  }
}

// Lock a player's control model. A keyboard layout is exclusive: two players
// cannot share one layout. A gamepad is exclusive too, and it is exclusive by
// physical device: `pad` is the Gamepad API id of the pad the player pressed
// with, and a pad the other player already owns is refused. Returns true on
// success, or false when the model or the pad is already taken.
export function lockControlModel(player, model, pad = null) {
  game.screen.controlError = '';
  if (player === 2 && model !== 'gamepad' && game.screen.p1Model === model) {
    game.screen.controlError = 'P2: cannot use the same layout as P1';
    return false;
  }
  if (model === 'gamepad' && pad != null) {
    const owner = player === 1 ? game.screen.p2Pad : game.screen.p1Pad;
    if (owner === pad) {
      game.screen.controlError = `P${player}: cannot use the same gamepad as P${player === 1 ? 2 : 1}`;
      return false;
    }
  }
  if (player === 1) {
    game.screen.p1Selection = model;
    game.screen.p1Model = model;
    game.screen.p1Pad = model === 'gamepad' ? pad : null;
  } else {
    game.screen.p2Selection = model;
    game.screen.p2Model = model;
    game.screen.p2Pad = model === 'gamepad' ? pad : null;
  }
  advanceControlStep();
  return true;
}

// Reassign: clear a player's selection and model so they can pick a new layout,
// and send them back to their own screen.
export function reassignP1() {
  game.screen.p1Selection = null;
  game.screen.p1Model = null;
  game.screen.p1Pad = null;
  game.screen.gameControlStep = GAME_CONTROL_P1;
}

export function reassignP2() {
  game.screen.p2Selection = null;
  game.screen.p2Model = null;
  game.screen.p2Pad = null;
  game.screen.gameControlStep = GAME_CONTROL_P2;
}

// Who locks the next control model: 1, 2, or null when both are locked.
export function currentControlPlayer() {
  if (!controlModelAssigned(1)) return 1;
  if (!controlModelAssigned(2)) return 2;
  return null;
}

// P1 picks a role; P2 auto-gets the other. Sets the two-player mode flag
// and assigns both roles. The one-item-at-a-time control flow starts on P1.
export function pickP1Role(role) {
  game.screen.p1Role = role;
  game.screen.p2Role = (role === 'snake') ? 'tetris' : 'snake';
  game.screen.twoPlayerMode = true;
  game.screen.gameControlStep = GAME_CONTROL_P1;
}

// Return to the main menu and clear the selections.
export function toMenu() {
  game.screen.state = MENU;
  game.screen.menuSelect = 0;
  game.screen.roleSelect = 0;
}

// Back from SELECT_CONTROL returns to the role selection screen.
export function backToRoleSelect() {
  game.screen.state = SELECT_ROLE;
}

// ---------- The intent queue and the screen system ----------
// The input layer normalises a device event into an intent and pushes it here.
// The screen system drains the queue once per tick, at the start of its update,
// so an intent applies on the tick after it was produced. This module is the
// only place that interprets an intent: it reads the screen table and the
// navigation half, and never a page element, a pointer coordinate, a key code
// or a device.
const intentQueue = [];

export function pushIntent(intent) {
  if (intent) intentQueue.push(intent);
}

// Run one table transition for the item the intent selected. Returns false
// when the transition is not allowed now, so the caller can undo its writes.
function applyAction(item, intent) {
  switch (item.action) {
    case TRANSITIONS.open:
    case TRANSITIONS['select-role']:
      game.screen.state = item.opens;
      return true;
    case TRANSITIONS['two-player']:
      if (!offersItem(item)) return false;
      game.screen.twoPlayerMode = true;
      game.screen.state = item.opens;
      return true;
    case TRANSITIONS['pick-role']:
      pickRole(item.role);
      return true;
    case TRANSITIONS['back-menu']:
      toMenu();
      return true;
    case TRANSITIONS['back-role-select']:
      backToRoleSelect();
      return true;
    case TRANSITIONS['lock-model']:
      if (!intent.model || !item.player) return false;
      return lockControlModel(item.player, intent.model);
    case TRANSITIONS.reassign:
      if (item.player === 1) reassignP1();
      else reassignP2();
      return true;
    case TRANSITIONS['start-game']:
      if (!game.screen.p1Model || !game.screen.p2Model) return false;
      startGame();
      return true;
    default:
      return false;
  }
}

// Lock the role the player chose. In a two-player game the other role goes to
// the second player and the control flow follows; otherwise the game starts.
function pickRole(role) {
  game.play.role = role;
  if (game.screen.twoPlayerMode) {
    pickP1Role(role);
    game.screen.state = SELECT_CONTROL;
    return;
  }
  startGame();
}

// The item the current screen shows: the highlighted one for an arrow cursor,
// the one named by the control step for a step cursor.
function currentItem(row) {
  if (row.cursor === 'arrow') return row.items[game.screen[row.selection]] ?? null;
  if (row.cursor === 'step') return itemForStep(row.id, game.screen.gameControlStep);
  return null;
}

// True when the interface can offer this item right now. A wide-only item is
// hidden on a narrow viewport, so the cursor must never land on it.
function offersItem(item) {
  return !item.requiresWide || twoPlayerOffered();
}

// Move the arrow cursor one item, wrapping over the item list and skipping
// items the viewport does not offer.
function stepCursor(row, step) {
  if (row.cursor !== 'arrow' || row.items.length === 0) return false;
  const n = row.items.length;
  const field = row.selection;
  let index = game.screen[field];
  for (let k = 0; k < n; k++) {
    index = (index + step + n) % n;
    if (!offersItem(row.items[index])) continue;
    game.screen[field] = index;
    return true;
  }
  return false;
}

// A pointer, key or pad named one item of the current screen by its page id.
// The selection is written first and restored when the transition refuses, so
// a rejected intent leaves navigation state untouched.
function selectById(row, id, intent) {
  for (let i = 0; i < row.items.length; i++) {
    if (row.items[i].id !== id) continue;
    const field = row.selection;
    const previous = field ? game.screen[field] : null;
    if (field) game.screen[field] = i;
    if (!applyAction(row.items[i], intent)) {
      if (field) game.screen[field] = previous;
      return false;
    }
    return true;
  }
  for (const control of row.controls) {
    if (control.id !== id) continue;
    return applyAction(control, intent);
  }
  return false;
}

// The first item or control that returns to the main menu, if this screen has
// one.
function applyBack(row, intent) {
  for (const item of row.items) {
    if (item.action === TRANSITIONS['back-menu']) return applyAction(item, intent);
  }
  for (const control of row.controls) {
    if (control.action === TRANSITIONS['back-menu']) return applyAction(control, intent);
  }
  return false;
}

// A layout key or a pad locks the model of the player whose step is on screen.
// `pad` names the physical gamepad so the lock can claim that device.
function lockForCurrentStep(row, model, pad) {
  if (row.cursor !== 'step' || !model) return false;
  const item = itemForStep(row.id, game.screen.gameControlStep);
  if (!item || item.action !== TRANSITIONS['lock-model']) return false;
  return lockControlModel(item.player, model, pad);
}

// The start key: in the main menu it opens the role sub-menu like the Play
// item does; anywhere else it starts the game.
function startFromCurrent(row, intent) {
  for (const item of row.items) {
    if (item.action === TRANSITIONS['select-role']) return applyAction(item, intent);
  }
  startGame();
  return true;
}

// Apply one navigation intent against the current screen's table entry. An
// intent the current screen has no item for is rejected and changes nothing.
function applyIntent(intent) {
  const row = SCREEN_BY_ID[game.screen.state];
  if (!row) return false;
  switch (intent.action) {
    case 'menuUp':
    case 'menuDown':
      return stepCursor(row, intent.action === 'menuUp' ? -1 : 1);
    case 'confirm': {
      const item = currentItem(row);
      return item !== null && applyAction(item, intent);
    }
    case 'select':
      return selectById(row, intent.id, intent);
    case 'lockModel':
      return lockForCurrentStep(row, intent.model);
    case 'toMenu':
      return applyBack(row, intent);
    case 'startGame':
      return startFromCurrent(row, intent);
    default:
      return false;
  }
}

// Empty the queue and apply every intent in the order the devices produced it.
export function drainIntents() {
  while (intentQueue.length > 0) applyIntent(intentQueue.shift());
}

// The screen navigation as an engine system: it drains the intent queue at the
// start of its update, before any gameplay system reads navigation state.
export const screenSystem = {
  name: 'screen',
  init(ctx) {
    intentQueue.length = 0;
  },
  update(ctx) {
    drainIntents();
  },
};


