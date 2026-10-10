// The page interface: everything the game shows outside the play field.
// Owns the elements declared in snaketris.html and keeps their visibility in
// step with `game.state`, the single view authority. Imports only constants.js
// and state.js, so the module graph stays one-way (app -> ui).
import {
  MENU, SELECT_ROLE, RECORDS, HELP, GAME_OVER, PLAYING,
  FIELD_V_GAP, FIELD_V_GAP_MOBILE, BOARD_W, BOARD_H, UI_STACK_MAX_WIDTH, UI_COLUMN_MIN,
  ROLE_MARKERS,
} from './constants.js';
import { game } from './state.js';
import { entryRole } from './highscores.js';

let uiEl = null;
let scoreEl = null;
let statusEl = null;
let menuViewEl = null;
let roleViewEl = null;
let recordsViewEl = null;
let helpViewEl = null;
let recordsListEl = null;
let recordsEmptyEl = null;
let menuItemsEls = [];
let roleItemsEls = [];
let fieldEl = null;
let twoPlayerItemEl = null;
let roleLineEl = null;

// Called by app.js once the page is parsed; stores the interface elements.
export function initUi() {
  uiEl = document.getElementById('ui');
  scoreEl = document.getElementById('score');
  statusEl = document.getElementById('status');
  menuViewEl = document.getElementById('menu-view');
  roleViewEl = document.getElementById('role-view');
  recordsViewEl = document.getElementById('records-view');
  helpViewEl = document.getElementById('help-view');
  recordsListEl = document.getElementById('records-list');
  recordsEmptyEl = document.getElementById('records-empty');
  menuItemsEls = Array.from(document.querySelectorAll('#menu-items > li'));
  roleItemsEls = Array.from(document.querySelectorAll('#role-items > li'));
  fieldEl = document.getElementById('game');
  twoPlayerItemEl = document.getElementById('menu-item-two-player');
  roleLineEl = document.getElementById('role-line');
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
  return 'Snake ' + game.snakeScore + '  ·  Tetris ' + game.tetrisScore;
}

// The game-over line names the winner and shows both final scores.
function statusText() {
  let winner = 'Draw';
  if (game.snakeScore > game.tetrisScore) winner = 'Snake wins';
  else if (game.tetrisScore > game.snakeScore) winner = 'Tetris wins';
  return 'Game Over — Snake ' + game.snakeScore + ', Tetris ' + game.tetrisScore + ' — ' + winner +
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

// The one view authority: `game.state` decides which interface elements are
// on screen. Called every frame from the render path.
export function syncViews(recordsBoard) {
  const state = game.state;
  if (scoreEl) scoreEl.textContent = scoreText();
  const fieldOn = state === PLAYING || state === GAME_OVER;
  show(fieldEl, fieldOn);
  show(scoreEl, fieldOn);
  placeScore();
  show(statusEl, state === GAME_OVER);
  if (state === GAME_OVER && statusEl) statusEl.textContent = statusText();
  // The role screen is a separate view: opening it hides the main menu.
  show(menuViewEl, state === MENU);
  show(roleViewEl, state === SELECT_ROLE);
  show(recordsViewEl, state === RECORDS);
  show(helpViewEl, state === HELP);
  // Two-player menu item: shown when the viewport is wide enough, hidden at or
  // below UI_STACK_MAX_WIDTH.
  if (twoPlayerItemEl) {
    twoPlayerItemEl.style.display = window.innerWidth > UI_STACK_MAX_WIDTH ? '' : 'none';
  }
  if (state === MENU) highlightItem(menuItemsEls, game.menuSelect);
  if (state === SELECT_ROLE) {
    // The menu is off screen here, so its highlight is cleared too.
    highlightItem(menuItemsEls, -1);
    highlightItem(roleItemsEls, game.roleSelect);
    // Role line: "P1: X / P2: Y" above the model selection in two-player mode.
    if (roleLineEl) {
      roleLineEl.textContent = game.twoPlayerMode
        ? 'P1: ' + game.p1Role + '  /  P2: ' + game.p2Role
        : '';
    }
  } else if (roleLineEl) {
    roleLineEl.textContent = '';
  }
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
// Zero when the interface shares a track beside the field. On narrow
// viewports the gap is halved so the board starts higher on screen.
export function interfaceBandHeight() {
  if (!stackedLayout() || !uiEl) return 0;
  const gap = window.innerWidth <= UI_STACK_MAX_WIDTH ? FIELD_V_GAP_MOBILE : FIELD_V_GAP;
  return uiEl.getBoundingClientRect().height + gap;
}
