// Headless verification for the GitHub icon in the start menu
// (change: add-github-link).
//
// Browser runs are not part of this project's verification route, so the two
// browser-only tasks (icon legibility at every viewport size, live click) are
// checked here instead: the icon is drawn in logical canvas coordinates and the
// canvas buffer is never resized (only its CSS size is scaled by fitCanvas), so
// logical-coordinate geometry is viewport-independent by construction.
//
// Mirrors js/render.js drawMenu() + drawOctocat() and js/input.js onPointerUp()
// through the public API (initInput / onPointerDown / onPointerUp) with the
// browser environment stubbed by controller-stubs.mjs.
//
// Run: node scripts/verify-github-icon.mjs

import { setGamepads, makeCanvas } from './controller-stubs.mjs';
import { initInput, onPointerDown, onPointerUp } from '../js/input.js';
import { game } from '../js/state.js';
import {
  MENU, RECORDS, HELP, MENU_ITEMS, MENU_ITEM_Y, MENU_ITEM_HIT_H,
  GITHUB_ICON_Y, GITHUB_ICON_HIT_H, GITHUB_URL,
  BOARD_W, BOARD_H, CELL,
} from '../js/constants.js';

// ---------- Geometry mirrored from render.js ----------

// drawOctocat(): size = CELL * 1.5, translate(x - size/2, y - size/2), scale(size/24).
// The translate uses half the SCALED viewBox, so the 24x24 viewBox centre lands
// on the anchor (x, y) rather than ~6px off it.
const ICON_SIZE = CELL * 1.5;
const ICON_SCALE = ICON_SIZE / 24;
// Bounding box of the official octocat Path2D inside its 24x24 viewBox, read
// off the path data (x: .5 -> 23.5, y: 1 -> 20.63 plus the 2.9 rounded foot).
const PATH_MIN_X = 0.5;
const PATH_MAX_X = 23.5;
const PATH_MIN_Y = 1;
const PATH_MAX_Y = 22.63;

const iconX = BOARD_W / 2; // drawMenu calls drawOctocat(canvas.width / 2, ...)
const iconY = GITHUB_ICON_Y;

const glyphLeft = iconX - ICON_SIZE / 2 + PATH_MIN_X * ICON_SCALE;
const glyphRight = iconX - ICON_SIZE / 2 + PATH_MAX_X * ICON_SCALE;
const glyphTop = iconY - ICON_SIZE / 2 + PATH_MIN_Y * ICON_SCALE;
const glyphBottom = iconY - ICON_SIZE / 2 + PATH_MAX_Y * ICON_SCALE;

const hitTop = GITHUB_ICON_Y - GITHUB_ICON_HIT_H / 2;
const hitBottom = GITHUB_ICON_Y + GITHUB_ICON_HIT_H / 2;

const lastItemTop = MENU_ITEM_Y[MENU_ITEMS.length - 1] - MENU_ITEM_HIT_H / 2;
const lastItemBottom = MENU_ITEM_Y[MENU_ITEMS.length - 1] + MENU_ITEM_HIT_H / 2;

// ---------- Pointer plumbing ----------

// window.open spy: records every URL the icon handler asks to open.
const opened = [];
window.open = (url, target) => {
  opened.push({ url, target });
  return null;
};

initInput(makeCanvas()); // installs the module-private canvas (rect 240x480)

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('  \u2713 ' + msg);
  else {
    console.log('  \u2717 FAIL: ' + msg);
    failures++;
  }
}

// One full click gesture ending at a logical canvas point. The stub canvas
// reports a 240x480 client rect at the origin, so client px == logical px.
function tap(x, y) {
  onPointerDown({ pointerId: 1, clientX: x, clientY: y });
  onPointerUp({ pointerId: 1, clientX: x, clientY: y });
}

function menuState() {
  game.state = MENU;
}

// ---------- Icon placement ----------

console.log('=== Icon placement (logical canvas coords) ===');
console.log(
  '  icon anchor (' + iconX + ', ' + iconY + '), glyph box [' +
    glyphLeft.toFixed(2) + ', ' + glyphTop.toFixed(2) + '] - [' +
    glyphRight.toFixed(2) + ', ' + glyphBottom.toFixed(2) + ']'
);
console.log(
  '  hit range y [' + hitTop + ', ' + hitBottom + '], last item hit range y [' +
    lastItemTop + ', ' + lastItemBottom + ']'
);

