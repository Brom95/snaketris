// Headless verification for the GitHub link in the start menu
// (change: add-github-link; re-hosted by dom-ui-outside-canvas).
//
// The icon used to be a Path2D painted inside the canvas plus a row-based hit
// test in js/input.js, which opened the repo through window.open(). Popup
// blockers swallow window.open, and the geometry only existed in logical
// canvas coordinates, so the old script mirrored drawOctocat() and tapped
// logical points.
//
// The interface now lives on the page, so the assertions are DOM assertions:
// the anchor exists in snaketris.html with the exact href, target and rel, the
// octocat SVG is inside it, it follows the three menu items in document order,
// and no js/ file paints or opens the icon any more. Behaviour is driven through
// the public API (initInput / onInterfacePointerUp / the pointer adapters in
// js/devices.js) with the browser environment stubbed by harness.stubDom().
//
// Run: node scripts/verify-github-icon.mjs

import { check, makeCanvas, report, stubDom } from './harness.mjs';
import { initInput, onInterfacePointerUp, onPointerUp } from '../js/input.js';
import { onPointerDown } from '../js/devices.js';
import { game } from '../js/state.js';
import { MENU, RECORDS, HELP, GAME_OVER, MENU_ITEMS, GITHUB_URL } from '../js/constants.js';

import { readFileSync, readdirSync } from 'node:fs';

// ---------- Static page assertions (snaketris.html) ----------

const page = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');

// The anchor: real <a>, so the browser opens the tab itself and popup blockers
// cannot interfere.
const anchorStart = page.indexOf('<a id="github-link"');
const anchorEnd = page.indexOf('</a>', anchorStart);
const anchorTag = page.slice(page.indexOf('>', anchorStart) + 1, anchorEnd);

