// The page interface: everything the game shows outside the play field.
// Owns the elements declared in snaketris.html and keeps their visibility in
// step with `game.screen.state`, the single view authority. Imports only constants.js
// and state.js, so the module graph stays one-way (app -> ui).
import {
  MENU, SELECT_ROLE, SELECT_CONTROL, RECORDS, HELP, GAME_OVER, PLAYING,
  FIELD_V_GAP, FIELD_V_GAP_MOBILE, BOARD_W, BOARD_H, UI_STACK_MAX_WIDTH, UI_COLUMN_MIN,
  ROLE_MARKERS,
  GAME_CONTROL_P1, GAME_CONTROL_P2, GAME_CONTROL_START,
  GAME_CONTROL_PLAYER_MARKERS,
} from './constants.js';
import { game } from './state.js';
import { entryRole } from './highscores.js';
import { SCREENS, SCREEN_BY_ID, itemForStep, controlModelAssigned } from './screens.js';

// Elements this module owns that the screen table does not name.
let uiEl = null;
let scoreEl = null;
let statusEl = null;
let recordsListEl = null;
let recordsEmptyEl = null;
let fieldEl = null;
let roleLineEl = null;
let controlErrorEl = null;
let controlKeyHintsEl = null;
let controlSummaryEl = null;

// One element owner: every id the screen table names is looked up here, once,
// and handed out to whoever paints or hit-tests it. js/input.js hit-tests the
// same lists, so the page and the table cannot drift apart silently.
const elById = new Map();
const itemsByScreen = new Map();
const controlsByScreen = new Map();

// Per-player feedback blocks, keyed by the player number the table carries.
const statusElsByPlayer = new Map();
const summaryElsByPlayer = new Map();

// Called by app.js once the page is parsed; stores the interface elements.
export function initUi() {
  uiEl = document.getElementById('ui');
  scoreEl = document.getElementById('score');
  statusEl = document.getElementById('status');
  recordsListEl = document.getElementById('records-list');
  recordsEmptyEl = document.getElementById('records-empty');
  fieldEl = document.getElementById('game');
  roleLineEl = document.getElementById('role-line');
  controlErrorEl = document.getElementById('control-error');
  controlKeyHintsEl = document.getElementById('control-key-hints');
  controlSummaryEl = document.getElementById('control-summary');
  statusElsByPlayer.set(1, document.getElementById('control-p1-status'));
  statusElsByPlayer.set(2, document.getElementById('control-p2-status'));
  summaryElsByPlayer.set(1, document.getElementById('summary-line-1'));
  summaryElsByPlayer.set(2, document.getElementById('summary-line-2'));
  indexInterface();
}

// Look up every id the table names, in table order. A page element that is
// absent keeps its slot, so every table index stays true.
function indexInterface() {
  for (const row of SCREENS) {
    if (row.view) lookup(row.view);
    const items = [];
    for (const item of row.items) items.push(lookup(item.id));
    const controls = [];
    for (const control of row.controls) controls.push(lookup(control.id));
    itemsByScreen.set(row.id, items);
    controlsByScreen.set(row.id, controls);
  }
}

function lookup(id) {
  if (!id) return null;
  const el = document.getElementById(id);
  elById.set(id, el);
  return el;
}

// The interface elements of one screen: its items, then its controls.
export function hitTargets(screenId) {
  const out = [];
  for (const el of itemsByScreen.get(screenId) ?? []) if (el) out.push(el);
  for (const el of controlsByScreen.get(screenId) ?? []) if (el) out.push(el);
  return out;
}

// Shows or hides one interface element. `.view` hides by default, `.view.on`
// shows it; the class toggle keeps the base class intact.
function show(el, on) {
  if (el) el.classList.toggle('on', on);
}

