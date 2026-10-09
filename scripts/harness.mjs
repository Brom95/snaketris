// scripts/harness.mjs
// Shared test harness for every headless check in scripts/.
//
// Two kinds of check exist, and both need the same plumbing:
//   1. Stubbed-DOM checks. js/ modules run in Node against a fake browser
//      environment built by stubDom().
//   2. Real-page checks. Chromium drives the actual page. servePage() serves
//      the repo over http://duel.test/ so ES module imports resolve without a
//      local server.
//
// Run all checks: node scripts/verify-all.mjs
//
// Playwright gotchas that every helper here encodes:
//   - page.waitForFunction does not await an async predicate. A returned
//     Promise is truthy, so every predicate passed here is synchronous.
//   - Playwright serializes a predicate into the page, so Node-side variables
//     are not visible inside it. Values must be passed as the second argument.
//   - The view classes are applied on the next rendered frame. page.isVisible
//     reads the DOM at one instant and does not wait, so visibility checks go
//     through shown().
//   - Pages in one browser context share storage. One context per run keeps the
//     high-score board written by one game visible to the next page.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { COLS, ROWS } from '../js/constants.js';

export const BASE = 'http://duel.test/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

let failures = 0;
const DEBUG = process.env.DUEL_DEBUG === '1';

// ---------- Reporting ----------

export function check(cond, msg) {
  if (cond) {
    console.log('\x1b[32m\u2713\x1b[0m ' + msg);
    return true;
  }
  failures++;
  console.log('\x1b[31m\u2717 FAIL: \x1b[0m' + msg);
  return false;
}

export function failureCount() {
  return failures;
}

// Print the summary of one script and set the process exit code.
export function report(name, extra = 0) {
  const total = failures + extra;
  console.log('');
  if (total === 0) console.log(name + ' passed.');
  else console.log(name + ' FAILED: ' + total + ' assertion(s).');
  process.exitCode = total === 0 ? 0 : 1;
  return total;
}

// Stage dump, only when DUEL_DEBUG=1.
export function dump(label, value) {
  if (DEBUG) console.log('  [debug] ' + label + ': ' + JSON.stringify(value));
}

// ---------- Stubbed browser environment ----------

// One rich DOM: classList, textContent, children, inline style and a box.
// Class, child and text state live in maps keyed by id, so every handle for one
// id agrees, exactly as a real document would.
export function stubDom({
  elements = [],
  rects = {},
  lists = {},
  window: win = {},
  storage = null,
  gamepads = [],
  canvas = null,
} = {}) {
  const classState = new Map();
  const childState = new Map();
  const textState = new Map();
  const styleState = new Map();
  const listeners = {
    document: new Map(),
    window: new Map(),
    canvas: new Map(),
  };
  let created = 0;

  function memo(map, id, seed) {
    if (!map.has(id)) map.set(id, seed());
    return map.get(id);
  }

  function box(id) {
    const r = rects[id];
    if (r) return r;
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }

  function el(id) {
    const classes = memo(classState, id, () => new Set());
    const node = {
      id,
      style: memo(styleState, id, () => ({})),
      classList: {
        toggle: (name, on) => {
          if (on === false) classes.delete(name);
          else if (on === true) classes.add(name);
          else if (classes.has(name)) classes.delete(name);
          else classes.add(name);
        },
        contains: (name) => classes.has(name),
      },
      appendChild: (child) => {
        memo(childState, id, () => []).push(child);
      },
      getBoundingClientRect: () => box(id),
    };
    // Assigning textContent replaces the children, as the browser does.
    Object.defineProperty(node, 'textContent', {
      get: () => textState.get(id) || '',
      set: (v) => {
        textState.set(id, v);
        childState.delete(id);
      },
    });
    return node;
  }

  function count(map, type) {
    map.set(type, (map.get(type) || 0) + 1);
  }

  const ids = [...elements, ...Object.keys(rects)];
  for (const list of Object.values(lists)) ids.push(...list);

  globalThis.document = {
    getElementById: (id) => el(id),
    querySelectorAll: (selector) => (lists[selector] || []).map(el),
    createElement: (tag) => el('created-' + ++created),
    addEventListener: (type) => count(listeners.document, type),
    removeEventListener: () => {},
  };

  globalThis.window = {
    innerWidth: win.innerWidth ?? 1280,
    innerHeight: win.innerHeight ?? 800,
    addEventListener: (type) => count(listeners.window, type),
    removeEventListener: () => {},
  };

  // Node exposes navigator and localStorage as non-writable getters, so both
  // must be redefined rather than assigned.
  const pads = [...gamepads];
  Object.defineProperty(globalThis, 'navigator', {
    value: { getGamepads: () => pads },
    configurable: true,
  });
  if (storage !== null) {
    const store = storage instanceof Map ? storage : new Map(Object.entries(storage));
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => {
          store.set(key, value);
        },
      },
    });
  }

  const field = canvas ?? makeCanvas({ width: 240, height: 480 });
  if (canvas) canvas.addEventListener = (type) => count(listeners.canvas, type);

  return {
    el,
    children: (id) => memo(childState, id, () => []),
    classes: (id) => memo(classState, id, () => new Set()),
    styles: (id) => memo(styleState, id, () => ({})),
    listeners,
    setRect: (id, rect) => {
      rects[id] = rect;
    },
    setViewport: (w, h) => {
      globalThis.window.innerWidth = w;
      globalThis.window.innerHeight = h;
    },
    setGamepads: (next) => {
      pads.length = 0;
      pads.push(...next);
    },
    canvas: field,
  };
}

