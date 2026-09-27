// Headless geometry check for the left-aligned start menu
// (change: left-align-menu-labels). Mirrors drawMenu() in js/render.js:
// same labels, same fonts, same shared-left-edge anchor, and the same
// measureText() semantics.
//
// No canvas is available in Node, so text width is modeled as a flat
// 0.6em advance per glyph — the advance width of standard monospace
// fonts (Consolas, DejaVu Sans Mono, Courier, ...), which is the model
// used in the change's design. Run: node scripts/verify-menu-geometry.mjs

import { MENU_ITEMS, MENU_ITEM_Y, BOARD_W, BOARD_H } from '../js/constants.js';

const ADVANCE_EM = 0.6; // monospace advance width, em

function widthOf(text, fontSize) {
  return text.length * ADVANCE_EM * fontSize;
}

function fontSizeOf(font) {
  return Number(font.match(/(\d+(?:\.\d+)?)(?=px)/)[1]);
}

// The same labels drawMenu() builds, in draw order.
const labels = [{ text: 'snaketris', y: 120, font: 'bold 30px monospace' }];
for (let i = 0; i < MENU_ITEMS.length; i++) {
  const highlighted = i === 0; // menuSelect starts at 0
  labels.push({
    text: highlighted ? '▶ ' + MENU_ITEMS[i] : MENU_ITEMS[i],
    y: MENU_ITEM_Y[i],
    font: highlighted ? 'bold 24px monospace' : '20px monospace',
  });
}
labels.push({ text: 'Arrows/W-S move · R to start', y: 420, font: '13px monospace' });

for (const l of labels) l.w = widthOf(l.text, fontSizeOf(l.font));

const widest = Math.max(...labels.map((l) => l.w));
const left = BOARD_W / 2 - widest / 2;

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else {
    console.log('  ✗ FAIL: ' + msg);
    failures++;
  }
}
function near(a, b) {
  return Math.abs(a - b) < 1e-9;
}

console.log('Board: ' + BOARD_W + 'x' + BOARD_H + ' (buffer, CSS-scaled), center x = ' + BOARD_W / 2);
console.log('Widest label width: ' + widest + ' px');
for (const l of labels) {
  console.log(
    '  ' + l.text + '  [' + fontSizeOf(l.font) + 'px]  w=' + l.w +
      '  left=' + left + '  right=' + (left + l.w)
  );
}

const hint = labels.find((l) => l.y === 420);
const right = left + hint.w;

check(near(widest, 218.4), 'widest label is the 13px hint at 218.4px');
check(hint.w === widest, 'the hint line is the widest menu label');
check(near(left, 10.8), 'shared left edge is 10.8px (120 - 218.4/2)');
check(near(right, 229.2), "hint's right edge is 229.2px");
check(near((left + right) / 2, BOARD_W / 2), 'widest label symmetric about board center');
check(left >= 0 && right <= BOARD_W, 'menu block unclipped: [' + left + ', ' + right + '] within [0, ' + BOARD_W + ']');
check(labels.every((l) => left >= 0 && left + l.w <= BOARD_W), 'every label within [0, 240]');
check(near(BOARD_W - right, left), 'equal margins on both sides: ' + left + 'px / ' + (BOARD_W - right) + 'px');

console.log(failures === 0 ? 'All menu geometry assertions passed.' : 'Menu geometry check FAILED.');
process.exit(failures ? 1 : 0);