// ISO-8601 "2026-09-26T12:34:56.789Z" -> "2026-09-26" (deterministic).
function formatDate(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// The leaderboard rows are rebuilt from the board the caller supplies, so this
// module stays free of storage concerns. Every row carries its role marker.
function fillRecords(board) {
  recordsListEl.textContent = '';
  for (let i = 0; i < board.length; i++) {
    const li = document.createElement('li');
    li.textContent = ROLE_MARKERS[entryRole(board[i])] + '  ' + board[i].score + '  ·  ' + formatDate(board[i].date);
    recordsListEl.appendChild(li);
  }
  show(recordsEmptyEl, board.length === 0);
}

// Highlight one item in a list by index. The `::before` marker and the
// highlight colour come from the page CSS. Index -1 clears the whole list.
function highlightItem(items, index) {
  for (let i = 0; i < items.length; i++) {
    show(items[i], i === index);
  }
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
  return 'Game Over — Snake ' + game.play.snakeScore + ', Tetris ' + game.play.tetrisScore + ' — ' + winner +
    ' — press R or click for menu';
}

// The readout sits in normal flow within the #ui band. On stacked layouts
// (mobile) it is part of the interface band above the field rather than an
// overlay over the top edge, so the full field height below that band is
// unobstructed. Clearing any inline styles returns it to flow.
function placeScore() {
  if (!scoreEl) return;
  scoreEl.style.position = '';
  scoreEl.style.top = '';
  scoreEl.style.left = '';
  scoreEl.style.width = '';
}

// The one view authority: `game.screen.state` decides which interface elements are
// on screen. Called every frame from the render path.
export function syncViews(recordsBoard) {
  const state = game.screen.state;
  const row = SCREEN_BY_ID[state];
  if (scoreEl) scoreEl.textContent = scoreText();
  const fieldOn = row !== undefined && row.field;
  show(fieldEl, fieldOn);
  show(scoreEl, fieldOn);
  placeScore();
  show(statusEl, state === GAME_OVER);
  if (state === GAME_OVER && statusEl) statusEl.textContent = statusText();
  // The role screen is a separate view: opening it hides the main menu.
  for (const screen of SCREENS) show(elById.get(screen.view), screen.id === state);
  // Two-player menu item: shown when the viewport is wide enough, hidden at or
  // below UI_STACK_MAX_WIDTH.
  const twoPlayerItem = elById.get('menu-item-two-player');
  if (twoPlayerItem) {
    twoPlayerItem.style.display = window.innerWidth > UI_STACK_MAX_WIDTH ? '' : 'none';
  }
  paintHighlights(state);
  if (roleLineEl) {
    roleLineEl.textContent =
      state === SELECT_ROLE && game.screen.twoPlayerMode
        ? 'P1: ' + game.screen.p1Role + '  /  P2: ' + game.screen.p2Role
        : '';
  }
  if (row !== undefined && row.cursor === 'step') paintControlFeedback(row);
  else if (controlErrorEl) controlErrorEl.textContent = '';
  if (state === RECORDS) fillRecords(recordsBoard || []);
}

// Paint the selection cursor of every screen from the table. The current screen
// gets its own cursor; every other screen is cleared, exactly as before.
function paintHighlights(state) {
  for (const row of SCREENS) {
    const items = itemsByScreen.get(row.id) ?? [];
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
// per-player status, the controls, and the shared summary.
function paintControlFeedback(row) {
  const step = itemForStep(row.id, game.screen.gameControlStep);
  if (controlKeyHintsEl) {
    controlKeyHintsEl.textContent = step ? step.hints : '';
    show(controlKeyHintsEl, true);
  }
  show(controlErrorEl, !!game.screen.controlError);
  if (controlErrorEl) controlErrorEl.textContent = game.screen.controlError || '';
  const controls = controlsByScreen.get(row.id) ?? [];
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
  const shared = !!step && !step.player;
  show(controlSummaryEl, shared);
  if (!shared) return;
  for (const player of [1, 2]) {
    const el = summaryElsByPlayer.get(player);
    if (!el) continue;
    el.textContent = 'P' + player + ': ' + roleOf(player) +
      '  /  ' + markerOf(row, player) + ' ' + (modelOf(player) || '');
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

// The one viewport rule: the same scale and gap answer both whether the interface
// column stacks above the field and how much height the field may take.
function fieldScale() {
  return Math.min(window.innerWidth / BOARD_W, (window.innerHeight - 2 * FIELD_V_GAP) / BOARD_H);
}

export function layoutRule() {
  const narrow = window.innerWidth <= UI_STACK_MAX_WIDTH;
  return {
    stacked: narrow || window.innerWidth - BOARD_W * fieldScale() < UI_COLUMN_MIN + FIELD_V_GAP,
    gap: narrow ? FIELD_V_GAP_MOBILE : FIELD_V_GAP,
  };
}

// Height the stacked interface occupies, including the gap around the field.
// Zero when the interface shares a track beside the field. On narrow
// viewports the gap is halved so the board starts higher on screen.
export function interfaceBandHeight() {
  const rule = layoutRule();
  if (!rule.stacked || !uiEl) return 0;
  return uiEl.getBoundingClientRect().height + rule.gap;
}