// A gamepad with 16 buttons and two axes, the shape the Gamepad API reports.
export function makePad(pressed = [], axes = [0, 0]) {
  const buttons = [];
  for (let i = 0; i < 16; i++) {
    const on = pressed.includes(i);
    buttons.push({ pressed: on, value: on ? 1 : 0 });
  }
  return { id: 'stub-pad', buttons, axes };
}

// A canvas element stub. Pass a context to record the drawing calls.
export function makeCanvas(rect = { left: 0, top: 0, width: 240, height: 480 }, ctx = null) {
  const box = { ...rect };
  return {
    width: rect.width,
    height: rect.height,
    style: {},
    getContext: () => ctx ?? null,
    getBoundingClientRect: () => box,
    setPointerCapture: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// ---------- Real-page helpers ----------

// Serve the repo over HTTP so ES modules resolve; no local server is needed.
export async function servePage(page, rootDir) {
  await page.route(BASE + '**', (route) => {
    const file = path.join(rootDir, decodeURIComponent(route.request().url().slice(BASE.length)));
    try {
      return route.fulfill({
        status: 200,
        contentType: TYPES[path.extname(file)] ?? 'application/octet-stream',
        body: readFileSync(file),
      });
    } catch {
      return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    }
  });
}

// Publish the live game object on the page so predicates can read it without an
// await. `game` is mutated in place, so the reference stays valid.
export async function exposeGame(page) {
  await page.evaluate(async () => {
    window.__game = (await import('/js/state.js')).game;
  });
}

// waitForFunction that reports instead of throwing. `arg` is handed to the
// predicate so it can use a Node-side value.
export async function waitFor(page, predicate, arg, timeout = 10000) {
  try {
    await page.waitForFunction(predicate, arg, { timeout });
    return true;
  } catch {
    return false;
  }
}

export function stateIs(page, state, timeout = 5000) {
  return waitFor(page, (wanted) => window.__game.state === wanted, state, timeout);
}

// A view class is applied on the next rendered frame, so visibility is checked
// by waiting for the settled state and then reading the DOM.
export async function shown(page, selector, want, timeout = 3000) {
  const settled = await waitFor(page, (probe) => {
    const el = document.querySelector(probe.sel);
    return Boolean(el) && el.checkVisibility() === probe.want;
  }, { sel: selector, want }, timeout);
  return settled && (await page.isVisible(selector)) === want;
}

// Read the live game state from the page.
export async function snapshot(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const piece = g.pieces[0];
    return {
      tick: g.tick,
      state: g.state,
      role: g.role,
      snakeScore: g.snakeScore,
      tetrisScore: g.tetrisScore,
      overflow: g.overflow,
      head: g.snake[0],
      length: g.snake.length,
      landed: g.landedBlocks,
      moveAcc: g.pieceMoveAcc,
      piece: piece ? { col: piece.col, row: piece.row, shape: piece.shape.map((s) => s.join(',')) } : null,
    };
  });
}

// Fresh page sitting at the starting menu. All pages share one context so the
// high-score board written by one game is visible to the next page.
export async function freshPage(context, rootDir) {
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('  \u2717 page error: ' + err.message));
  await servePage(page, rootDir);
  await page.goto(BASE + 'snaketris.html');
  await exposeGame(page);
  await stateIs(page, 'MENU', 10000);
  return page;
}

