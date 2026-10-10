// Headless browser check for the role duel (change: role-selection-bot-snake,
// task 9.3). It drives the real page in Chromium: the role sub-menu, the static
// menu geometry, piece shift/rotate with the shared cooldown, the bot snake, the
// bot piece, both scores, the game-over winner line, and the records markers.
//
// Run: node scripts/verify-role-duel.mjs
//
// The page plumbing (serving, waiting, snapshots, role start) lives in
// scripts/harness.mjs.
import { chromium } from '@playwright/test';
import path from 'node:path';
import { BASE_FALL, SNAKE_SPEED_DELTA, MAX_SNAKE_LEN, MENU_ITEMS } from '../js/constants.js';
import {
  boxesAtEverySelection,
  centreTapRotates,
  check,
  dump,
  freshPage,
  playRole,
  report,
  snapshot,
  stable,
  stateIs,
  steerIntoBlock,
  shown,
  waitFor,
} from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
// Ticks of one snake step at the base fall speed.
const SNAKE_BASE_TICKS = 1 / BASE_FALL - SNAKE_SPEED_DELTA;

const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== Menu and role screen ===');
const menu = await freshPage(context, ROOT);
const menuItems = await menu.$$eval('#menu-items > li', (els) => els.map((e) => e.textContent));
check(menuItems.length === MENU_ITEMS.length, 'main menu has ' + MENU_ITEMS.length + ' items: ' + menuItems.join(', '));
await menu.click('#menu-item-play');
await stateIs(menu, 'SELECT_ROLE');
const roleTexts = await menu.$$eval('#role-items > li', (els) => els.map((e) => e.textContent));
check(roleTexts.length === 3, 'role screen has three selectable items: ' + roleTexts.join(' | '));
check(roleTexts[0].includes('\u{1F40D}'), 'the Snake item carries the snake marker');
check(roleTexts[1].includes('\u{1F3D7}'), 'the Tetris item carries the builder marker');
check(roleTexts[2] === 'Back', 'the third role item is Back');
check(await shown(menu, '#role-view', true), 'the role screen is on screen in SELECT_ROLE');
check(await shown(menu, '#menu-title', false), 'the menu title is hidden on the role screen');
check(await shown(menu, '#menu-items', false), 'the menu items are hidden on the role screen');
check(await shown(menu, '#github-link', false), 'the GitHub link is hidden on the role screen');
check(await shown(menu, '#role-back', true), 'the role screen shows a Back control');
await menu.click('#role-back');
check(await stateIs(menu, 'MENU'), 'Back returns to the main menu');
check(await shown(menu, '#menu-items', true), 'the menu items are visible again after Back');
check(await shown(menu, '#role-view', false), 'the role screen is hidden after Back');

console.log('=== Static menu geometry ===');
const menuSets = await boxesAtEverySelection(menu, '#menu-items > li', 3, 'ArrowDown');
check(stable(menuSets, 'width'), 'every menu item keeps its width while the arrow moves: ' +
  menuSets.map((s) => s.map((b) => b.width).join('/')).join(' | '));
check(stable(menuSets, 'left'), 'the menu list does not shift horizontally');
check(stable(menuSets, 'font'), 'menu items use one font size: ' + menuSets[0][0].font);
check(stable(menuSets, 'weight'), 'menu items keep one font weight: ' + menuSets[0][0].weight);
check(menuSets.every((set) => set.filter((b) => b.marker === '1').length === 1),
  'exactly one marker is visible at every selection');
check(menuSets.every((set) => set.every((b) => b.marker === '0' || b.marker === '1')),
  'every item carries the marker, hidden or shown');

console.log('=== Static role-screen geometry ===');
await menu.click('#menu-item-play');
await stateIs(menu, 'SELECT_ROLE');
const roleSets = await boxesAtEverySelection(menu, '#role-items > li', 3, 'ArrowDown');
check(stable(roleSets, 'width'), 'every role item keeps its width while the arrow moves: ' +
  roleSets.map((s) => s.map((b) => b.width).join('/')).join(' | '));