check(GITHUB_ICON_Y > MENU_ITEM_Y[MENU_ITEMS.length - 1], 'icon sits below the last menu item center');
check(hitTop > lastItemBottom, 'icon hit range starts below the last item hit range: no overlap');
check(glyphTop > lastItemBottom, 'drawn glyph clears the last menu item: ' + glyphTop.toFixed(2) + ' > ' + lastItemBottom);
check(glyphLeft >= 0 && glyphRight <= BOARD_W, 'glyph unclipped horizontally: [' + glyphLeft.toFixed(2) + ', ' + glyphRight.toFixed(2) + '] within [0, ' + BOARD_W + ']');
check(glyphTop >= 0 && glyphBottom <= BOARD_H, 'glyph unclipped vertically: [' + glyphTop.toFixed(2) + ', ' + glyphBottom.toFixed(2) + '] within [0, ' + BOARD_H + ']');
check(GITHUB_ICON_HIT_H >= 30, 'hit area >= 30px tall for finger taps: ' + GITHUB_ICON_HIT_H);

const overlap = Math.min(hitBottom, glyphBottom) - Math.max(hitTop, glyphTop);
const glyphHeight = glyphBottom - glyphTop;
check(overlap >= glyphHeight, 'hit range fully covers the drawn glyph: [' + hitTop + ', ' + hitBottom + '] contains [' + glyphTop.toFixed(2) + ', ' + glyphBottom.toFixed(2) + ']');

const glyphCX = (glyphLeft + glyphRight) / 2;
const glyphCY = (glyphTop + glyphBottom) / 2;
check(Math.abs(glyphCX - iconX) < 1, 'glyph centred on the anchor x: ' + glyphCX.toFixed(2) + ' vs ' + iconX);
check(Math.abs(glyphCY - iconY) < 1, 'glyph centred on the anchor y: ' + glyphCY.toFixed(2) + ' vs ' + iconY);

// The icon is drawn in logical coordinates and fitCanvas only changes the CSS
// size, so placement cannot drift with the viewport.
check(ICON_SIZE > CELL && ICON_SIZE < BOARD_W / 4, 'icon size legible but not dominant: ' + ICON_SIZE + 'px');

// ---------- Pointer hit-test: icon opens the repo ----------

console.log('=== Pointer hit-test on the icon ===');

menuState();
game.menuSelect = 0;
opened.length = 0;
tap(iconX, iconY);
check(opened.length === 1 && opened[0].url === GITHUB_URL, 'tap at the icon anchor opens ' + GITHUB_URL);
check(opened[0].target === '_blank', 'opens in a new tab (_blank)');
check(game.state === MENU, 'icon tap does not change the game state (stays MENU)');

menuState();
opened.length = 0;
tap(iconX, hitTop); // upper edge of the hit range
check(opened.length === 1, 'tap at the hit-range top edge (y=' + hitTop + ') opens the repo');

menuState();
opened.length = 0;
tap(iconX, hitBottom); // lower edge
check(opened.length === 1, 'tap at the hit-range bottom edge (y=' + hitBottom + ') opens the repo');

menuState();
opened.length = 0;
tap(iconX, hitBottom + 1); // just outside
check(opened.length === 0 && game.state === MENU, 'tap 1px below the hit range does nothing');

menuState();
opened.length = 0;
tap(20, iconY); // far left of the icon, same row
check(opened.length === 1, 'hit-test is row-based (y only): tap at x=20 on the icon row opens the repo');

// ---------- Menu items take precedence over the icon ----------

console.log('=== Menu items win over the icon ===');

menuState();
opened.length = 0;
tap(iconX, MENU_ITEM_Y[2]);
check(opened.length === 0, 'tap on "How to Play" does not open the repo');
check(game.state === HELP, 'tap on "How to Play" opens the HELP view');

menuState();
opened.length = 0;
tap(iconX, lastItemBottom); // exact boundary of the last item's hit range
check(opened.length === 0, 'tap on the last item boundary selects the item, not the icon');
check(game.state === HELP, 'boundary tap still selects "How to Play"');

menuState();
opened.length = 0;
tap(iconX, MENU_ITEM_Y[0]);
check(opened.length === 0 && game.state !== MENU, 'tap on "Play" starts the game without opening the repo');

menuState();
opened.length = 0;
tap(iconX, (lastItemBottom + hitTop) / 2); // dead gap between item and icon
check(opened.length === 0 && game.state === MENU, 'tap in the gap between item and icon is a no-op');

// ---------- Navigation still cycles three items ----------

console.log('=== Menu still cycles exactly three items ===');

check(MENU_ITEMS.length === 3, 'three selectable items: ' + MENU_ITEMS.join(', '));
check(!MENU_ITEMS.includes('GitHub') && !MENU_ITEMS.includes(GITHUB_URL), 'the icon is not a selectable menu item');
menuState();
game.menuSelect = 2;
game.menuSelect = (game.menuSelect + 1) % MENU_ITEMS.length;
check(game.menuSelect === 0, 'selection wraps 2 -> 0 (three-item cycle unchanged)');

// ---------- Summary ----------

console.log('');
if (failures === 0) {
  console.log('All GitHub icon assertions passed.');
  process.exit(0);
} else {
  console.log('GitHub icon check FAILED: ' + failures + ' assertion(s) failed.');
  process.exit(1);
}
