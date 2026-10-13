// Engine state skeleton: the two containers every system shares.
// The engine declares the shape — two containers, one tick slot inside the
// gameplay container — and nothing else. A consumer registers [name, initial]
// tables for each container and an optional hook that runs after the gameplay
// container is refilled. This file names no field of its own beyond the two
// container names and the tick slot.
//
// The root is exported once and mutated in place. Every consumer imports this
// same binding, so a reset never leaves a stale reference behind.
export const state = { play: {}, screen: {} };

let playTable = [];
let screenTable = [];
let afterReset = null;

// Register the field tables: configureState({ play: [[name, initial], ...],
// screen: [[name, initial], ...], afterReset: fn }). The containers are filled
// immediately, so the root is usable before the first reset; the hook runs
// only on a reset, because it rebuilds what a table cannot express.
export function configureState(tables) {
  playTable = tables.play ?? [];
  screenTable = tables.screen ?? [];
  afterReset = tables.afterReset ?? null;
  fill(state.play, playTable);
  fill(state.screen, screenTable);
}

// A shallow copy keeps each mutable initial off the table, so two resets never
// share an object or an array.
function clone(value) {
  if (Array.isArray(value)) return value.slice();
  if (typeof value === 'object' && value !== null) return Object.assign({}, value);
  return value;
}

function fill(container, table) {
  for (const entry of table) container[entry[0]] = clone(entry[1]);
}

// A reset leaves exactly the registered fields behind, so a container can never
// carry a field a previous configuration wrote.
function clear(container) {
  for (const key of Object.keys(container)) delete container[key];
}

export function resetScreen() {
  clear(state.screen);
  fill(state.screen, screenTable);
}

export function resetPlay() {
  clear(state.play);
  fill(state.play, playTable);
  if (afterReset) afterReset();
}

export function resetState() {
  resetPlay();
  resetScreen();
}