// Nearest solid cell from the snake head, on the wrap-around board.
export async function nearestSolid(page) {
  return page.evaluate(async () => {
    const g = window.__game;
    const { getCell } = await import('/js/grid.js');
    const { COLS, ROWS, SOLID } = await import('/js/constants.js');
    const head = g.snake[0];
    let best = null;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (getCell(r, c) !== SOLID) continue;
        const dr = Math.abs(head.r - r);
        const dc = Math.abs(head.c - c);
        const d = Math.min(dr, ROWS - dr) + Math.min(dc, COLS - dc);
        if (d === 0) continue;
        if (!best || d < best.d) best = { d, r, c };
      }
    }
    return best;
  });
}

// Wrap-aware key that moves the head one step toward the target cell.
export function steerKey(head, target) {
  const dr = target.r - head.r;
  const dc = target.c - head.c;
  const vert = Math.min(Math.abs(dr), ROWS - Math.abs(dr));
  const horiz = Math.min(Math.abs(dc), COLS - Math.abs(dc));
  const down = dr > 0 && dr <= ROWS / 2;
  const right = dc > 0 && dc <= COLS / 2;
  if (vert === 0) return right ? 'ArrowRight' : 'ArrowLeft';
  if (horiz === 0) return down ? 'ArrowDown' : 'ArrowUp';
  return vert <= horiz ? (down ? 'ArrowDown' : 'ArrowUp') : (right ? 'ArrowRight' : 'ArrowLeft');
}

// Steer the snake into the nearest solid block until the game ends. Valid only
// while the player controls the snake.
export async function steerIntoBlock(page, maxSteps = 80) {
  for (let i = 0; i < maxSteps; i++) {
    if (await stateIs(page, 'GAME_OVER', 200)) return true;
    const target = await nearestSolid(page);
    if (!target) return false;
    await page.keyboard.press(steerKey((await snapshot(page)).head, target));
    await page.waitForTimeout(120);
  }
  return stateIs(page, 'GAME_OVER', 20000);
}

// Tap the exact centre of the field and check that the falling piece rotates.
// A rotation blocked by a wall or a block leaves the shape unchanged, so the
// tap is repeated until a piece can turn.
export async function centreTapRotates(page) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const before = await snapshot(page);
    if (before.state !== 'PLAYING' || !before.piece) return false;
    await page.click('#game');
    const after = await snapshot(page);
    if (after.piece && after.piece.shape.join('|') !== before.piece.shape.join('|')) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

// Open the role sub-menu and start one game in the given role.
export async function playRole(context, role, rootDir) {
  const page = await freshPage(context, rootDir);
  await page.click('#menu-item-play');
  await stateIs(page, 'SELECT_ROLE');
  await page.click('#role-item-' + role);
  const ok = await waitFor(page, (wanted) => {
    const g = window.__game;
    return g.state === 'PLAYING' && g.role === wanted;
  }, role, 5000);
  if (!ok) console.log('  (state after the role click: ' + JSON.stringify(await snapshot(page)) + ')');
  return { page, ok };
}

// Item boxes of one list, with the marker opacity and the font.
export async function itemBoxes(page, selector) {
  return page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).map((elem) => {
    const rect = elem.getBoundingClientRect();
    const style = getComputedStyle(elem);
    return {
      width: Math.round(rect.width),
      left: Math.round(rect.left),
      font: style.fontSize,
      weight: style.fontWeight,
      marker: getComputedStyle(elem, '::before').opacity,
    };
  }), selector);
}

// Capture the item boxes at every selection index of one list.
export async function boxesAtEverySelection(page, selector, count, stepKey) {
  const sets = [];
  for (let i = 0; i < count; i++) {
    await waitFor(page, (wanted) => window.__game.menuSelect === wanted || window.__game.roleSelect === wanted, i, 3000);
    // The highlight class is applied on the next rendered frame.
    await page.waitForTimeout(120);
    sets.push(await itemBoxes(page, selector));
    await page.keyboard.press(stepKey);
  }
  return sets;
}

// True when one key has the same value in every captured set.
export function stable(sets, key) {
  const values = new Set();
  for (const set of sets) for (const box of set) values.add(box[key]);
  return values.size === 1;
}
