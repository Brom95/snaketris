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

// Interface (page) element stubs, added for the dom-ui-outside-canvas change:
// input.js queries the menu items and hit-tests the boxes the browser lays out,
// so the stubs hand back fixed rectangles a test can reason about.
let _menuRects = [
  { left: 0, top: 100, right: 120, bottom: 124 },
  { left: 0, top: 132, right: 140, bottom: 156 },
  { left: 0, top: 164, right: 160, bottom: 188 },
];
export function setMenuRects(rects) {
  _menuRects = rects;
}
const _menuItems = _menuRects.map((_, i) => ({
  id: 'menu-item-' + i,
  getBoundingClientRect: () => _menuRects[i],
}));

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
  getElementById: () => ({ width: 0, height: 0, style: {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) }),
  createElement: () => ({ width: 0, height: 0, style: {} }),
  querySelectorAll: (selector) => (selector === '#menu-items > li' ? _menuItems : []),
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
