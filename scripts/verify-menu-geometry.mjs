// Headless check for the start menu as PAGE elements
// (change: left-align-menu-labels, re-hosted by dom-ui-outside-canvas).
//
// The menu used to be painted inside the canvas, so this script modelled
// drawMenu()'s measureText() geometry. The menu is now page markup, so there is
// no canvas text measurement left to model: the assertions are DOM assertions
// (a title, three selectable items, the highlight following game.screen.menuSelect)
// plus the keyboard cycle, which must keep performing exactly one menu action
// per press.
//
// Run: node scripts/verify-menu-geometry.mjs

import { check, makeCanvas, report, stubDom } from './harness.mjs';
import { MENU_ITEMS, MENU, SELECT_DURATION, SELECT_ROLE, SELECT_WAY, PAIRING, RECORDS, HELP, DURATION_SCREEN_ITEMS, WAY_SCREEN_ITEMS } from '../js/constants.js';
import { game } from '../js/state.js';
import { drainIntents, toMenu } from '../js/screens.js';
import { initInput, onKey } from '../js/input.js';
import { initUi, syncViews } from '../js/ui.js';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');

// ---------- Static page assertions ----------

const titleOk = /<h1 id="menu-title">[^<]*snaketris/i.test(page);
const listOk = /<ul id="menu-items">/.test(page);

// The three items, in document order, with their labels and tabindex attribute.
const itemTagRe = /<li id="(menu-item-[a-z\-]+)"([^>]*)>([^<]*)<\/li>/g;
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

// Rich enough DOM for ui.js: classList.toggle drives the view/highlight
// visibility, getBoundingClientRect feeds the interface hit test.
const dom = stubDom({
  elements: ['ui', 'score', 'status', 'menu-view', 'duration-view', 'role-view', 'way-view', 'records-view', 'help-view',
    'records-list', 'records-empty'],
  lists: { '#menu-items > li': ['menu-item-play', 'menu-item-two-player', 'menu-item-records', 'menu-item-help'] },
  rects: {
    'duration-item-1': { left: 0, top: 0, right: 170, bottom: 24 },
    'duration-item-3': { left: 0, top: 24, right: 170, bottom: 48 },
    'duration-item-5': { left: 0, top: 48, right: 170, bottom: 72 },
    'duration-back': { left: 0, top: 72, right: 170, bottom: 96 },
  },
  window: { innerWidth: 1280, innerHeight: 800 },
  canvas: makeCanvas(),
});

initInput(dom.canvas);
initUi();

function press(key) {
  onKey({ key, preventDefault: () => {} });
  drainIntents();
}

// ---------- Static checks ----------

console.log('=== Menu is page markup ===');
check(titleOk, 'snaketris.html has <h1 id="menu-title">snaketris</h1>');
check(listOk, 'the items live in <ul id="menu-items">');
check(labelsMatch, 'the three item labels match MENU_ITEMS in order: ' + items.map((it) => it.label).join(', '));
check(tabindexOk, 'every item carries tabindex="-1" so the browser never activates it natively');
check(noButtons, 'no <button> element exists: keyboard navigation stays in onKey');
check(highlightCss, 'the highlight style keys on the .on class (li.on)');

// ---------- Highlight follows game.screen.menuSelect ----------

console.log('=== Highlight follows game.screen.menuSelect ===');

toMenu();
syncViews(null);
for (let sel = 0; sel < MENU_ITEMS.length; sel++) {
  game.screen.menuSelect = sel;
  syncViews(null);
  const on = items.filter((it) => dom.classes(it.id).has('on')).map((it) => it.id);
  check(on.length === 1 && on[0] === items[sel].id,
    'menuSelect=' + sel + ' highlights only ' + items[sel].id);
}

// ---------- The duration sub-menu markup and boxes ----------

console.log('=== The duration sub-menu is page markup with its own boxes ===');

const durationList = /<ul id="duration-items">([\s\S]*?)<\/ul>/.exec(page);
check(durationList !== null, 'snaketris.html has <ul id="duration-items">');
const durationItems = [];
const durationTagRe = /<li id="(duration-[a-z0-9\-]+)"([^>]*)>([^<]*)<\/li>/g;
let d;
while ((d = durationTagRe.exec(durationList ? durationList[1] : '')) !== null) {
  durationItems.push({ id: d[1], attrs: d[2], label: d[3] });
}
check(durationItems.length === DURATION_SCREEN_ITEMS.length &&
  durationItems.every((it, i) => it.label === DURATION_SCREEN_ITEMS[i]),
  'the four duration items carry DURATION_SCREEN_ITEMS in order: ' + durationItems.map((it) => it.label).join(', '));
check(durationItems.every((it) => /tabindex="-1"/.test(it.attrs)),
  'every duration item carries tabindex="-1" so the browser never activates it natively');

const durationBoxes = durationItems.map((it) => {
  const b = dom.el(it.id).getBoundingClientRect();
  return [b.left, b.top, b.right, b.bottom].join(':');
});
check(durationItems.length === 4 &&
  durationBoxes.every((b) => !/:0:0$/.test(b)) &&
  new Set(durationBoxes).size === durationItems.length,
  'each of the four duration items reports a distinct box: ' + durationBoxes.join(' | '));