check(stable(roleSets, 'left'), 'the role list does not shift horizontally');
check(stable(roleSets, 'font'), 'role items use one font size: ' + roleSets[0][0].font);
check(stable(roleSets, 'weight'), 'role items keep one font weight: ' + roleSets[0][0].weight);
check(roleSets.every((set) => set.filter((b) => b.marker === '1').length === 1),
  'the arrow reaches every role item, including Back');
await menu.keyboard.press('ArrowDown');
await menu.keyboard.press('ArrowDown');
check(await waitFor(menu, () => window.__game.roleSelect === 2, undefined, 3000),
  'the arrow lands on the Back item');
await menu.waitForTimeout(120);
check(await menu.evaluate(() => getComputedStyle(document.getElementById('role-back'), '::before').opacity === '1'),
  'the Back item shows the arrow marker when selected');
await menu.close();

console.log('=== Tetris role: piece control and cooldown ===');
const tetris = await playRole(context, 'tetris', ROOT);
// The page that carries the judged Tetris game; the retry replaces it.
let tetrisPage = tetris.page;
dump('tetris start', await snapshot(tetrisPage));
check(tetris.ok, 'choosing Tetris starts a Tetris-role game');
check(await waitFor(tetrisPage, () => window.__game.pieces.length > 0, undefined, 5000),
  'a piece is falling in Tetris role');

const before = await snapshot(tetrisPage);
check(before.snakeScore === 0 && before.tetrisScore === 0, 'both scores start at 0');
check(before.length === 3, 'the bot snake starts with three segments');

// Open the shift gate while a piece is still in the air, then press twice
// inside one interval, in the direction that keeps the piece on the board.
const gateOpen = await waitFor(tetris.page, (ticks) => {
  const g = window.__game;
  return g.state === 'PLAYING' && g.pieces.length > 0 && g.pieceMoveAcc >= ticks;
}, SNAKE_BASE_TICKS, 20000);
check(gateOpen, 'the shared shift gate opens after one snake step');
if (gateOpen) {
  const gate = await snapshot(tetris.page);
  dump('gate open', gate);
  const key = gate.piece.col < 5 ? 'ArrowRight' : 'ArrowLeft';
  await tetris.page.keyboard.press(key);
  await tetris.page.keyboard.press(key);
  await tetris.page.waitForTimeout(200);
  const afterShift = await snapshot(tetris.page);
  dump('after shift', afterShift);
  const moved = afterShift.piece ? Math.abs(afterShift.piece.col - gate.piece.col) : -1;
  check(moved === 1,
    'two presses inside one snake step shift the piece exactly one cell: ' +
      gate.piece.col + ' -> ' + (afterShift.piece ? afterShift.piece.col : 'gone'));

  const rotated = await snapshot(tetris.page);
  await tetris.page.keyboard.press('ArrowUp');
  let afterRotate = await snapshot(tetris.page);
  if (rotated.piece && afterRotate.piece &&
      afterRotate.piece.shape.join('|') === rotated.piece.shape.join('|')) {
    await tetris.page.keyboard.press('ArrowDown');
    afterRotate = await snapshot(tetris.page);
  }
  check(rotated.piece && afterRotate.piece &&
      afterRotate.piece.shape.join('|') !== rotated.piece.shape.join('|'),
    'the arrow keys rotate the piece: ' + rotated.piece.shape.join('|') +
      ' -> ' + (afterRotate.piece ? afterRotate.piece.shape.join('|') : 'gone'));

  // A rotation must not stop the fall: the next tick still moves the piece.
  const fall = await tetris.page.evaluate(async () => {
    const pieces = await import('/js/pieces.js');
    const p = window.__game.pieces[0];
    if (!p) return null;
    const row = p.row;
    const turned = pieces.rotatePiece(p, true);
    pieces.stepPiece(p);
    const landed = window.__game.pieces.indexOf(p) === -1;
    return { turned, advanced: p.row > row || landed, speed: pieces.currentFallSpeed() };
  });
  check(fall !== null && fall.advanced,
    'a rotation does not interrupt the fall (turn ' + fall.turned + ', speed ' + fall.speed + ')');
}

let played = await snapshot(tetrisPage);
check(await centreTapRotates(tetrisPage),
  'a tap in the centre of the field rotates the falling piece');
