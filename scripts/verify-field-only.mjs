// scripts/verify-field-only.mjs
// Headless verification for the "Field-only canvas and independent scaling"
// group (tasks 5.1-5.3 of the dom-ui-outside-canvas change).
//
//   5.1  render() paints nothing but the field, in every game state
//   5.2  fitCanvas() keeps the plain contain-fit rule scoped to the canvas;
//        toLogical() still resolves through getBoundingClientRect(); tap and
//        swipe steering still queue a direction through the no-reverse rule
//   5.3  field and interface scale by separate rules at a wide desktop
//        viewport and at a phone viewport (where the stacked interface band
//        is subtracted from the height the field may use)
//
// Run: node scripts/verify-field-only.mjs

// Imported first so the browser globals exist before js/input.js (and its
// transitive imports) evaluate.
import { docListeners } from './controller-stubs.mjs';

import { COLS, ROWS, CELL, SOLID, COLORS, BOARD_W, BOARD_H, FIELD_V_GAP, UI_COLUMN_MIN, UI_STACK_MAX_WIDTH, MENU, PLAYING, GAME_OVER, RECORDS, HELP } from '../js/constants.js';
import { initRender, render } from '../js/render.js';
import { initGrid, setCell, getGrid } from '../js/grid.js';
import { game, resetGame } from '../js/state.js';
import { initInput, fitCanvas, toLogical, onPointerDown, onPointerMove, onPointerUp } from '../js/input.js';
import { initUi, interfaceBandHeight } from '../js/ui.js';
import { readFileSync } from 'node:fs';

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('\x1b[32m✓\x1b[0m ' + msg);
  else {
    failures++;
    console.log('\x1b[31m✗ FAIL: \x1b[0m' + msg);
  }
}
function near(a, b) {
  return Math.abs(a - b) < 1e-6;
}

// ---------- A recording 2d context: every canvas call becomes evidence ------
const calls = []; // [method, ...args]
const painted = []; // [styleProperty, value]
const ctxTarget = {
  fillStyle: '', strokeStyle: '', lineWidth: 0,
  fillRect: (...a) => calls.push(['fillRect', ...a]),
  clearRect: (...a) => calls.push(['clearRect', ...a]),
  beginPath: () => calls.push(['beginPath']),
  closePath: () => calls.push(['closePath']),
  moveTo: (...a) => calls.push(['moveTo', ...a]),
  lineTo: (...a) => calls.push(['lineTo', ...a]),
  stroke: () => calls.push(['stroke']),
  fill: () => calls.push(['fill']),
  arc: (...a) => calls.push(['arc', ...a]),
  save: () => calls.push(['save']),
  restore: () => calls.push(['restore']),
  translate: (...a) => calls.push(['translate', ...a]),
  fillText: (...a) => calls.push(['fillText', ...a]),
  strokeText: (...a) => calls.push(['strokeText', ...a]),
  measureText: (...a) => {
    calls.push(['measureText', ...a]);
    return { width: 0 };
  },
  drawImage: (...a) => calls.push(['drawImage', ...a]),
  createLinearGradient: (...a) => calls.push(['createLinearGradient', ...a]),
};
const ctx = new Proxy(ctxTarget, {
  set: (t, k, v) => {
    if (k === 'fillStyle' || k === 'strokeStyle') painted.push([k, v]);
    return true;
  },
});

const FIELD_METHODS = new Set(['fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke']);
const TEXT_METHODS = new Set(['fillText', 'strokeText', 'measureText', 'drawImage']);
const FIELD_COLORS = new Set([COLORS.bg, COLORS.grid, COLORS.solid, COLORS.edible, COLORS.snake, COLORS.snakeHead]);

