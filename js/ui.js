// The page interface: everything the game shows outside the play field.
// Owns the elements declared in snaketris.html and keeps their visibility in
// step with `game.screen.state`, the single view authority. Imports only constants.js
// and state.js, so the module graph stays one-way (app -> ui).
import {
  SELECT_ROLE, SELECT_DURATION, SELECT_CONTROL, PLAYING, RECORDS, GAME_OVER, PAIRING,
  FIELD_V_GAP, FIELD_V_GAP_MOBILE, BOARD_W, BOARD_H, UI_STACK_MAX_WIDTH, UI_COLUMN_MIN,
  GAME_CONTROL_PLAYER_MARKERS,
  PAIRING_TITLE, PAIRING_HINTS, PAIRING_LINK_LABEL, PAIRING_CODE_LABEL, PAIRING_WAITING,
  DURATION_SCREEN_ITEMS, ROLE_SCREEN_ITEMS, MIRROR_TITLE, MIRROR_HINTS,
  twoPlayerOffered,
} from './constants.js';
import { game, remainingSeconds } from './state.js';
import { recordLines } from './highscores.js';
import { SCREENS, SCREEN_BY_ID, itemForStep, controlModelAssigned } from './screens.js';
import { lobby, guestPage } from './netplay.js';
import { paintQr } from './qr.js';
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
let pairingTitleEl = null;
let pairingHintsEl = null;
let pairingLinkEl = null;
let pairingCodeEl = null;
let pairingQrEl = null;
let pairingWaitingEl = null;
let mirrorDurationEl = null;
let mirrorRoleEl = null;
let mirrorTitleEl = null;
let mirrorHintsEl = null;

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
  pairingTitleEl = lookup('pairing-title');
  pairingHintsEl = lookup('pairing-hints');
  pairingLinkEl = lookup('pairing-link');
  pairingCodeEl = lookup('pairing-code');
  pairingQrEl = lookup('pairing-qr');
  pairingWaitingEl = lookup('pairing-waiting');
  mirrorDurationEl = lookup('mirror-duration-items');
  mirrorRoleEl = lookup('mirror-role-items');
  mirrorTitleEl = lookup('mirror-title');
  mirrorHintsEl = lookup('mirror-hints');
  statusElsByPlayer.set(1, lookup('control-p1-status'));
  statusElsByPlayer.set(2, lookup('control-p2-status'));
  summaryElsByPlayer.set(1, lookup('summary-line-1'));
  summaryElsByPlayer.set(2, lookup('summary-line-2'));
  iface.indexRows(SCREENS);
  // The engine page pass: each painter runs once per rendered frame, in this
  // order. Registration is name-keyed, so a second initUi cannot paint twice.
  registerPagePainter('views', paintViews);
  registerPagePainter('pairing', paintPairing);
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
  // The "Two Players" entry is offered at every viewport width: the way it
  // takes is chosen after the entry, not by hiding the entry.
  const twoPlayerItem = iface.element('menu-item-two-player');
  if (twoPlayerItem) twoPlayerItem.style.display = '';
  paintHighlights(state);
  paintStageTitle(state, row);
  if (row !== undefined && row.cursor === 'step') paintControlFeedback(row);
  else if (controlErrorEl) controlErrorEl.textContent = '';
}

function paintScore(pctx) {
  if (scoreEl) scoreEl.textContent = scoreText();
}

// The pairing step: the secret this page holds for the other device, in the
// form that device can use it. The link carries the trimmed offer blob in the
// URL fragment, so opening it carries the secret out of band; the QR paints the
// same link for a device that cannot copy text. The waiting line names what the
// other device still has to do. This step paints no play field: its row declares
// none, so the field stays hidden and no match can exist before a peer is paired.
function paintPairing(pctx) {
  if (game.screen.state !== PAIRING) return;
  if (pairingTitleEl) pairingTitleEl.textContent = PAIRING_TITLE;
  show(pairingHintsEl, true);
  if (pairingHintsEl) pairingHintsEl.textContent = PAIRING_HINTS;
  const published = lobby.secret !== '';
  const linkForm = published && lobby.form === 'link';
  show(pairingLinkEl, linkForm);
  if (pairingLinkEl) pairingLinkEl.textContent = linkForm ? lobby.link : '';
  show(pairingQrEl, linkForm);
  if (pairingQrEl && !linkForm) pairingQrEl.width = 0;
  if (linkForm && pairingQrEl) paintQr(pairingQrEl, lobby.link);
  // The short readable code is painted beside the link and the QR in every form,
  // so a device that can neither scan nor open a link still holds a secret it can
  // type on its own page.
  const codeForm = published && lobby.code !== '';
  show(pairingCodeEl, codeForm);
  if (pairingCodeEl) pairingCodeEl.textContent = codeForm ? PAIRING_CODE_LABEL + ': ' + lobby.code : '';
  show(pairingWaitingEl, !lobby.paired || preparationShown());
  if (pairingWaitingEl) pairingWaitingEl.textContent = PAIRING_WAITING;
  paintMirrors();
}

// The guest page's read-only copies of the host page's preparation sub-menus:
// the copies carry no selectable item, and the marker sits where the host page's
// cursor rests. The guest selects nothing of its own.
function paintMirrors() {
  const preparing = preparationShown();
  show(mirrorTitleEl, preparing);
  show(mirrorHintsEl, preparing);
  if (mirrorTitleEl) mirrorTitleEl.textContent = MIRROR_TITLE;
  if (mirrorHintsEl) mirrorHintsEl.textContent = MIRROR_HINTS;
  show(mirrorDurationEl, preparing && lobby.prepScreen === SELECT_DURATION);
  show(mirrorRoleEl, preparing && lobby.prepScreen === SELECT_ROLE);
  if (mirrorDurationEl) paintMirror(mirrorDurationEl, DURATION_SCREEN_ITEMS, lobby.prepIndex);
  if (mirrorRoleEl) paintMirror(mirrorRoleEl, ROLE_SCREEN_ITEMS, lobby.prepIndex);
}

function preparationShown() {
  return guestPage() && (lobby.prepScreen === SELECT_DURATION ||
    lobby.prepScreen === SELECT_ROLE || lobby.prepScreen === SELECT_CONTROL);
}

function paintMirror(list, labels, index) {
  if (!list) return;
  const items = list.querySelectorAll(':scope > li');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    item.textContent = labels[i];
    item.className = i === index ? 'on' : '';
    item.removeAttribute('tabindex');
  }
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
