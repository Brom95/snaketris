// Headless verification of the page shell for change `dom-ui-outside-canvas`.
//
// The interface now lives in page elements, so its structure and its sizing
// rule are static facts about snaketris.html rather than runtime behaviour.
// This script asserts:
//   - every interface element the game code queries exists in the DOM tree
//   - the CSS sizing values are present as written and match the numbers
//     exported from js/constants.js (FIELD_V_GAP, UI_COLUMN_MIN,
//     UI_STACK_MAX_WIDTH)
//   - the touch-suppression rules are scoped to the canvas selector only
//   - menu items are page elements that are not natively activatable
//     (tabindex="-1", no <button>), so keyboard confirmation fires once
//   - the GitHub link is a real anchor (href/target/rel), not a JS window.open
//
// Run: node scripts/verify-page-layout.mjs

import { readFileSync } from 'node:fs';
import { FIELD_V_GAP, UI_COLUMN_MIN, UI_STACK_MAX_WIDTH, GITHUB_URL, MENU_ITEMS } from '../js/constants.js';

const html = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');
// Only the <style> block is CSS; the body markup must not be scanned for rules.
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const css = styleStart >= 0 && styleEnd > styleStart ? html.slice(styleStart + 7, styleEnd) : '';
const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'));

let failures = 0;
function check(cond, msg) {
  if (cond) console.log('  \u2713 ' + msg);
  else {
    console.log('  \u2717 FAIL: ' + msg);
    failures++;
  }
}

function hasId(id) {
  return body.includes('id="' + id + '"');
}

// ---------- Interface elements the game code queries ----------

console.log('=== Interface DOM tree ===');
check(hasId('game'), 'the play field is a canvas element');
check(hasId('ui'), 'one interface container element (#ui) holds everything outside the field');
check(hasId('score'), 'score readout is a page element');
check(hasId('status'), 'game-over message is a page element');
check(hasId('menu-view'), 'menu view is a page element');
check(hasId('menu-title'), 'menu title is page text');
check(hasId('menu-items'), 'menu items live in a list');
check(hasId('github-link'), 'the GitHub link is an anchor element');
check(hasId('github-icon'), 'the octocat is inline page markup');
check(hasId('records-view'), 'records view is a page element');
check(hasId('records-list'), 'the leaderboard is a page list');
check(hasId('records-empty'), 'the empty-board message is page text');
check(hasId('help-view'), 'help view is a page element');
check(hasId('help-controls'), 'the controls section is a page section');
check(hasId('help-rules'), 'the rules section is a page section');
check(body.includes('class="return"'), 'return controls are marked for the pointer handler');

// ---------- Menu items: three labels, none natively activatable ----------

console.log('=== Menu items are page elements, not controls ===');
const itemTags = [...body.matchAll(/<li[^>]*>/g)].map((m) => m[0]);
const menuItems = itemTags.filter((t) => t.includes('menu-item-'));
check(menuItems.length === MENU_ITEMS.length, 'one element per menu item: ' + menuItems.length + ' of ' + MENU_ITEMS.length);
check(menuItems.every((t) => t.includes('tabindex="-1"')), 'every menu item carries tabindex="-1" (no native Enter/Space activation)');
check(!/<button/.test(body), 'no <button> element exists in the page');
for (const label of MENU_ITEMS) {
  check(new RegExp('<li[^>]*menu-item-[^>]*>' + label + '</li>').test(body), 'label text present as page text: ' + label);
}

// ---------- GitHub anchor ----------

console.log('=== GitHub link is declarative ===');
const anchor = /<a\b[^>]*id="github-link"[^>]*>/.exec(body);
check(anchor !== null, 'the GitHub anchor element exists');
if (anchor) {
  const tag = anchor[0];
  check(tag.includes('href="' + GITHUB_URL + '"'), 'href is exactly ' + GITHUB_URL);
  check(tag.includes('target="_blank"'), 'target="_blank" opens a new tab');
  check(tag.includes('rel="noopener"'), 'rel="noopener" isolates the new tab');
}
check(!/window\.open/.test(body), 'no script-side window.open in the page');

// ---------- CSS sizing values match the exported constants ----------

console.log('=== CSS breakpoint values present as written ===');
check(css.includes('gap: ' + FIELD_V_GAP + 'px'), 'FIELD_V_GAP as the CSS gap around the field: gap: ' + FIELD_V_GAP + 'px');
check(css.includes('width: min(' + UI_COLUMN_MIN + 'px'), 'UI_COLUMN_MIN as the interface column width: min(' + UI_COLUMN_MIN + 'px, 92vw)');
check(css.includes('@media (max-width: ' + UI_STACK_MAX_WIDTH + 'px)'), 'UI_STACK_MAX_WIDTH as the stacking breakpoint: @media (max-width: ' + UI_STACK_MAX_WIDTH + 'px)');
const stacked = /@media \(max-width: \d+px\)\s*\{[^}]*body\s*\{[^}]*flex-direction: column-reverse/.test(css);
check(stacked, 'the breakpoint stacks the interface above the field (column-reverse)');
check(/body\s*\{[^}]*flex-wrap: wrap/.test(css), 'the field and interface share flex tracks and wrap when they cannot fit');

// ---------- Touch suppression scoped to the canvas ----------

console.log('=== Touch suppression scoped to the board ===');
const canvasRule = /canvas\s*\{[^}]*\}/.exec(css);
check(canvasRule !== null, 'a canvas selector exists in the CSS');
if (canvasRule) {
  const rule = canvasRule[0];
  check(rule.includes('touch-action: none'), 'touch-action: none on the canvas selector');
  check(rule.includes('-webkit-touch-callout: none'), 'webkit touch callout suppressed on the canvas selector');
  check(rule.includes('user-select: none'), 'selection suppressed on the canvas selector');
}
const outsideCanvas = css.replace(canvasRule ? canvasRule[0] : '', '');
check(!/touch-action|touch-callout/.test(outsideCanvas), 'no touch-suppression declaration outside the canvas selector');

// ---------- Summary ----------

console.log('');
if (failures === 0) {
  console.log('Page layout check passed.');
  process.exit(0);
}
console.log('Page layout check FAILED: ' + failures + ' assertion(s) failed.');
process.exit(1);