const canvasRect = { left: 0, top: 0, width: BOARD_W, height: BOARD_H };
const canvas = {
  width: BOARD_W,
  height: BOARD_H,
  style: {},
  getContext: (kind) => ctx,
  getBoundingClientRect: () => canvasRect,
  setPointerCapture: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

// ---------- Interface page elements, sized by the page's own rule -----------
const UI_BOX_HEIGHT = 150; // the tallest interface view at a phone viewport
function makeEl(id, height) {
  return { id, height, getBoundingClientRect: () => ({ left: 0, top: 0, width: UI_COLUMN_MIN, height }) };
}
const registry = {};
for (const id of ['ui', 'score', 'status', 'menu-view', 'records-view', 'help-view', 'records-list', 'records-empty']) {
  registry[id] = makeEl(id, id === 'ui' ? UI_BOX_HEIGHT : 0);
}
const menuItems = [makeEl('menu-item-play', 24), makeEl('menu-item-records', 24), makeEl('menu-item-help', 24)];

globalThis.document = {
  getElementById: (id) => registry[id],
  querySelectorAll: (selector) => (selector === '#menu-items > li' ? menuItems : []),
  createElement: (tag) => ({ tag, textContent: '', appendChild: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) }),
  addEventListener: (type) => {
    docListeners.set(type, (docListeners.get(type) || 0) + 1);
  },
};

initUi();
initRender(canvas);
initInput(canvas);
check(docListeners.get('pointerup') === 1, 'the interface pointer listener is registered once on the document');

// ---------- 5.1 The canvas draws nothing but the field in every state -------
initGrid();
resetGame();
setCell(ROWS - 1, 0, SOLID);
setCell(ROWS - 1, 1, SOLID);
setCell(ROWS - 2, 0, SOLID);
game.pieces = [{ shape: [[0, 0], [0, 1], [1, 0], [1, 1]], col: 3, row: 5 }];

const renderSrc = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
check(!/fillText|measureText|strokeText|drawImage/.test(renderSrc), 'render.js has no text or image drawing left anywhere');
check(!/drawMenu|drawRecords|drawHelp|drawOverlay|overlayBackground|drawText|drawOctocat/.test(renderSrc), 'no canvas view helper survives in render.js');
check(!/MENU_ITEMS|MENU_ITEM_Y|MENU_ITEM_HIT_H/.test(renderSrc), 'render.js no longer imports the menu layout constants');

for (const state of [MENU, PLAYING, RECORDS, HELP, GAME_OVER]) {
  game.state = state;
  calls.length = 0;
  painted.length = 0;
  render();

  const names = calls.map((c) => c[0]);
  check(names.every((n) => FIELD_METHODS.has(n)), 'in ' + state + ' the canvas only fills cells and strokes the grid');
  check(!names.some((n) => TEXT_METHODS.has(n)), 'in ' + state + ' the canvas draws no text, overlay or icon');
  check(painted.every((p) => FIELD_COLORS.has(p[1])), 'in ' + state + ' only field palette colours are used');

  const solids = getGrid().flat().filter((v) => v === SOLID).length;
  const pieceCells = game.pieces.reduce((n, p) => n + p.shape.length, 0);
  const rects = names.filter((n) => n === 'fillRect').length;
  check(rects === 1 + solids + pieceCells + game.snake.length,
    'in ' + state + ' the painted cells are exactly background + ' + solids + ' solid + ' + pieceCells + ' falling + ' + game.snake.length + ' snake');
}

// ---------- 5.2 fitCanvas keeps the contain-fit rule on the canvas alone ----
function canvasSize() {
  return { w: parseFloat(canvas.style.width), h: parseFloat(canvas.style.height) };
}

globalThis.window.innerWidth = 1920;
globalThis.window.innerHeight = 1080;
fitCanvas(0);
const desktop = canvasSize();
check(near(desktop.h, 1080 - 2 * FIELD_V_GAP) && near(desktop.w, BOARD_W * ((1080 - 2 * FIELD_V_GAP) / BOARD_H)),
  'a wide desktop grows the field by height (' + desktop.w + 'x' + desktop.h + ')');
check(near(desktop.w / desktop.h, BOARD_W / BOARD_H), 'the desktop field keeps the board aspect ratio');
check(near(1080 - desktop.h, 2 * FIELD_V_GAP), 'the desktop field keeps exactly the FIELD_V_GAP inset top and bottom');

globalThis.window.innerWidth = 390;
globalThis.window.innerHeight = 844;
fitCanvas(0);
const phoneUnreserved = canvasSize();
check(near(phoneUnreserved.h, 844 - 2 * FIELD_V_GAP), 'the phone field without a reservation would fill the height (' + phoneUnreserved.w + 'x' + phoneUnreserved.h + ')');
check(844 - phoneUnreserved.h < 2 * FIELD_V_GAP + UI_BOX_HEIGHT, 'that leaves less than the interface needs, hence the reservation');

