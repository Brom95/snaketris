// Headless check for the HUD: the score readout and the game-over message are
// page elements driven by ui.js, and the canvas paints neither.
import { check, report, stubDom } from './harness.mjs';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../snaketris.html', import.meta.url), 'utf8');
const uiSrc = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');

// ---------- Page: the readout and the status message exist as elements ------
check(/<p id="score"[^>]*>Score: 0<\/p>/.test(page), 'score readout is a page element starting at 0');
check(/<p id="timer" class="view">/.test(page), 'the countdown is a hidden page element beside the score');
check(/<p id="status" class="view">Game Over/.test(page), 'game-over message is a hidden page element');
check(/#score \{ font-size: 16px; \}/.test(page), 'score readout has its own font size');
check(/#timer \{ font-size: 16px; \}/.test(page), 'the countdown readout has its own font size');
check(/#status \{ font-size: 16px; \}/.test(page), 'status message has its own font size');
check(!/window\.open/.test(page), 'no scripted navigation in the page');

// ---------- Sources: ui.js owns both, render.js no longer paints them ------
check(/scoreEl\.textContent = scoreText\(\)/.test(uiSrc), 'ui.js writes the score text from the side scores');
check(/'Snake ' \+ game\.play\.snakeScore \+ '  ·  Tetris ' \+ game\.play\.tetrisScore/.test(uiSrc), 'the readout text carries both side scores');
check(/show\(statusEl, state === GAME_OVER\)/.test(uiSrc), 'ui.js shows the status message only in GAME_OVER');
check(/timerEl\.textContent = String\(remainingSeconds\(\)\)/.test(uiSrc), 'ui.js writes the countdown from the remaining seconds');
check(/show\(timerEl, state === PLAYING \|\| state === GAME_OVER\)/.test(uiSrc), 'ui.js shows the countdown only while a match runs or has just ended');
check(!/position: fixed/.test(uiSrc), 'ui.js never pins the readout over the field');
check(/FIELD_V_GAP_MOBILE/.test(uiSrc), 'ui.js uses the mobile gap when it measures the interface band');
check(!/Score: /.test(renderSrc), 'render.js paints no score text');
const renderBody = renderSrc.slice(renderSrc.indexOf('export function render()'));
check(!/drawOverlay\(/.test(renderBody), 'the render path paints no game-over overlay');
check(!/Game Over/.test(renderBody), 'the render path carries no game-over wording');

// ---------- Behaviour: run syncViews over stub interface elements ----------
// The play field is the only element placeScore measures; everything else
// reports a zero box so the readout's overlay position resolves to no-op.
const FIELD_BOX = { left: 40, top: 100, right: 340, bottom: 700, width: 300, height: 600 };
// The phone viewport stacks the interface band above the field, so both readouts
// report boxes that end above the field's top edge.
const SCORE_BOX = { left: 40, top: 40, right: 340, bottom: 64, width: 300, height: 24 };
const TIMER_BOX = { left: 40, top: 68, right: 340, bottom: 92, width: 300, height: 24 };
const dom = stubDom({
  elements: ['ui', 'score', 'timer', 'status', 'menu-view', 'role-view', 'records-view', 'help-view',
    'records-list', 'records-empty'],
  lists: { '#menu-items > li': ['menu-item-play', 'menu-item-records', 'menu-item-help'] },
  rects: { game: FIELD_BOX, score: SCORE_BOX, timer: TIMER_BOX },
  // The stacked-layout decision reads the viewport; a phone width forces stacking.
  window: { innerWidth: 390, innerHeight: 844 },
});

const { MENU, PLAYING, GAME_OVER } = await import('../js/constants.js');
const { initUi, syncViews, layoutRule } = await import('../js/ui.js');
const { game } = await import('../js/state.js');

initUi();
syncViews(null);

check(game.screen.state === MENU, 'the stubbed game starts in MENU');
check(dom.el('score').textContent === 'Snake 0  ·  Tetris 0', 'the readout shows both side scores at 0 at game start');
check(dom.classes('menu-view').has('on'), 'the menu view is on screen in MENU');
check(!dom.classes('status').has('on'), 'the game-over message is hidden outside GAME_OVER');
check(!dom.classes('records-view').has('on'), 'the records view is hidden in MENU');

// Each side score is reported on its own, so stepping one side moves only
// that side's number in the readout.
game.play.snakeScore = 3;
game.play.tetrisScore = 1;
syncViews(null);
check(dom.el('score').textContent === 'Snake 3  ·  Tetris 1', 'the readout follows each side score');

// ---------- Field visibility and the readout's placement rule ---------------
// The field is on screen only in PLAYING and GAME_OVER; while it is hidden the
// readout returns to the interface flow (clears its inline styles), and it
// stays in that flow on stacked layouts instead of overlaying the field.
game.screen.state = MENU;
syncViews(null);
check(!dom.classes('game').has('on'), 'the field is hidden while MENU is shown');
check(!dom.classes('timer').has('on'), 'the countdown is hidden while MENU is shown');
check(dom.styles('score').position === '', 'the readout clears its inline styles while the field is hidden');

game.screen.state = PLAYING;
syncViews(null);
check(dom.classes('game').has('on'), 'the field is on screen in PLAYING');
check(dom.classes('timer').has('on'), 'the countdown is on screen while playing');
check(dom.el('timer').textContent === '60', 'the countdown reads plain seconds with no unit suffix');
check(dom.styles('score').position === '', 'the readout stays in normal flow (no overlay) on stacked layouts');
check(dom.styles('score').top === '', 'the readout does not pin to the field top edge');
check(dom.styles('timer').position === '', 'the countdown shares the score readout flow');

game.screen.state = GAME_OVER;
syncViews(null);
check(dom.classes('game').has('on'), 'the final board stays visible in GAME_OVER');
check(dom.classes('timer').has('on'), 'the countdown stays on screen when the match ends');
check(dom.classes('status').has('on'), 'the game-over message appears when a game ends');
check(dom.el('score').textContent === 'Snake 3  ·  Tetris 1', 'the final side scores stay readable when the game ends');
check(!dom.classes('menu-view').has('on'), 'the menu view is hidden in GAME_OVER');
check(!dom.classes('help-view').has('on'), 'no other view leaks into GAME_OVER');

// ---------- The countdown placement in both layouts -----------------------
// The stub boxes declare where each readout really sits, so the check answers
// the placement rule itself: inside the interface band when it stacks, outside
// the field when the interface column sits beside it.
const stackedTimer = dom.el('timer').getBoundingClientRect();
check(!!dom.el('timer'), 'the countdown box is queryable in the harness');
check(stackedTimer.bottom <= FIELD_BOX.top, 'stacked layout: the countdown sits inside the interface band above the field');

const BESIDE_FIELD_BOX = { left: 400, top: 100, right: 700, bottom: 580, width: 300, height: 480 };
const BESIDE_TIMER_BOX = { left: 40, top: 120, right: 340, bottom: 144, width: 300, height: 24 };
dom.setViewport(1200, 800);
dom.setRect('game', BESIDE_FIELD_BOX);
dom.setRect('timer', BESIDE_TIMER_BOX);
syncViews(null);
check(!layoutRule().stacked, 'the wide viewport answers the beside layout');
const besideTimer = dom.el('timer').getBoundingClientRect();
check(besideTimer.right <= BESIDE_FIELD_BOX.left, 'beside layout: the countdown sits outside the field');

report('HUD check');