// The highlight follows game.screen.durationSelect.
toMenu();
game.screen.state = SELECT_DURATION;
for (let sel = 0; sel < DURATION_SCREEN_ITEMS.length; sel++) {
  game.screen.durationSelect = sel;
  syncViews(null);
  const on = durationItems.filter((it) => dom.classes(it.id).has('on')).map((it) => it.id);
  check(on.length === 1 && on[0] === durationItems[sel].id,
    'durationSelect=' + sel + ' highlights only ' + durationItems[sel].id);
}
game.screen.state = MENU;
game.screen.durationSelect = 0;

// ---------- The way sub-menu markup and highlight ----------

console.log('=== The way sub-menu is page markup with its own highlight ===');

const wayList = /<ul id="way-items">([\s\S]*?)<\/ul>/.exec(page);
check(wayList !== null, 'snaketris.html has <ul id="way-items">');
const wayItems = [];
const wayTagRe = /<li id="(way-[a-z0-9\-]+)"([^>]*)>([^<]*)<\/li>/g;
let w;
while ((w = wayTagRe.exec(wayList ? wayList[1] : '')) !== null) {
  wayItems.push({ id: w[1], attrs: w[2], label: w[3] });
}
check(wayItems.length === WAY_SCREEN_ITEMS.length &&
  wayItems.every((it, i) => it.label === WAY_SCREEN_ITEMS[i]),
  'the way items carry WAY_SCREEN_ITEMS in order: ' + wayItems.map((it) => it.label).join(', '));
check(wayItems.every((it) => /tabindex="-1"/.test(it.attrs)),
  'every way item carries tabindex="-1" so the browser never activates it natively');

// The highlight follows game.screen.waySelect, the same rule the duration and
// role sub-menus use.
toMenu();
game.screen.state = SELECT_WAY;
for (let sel = 0; sel < WAY_SCREEN_ITEMS.length; sel++) {
  game.screen.waySelect = sel;
  syncViews(null);
  const on = wayItems.filter((it) => dom.classes(it.id).has('on')).map((it) => it.id);
  check(on.length === 1 && on[0] === wayItems[sel].id,
    'waySelect=' + sel + ' highlights only ' + wayItems[sel].id);
}

// ---------- Keyboard cycle ----------

console.log('=== Keyboard cycle performs one action per press ===');

toMenu();
game.screen.menuSelect = 0;
press('arrowdown');
check(game.screen.menuSelect === 1 && game.screen.state === MENU, 'ArrowDown: 0 -> 1');
press('arrowdown');
check(game.screen.menuSelect === 2 && game.screen.state === MENU, 'ArrowDown: 1 -> 2');
press('arrowdown');
check(game.screen.menuSelect === 3 && game.screen.state === MENU, 'ArrowDown: 2 -> 3 (Two Players)');
press('arrowdown');
check(game.screen.menuSelect === 0 && game.screen.state === MENU, 'ArrowDown: 3 -> 0 (wraps)');
press('arrowup');
check(game.screen.menuSelect === 3 && game.screen.state === MENU, 'ArrowUp: 0 -> 3 (wraps)');
press('arrowup');
check(game.screen.menuSelect === 2 && game.screen.state === MENU, 'ArrowUp: 3 -> 2');

// One entry, two ways: confirming "Two Players" opens the way sub-menu, and
// the same-computer way is what opens the duration sub-menu after it.
toMenu();
game.screen.menuSelect = 1;
press('enter');
check(game.screen.state === SELECT_WAY && game.screen.waySelect === 0,
  'Enter on "Two Players" opens the way sub-menu at "Same computer"');
press('arrowdown');
check(game.screen.waySelect === 1 && game.screen.state === SELECT_WAY, 'ArrowDown in the way sub-menu: Same computer -> Network');
press('enter');
check(game.screen.networkMode && game.screen.state === PAIRING, 'Enter on "Network" opens the pairing step');
press('escape');
check(game.screen.state === MENU, 'Escape in the pairing step returns to the menu');

toMenu();
game.screen.menuSelect = 1;
press('enter');
press('enter');
check(game.screen.twoPlayerMode && !game.screen.networkMode && game.screen.state === SELECT_DURATION,
  'Enter on "Same computer" starts the same-computer way at the duration sub-menu');
press('escape');
check(game.screen.state === MENU, 'Escape in the duration sub-menu returns to the menu');

toMenu();
game.screen.menuSelect = 2;
press(' ');
check(game.screen.state === RECORDS, 'Space on "Records" opens RECORDS');
press('escape');
check(game.screen.state === MENU, 'Escape in RECORDS returns to MENU');

// "Play" no longer starts a game: it opens the duration sub-menu, and the
// duration sub-menu opens the role sub-menu.
toMenu();
game.screen.menuSelect = 0;
press('enter');
check(game.screen.state === SELECT_DURATION && game.screen.durationSelect === 0,
  'Enter on "Play" opens the duration sub-menu at 1 minute');
press('arrowdown');
check(game.screen.durationSelect === 1 && game.screen.state === SELECT_DURATION,
  'ArrowDown in the duration sub-menu: 1 minute -> 3 minutes');
press('enter');
check(game.screen.state === SELECT_ROLE && game.play.durationMinutes === 3,
  'Enter on "3 minutes" stores the duration and opens the role sub-menu');
press('escape');
check(game.screen.state === SELECT_DURATION, 'Escape in the role sub-menu returns to the duration sub-menu');

toMenu();
press('r');
check(game.screen.state === SELECT_DURATION, 'R opens the duration sub-menu from the menu');

// A single press must not advance the selection twice.
toMenu();
game.screen.menuSelect = 0;
press('arrowdown');
check(game.screen.menuSelect === 1, 'one ArrowDown press advances exactly one step');

// ---------- Summary ----------

report('Menu check');
