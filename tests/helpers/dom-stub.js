// Shared DOM stub + seeded RNG for headless node:test specs.
//
// installDomStub() installs globalThis.document/window/performance/
// requestAnimationFrame and returns the handles each spec needs to drive the
// game headlessly. The RNG is a deterministic LCG (seed 20240601, matching the
// old harness), installed as Math.random so every module that randomizes sees
// the same sequence.

let canvas = null;

// Minimal element: enough for ui.js (textContent, class toggle, appendChild)
// and for input.js hit-testing (getBoundingClientRect).
function makeEl(id, rect = { left: 0, top: 0, width: 320, height: 24 }) {
  const children = [];
  const classes = new Set();
  return {
    id,
    textContent: '',
    children,
    style: {},
    classList: {
      toggle: (name, on) => { if (on) classes.add(name); else classes.delete(name); },
      has: (name) => classes.has(name),
    },
    classes,
    appendChild: (el) => { children.push(el); },
    getBoundingClientRect: () => rect,
  };
}

// In-memory localStorage stub (highscores uses it).
function installLocalStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (store[k] ?? null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
}

// Gamepad stub: js/devices.js polls navigator.getGamepads(). Node defines
// `navigator` as a getter-only global, so it must be replaced with
// defineProperty rather than assigned.
function installGamepadStub() {
  const gamepads = [];
  Object.defineProperty(globalThis, 'navigator', {
    value: { getGamepads: () => gamepads },
    configurable: true,
  });
  return gamepads;
}

// Deterministic LCG seeded 20240601 (matching the old harness).
function seededRandom() {
  let seed = 20240601;
  return () => {
    seed = (seed * 1103515245 + 12345) % 0x80000000;
    return seed / 0x80000000;
  };
}

export function installDomStub() {
  const ctxFake = new Proxy({
    fillRect: () => {}, stroke: () => {}, beginPath: () => {},
    moveTo: () => {}, lineTo: () => {}, fillText: () => {},
  }, {
    set(t, p, v) { if (p in t) return true; t[p] = v; return true; }
  });
  const events = { canvas: {}, document: {}, window: {} };
  // The field is shown/hidden through the same `.view`/`.view.on` classes as
  // the interface elements, so it needs the same class tracking.
  canvas = makeEl('game', { left: 0, top: 0, width: 576, height: 720 });
  canvas.width = 0;
  canvas.height = 0;
  canvas.getContext = () => ctxFake;
  canvas.setPointerCapture = () => {};
  canvas.addEventListener = (type, fn) => { (events.canvas[type] ??= []).push(fn); };

  // Interface elements declared in snaketris.html, keyed by id.
  const elements = {
    game: canvas,
    ui: makeEl('ui'),
    score: makeEl('score'),
    status: makeEl('status'),
    'menu-view': makeEl('menu-view'),
    'role-view': makeEl('role-view'),
    'role-back': makeEl('role-back', { left: 0, top: 60, width: 320, height: 24 }),
    'records-view': makeEl('records-view'),
    'help-view': makeEl('help-view'),
    'records-list': makeEl('records-list'),
    'records-empty': makeEl('records-empty'),
    'menu-items': makeEl('menu-items'),
    'role-items': makeEl('role-items'),
  };
  const menuItems = [makeEl('menu-item-play'), makeEl('menu-item-records'), makeEl('menu-item-help')];
  const roleItems = [makeEl('role-item-snake'), makeEl('role-item-tetris')];

  const document = {
    getElementById: (id) => elements[id] ?? null,
    querySelectorAll: (selector) => {
      if (selector === '#menu-items > li') return menuItems;
      if (selector === '#role-items > li') return roleItems;
      return [];
    },
    createElement: (tag) => makeEl(tag),
    addEventListener: (type, fn) => { (events.document[type] ??= []).push(fn); }
  };
  const performance = { now: () => 0 };
  const window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: (type, fn) => { (events.window[type] ??= []).push(fn); }
  };
  let rafCb = null;

  globalThis.document = document;
  globalThis.window = window;
  globalThis.performance = performance;
  globalThis.requestAnimationFrame = (cb) => { rafCb = cb; };
  installLocalStorage();
  const gamepads = installGamepadStub();
  const random = seededRandom();
  Math.random = random;

  return {
    canvas, events, document, window, performance, random,
    elements, menuItems, roleItems, gamepads,
    rafCb: () => rafCb
  };
}

// A Gamepad API-shaped pad: 16 buttons, two axes.
export function makePad(pressed = [], axes = [0, 0]) {
  const buttons = [];
  for (let i = 0; i < 16; i++) buttons.push({ pressed: pressed.includes(i) });
  return { buttons, axes };
}