const bothScored = (page) => waitFor(page, () => {
  const g = window.__game;
  return (g.snakeScore > 0 && g.tetrisScore > 0) || g.state === 'GAME_OVER';
}, undefined, 60000);
await bothScored(tetrisPage);
played = await snapshot(tetrisPage);
dump('tetris end', played);
if (played.snakeScore === 0) {
  // The bot snake can reach a solid block before it intercepts a falling piece.
  // One more game before judging the eating path.
  console.log('  (the bot snake ate nothing in the first Tetris game: ' + JSON.stringify(played) + ')');
  const retry = await playRole(context, 'tetris', ROOT);
  await bothScored(retry.page);
  played = await snapshot(retry.page);
  dump('tetris retry', played);
  tetrisPage = retry.page;
}
check(played.snakeScore > 0, 'the bot snake ate cells: Snake ' + played.snakeScore);
check(played.tetrisScore > 0, 'a piece landed and paid the Tetris side: Tetris ' + played.tetrisScore);
const eaten = Math.min(played.length, MAX_SNAKE_LEN) - 3 + played.overflow;
check((played.snakeScore - eaten) % 4 === 0,
  'snake score minus growth is a multiple of the whole-piece bonus: ' + played.snakeScore + ' - ' + eaten);
const hud = await tetrisPage.evaluate(() => document.getElementById('score').textContent);
check(/Snake \d+  \u00b7  Tetris \d+/.test(hud), 'HUD shows both labelled scores: ' + hud);
// Only a finished game writes its score to the board.
check(await stateIs(tetrisPage, 'GAME_OVER', 120000), 'the Tetris-role game ended and recorded its score');
await tetris.page.close();
if (tetrisPage !== tetris.page) await tetrisPage.close();

console.log('=== Snake role: the bot drives the pieces ===');
const snake = await playRole(context, 'snake', ROOT);
check(snake.ok, 'choosing Snake starts a Snake-role game');
check(await waitFor(snake.page, () => window.__game.pieces.length > 0, undefined, 5000),
  'a piece is falling in Snake role');
const botPieceStart = await snapshot(snake.page);
check(botPieceStart.piece !== null, 'the bot leaves a piece in the air for the player to see');
check(await waitFor(snake.page, () => window.__game.landedBlocks > 0, undefined, 60000),
  'the bot landed at least one piece');
const botPieceEnd = await snapshot(snake.page);
dump('snake role', botPieceEnd);
check(botPieceEnd.tetrisScore > 0, 'the bot landed blocks and scored: Tetris ' + botPieceEnd.tetrisScore);

const killed = await steerIntoBlock(snake.page);
check(killed, 'the snake ran into a solid block and the game ended');
const status = await snake.page.evaluate(() => document.getElementById('status').textContent);
check(/Game Over \u2014 Snake \d+, Tetris \d+ \u2014 (Snake wins|Tetris wins|Draw)/.test(status),
  'game-over line names the winner and both scores: ' + status);

console.log('=== Records board ===');
// R returns to the menu from GAME_OVER. The board is read on this page, whose
// storage holds the entries written by the games above.
await snake.page.keyboard.press('r');
await stateIs(snake.page, 'MENU');
await snake.page.click('#menu-item-records');
await stateIs(snake.page, 'RECORDS');
await waitFor(snake.page, () => document.querySelectorAll('#records-list > li').length > 0, undefined, 5000);
const stored = await snake.page.evaluate(() => localStorage.getItem('snaketris.highscores'));
dump('stored board', stored);
const rows = await snake.page.$$eval('#records-list > li', (els) => els.map((e) => e.textContent));
check(rows.length > 0, 'the records board lists ' + rows.length + ' entry(ies)');
check(rows.every((r) => r.includes('\u{1F40D}') || r.includes('\u{1F3D7}')),
  'every entry carries a role marker: ' + rows.join(' | '));
check(rows.some((r) => r.includes('\u{1F40D}')), 'a snake-side entry is marked with the snake emoji');
check(rows.some((r) => r.includes('\u{1F3D7}')), 'a tetris-side entry is marked with the builder emoji');
await snake.page.close();

await browser.close();

report('Role-duel browser check');
