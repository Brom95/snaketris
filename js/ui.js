// The page interface: everything the game shows outside the play field.
// Owns the elements declared in snaketris.html and keeps their visibility in
// step with `game.screen.state`, the single view authority. Imports only constants.js
// and state.js, so the module graph stays one-way (app -> ui).
import {
  SELECT_ROLE, SELECT_DURATION, SELECT_CONTROL, PLAYING, RECORDS, GAME_OVER,
  FIELD_V_GAP, FIELD_V_GAP_MOBILE, BOARD_W, BOARD_H, UI_STACK_MAX_WIDTH, UI_COLUMN_MIN,
  GAME_CONTROL_PLAYER_MARKERS,
  twoPlayerOffered,
} from './constants.js';
import { game, remainingSeconds } from './state.js';
import { recordLines } from './highscores.js';
import { SCREENS, SCREEN_BY_ID, itemForStep, controlModelAssigned } from './screens.js';
import { createLayout } from '../engine/js/layout.js';
import { createInterface } from '../engine/js/interface.js';
import { paintPage, registerPagePainter } from '../engine/js/present.js';

// The engine viewport rule, fed with the game's field box and the page's gap
// values. One instance answers both the stacked-layout rule and the gap.
const layout = createLayout({
  boardWidth: BOARD_W,
  boardHeight: BOARD_H,
  stackMaxWidth: UI_STACK_MAX_WIDTH,
  columnMin: UI_COLUMN_MIN,
  gap: FIELD_V_GAP,
  gapMobile: FIELD_V_GAP_MOBILE,
});

// Elements this module owns that the screen table does not name.
let uiEl = null;
let scoreEl = null;
let timerEl = null;
let statusEl = null;
let recordsListEl = null;
let recordsEmptyEl = null;
let fieldEl = null;
let roleLineEl = null;
let controlErrorEl = null;
let controlKeyHintsEl = null;
let controlSummaryEl = null;
let roleTitleEl = null;
let controlTitleEl = null;

// One element owner lives in the engine: every id the screen table names is looked
// up there, once, and handed out to whoever paints or hit-tests it. js/input.js
// hit-tests the same lists, so the page and the table cannot drift apart silently.
const iface = createInterface();
const lookup = iface.lookup;
const show = iface.show;
const highlightItem = iface.highlight;

// The one paint context every page painter reads: the state root, and the
// records board the page entry supplies (null when no board is shown).
const paintCtx = { state: game, board: null };

// Per-player feedback blocks, keyed by the player number the table carries.
const statusElsByPlayer = new Map();
const summaryElsByPlayer = new Map();

// Called by app.js once the page is parsed; stores the interface elements and
// indexes every id the registered table names, in table order.
export function initUi() {
  uiEl = lookup('ui');
  scoreEl = lookup('score');
  timerEl = lookup('timer');
  statusEl = lookup('status');
  recordsListEl = lookup('records-list');
  recordsEmptyEl = lookup('records-empty');
  fieldEl = lookup('game');
  roleLineEl = lookup('role-line');
  controlErrorEl = lookup('control-error');
  controlKeyHintsEl = lookup('control-key-hints');
  controlSummaryEl = lookup('control-summary');
  roleTitleEl = lookup('role-title');
  controlTitleEl = lookup('control-title');
  statusElsByPlayer.set(1, lookup('control-p1-status'));
  statusElsByPlayer.set(2, lookup('control-p2-status'));
  summaryElsByPlayer.set(1, lookup('summary-line-1'));
  summaryElsByPlayer.set(2, lookup('summary-line-2'));
  iface.indexRows(SCREENS);
  // The engine page pass: each painter runs once per rendered frame, in this
  // order. Registration is name-keyed, so a second initUi cannot paint twice.
  registerPagePainter('views', paintViews);
  registerPagePainter('score', paintScore);
  registerPagePainter('status', paintStatus);
  registerPagePainter('placeScore', placeScore);
  registerPagePainter('roleLine', paintRoleLine);
  registerPagePainter('records', paintRecords);
}

// The interface elements of one screen: its items, then its controls.
export function hitTargets(screenId) {
  return iface.hitTargets(screenId);
}

