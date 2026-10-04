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
check(/<p id="score">Score: 0<\/p>/.test(page), 'score readout is a page element starting at 0');
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
function makeEl(id) {
  const el = { id, textContent: '', classes: new Set(), children: [] };
  el.classList = {
    toggle: (name, on) => {
      if (on) el.classes.add(name);
      else el.classes.delete(name);
    },
    contains: (name) => el.classes.has(name),
  };
  el.appendChild = (child) => el.children.push(child);
  return el;
}

const registry = {};
for (const id of ['ui', 'score', 'status', 'menu-view', 'records-view', 'help-view',
                  'records-list', 'records-empty']) {
  registry[id] = makeEl(id);
}
const menuItems = [makeEl('menu-item-play'), makeEl('menu-item-records'), makeEl('menu-item-help')];

globalThis.document = {
  getElementById: (id) => registry[id],
  querySelectorAll: (selector) => menuItems,
  createElement: (tag) => makeEl(tag),
};

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

game.state = consts.GAME_OVER;
ui.syncViews(null);
check(registry.status.classes.has('on'), 'the game-over message appears when a game ends');
check(registry.score.textContent === 'Score: 7', 'the final score stays readable beside the field');
check(!registry['menu-view'].classes.has('on'), 'the menu view is hidden in GAME_OVER');
check(!registry['help-view'].classes.has('on'), 'no other view leaks into GAME_OVER');

console.log(failures === 0 ? 'HUD check passed.' : 'HUD check failed: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
