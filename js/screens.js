// The screen table: one declarative source of truth for every screen of the
// interface. Each screen states its items in page order, and every item names
// the page element it is, its label, its marker, its key hints, and the screen
// or transition it opens. Back and reassign controls are declared per screen.
//
// Data only. Labels and markers come from constants.js; the ids are the page
// element ids declared in snaketris.html, so the table and the page cannot
// drift apart silently (tests/screens.test.js checks every id against the page).

import {
  MENU, SELECT_DURATION, SELECT_ROLE, SELECT_CONTROL, PLAYING, GAME_OVER, RECORDS, HELP,
  MENU_ITEMS, ROLE_ITEMS, ROLE_SCREEN_ITEMS, CONTROL_SCREEN_ITEMS,
  DURATION_MINUTES, DURATION_SCREEN_ITEMS, TICKS_PER_MINUTE,
  ROLE_MARKERS,
  GAME_CONTROL_P1, GAME_CONTROL_P2, GAME_CONTROL_START,
  GAME_CONTROL_PLAYER_MARKERS,
  twoPlayerOffered,
} from './constants.js';

// The transitions an item can ask for. The screen system is the only module
// that interprets them; no input module branches on a screen.
export const TRANSITIONS = {
  open: 'open', // move to the item's `opens` screen
  'select-role': 'select-role', // open the item's `opens` screen from the menu flow
  'two-player': 'two-player', // arm two-player mode, then open the item's `opens` screen
  'pick-duration': 'pick-duration', // lock the item's match duration, then open the role screen
  'back-duration': 'back-duration', // leave the duration screen for the main menu
  'pick-role': 'pick-role', // lock the item's role, then continue the flow
  'back-menu': 'back-menu', // return to the main menu
  'back-role-select': 'back-role-select', // leave the control screen for the duration screen
  'pick-board': 'pick-board', // show the item's duration leaderboard in the records view
  'lock-model': 'lock-model', // lock the item's player's control model
  reassign: 'reassign', // clear one player's selection and model
  'start-game': 'start-game', // start when the flow allows it
  'start-bare': 'start-bare', // the start key with no item on screen: start whatever the flow allows
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
    startAction: TRANSITIONS['select-role'],
    items: [
      {
        id: 'menu-item-play',
        label: MENU_ITEMS[0],
        marker: null,
        hints: null,
        action: TRANSITIONS['select-role'],
        opens: SELECT_DURATION,
      },
      {
        id: 'menu-item-two-player',
        label: MENU_ITEMS[1],
        marker: null,
        hints: null,
        action: TRANSITIONS['two-player'],
        opens: SELECT_DURATION,
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
    id: SELECT_DURATION,
    view: 'duration-view',
    field: false,
    cursor: 'arrow',
    selection: 'durationSelect',
    startAction: TRANSITIONS['start-bare'],
    items: [
      {
        id: 'duration-item-1',
        label: DURATION_SCREEN_ITEMS[0],
        marker: null,
        hints: null,
        minutes: DURATION_MINUTES[0],
        action: TRANSITIONS['pick-duration'],
      },
      {
        id: 'duration-item-3',
        label: DURATION_SCREEN_ITEMS[1],
        marker: null,
        hints: null,
        minutes: DURATION_MINUTES[1],
        action: TRANSITIONS['pick-duration'],
      },
      {
        id: 'duration-item-5',
        label: DURATION_SCREEN_ITEMS[2],
        marker: null,
        hints: null,
        minutes: DURATION_MINUTES[2],
        action: TRANSITIONS['pick-duration'],
      },
      {
        id: 'duration-back',
        label: DURATION_SCREEN_ITEMS[3],
        marker: null,
        hints: null,
        action: TRANSITIONS['back-duration'],
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
    startAction: TRANSITIONS['start-bare'],
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
        action: TRANSITIONS['back-role-select'],
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
    stepField: 'gameControlStep',
    lockAction: TRANSITIONS['lock-model'],
    startAction: TRANSITIONS['start-bare'],
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
    startAction: TRANSITIONS['start-bare'],
    items: [],
    controls: [],
  },
  {
    id: GAME_OVER,
    view: null,
    field: true,
    cursor: 'none',
    selection: null,
    startAction: TRANSITIONS['start-bare'],
    items: [],
    controls: [
      { id: 'status', label: 'Menu', marker: null, action: TRANSITIONS['back-menu'] },
    ],
  },
  {
    id: RECORDS,
    view: 'records-view',
    field: false,
    cursor: 'arrow',
    selection: 'recordsSelect',
    startAction: TRANSITIONS['start-bare'],
    items: [
      {
        id: 'records-board-1',
        label: DURATION_SCREEN_ITEMS[0],
        marker: null,
        hints: null,
        minutes: DURATION_MINUTES[0],
        action: TRANSITIONS['pick-board'],
      },
      {
        id: 'records-board-3',
        label: DURATION_SCREEN_ITEMS[1],
        marker: null,
        hints: null,
        minutes: DURATION_MINUTES[1],
        action: TRANSITIONS['pick-board'],
      },
      {
        id: 'records-board-5',
        label: DURATION_SCREEN_ITEMS[2],
        marker: null,
        hints: null,
        minutes: DURATION_MINUTES[2],
        action: TRANSITIONS['pick-board'],
      },
    ],
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
    startAction: TRANSITIONS['start-bare'],
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

// The match duration whose leaderboard the records view shows right now: the
// board the arrow cursor selects. app.js hands this to the page painter, so the
// list and the cursor can never name different boards.
export function selectedBoardMinutes() {
  const item = currentItem(RECORDS);
  return item?.minutes ?? DURATION_MINUTES[0];
}

// ---------- The navigation state machine ----------
// Every transition below reads and writes the navigation half only. No
// gameplay field changes here, and no page element, pointer coordinate, key
// code or device state is read here.
import { game, startGame } from './state.js';
import { currentItem, gotoScreen, registerNavigation } from '../engine/js/navigation.js';

// The navigation half as [name, initial] pairs, in page order. js/state.js
// registers this table into the engine state skeleton, so the engine refills
// the half from here on every reset and names none of these fields itself.
// A hoisted function declaration, because js/state.js reads it while this
// module is still mid-evaluation (the two modules import each other).
export function screenFields() {
  return [
    ['state', MENU],
    ['menuSelect', 0],
    ['roleSelect', 0],
    ['durationSelect', 0],
    ['controlSelect', 0],
    ['recordsSelect', 0],
    ['p1Role', null],
    ['p2Role', null],
    ['twoPlayerMode', false],
    ['p1Selection', null],
    ['p2Selection', null],
    ['p1Model', null],
    ['p2Model', null],
    // The physical gamepad each player owns, by Gamepad API id. A pad drives
    // only the player who locked it, so two players need two distinct pads.
    ['p1Pad', null],
    ['p2Pad', null],
    ['controlError', ''],
    ['controlConfirmed', false],
    ['gameControlStep', GAME_CONTROL_P1],
  ];
}

// The engine skeleton owns the reset of both halves. The game re-exports the
// name so every existing caller keeps its import line.
export { resetScreen } from '../engine/js/state.js';

// The screen the interface shows once a game ends: the shared Start step in
// two-player mode, the game-over overlay otherwise. The game reports the screen and the engine
// navigates to it; a bare step constant hides every view.
export function applyGameOverScreen() {
  if (!game.screen.twoPlayerMode) {
    gotoScreen(GAME_OVER);
    return;
  }
  gotoScreen(SELECT_CONTROL);
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
  gotoScreen(MENU);
  game.screen.menuSelect = 0;
  game.screen.durationSelect = 0;
  game.screen.roleSelect = 0;
}

// Back from SELECT_CONTROL returns to the duration screen, the stage before the
// role screen. A player who leaves the control screen re-asks the match length.
export function backToRoleSelect() {
  gotoScreen(SELECT_DURATION);
}

// Lock the role the player chose. In a two-player game the other role goes to
// the second player and the control flow follows; otherwise the game starts.
function pickRole(role) {
  game.play.role = role;
  if (game.screen.twoPlayerMode) {
    pickP1Role(role);
    gotoScreen(SELECT_CONTROL);
    return;
  }
  startGame();
}

// True when the interface can offer this item right now. A wide-only item is
// hidden on a narrow viewport, so the cursor must never land on it.
function offersItem(item) {
  return !item.requiresWide || twoPlayerOffered();
}

// ---------- The handler map the engine looks up ----------
// The engine owns the intent queue, the cursor mechanics and the dispatch. This map is the only
// place the game interprets an action: a handler gets the item the intent selected (null when the
// start key runs with no item) plus the intent, and returns true when it changed navigation state.
const HANDLERS = {
  [TRANSITIONS.open]: (item, intent) => {
    gotoScreen(item.opens);
    return true;
  },
  [TRANSITIONS['select-role']]: (item, intent) => {
    gotoScreen(item.opens);
    return true;
  },
  [TRANSITIONS['two-player']]: (item, intent) => {
    if (!offersItem(item)) return false;
    game.screen.twoPlayerMode = true;
    gotoScreen(item.opens);
    return true;
  },
  [TRANSITIONS['pick-duration']]: (item, intent) => {
    game.play.durationMinutes = item.minutes;
    game.play.durationTicks = item.minutes * TICKS_PER_MINUTE;
    gotoScreen(SELECT_ROLE);
    return true;
  },
  [TRANSITIONS['back-duration']]: (item, intent) => {
    toMenu();
    return true;
  },
  [TRANSITIONS['pick-role']]: (item, intent) => {
    pickRole(item.role);
    return true;
  },
  [TRANSITIONS['back-menu']]: (item, intent) => {
    toMenu();
    return true;
  },
  [TRANSITIONS['back-role-select']]: (item, intent) => {
    backToRoleSelect();
    return true;
  },
  [TRANSITIONS['pick-board']]: (item, intent) => {
    // The records view stays open; the item's board is already the selection this call wrote.
    return true;
  },
  [TRANSITIONS['lock-model']]: (item, intent) => {
    if (!intent.model || !item.player) return false;
    return lockControlModel(item.player, intent.model);
  },
  [TRANSITIONS.reassign]: (item, intent) => {
    if (item.player === 1) reassignP1();
    else reassignP2();
    return true;
  },
  [TRANSITIONS['start-game']]: (item, intent) => {
    if (!game.screen.p1Model || !game.screen.p2Model) return false;
    startGame();
    return true;
  },
  // The start key away from the main menu starts with no item guard, unlike the Start item.
  [TRANSITIONS['start-bare']]: (item, intent) => {
    startGame();
    return true;
  },
};

// The actions a `toMenu` intent may run. Items may leave from any earlier stage; a screen's own
// Back control returns only from the stages whose Back control goes to the main menu.
const BACK_ITEM_ACTIONS = [
  TRANSITIONS['back-menu'],
  TRANSITIONS['back-duration'],
  TRANSITIONS['back-role-select'],
];
const BACK_CONTROL_ACTIONS = [TRANSITIONS['back-menu'], TRANSITIONS['back-duration']];

// The game registers its rows, its handler map and its own field names into the engine navigation.
registerNavigation({
  rows: SCREENS,
  handlers: HANDLERS,
  offers: offersItem,
  backItems: BACK_ITEM_ACTIONS,
  backControls: BACK_CONTROL_ACTIONS,
  stateField: 'state',
});

// The engine owns the queue, the cursor mechanics and the screen system. The game re-exports the
// names so every existing caller keeps its import line.
export { pushIntent, drainIntents, screenSystem, itemForStep, opensScreen, currentItem } from '../engine/js/navigation.js';