// The leaderboard rows are rebuilt from the board the caller supplies, so this
// module stays free of storage concerns. The records owner formats each line;
// this module only puts one formatted line into one list item.
function fillRecords(board) {
  recordsListEl.textContent = '';
  for (const line of recordLines(board)) {
    const li = document.createElement('li');
    li.textContent = line;
    recordsListEl.appendChild(li);
  }
  show(recordsEmptyEl, board.length === 0);
}

// Both side scores, each labelled with its side. The chosen role is not named.
function scoreText() {
  return 'Snake ' + game.play.snakeScore + '  ·  Tetris ' + game.play.tetrisScore;
}

// The game-over line names the winner and shows both final scores.
function statusText() {
  let winner = 'Draw';
  if (game.play.gameOverReason === 'snake-death') winner = 'Tetris wins';
  else if (game.play.gameOverReason === 'top-out') winner = 'Snake wins';
  else if (game.play.snakeScore > game.play.tetrisScore) winner = 'Snake wins';
  else if (game.play.tetrisScore > game.play.snakeScore) winner = 'Tetris wins';
  const reason = game.play.gameOverReason === 'time-up' ? 'time up — ' : '';
  return 'Game Over — ' + reason + 'Snake ' + game.play.snakeScore + ', Tetris ' + game.play.tetrisScore + ' — ' + winner +
    ' — press R or click for menu';
}

// The readout sits in normal flow within the #ui band. On stacked layouts
// (mobile) it is part of the interface band above the field rather than an
// overlay over the top edge, so the full field height below that band is
// unobstructed. Clearing any inline styles returns it to flow.
function placeScore() {
  for (const el of [scoreEl, timerEl]) {
    if (!el) continue;
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    el.style.width = '';
  }
}

// The one page-paint entry: the engine page pass runs every registered painter
// once per rendered frame. The records board is supplied here because this
// module owns no storage.
export function syncViews(recordsBoard) {
  paintCtx.board = recordsBoard;
  paintPage(paintCtx);
}

// The visibility half: every registered row's view, the field, the countdown,
// the wide-viewport menu item, the cursors, the stage titles and the step
// feedback.
function paintViews(pctx) {
  const state = game.screen.state;
  const row = SCREEN_BY_ID[state];
  // The engine view-sync mechanism toggles every registered row's view from the
  // current screen id and reports whether that row shows the field.
  const fieldOn = iface.paintViews(SCREENS, state);
  show(fieldEl, fieldOn);
  show(scoreEl, fieldOn);
  // The countdown is plain remaining seconds with no unit suffix, on screen only
  // while a match is running or has just ended.
  if (timerEl) {
    timerEl.textContent = String(remainingSeconds());
    show(timerEl, state === PLAYING || state === GAME_OVER);
  }
  // Two-player menu item: shown when the viewport is wide enough, hidden at or
  // below UI_STACK_MAX_WIDTH.
  const twoPlayerItem = iface.element('menu-item-two-player');
  if (twoPlayerItem) twoPlayerItem.style.display = twoPlayerOffered() ? '' : 'none';
  paintHighlights(state);
  paintStageTitle(state, row);
  if (row !== undefined && row.cursor === 'step') paintControlFeedback(row);
  else if (controlErrorEl) controlErrorEl.textContent = '';
}

function paintScore(pctx) {
  if (scoreEl) scoreEl.textContent = scoreText();
}

function paintStatus(pctx) {
  const state = game.screen.state;
  show(statusEl, state === GAME_OVER);
  if (state === GAME_OVER && statusEl) statusEl.textContent = statusText();
}

function paintRecords(pctx) {
  if (game.screen.state !== RECORDS) return;
  fillRecords(pctx.board || []);
}

// Every preparation stage says its own name and the action it expects, so the
// player always knows which stage is active and who acts.
function paintStageTitle(state, row) {
  if (roleTitleEl) {
    roleTitleEl.textContent =
      state === SELECT_ROLE && game.screen.twoPlayerMode
        ? 'Choose your side — P1 picks, P2 gets the other'
        : 'Choose your side';
  }
  if (!controlTitleEl) return;
  const step = row !== undefined && state === SELECT_CONTROL
    ? itemForStep(row.id, game.screen.gameControlStep) : null;
  if (!step) {
    controlTitleEl.textContent = 'Confirm controls';
    return;
  }
  const index = stepItemIndex(row);
  const position = 'step ' + (index >= 0 ? index + 1 : row.items.length) +
    ' of ' + row.items.length;
  controlTitleEl.textContent = 'Confirm controls — ' + position +
    ': ' + (step.player ? 'P' + step.player : 'both players');
}

