// The page interface: everything the game shows outside the play field.
// Owns the elements declared in snaketris.html and keeps their visibility in
// step with `game.state`, the single view authority. Imports only constants.js
// and state.js, so the module graph stays one-way (app -> ui).
import {
  MENU, RECORDS, HELP, GAME_OVER, PLAYING,
  FIELD_V_GAP, BOARD_W, BOARD_H, UI_STACK_MAX_WIDTH, UI_COLUMN_MIN,
} from './constants.js';
import { game } from './state.js';

let uiEl = null;
let scoreEl = null;
let statusEl = null;
let menuViewEl = null;
let recordsViewEl = null;
let helpViewEl = null;
let recordsListEl = null;
let recordsEmptyEl = null;
let menuItemsEls = [];
let fieldEl = null;

// Called by app.js once the page is parsed; stores the interface elements.
export function initUi() {
  uiEl = document.getElementById('ui');
  scoreEl = document.getElementById('score');
  statusEl = document.getElementById('status');
  menuViewEl = document.getElementById('menu-view');
  recordsViewEl = document.getElementById('records-view');
  helpViewEl = document.getElementById('help-view');
  recordsListEl = document.getElementById('records-list');
  recordsEmptyEl = document.getElementById('records-empty');
  menuItemsEls = Array.from(document.querySelectorAll('#menu-items > li'));
  fieldEl = document.getElementById('game');
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
// module stays free of storage concerns.
function fillRecords(board) {
  recordsListEl.textContent = '';
  for (let i = 0; i < board.length; i++) {
    const li = document.createElement('li');
    li.textContent = board[i].score + '  ·  ' + formatDate(board[i].date);
    recordsListEl.appendChild(li);
  }
  show(recordsEmptyEl, board.length === 0);
}

// The highlighted menu item follows `game.menuSelect`; the `::before` marker
// and the highlight colour come from the page CSS.
function highlightMenu() {
  for (let i = 0; i < menuItemsEls.length; i++) {
    show(menuItemsEls[i], i === game.menuSelect);
  }
}

// Where the interface stacks above the field the readout floats over the top
// edge of the field instead of sitting in the column, so it reserves no band of
// its own; anywhere else (or while the field is hidden) it returns to the flow.
function placeScore(overField) {
  if (!scoreEl) return;
  if (!overField || !fieldEl) {
    scoreEl.style.position = '';
    scoreEl.style.top = '';
    scoreEl.style.left = '';
    scoreEl.style.width = '';
    return;
  }
  const box = fieldEl.getBoundingClientRect();
  scoreEl.style.position = 'fixed';
  scoreEl.style.top = box.top + 'px';
  scoreEl.style.left = box.left + 'px';
  scoreEl.style.width = box.width + 'px';
}

// The one view authority: `game.state` decides which interface elements are
// on screen. Called every frame from the render path.
export function syncViews(recordsBoard) {
  const state = game.state;
  if (scoreEl) scoreEl.textContent = 'Score: ' + game.score;
  const fieldOn = state === PLAYING || state === GAME_OVER;
  show(fieldEl, fieldOn);
  show(scoreEl, fieldOn);
  placeScore(fieldOn && stackedLayout());
  show(statusEl, state === GAME_OVER);
  show(menuViewEl, state === MENU);
  show(recordsViewEl, state === RECORDS);
  show(helpViewEl, state === HELP);
  if (state === MENU) highlightMenu();
  if (state === RECORDS) fillRecords(recordsBoard || []);
}

// The interface column has its own size rule and never follows the field's
// scale, so on viewports where it cannot sit beside the field it stacks above
// it and the field must give up that band of height.
function stackedLayout() {
  if (window.innerWidth <= UI_STACK_MAX_WIDTH) return true;
  const scale = Math.min(window.innerWidth / BOARD_W, (window.innerHeight - 2 * FIELD_V_GAP) / BOARD_H);
  return window.innerWidth - BOARD_W * scale < UI_COLUMN_MIN + FIELD_V_GAP;
}

// Height the stacked interface occupies, including the gap around the field.
// Zero when the interface shares a track beside the field.
export function interfaceBandHeight() {
  if (!stackedLayout() || !uiEl) return 0;
  return uiEl.getBoundingClientRect().height + FIELD_V_GAP;
}
