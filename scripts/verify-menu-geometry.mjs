// Headless check for the start menu as PAGE elements
// (change: left-align-menu-labels, re-hosted by dom-ui-outside-canvas).
//
// The menu used to be painted inside the canvas, so this script modelled
// drawMenu()'s measureText() geometry. The menu is now page markup, so there is
// no canvas text measurement left to model: the assertions are DOM assertions
// (a title, three selectable items, the highlight following game.menuSelect)
// plus the keyboard cycle, which must keep performing exactly one menu action
// per press.
//
// Run: node scripts/verify-menu-geometry.mjs

import { MENU_ITEMS, MENU, RECORDS, HELP, PLAYING } from '../js/constants.js';
import { game, toMenu, startGame } from '../js/state.js';
import { initInput, onKey } from '../js/input.js';
import { initUi, syncViews } from '../js/ui.js';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');

// ---------- Static page assertions ----------

const titleOk = /<h1 id="menu-title">[^<]*snaketris/i.test(page);
const listOk = /<ul id="menu-items">/.test(page);

// The three items, in document order, with their labels and tabindex attribute.
const itemTagRe = /<li id="(menu-item-[a-z]+)"([^>]*)>([^<]*)<\/li>/g;
const items = [];
let m;
while ((m = itemTagRe.exec(page)) !== null) {
  items.push({ id: m[1], attrs: m[2], label: m[3] });
}
const labelsMatch =
  items.length === MENU_ITEMS.length &&
  items.every((it, i) => it.label === MENU_ITEMS[i]);
const tabindexOk = items.every((it) => /tabindex="-1"/.test(it.attrs));
// tabindex="-1" keeps the items focusable-by-script but never tabbable, and no
// <button> exists, so the browser never activates them on its own.
const noButtons = !/<button/.test(page);
const highlightCss = /#menu-items li\.on\b/.test(page) || /li\.on\s*\{/.test(page);

// ---------- Behavioural plumbing ----------

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('  \u2713 ' + msg);
  else {
    console.log('  \u2717 FAIL: ' + msg);
    failures++;
  }
}

// Rich enough DOM for ui.js: classList.toggle drives the view/highlight
// visibility, getBoundingClientRect feeds the interface hit test.
// Class state lives in one map keyed by id so every handle for an id agrees.
const classState = new Map();
const childState = new Map();
const rects = new Map();
function el(id) {
  if (!classState.has(id)) classState.set(id, new Set());
  if (!childState.has(id)) childState.set(id, []);
  const classes = classState.get(id);
  const children = childState.get(id);
  return {
    id,
    style: {},
    textContent: '',
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
      children.push(child);
    },
    getBoundingClientRect: () => rects.get(id) || { left: 0, top: 0, right: 0, bottom: 0 },
  };
}

const menuItems = [el('menu-item-play'), el('menu-item-records'), el('menu-item-help')];
globalThis.document = {
  getElementById: (id) => el(id),
  querySelectorAll: (selector) => (selector === '#menu-items > li' ? menuItems : []),
  createElement: (tag) => el('li'),
  addEventListener: () => {},
};
globalThis.window = { innerWidth: 1280, innerHeight: 800, addEventListener: () => {} };

initInput({
  style: {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 240, height: 480 }),
  setPointerCapture: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
});
initUi();

function press(key) {
  onKey({ key, preventDefault: () => {} });
}

// ---------- Static checks ----------

console.log('=== Menu is page markup ===');
check(titleOk, 'snaketris.html has <h1 id="menu-title">snaketris</h1>');
check(listOk, 'the items live in <ul id="menu-items">');
check(labelsMatch, 'the three item labels match MENU_ITEMS in order: ' + items.map((it) => it.label).join(', '));
check(tabindexOk, 'every item carries tabindex="-1" so the browser never activates it natively');
check(noButtons, 'no <button> element exists: keyboard navigation stays in onKey');
check(highlightCss, 'the highlight style keys on the .on class (li.on)');

// ---------- Highlight follows game.menuSelect ----------

console.log('=== Highlight follows game.menuSelect ===');

toMenu();
syncViews(null);
for (let sel = 0; sel < MENU_ITEMS.length; sel++) {
  game.menuSelect = sel;
  syncViews(null);
  const on = menuItems.filter((it) => it.classList.contains('on')).map((it) => it.id);
  check(on.length === 1 && on[0] === items[sel].id,
    'menuSelect=' + sel + ' highlights only ' + items[sel].id);
}

// ---------- Keyboard cycle ----------

console.log('=== Keyboard cycle performs one action per press ===');

toMenu();
game.menuSelect = 0;
press('arrowdown');
check(game.menuSelect === 1 && game.state === MENU, 'ArrowDown: 0 -> 1');
press('arrowdown');
check(game.menuSelect === 2 && game.state === MENU, 'ArrowDown: 1 -> 2');
press('arrowdown');
check(game.menuSelect === 0 && game.state === MENU, 'ArrowDown: 2 -> 0 (wraps)');
press('arrowup');
check(game.menuSelect === 2 && game.state === MENU, 'ArrowUp: 0 -> 2 (wraps)');
press('arrowup');
check(game.menuSelect === 1 && game.state === MENU, 'ArrowUp: 2 -> 1');

toMenu();
game.menuSelect = 1;
press('enter');
check(game.state === RECORDS, 'Enter on "Records" opens RECORDS (one action)');
press('enter');
check(game.state === MENU, 'Enter in RECORDS returns to MENU');

toMenu();
game.menuSelect = 2;
press(' ');
check(game.state === HELP, 'Space on "How to Play" opens HELP');
press('escape');
check(game.state === MENU, 'Escape in HELP returns to MENU');

toMenu();
game.menuSelect = 0;
press('enter');
check(game.state === PLAYING, 'Enter on "Play" starts the game');

toMenu();
press('r');
check(game.state === PLAYING, 'R starts the game from the menu');

// A single press must not advance the selection twice.
toMenu();
game.menuSelect = 0;
press('arrowdown');
check(game.menuSelect === 1, 'one ArrowDown press advances exactly one step');

// ---------- Summary ----------

console.log('');
if (failures === 0) {
  console.log('All menu assertions passed.');
  process.exit(0);
} else {
  console.log('Menu check FAILED: ' + failures + ' assertion(s) failed.');
  process.exit(1);
}