const hasAnchor = anchorStart !== -1 && anchorEnd !== -1;
const hrefOk = new RegExp('href="' + GITHUB_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(page);
const targetOk = /<a id="github-link"[^>]*\btarget="_blank"/.test(page);
const relOk = /<a id="github-link"[^>]*\brel="noopener"/.test(page);
const iconInsideAnchor = hasAnchor && /<svg\b/.test(anchorTag);

// Document order: the three items come first, the icon anchor after them, so
// the browser stacks the icon below the menu items.
const lastItemIdx = page.indexOf('<li id="menu-item-help"');
const iconBelowItems = hasAnchor && lastItemIdx !== -1 && lastItemIdx < anchorStart;

// ---------- Static js/ assertions (nothing paints or opens the icon) ----------

const jsDir = new URL('../js/', import.meta.url);
const jsFiles = readdirSync(jsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => ({ name, src: readFileSync(new URL(name, jsDir), 'utf8') }));

const noWindowOpen = jsFiles.every((f) => !/window\.open/.test(f.src));
const noIconConstants = jsFiles.every((f) => !/GITHUB_ICON_/.test(f.src));
const noOctocat = jsFiles.every((f) => !/drawOctocat/.test(f.src));
const urlOnlyInConstants = jsFiles
  .filter((f) => /GITHUB_URL/.test(f.src))
  .map((f) => f.name);

// ---------- Behavioural plumbing ----------

// Fixed layout the stub hands back from getBoundingClientRect(): three stacked
// item boxes and, below them, the anchor box.
const ITEMS = [
  { left: 40, top: 100, right: 160, bottom: 124 },
  { left: 40, top: 132, right: 180, bottom: 156 },
  { left: 40, top: 164, right: 200, bottom: 188 },
];
const ANCHOR = { left: 100, top: 210, right: 124, bottom: 234 };

const dom = stubDom({
  elements: ['ui', 'score', 'status', 'menu-view', 'role-view', 'records-view', 'help-view',
    'records-list', 'records-empty'],
  lists: { '#menu-items > li': ['menu-item-play', 'menu-item-records', 'menu-item-help'] },
  rects: {
    'menu-item-play': ITEMS[0],
    'menu-item-records': ITEMS[1],
    'menu-item-help': ITEMS[2],
    'github-link': ANCHOR,
  },
  window: { innerWidth: 1280, innerHeight: 800 },
  canvas: makeCanvas(),
});

initInput(dom.canvas); // installs the module-private canvas + the interface listener

function center(box) {
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
}

// A page-level pointer release at a viewport point (target is a DOM element,
// never the canvas).
function clickPage(x, y) {
  onInterfacePointerUp({ target: { note: 'interface element' }, clientX: x, clientY: y });
}

function menuState() {
  game.state = MENU;
}

// ---------- Static checks ----------

console.log('=== GitHub link is a page anchor ===');
check(hasAnchor, 'snaketris.html contains <a id="github-link">');
check(hrefOk, 'href is exactly ' + GITHUB_URL);
check(targetOk, 'target="_blank" set (new tab)');
check(relOk, 'rel="noopener" set (no opener leak)');
check(iconInsideAnchor, 'the octocat <svg> is inside the anchor, so the icon is the clickable link');
check(iconBelowItems, 'the anchor follows all three menu items in document order (icon below the items)');

console.log('=== Nothing paints or opens the icon any more ===');
check(noWindowOpen, 'no js/ file calls window.open');
check(noIconConstants, 'no js/ file references GITHUB_ICON_*');
check(noOctocat, 'no js/ file references drawOctocat');
check(urlOnlyInConstants.length === 1 && urlOnlyInConstants[0] === 'constants.js',
  'GITHUB_URL is declared once, in constants.js: ' + urlOnlyInConstants.join(', '));

// ---------- Interface selection still cycles three items ----------

console.log('=== Interface pointer selects the three items ===');

check(MENU_ITEMS.length === 4, 'four selectable items: ' + MENU_ITEMS.join(', '));
check(!MENU_ITEMS.includes('GitHub') && !MENU_ITEMS.includes(GITHUB_URL),
  'the icon is not a selectable menu item');

menuState();
game.menuSelect = 0;
clickPage(center(ITEMS[2]).x, center(ITEMS[2]).y);
check(game.state === HELP && game.menuSelect === 2, 'click on "How to Play" selects item 2 and opens HELP');

menuState();
game.menuSelect = 0;
clickPage(center(ITEMS[1]).x, center(ITEMS[1]).y);
check(game.state === RECORDS && game.menuSelect === 1, 'click on "Records" selects item 1 and opens RECORDS');

menuState();
game.menuSelect = 0;
clickPage(center(ITEMS[0]).x, center(ITEMS[0]).y);
check(game.state === 'SELECT_ROLE', 'click on "Play" opens the role sub-menu');

// ---------- The anchor: the browser navigates, the game selects nothing ----------

console.log('=== Clicking the icon selects nothing ===');

menuState();
game.menuSelect = 1;
clickPage(center(ANCHOR).x, center(ANCHOR).y);
check(game.menuSelect === 1 && game.state === MENU,
  'click inside the anchor box changes no selection and no state (the browser opens the tab)');

menuState();
game.menuSelect = 1;
clickPage(center(ITEMS[0]).x + 200, center(ITEMS[0]).y); // same row, outside every box
check(game.menuSelect === 1 && game.state === MENU,
  'click outside every item box is a no-op (no row-based hit test survives)');

menuState();
game.menuSelect = 1;
clickPage(center(ITEMS[2]).x, ITEMS[2].top - 4); // 4px above item 2, inside the row gap
check(game.menuSelect === 1 && game.state === MENU, 'click just above an item box does not select it');

// A board gesture must never be handled by the interface listener.
menuState();
game.menuSelect = 1;
onInterfacePointerUp({ target: dom.canvas, clientX: center(ITEMS[2]).x, clientY: center(ITEMS[2]).y });
check(game.menuSelect === 1 && game.state === MENU,
  'a pointer release whose target is the canvas is ignored by the interface listener');

// ---------- Board gestures in MENU do nothing ----------

console.log('=== MENU board gesture is inert ===');

menuState();
game.menuSelect = 1;
const dirBefore = { ...game.nextDir };
onPointerDown({ pointerId: 7, clientX: 120, clientY: 240 });
onPointerUp({ pointerId: 7, clientX: 120, clientY: 20 }); // swipe up ending on the board
check(game.state === MENU && game.menuSelect === 1,
  'a swipe ending on the board in MENU changes neither state nor selection');
check(game.nextDir.r === dirBefore.r && game.nextDir.c === dirBefore.c,
  'and it steers nothing (nextDir unchanged)');

// ---------- Non-menu states still return to the menu from the page ----------

console.log('=== Interface click returns to the menu from RECORDS/HELP/GAME_OVER ===');

for (const [label, enter] of [
  ['RECORDS', () => { game.state = RECORDS; }],
  ['HELP', () => { game.state = HELP; }],
  ['GAME_OVER', () => { game.state = GAME_OVER; }],
]) {
  enter();
  clickPage(center(ANCHOR).x, center(ANCHOR).y);
  check(game.state === MENU, label + ': interface click returns to MENU');
}

// ---------- Summary ----------

report('GitHub link check');
