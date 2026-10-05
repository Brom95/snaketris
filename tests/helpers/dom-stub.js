// Shared DOM stub + seeded RNG for headless node:test specs.
//
// installDomStub() installs globalThis.document/window/performance/
// requestAnimationFrame and returns the handles each spec needs to drive the
// game headlessly. The RNG is a deterministic LCG (seed 20240601, matching the
// old harness), installed as Math.random so every module that randomizes sees
// the same sequence.

let canvas = null;

export function installDomStub() {
  const ctxFake = new Proxy({
    fillRect: () => {}, stroke: () => {}, beginPath: () => {},
    moveTo: () => {}, lineTo: () => {}, fillText: () => {},
  }, {
    set(t, p, v) { if (p in t) return true; t[p] = v; return true; }
  });
  const events = { canvas: {}, document: {}, window: {} };
  canvas = {
    width: 0, height: 0,
    style: { width: '', height: '' },
    classList: { toggle: () => {} },
    getContext: () => ctxFake,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 576, height: 720 }),
    setPointerCapture: () => {},
    addEventListener: (type, fn) => { (events.canvas[type] ??= []).push(fn); }
  };
  const document = {
    getElementById: (id) => (id === 'game' ? canvas : null),
    querySelectorAll: () => [],
    addEventListener: (type, fn) => { (events.document[type] ??= []).push(fn); }
  };
  const performance = { now: () => 0 };
  let rafCb = null;
  const requestAnimationFrame = (cb) => { rafCb = cb; };
  const window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: (type, fn) => { (events.window[type] ??= []).push(fn); }
  };

  // Deterministic LCG seeded 20240601 (matching the old harness).
  let seed = 20240601;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 0x80000000;
    return seed / 0x80000000;
  };

  globalThis.document = document;
  globalThis.window = window;
  globalThis.performance = performance;
  globalThis.requestAnimationFrame = requestAnimationFrame;

  // In-memory localStorage stub (highscores uses it).
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (store[k] ?? null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };

  Math.random = random;

  return { canvas, events, document, window, performance, random, rafCb: () => rafCb };
}