// The role line names both roles through the whole preparation flow. It stays
// empty until a role is chosen, so it never prints the text "null".
function paintRoleLine(pctx) {
  if (!roleLineEl) return;
  const state = game.screen.state;
  const named = game.screen.twoPlayerMode && game.screen.p1Role && game.screen.p2Role;
  const on = named && (state === SELECT_ROLE || state === SELECT_CONTROL);
  roleLineEl.textContent = on
    ? 'P1: ' + game.screen.p1Role + '  /  P2: ' + game.screen.p2Role
    : '';
  show(roleLineEl, !!roleLineEl.textContent);
}

// Paint the selection cursor of every screen from the table. The current screen
// gets its own cursor; every other screen is cleared, exactly as before.
function paintHighlights(state) {
  for (const row of SCREENS) {
    const items = iface.items(row.id);
    if (row.id !== state) {
      highlightItem(items, -1);
      continue;
    }
    if (row.cursor === 'arrow') {
      highlightItem(items, game.screen[row.selection] ?? -1);
      continue;
    }
    highlightItem(items, stepItemIndex(row));
  }
}

// The item index the current control step selects, or -1 when the step names no
// item (the shared start step).
function stepItemIndex(row) {
  const item = itemForStep(row.id, game.screen.gameControlStep);
  if (!item) return -1;
  for (let i = 0; i < row.items.length; i++) {
    if (row.items[i].id === item.id) return i;
  }
  return -1;
}

// The step-screen feedback blocks read the same table entry: key hints, the
// per-player status, the controls, and the per-player summary on every step.
function paintControlFeedback(row) {
  const step = itemForStep(row.id, game.screen.gameControlStep);
  if (controlKeyHintsEl) {
    controlKeyHintsEl.textContent = step ? step.hints : '';
    show(controlKeyHintsEl, true);
  }
  show(controlErrorEl, !!game.screen.controlError);
  if (controlErrorEl) controlErrorEl.textContent = game.screen.controlError || '';
  const controls = iface.controls(row.id);
  for (let i = 0; i < row.controls.length; i++) {
    const spec = row.controls[i];
    const el = controls[i];
    if (!el) continue;
    show(el, spec.player ? controlModelAssigned(spec.player) : true);
  }
  for (const item of row.items) {
    if (!item.player) continue;
    const el = statusElsByPlayer.get(item.player);
    if (!el) continue;
    const model = modelOf(item.player);
    el.textContent = model
      ? 'P' + item.player + ': ' + item.marker + ' ' + model.toUpperCase() + ' ✔'
      : '';
    show(el, !!el.textContent);
  }
  show(controlSummaryEl, true);
  for (const player of [1, 2]) {
    const el = summaryElsByPlayer.get(player);
    if (!el) continue;
    const role = roleOf(player);
    const model = modelOf(player);
    el.textContent = role
      ? 'P' + player + ': ' + role + '  /  ' + markerOf(row, player) +
        ' ' + (model || 'not chosen')
      : '';
    show(el, !!el.textContent);
  }
}

function modelOf(player) {
  return player === 1 ? game.screen.p1Model : game.screen.p2Model;
}

// P1 falls back to the single-player role; P2 has no role until the table picks one.
function roleOf(player) {
  return player === 1 ? (game.screen.p1Role || game.play.role) : (game.screen.p2Role || '');
}

function markerOf(row, player) {
  for (const item of row.items) {
    if (item.player === player) return item.marker;
  }
  return GAME_CONTROL_PLAYER_MARKERS[player];
}

// The one viewport rule lives in the engine; this module hands out its two
// readings so the page and the field fit cannot drift apart.
export function layoutRule() {
  return layout.rule();
}

// Height the stacked interface occupies, including the gap around the field.
// Zero when the interface shares a track beside the field.
export function interfaceBandHeight() {
  return layout.band(uiEl);
}

// Size one page element to the viewport rule: the engine fit reads the same
// rule as the band above.
export function sizeField(element, reserved) {
  layout.fit(element, reserved);
}