// ---------- toLogical still resolves through getBoundingClientRect ----------
canvasRect.left = 100;
canvasRect.top = 50;
canvasRect.width = 492;
canvasRect.height = 984;
const centre = toLogical(100 + 246, 50 + 492);
check(near(centre.x, BOARD_W / 2) && near(centre.y, BOARD_H / 2), 'the centre of the displayed box maps to the centre of the board');
const corner = toLogical(100, 50);
check(near(corner.x, 0) && near(corner.y, 0), 'the top-left of the displayed box maps to the top-left of the board');
canvasRect.left = 0;
canvasRect.top = 0;
canvasRect.width = BOARD_W;
canvasRect.height = BOARD_H;

// ---------- tap and swipe steering still queue through the no-reverse rule --
game.state = PLAYING;
game.dir = { r: 0, c: 1 };
game.nextDir = { r: 0, c: 1 };

onPointerDown({ pointerId: 1, clientX: 120, clientY: 240 });
onPointerMove({ pointerId: 1, clientX: 120, clientY: 100 });
onPointerUp({ pointerId: 1, clientX: 120, clientY: 100 });
check(game.nextDir.r === -1 && game.nextDir.c === 0, 'an upward swipe queues the upward direction');

game.dir = { r: 0, c: 1 };
game.nextDir = { r: 0, c: 1 };
onPointerDown({ pointerId: 2, clientX: 200, clientY: 240 });
onPointerUp({ pointerId: 2, clientX: 40, clientY: 240 });
check(game.nextDir.r === 0 && game.nextDir.c === 1, 'a leftward swipe against a rightward heading is refused by the no-reverse rule');

game.dir = { r: 0, c: 1 };
onPointerDown({ pointerId: 3, clientX: 40, clientY: 100 });
onPointerUp({ pointerId: 3, clientX: 42, clientY: 102 });
check(game.nextDir.r === -1 && game.nextDir.c === 0, 'a tap above the centre queues the upward direction');

game.state = MENU;
onPointerDown({ pointerId: 4, clientX: 120, clientY: 240 });
onPointerUp({ pointerId: 4, clientX: 120, clientY: 100 });
check(game.nextDir.r === -1 && game.nextDir.c === 0, 'outside PLAYING a board gesture queues nothing new');

// ---------- 5.3 Field and interface scale by separate rules -----------------
globalThis.window.innerWidth = 1920;
globalThis.window.innerHeight = 1080;
check(interfaceBandHeight() === 0, 'a 1920 px viewport keeps the interface beside the field and reserves no height');
fitCanvas(interfaceBandHeight());
const wide = canvasSize();
check(near(wide.w, 492) && near(wide.h, 984), 'the desktop field is 492x984');
check(1920 - wide.w >= UI_COLUMN_MIN + FIELD_V_GAP, 'the ' + (1920 - wide.w) + ' px beside the field hold the ' + UI_COLUMN_MIN + ' px interface column');

globalThis.window.innerWidth = 390;
globalThis.window.innerHeight = 844;
const band = interfaceBandHeight();
check(band > 0, 'a 390 px viewport stacks the interface above the field and takes a band from the field height');
check(near(band, UI_BOX_HEIGHT + FIELD_V_GAP), 'the stacked interface band is its box height plus the gap around the field (' + band + ' px)');
fitCanvas(band);
const phone = canvasSize();
check(near(phone.w, 275) && near(phone.h, 550), 'the phone field gives up that band and becomes 275x550');
check(band + phone.h + 2 * FIELD_V_GAP <= 844 + 1e-6, 'field plus interface band plus insets fit 844 px, so the page does not scroll');
check(phone.h < 844 - 2 * FIELD_V_GAP, 'the phone field is smaller than the unreserved contain-fit, which is the deviation this change records');

check(near(wide.h, 984) && near(phone.h, 550), 'the field size follows the viewport while the interface column stays ' + UI_COLUMN_MIN + ' px at both');

console.log(failures === 0 ? 'field-only check passed.' : 'field-only check failed: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
