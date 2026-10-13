// Engine navigation: the intent queue, the cursor over consumer table rows, and the one handler-map lookup.
// The engine owns the queue, the cursor mechanics and the dispatch. The consumer supplies the rows,
// the handlers, the offer predicate and which actions count as leaving for the screen before.
// The engine never reads a page element, a pointer coordinate, a key code or a device.
import { state } from './state.js';

// The intent vocabulary the engine owns. Every other intent verb belongs to the consumer's handler map.
const NAV_UP = 'menuUp';
const NAV_DOWN = 'menuDown';
const NAV_CONFIRM = 'confirm';
const NAV_SELECT = 'select';
const NAV_BACK = 'toMenu';
const NAV_LOCK = 'lockModel';
const NAV_START = 'startGame';

let rowsById = new Map();
let handlers = new Map();
let offerPredicate = null;
let backItemActions = new Set();
let backControlActions = new Set();
let screenField = 'state';

// The consumer registers its screen table, its handler map and the names it uses in its own rows.
// Row keys the engine reads: id, cursor ('arrow' | 'step' | 'none'), selection, stepField,
// lockAction, startAction, items, controls. Item keys the engine reads: id, opens, step, action.
export function registerNavigation(nav) {
  screenField = nav.stateField ?? 'state';
  handlers = new Map();
  for (const action in nav.handlers ?? {}) handlers.set(action, nav.handlers[action]);
  offerPredicate = nav.offers ?? null;
  backItemActions = new Set(nav.backItems ?? []);
  backControlActions = new Set(nav.backControls ?? []);
  rowsById = new Map();
  for (const row of nav.rows ?? []) rowsById.set(row.id, row);
}

function currentScreenId() {
  return state.screen[screenField];
}

function currentRow() {
  return rowsById.get(currentScreenId());
}

// The consumer reports the screen it wants next and the engine writes it into the registered field.
export function gotoScreen(screenId) {
  state.screen[screenField] = screenId;
}

function offers(item) {
  return offerPredicate ? offerPredicate(item) : true;
}

export function itemForStep(screenId, step) {
  const row = rowsById.get(screenId);
  if (!row) return null;
  for (const item of row.items) {
    if (item.step === step) return item;
  }
  return null;
}

export function opensScreen(screenId, index) {
  const row = rowsById.get(screenId);
  if (!row) return null;
  return row.items[index]?.opens ?? null;
}

// The item the current screen shows: the highlighted one for an arrow cursor, the one named by the
// row's own step field for a step cursor, null for a screen with no cursor.
export function currentItem(screenId) {
  const row = rowsById.get(screenId);
  if (!row) return null;
  if (row.cursor === 'arrow') return row.items[state.screen[row.selection]] ?? null;
  if (row.cursor === 'step') return itemForStep(row.id, state.screen[row.stepField]);
  return null;
}

// Run the consumer handler the item asks for. One lookup, no engine branch on an action verb.
function applyAction(item, intent) {
  const handler = handlers.get(item.action);
  if (!handler) return false;
  return handler(item, intent) === true;
}

// Move the arrow cursor one item, wrapping over the item list and skipping items the consumer does
// not offer right now.
function stepCursor(row, step) {
  if (row.cursor !== 'arrow' || row.items.length === 0) return false;
  const n = row.items.length;
  const field = row.selection;
  let index = state.screen[field];
  for (let k = 0; k < n; k++) {
    index = (index + step + n) % n;
    if (!offers(row.items[index])) continue;
    state.screen[field] = index;
    return true;
  }
  return false;
}

// A pointer, key or pad named one item of the current screen by its page id. The selection is
// written first and restored when the handler refuses, so a rejected intent leaves navigation state
// untouched.
function selectById(row, id, intent) {
  for (let i = 0; i < row.items.length; i++) {
    if (row.items[i].id !== id) continue;
    const field = row.selection;
    const previous = field ? state.screen[field] : null;
    if (field) state.screen[field] = i;
    if (!applyAction(row.items[i], intent)) {
      if (field) state.screen[field] = previous;
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

// The first item or control that leaves for the screen before this one, if this screen has one.
function applyBack(row, intent) {
  for (const item of row.items) {
    if (backItemActions.has(item.action)) return applyAction(item, intent);
  }
  for (const control of row.controls) {
    if (backControlActions.has(control.action)) return applyAction(control, intent);
  }
  return false;
}

// A layout key locks the model of the player whose step is on screen, and only when the row names
// the action the lock drives.
function applyLock(row, intent) {
  if (row.cursor !== 'step' || !intent.model) return false;
  const item = itemForStep(row.id, state.screen[row.stepField]);
  if (!item || item.action !== row.lockAction) return false;
  return applyAction(item, intent);
}

// The start key: the row names the action it runs. When an item carries that action the row's item
// runs; otherwise the action runs with no item.
function applyStart(row, intent) {
  for (const item of row.items) {
    if (item.action === row.startAction) return applyAction(item, intent);
  }
  const handler = handlers.get(row.startAction);
  if (!handler) return false;
  return handler(null, intent) === true;
}

// Apply one navigation intent against the current screen's table entry. An intent the current
// screen has no item for is rejected and changes nothing.
function applyIntent(intent) {
  const row = currentRow();
  if (!row) return false;
  switch (intent.action) {
    case NAV_UP:
    case NAV_DOWN:
      return stepCursor(row, intent.action === NAV_UP ? -1 : 1);
    case NAV_CONFIRM: {
      const item = currentItem(row.id);
      return item !== null && applyAction(item, intent);
    }
    case NAV_SELECT:
      return selectById(row, intent.id, intent);
    case NAV_BACK:
      return applyBack(row, intent);
    case NAV_LOCK:
      return applyLock(row, intent);
    case NAV_START:
      return applyStart(row, intent);
    default:
      return false;
  }
}

const intentQueue = [];

export function pushIntent(intent) {
  if (intent) intentQueue.push(intent);
}

// Empty the queue and apply every intent in the order the devices produced it.
export function drainIntents() {
  while (intentQueue.length > 0) applyIntent(intentQueue.shift());
}

// The screen navigation as an engine system: it drains the intent queue at the start of its update,
// before any consumer system reads navigation state.
export const screenSystem = {
  name: 'screen',
  init(ctx) {
    intentQueue.length = 0;
  },
  update(ctx) {
    drainIntents();
  },
};
