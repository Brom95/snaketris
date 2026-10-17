// The screen table: one declarative source of truth for every screen of the
// interface. Each screen states its items in page order, and every item names
// the page element it is, its label, its marker, its key hints, and the screen
// or transition it opens. Back and reassign controls are declared per screen.
//
// Data only. Labels and markers come from constants.js; the ids are the page
// element ids declared in snaketris.html, so the table and the page cannot
// drift apart silently (tests/screens.test.js checks every id against the page).

import {
  MENU, SELECT_DURATION, SELECT_ROLE, SELECT_CONTROL, PLAYING, GAME_OVER, RECORDS, HELP, PAIRING, SELECT_WAY,
  MENU_ITEMS, ROLE_ITEMS, ROLE_SCREEN_ITEMS, CONTROL_SCREEN_ITEMS, WAY_SCREEN_ITEMS,
  DURATION_MINUTES, DURATION_SCREEN_ITEMS, TICKS_PER_MINUTE,
  ROLE_MARKERS,
  GAME_CONTROL_P1, GAME_CONTROL_P2, GAME_CONTROL_START,
  GAME_CONTROL_PLAYER_MARKERS,
  PAIRING_TITLE, PAIRING_HINTS, PAIRING_JOIN, PAIRING_WAITING,
  LOCAL_TITLE, LOCAL_HINTS, ADDRESS_LABEL, ADDRESS_HINTS, ADDRESS_BAD,
  COPY_LABEL, COPY_DENIED,
  twoPlayerOffered,
} from './constants.js';
import { attemptPair, guestPage, pickFlow, copyValue } from './netplay.js';

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
  pair: 'pair', // confirm the pairing secret and continue the network flow
  'pick-way': 'pick-way', // arm the way the "Two Players" entry offers, then continue the flow
  copy: 'copy', // put the value beside the affordance on the clipboard
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
        opens: SELECT_WAY,
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
    id: SELECT_WAY,
    view: 'way-view',
    field: false,
    cursor: 'arrow',
    selection: 'waySelect',
    startAction: null,
    items: [
      {
        id: 'way-item-local',
        label: WAY_SCREEN_ITEMS[0],
        marker: null,
        hints: null,
        action: TRANSITIONS['pick-way'],
        opens: SELECT_DURATION,
        requiresWide: true,
      },
      {
        id: 'way-item-network-global',
        label: WAY_SCREEN_ITEMS[1],
        marker: null,
        hints: null,
        action: TRANSITIONS['pick-way'],
        opens: PAIRING,
      },
      {
        id: 'way-item-network-local',
        label: WAY_SCREEN_ITEMS[2],
        marker: null,
        hints: null,
        action: TRANSITIONS['pick-way'],
        opens: PAIRING,
      },
      {
        id: 'way-back',
        label: WAY_SCREEN_ITEMS[3],
        marker: null,
        hints: null,
        action: TRANSITIONS['back-menu'],
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
  {
    id: PAIRING,
    view: 'pairing-view',
    field: false,
    cursor: 'none',
    selection: null,
    startAction: null, // the start key starts nothing here: no match exists before a peer is paired
    items: [
      { id: 'pairing-join', label: PAIRING_JOIN, marker: null, action: TRANSITIONS.pair },
    ],
    controls: [
      { id: 'pairing-back', label: 'Back', marker: null, action: TRANSITIONS['back-menu'] },
      { id: 'copy-pairing-link', label: COPY_LABEL, marker: null, action: TRANSITIONS.copy, value: 'link' },
      { id: 'copy-pairing-code', label: COPY_LABEL, marker: null, action: TRANSITIONS.copy, value: 'code' },
      { id: 'copy-pairing-address', label: COPY_LABEL, marker: null, action: TRANSITIONS.copy, value: 'address' },
    ],
  },
];

// One screen entry per id, so the screen system can look a screen up by the
// current navigation state.
export const SCREEN_BY_ID = SCREENS.reduce((acc, row) => {
  acc[row.id] = row;
  return acc;
}, {});

// The index the arrow cursor of the named screen rests on, for the guest page's
// read-only mirror of the host page's preparation. -1 for a screen with no
// arrow cursor.
export function selectedIndex(screenId) {
  const row = SCREEN_BY_ID[screenId];
  if (!row || row.cursor !== 'arrow') return -1;
  return game.screen[row.selection] ?? -1;
}

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
    ['waySelect', 0],
    ['p1Role', null],
    ['p2Role', null],
    ['twoPlayerMode', false],
    // This page plays in a network duel: each peer drives one side on its own
    // device, the host page runs the simulation and the guest page paints the
    // frames it receives.
    ['networkMode', false],
    // Which seat this page drives: 1 for the page that published the pairing
    // offer, 2 for the page that adopted one, 0 for a page in no duel.
    ['seat', 0],
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
// two-player mode, the duration sub-menu in a network duel (the host
// re-prepares for the next match without re-pairing), the game-over overlay
// otherwise. The game reports the screen and the engine navigates to it; a bare
// step constant hides every view.
export function applyGameOverScreen() {
  if (game.screen.networkMode) {
    // The host re-prepares for the next match; the guest keeps its pairing step
    // and its read-only mirrors.
    gotoScreen(guestPage() ? PAIRING : SELECT_DURATION);
    return;
  }
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
  game.screen.waySelect = 0;
}

// Back from SELECT_CONTROL returns to the duration screen, the stage before the
// role screen. A player who leaves the control screen re-asks the match length.
export function backToRoleSelect() {
  gotoScreen(SELECT_DURATION);
}

// The pairing step a page opens when it already holds a secret for the other
// device: the second player opened a pairing link, so the step is on screen and
// no match has started. Opening it is what puts this page in a network duel.
export function enterPairing() {
  game.screen.networkMode = true;
  game.screen.twoPlayerMode = true;
  gotoScreen(PAIRING);
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
    // "Play" is a single-player match: this page drives one side and the bot
    // drives the other.
    game.screen.networkMode = false;
    gotoScreen(item.opens);
    return true;
  },
  [TRANSITIONS['two-player']]: (item, intent) => {
    // The entry is offered at every viewport width and always opens the way
    // sub-menu. A narrow viewport has no second pad on this device, so the
    // shared-page way is the item the sub-menu hides there and the player still
    // chooses between the two network flows. The way itself arms the duel.
    game.screen.twoPlayerMode = true;
    gotoScreen(SELECT_WAY);
    return true;
  },
  [TRANSITIONS['pick-way']]: (item, intent) => {
    if (!offersItem(item)) return false;
    if (item.opens === PAIRING) {
      game.screen.networkMode = true;
      game.screen.twoPlayerMode = true;
      pickFlow(item.id === 'way-item-network-local' ? 'local' : 'global');
    } else {
      game.screen.networkMode = false;
      game.screen.twoPlayerMode = true;
    }
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
    // In a network duel the other peer confirms its model on its own device;
    // the message it sends locks that seat here.
    if (game.screen.networkMode && item.player === 2) return false;
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
  // Pairing advances only when this page holds a secret. The host opens the
  // duration sub-menu; the guest keeps the pairing step open, because the host
  // page owns the preparation and the guest only mirrors it.
  [TRANSITIONS.copy]: (item, intent) => {
    // The affordance copies the value beside it; a browser that refuses says so
    // on the step and the value stays selectable by hand.
    copyValue(item.value);
    return true;
  },
  [TRANSITIONS.pair]: (item, intent) => {
    if (!attemptPair()) return false;
    if (guestPage()) return true;
    gotoScreen(SELECT_DURATION);
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
export { pushIntent, drainIntents, screenSystem, itemForStep, opensScreen, currentItem, gotoScreen } from '../engine/js/navigation.js';


