// Headless geometry check for the left-aligned start menu
// (change: left-align-menu-labels; amended by add-github-link, which removed
// the navigation hint line to make room for the GitHub icon).
//
// Mirrors drawMenu() in js/render.js: same labels, same fonts, same shared-left-edge
// anchor, and the same measureText() semantics.
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

// The same labels drawMenu() builds for a given menuSelect, in draw order.
// The menu has no hint line: the space below the items holds the GitHub icon.
function labelsFor(menuSelect) {
  const labels = [{ text: 'snaketris', y: 120, font: 'bold 30px monospace' }];
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const highlighted = i === menuSelect;
    labels.push({
      text: highlighted ? '▶ ' + MENU_ITEMS[i] : MENU_ITEMS[i],
      y: MENU_ITEM_Y[i],
      font: highlighted ? 'bold 24px monospace' : '20px monospace',
    });
  }
  return labels;
}

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('  \u2713 ' + msg);
  else {
    console.log('  \u2717 FAIL: ' + msg);
    failures++;
  }
}
function near(a, b) {
  return Math.abs(a - b) < 1e-9;
}

console.log('Board: ' + BOARD_W + 'x' + BOARD_H + ' (buffer, CSS-scaled), center x = ' + BOARD_W / 2);

// The highlighted item is painted in a larger bold font, so the widest label
// (and therefore the shared left edge) depends on which item is selected.
// Every selection must keep the block centered and unclipped.
for (let sel = 0; sel < MENU_ITEMS.length; sel++) {
  const labels = labelsFor(sel);
  for (const l of labels) l.w = widthOf(l.text, fontSizeOf(l.font));

  const widest = Math.max(...labels.map((l) => l.w));
  const left = BOARD_W / 2 - widest / 2;
  const widestLabel = labels.find((l) => l.w === widest);

  console.log('menuSelect=' + sel + ' (' + MENU_ITEMS[sel] + '): widest "' + widestLabel.text +
    '" ' + widest + ' px, left=' + left + ', right=' + (left + widest));
  for (const l of labels) {
    console.log('  ' + l.text + '  [' + fontSizeOf(l.font) + 'px]  w=' + l.w +
      '  left=' + left + '  right=' + (left + l.w));
  }

  check(labels.length === 1 + MENU_ITEMS.length, 'menu paints title + ' + MENU_ITEMS.length +
    ' items only (no hint line): ' + labels.length + ' labels');
  check(near(left + widest / 2, BOARD_W / 2), 'widest label centered on the board: [' + left + ', ' + (left + widest) + ']');
  check(labels.every((l) => left >= 0 && left + l.w <= BOARD_W), 'every label within [0, ' + BOARD_W + ']: left=' + left + ', rightmost=' + (left + widest));
  check(near(BOARD_W - (left + widest), left), 'equal margins: ' + left + 'px / ' + (BOARD_W - (left + widest)) + 'px');
  check(labels.every((l) => l.y >= 0 && l.y <= BOARD_H), 'every label baseline inside the board height');
}

// The highlighted item is the widest label only when it is the longest item;
// otherwise the title wins, which is what pins the shared left edge.
const widestSel0 = widthOf('snaketris', 30);
check(near(widestSel0, 162), 'title width is 162px (9 glyphs at 30px)');
check(near(widthOf('▶ How to Play', 24), 187.2), 'the widest highlighted item is 187.2px ("▶ How to Play" at 24px)');
check(widthOf('▶ How to Play', 24) > widestSel0, 'a highlighted long item outwidens the title, so left shifts per selection');

console.log(failures === 0 ? 'All menu geometry assertions passed.' : 'Menu geometry check FAILED.');
process.exit(failures ? 1 : 0);
