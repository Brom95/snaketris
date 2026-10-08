// Headless check for the records and help views as PAGE elements
// (change: dom-ui-outside-canvas, tasks 4.1-4.4).
//
// Both views used to be painted inside the canvas from layout constants this
// module owned. They are page markup now, so the assertions are DOM assertions:
// the elements exist in snaketris.html, the retired canvas layout constants are
// gone from js/constants.js, and js/ui.js fills the leaderboard from the board
// it is handed (top-10, fewer-than-ten, and the empty state).
//
// Run: node scripts/verify-views.mjs

import { check, report, stubDom } from './harness.mjs';
import { initUi, syncViews } from '../js/ui.js';
import { game } from '../js/state.js';
import { RECORDS, HELP, MENU, ROLE_MARKERS } from '../js/constants.js';
import { recordScore, loadBoard } from '../js/highscores.js';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');
const constantsSrc = readFileSync(new URL('../js/constants.js', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');

// ---------- Static page assertions ----------

const recordsHeading = page.includes('<h2 id="records-title">Records</h2>');
const recordsList = page.includes('<ol id="records-list">');
const recordsEmpty = page.includes('<p id="records-empty" class="view">No scores yet — play a game!</p>');
const recordsReturn = page.includes('<p id="records-return" class="return">Menu</p>');

const helpHeading = page.includes('<h2 id="help-title">How to Play</h2>');
const controlsSection = page.includes('<section id="help-controls">') && page.includes('<h3>Controls</h3>');
const rulesSection = page.includes('<section id="help-rules">') && page.includes('<h3>Rules</h3>');
const helpReturn = page.includes('<p id="help-return" class="return">Menu</p>');

// Every control line the page lists, in document order.
const helpLines = [
  'Play — choose Snake or Tetris',
  'Snake role: Arrows / WASD — steer',
  'Snake role: Swipe or tap — steer',
  'Snake role: D-pad or left stick — steer',
  'Tetris role: Arrows / WASD — shift and rotate the piece',
  'Tetris role: Tap a side — shift, tap the centre — rotate',
  'Tetris role: Vertical swipe — rotate',
  'Tetris role: D-pad left/right — shift, up/down — rotate, A — rotate clockwise',
  'Controller: A — confirm, B — back',
  'Back or Escape — return to the menu',
  'R or click — start',
];
const helpLinesPresent = helpLines.every((line) => page.includes('<li>' + line + '</li>'));

// ---------- Static js/ assertions (the canvas views and their constants are gone) ----------

const retiredConstants = [
  'RECORDS_LINE_Y', 'RECORDS_LINE_SPACING', 'RECORDS_RETURN_Y',
  'HELP_CONTROLS_Y', 'HELP_RULES_Y', 'HELP_RETURN_Y',
];
const constantsRetired = retiredConstants.every((name) => !new RegExp(name).test(constantsSrc));
const noCanvasViews = !/drawRecords|drawHelp|formatDate/.test(renderSrc);

// ---------- Behavioural plumbing ----------

const dom = stubDom({
  elements: ['ui', 'score', 'status', 'menu-view', 'role-view', 'records-view', 'help-view',
    'records-list', 'records-empty'],
  lists: { '#menu-items > li': ['menu-item-play', 'menu-item-records', 'menu-item-help'] },
  storage: new Map(),
});

initUi();

function dateOf(n) {
  // Noon UTC keeps the formatted date tz-independent.
  return '2026-09-' + String(n).padStart(2, '0') + 'T12:00:00.000Z';
}

function rows() {
  return dom.children('records-list');
}

// ---------- Static checks ----------

console.log('=== Records view is page markup ===');
check(recordsHeading, '<h2 id="records-title">Records</h2> exists');
check(recordsList, 'the leaderboard is a real <ol id="records-list">');
check(recordsEmpty, 'the empty-state message is a page element');
check(recordsReturn, 'the return control is a page element');

console.log('=== Help view is page markup ===');
check(helpHeading, '<h2 id="help-title">How to Play</h2> exists');
check(controlsSection, 'the controls block is <section id="help-controls"> with an <h3>Controls</h3>');
check(rulesSection, 'the rules block is <section id="help-rules"> with an <h3>Rules</h3>');
check(helpLinesPresent, 'all ' + helpLines.length + ' control lines are selectable page text');
check(helpReturn, 'the return control is a page element');

console.log('=== Canvas view layer retired ===');
check(constantsRetired, 'no retired canvas layout constant remains in constants.js: ' + retiredConstants.join(', '));
check(noCanvasViews, 'render.js has no drawRecords / drawHelp / formatDate');

// ---------- Leaderboard rendering from the board ----------

console.log('=== Leaderboard rows match the stored board ===');

const recorded = [3, 15, 42, 7, 99, 21, 5, 64, 88, 12, 30, 1];
for (const s of recorded) recordScore(s);
const board = loadBoard(); // the storage module's own top-10 sort
check(board.length === 10, 'recordScore keeps the top 10 of 12: ' + board.length);
check(board.every((e, i) => i === 0 || board[i - 1].score >= e.score),
  'entries stay in descending score order: ' + board.map((e) => e.score).join(', '));
check(board[0].score === Math.max(...recorded), 'the stored top entry is the highest score recorded: ' + board[0].score);

game.state = RECORDS;
syncViews(board);
check(rows().length === board.length, 'records-list holds one row per entry: ' + rows().length);
const markerRe = new RegExp('^(' + Object.values(ROLE_MARKERS).join('|') + ')  \\d+  ·  \\d{4}-\\d{2}-\\d{2}$');
check(rows().every((li) => markerRe.test(li.textContent)),
  'every row reads "<marker>  <score>  ·  <YYYY-MM-DD>": ' + rows().map((li) => li.textContent).join(' | '));
check(rows()[0].textContent.includes(board[0].score + '  ·  '),
  'the top row is the highest score: ' + rows()[0].textContent);
check(rows().every((li, i) => li.textContent.includes(board[i].score + '  ·  ')),
  'row order matches the stored board: ' + rows().map((li) => li.textContent).join(' | '));
check(!dom.classes('records-empty').has('on'), 'the empty-state message is hidden when the board has entries');
check(dom.classes('records-view').has('on'), 'the records view is shown in RECORDS');

// Fewer than ten. The board arrives already sorted by the storage module, so
// ui.js must mirror that order row for row.
syncViews([{ score: 9, date: dateOf(4) }, { score: 3, date: dateOf(3) }]);
check(rows().length === 2, 'the fewer-than-ten case renders 2 rows');
check(rows()[0].textContent === ROLE_MARKERS.snake + '  9  ·  2026-09-04',
  'rows mirror the handed board order, marker first: ' + rows()[0].textContent);

// Empty state.
syncViews([]);
check(rows().length === 0, 'the empty board renders no rows');
check(dom.classes('records-empty').has('on'), 'the empty-state message is shown when the board is empty');

// ---------- View visibility follows state ----------

console.log('=== Only the active view is shown ===');
game.state = HELP;
syncViews(null);
check(dom.classes('help-view').has('on') && !dom.classes('records-view').has('on') && !dom.classes('menu-view').has('on'),
  'in HELP only the help view is on');
game.state = MENU;
syncViews(null);
check(dom.classes('menu-view').has('on') && !dom.classes('help-view').has('on'),
  'in MENU only the menu view is on');

report('View check');
