// Headless check for the HUD: the score readout and the game-over message are
// page elements driven by ui.js, and the canvas paints neither.
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');
const uiSrc = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');

let failures = 0;
function check(cond, label) {
  if (cond) {
    console.log('\x1b[32m✓\x1b[0m ' + label);
  } else {
    failures++;
    console.log('\x1b[31m✗\x1b[0m ' + label);
  }
}

// ---------- Page: the readout and the status message exist as elements ------
check(/<p id="score"[^>]*>Score: 0<\/p>/.test(page), 'score readout is a page element starting at 0');
check(/<p id="status" class="view">Game Over/.test(page), 'game-over message is a hidden page element');
check(/#score \{ font-size: 16px; \}/.test(page), 'score readout has its own font size');
check(/#status \{ font-size: 16px; \}/.test(page), 'status message has its own font size');
check(!/window\.open/.test(page), 'no scripted navigation in the page');

// ---------- Sources: ui.js owns both, render.js no longer paints them ------
check(/scoreEl\.textContent = 'Score: ' \+ game\.score/.test(uiSrc), 'ui.js writes the score text');
check(/show\(statusEl, state === GAME_OVER\)/.test(uiSrc), 'ui.js shows the status message only in GAME_OVER');
check(!/Score: /.test(renderSrc), 'render.js paints no score text');
const renderBody = renderSrc.slice(renderSrc.indexOf('export function render()'));
check(!/drawOverlay\(/.test(renderBody), 'the render path paints no game-over overlay');
check(!/Game Over/.test(renderBody), 'the render path carries no game-over wording');

// ---------- Behaviour: run syncViews over stub interface elements ----------
// The stubs hand back a rich element so ui.js can drive the view toggle, the
// readout's inline styles (placeScore) and the stacked-layout decision.
function makeEl(id) {
  const el = { id, textContent: '', classes: new Set(), children: [], style: {} };
  el.classList = {
    toggle: (name, on) => {
      if (on) el.classes.add(name);
      else el.classes.delete(name);
    },
    contains: (name) => el.classes.has(name),
  };
  el.appendChild = (child) => el.children.push(child);
  // The play field is the only element placeScore measures; everything else
  // reports a zero box so the readout's overlay position resolves to no-op.
  el.getBoundingClientRect = () => FIELD_BOX;
  return el;
}

const FIELD_BOX = { left: 40, top: 100, width: 300, height: 600 };
const registry = {};
for (const id of ['ui', 'score', 'status', 'menu-view', 'records-view', 'help-view',
                  'records-list', 'records-empty', 'game']) {
  registry[id] = makeEl(id);
}
const menuItems = [makeEl('menu-item-play'), makeEl('menu-item-records'), makeEl('menu-item-help')];

globalThis.document = {
  getElementById: (id) => registry[id],
  querySelectorAll: (selector) => menuItems,
  createElement: (tag) => makeEl(tag),
};
// The stacked-layout decision reads the viewport; a phone width forces stacking.
globalThis.window = { innerWidth: 390, innerHeight: 844 };

const consts = await import('../js/constants.js');
const ui = await import('../js/ui.js');
const state = await import('../js/state.js');
const game = state.game;

ui.initUi();
ui.syncViews(null);

check(game.state === consts.MENU, 'the stubbed game starts in MENU');
check(registry.score.textContent === 'Score: 0', 'the readout shows 0 at game start');
check(registry['menu-view'].classes.has('on'), 'the menu view is on screen in MENU');
check(!registry.status.classes.has('on'), 'the game-over message is hidden outside GAME_OVER');
check(!registry['records-view'].classes.has('on'), 'the records view is hidden in MENU');

// The readout mirrors `game.score` verbatim, so a +1 per cell eaten is a +1
// here; stepping the score is the contract under test.
game.score = 7;
ui.syncViews(null);
check(registry.score.textContent === 'Score: 7', 'the readout follows the score one-for-one');

// ---------- Field visibility and the readout's overlay rule -----------------
// The field is on screen only in PLAYING and GAME_OVER; while it is hidden the
// readout returns to the interface flow (clears its inline styles), and where
// the interface stacks above the field it floats over the top edge.
game.state = consts.MENU;
ui.syncViews(null);
check(!registry['game'].classes.has('on'), 'the field is hidden while MENU is shown');
check(registry.score.style.position === '', 'the readout clears its inline styles while the field is hidden');

game.state = consts.PLAYING;
ui.syncViews(null);
check(registry['game'].classes.has('on'), 'the field is on screen in PLAYING');
check(registry.score.style.position === '', 'the readout stays in normal flow (no overlay) on stacked layouts');
check(registry.score.style.top === '', 'the readout does not pin to the field top edge');

game.state = consts.GAME_OVER;
ui.syncViews(null);
check(registry['game'].classes.has('on'), 'the final board stays visible in GAME_OVER');
check(registry.status.classes.has('on'), 'the game-over message appears when a game ends');
check(registry.score.textContent === 'Score: 7', 'the final score stays readable beside the field');
check(!registry['menu-view'].classes.has('on'), 'the menu view is hidden in GAME_OVER');
check(!registry['help-view'].classes.has('on'), 'no other view leaks into GAME_OVER');

console.log(failures === 0 ? 'HUD check passed.' : 'HUD check failed: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
