// scripts/controller-stubs.mjs
// Headless browser-environment stubs. This module MUST be imported first by
// verify-controller-input.mjs so the globals exist before js/input.js (and its
// transitive imports: state.js -> highscores.js) evaluates.
//
// Node 26 has `navigator` (a configurable getter, no getGamepads) and an
// experimental `localStorage` getter, but no `window` or `document`. We
// override navigator/localStorage via Object.defineProperty (plain assignment
// is silently ignored for non-writable getters) and assign window/document
// directly.

const _pads = []; // mutable array of stub gamepad objects
export function setGamepads(pads) {
  _pads.length = 0;
  for (const p of pads) _pads.push(p);
}

// In-memory localStorage mock (only accessed lazily inside highscores.js).
const _storage = new Map();
const ls = {
  getItem: (k) => (_storage.has(k) ? _storage.get(k) : null),
  setItem: (k, v) => { _storage.set(k, String(v)); },
  removeItem: (k) => { _storage.delete(k); },
  clear: () => { _storage.clear(); },
  length: 0,
  key: () => null,
};

// window + document + canvas: addEventListener spies.
export const windowListeners = new Map(); // event name -> count
export const docListeners = new Map();
export const canvasListeners = new Map();

globalThis.window = {
  addEventListener: (type) => {
    windowListeners.set(type, (windowListeners.get(type) || 0) + 1);
  },
  removeEventListener: () => {},
};
globalThis.document = {
  addEventListener: (type) => {
    docListeners.set(type, (docListeners.get(type) || 0) + 1);
  },
  getElementById: () => ({ width: 0, height: 0, style: {} }),
  createElement: () => ({ width: 0, height: 0, style: {} }),
};

// Gamepad API: getGamepads() returns the current mutable array.
const nav = { getGamepads: () => _pads };

// Stubs that can be recreated per test (canvas elements).
export function makeCanvas() {
  return {
    style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 240, height: 480 }),
    setPointerCapture: () => {},
    addEventListener: (type) => {
      canvasListeners.set(type, (canvasListeners.get(type) || 0) + 1);
    },
    removeEventListener: () => {},
  };
}

Object.defineProperty(globalThis, 'navigator', {
  value: nav,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: ls,
  writable: true,
  configurable: true,
});
