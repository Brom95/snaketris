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
import { game } from './state.js';

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
// two-player mode, the game-over overlay otherwise.
export function applyGameOverScreen() {
  game.screen.state = game.screen.twoPlayerMode ? GAME_CONTROL_START : GAME_OVER;
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

// Lock a player's control model from a single key press. Sets the selection
// and the locked model, clears any previous conflict error, and advances the
// control step. Returns true on success, or false when P2 tried to reuse P1's
// keyboard layout. Gamepad is always shareable.
export function lockControlModel(player, model) {
  game.screen.controlError = '';
  // P2: keyboard models are exclusive with P1's locked model; gamepad is
  // shareable.
  if (player === 2 && model !== 'gamepad' && game.screen.p1Model === model) {
    game.screen.controlError = 'P2: cannot use the same layout as P1';
    return false;
  }
  if (player === 1) {
    game.screen.p1Selection = model;
    game.screen.p1Model = model;
  } else {
    game.screen.p2Selection = model;
    game.screen.p2Model = model;
  }
  advanceControlStep();
  return true;
}

// Reassign: clear a player's selection and model so they can pick a new layout,
// and send them back to their own screen.
export function reassignP1() {
  game.screen.p1Selection = null;
  game.screen.p1Model = null;
  game.screen.gameControlStep = GAME_CONTROL_P1;
}

export function reassignP2() {
  game.screen.p2Selection = null;
  game.screen.p2Model = null;
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

