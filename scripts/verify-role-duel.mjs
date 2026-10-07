// Headless browser check for the role duel (change: role-selection-bot-snake,
// task 9.3). It drives the real page in Chromium: the role sub-menu, piece
// shift/rotate with the shared cooldown, the bot snake, the bot piece, both
// scores, the game-over winner line, and the records markers.
//
// Run: node scripts/verify-role-duel.mjs
//
// Two page-side rules shape this script:
// 1. page.waitForFunction does not await an async predicate — a returned
//    Promise is truthy, so every predicate below is synchronous.
// 2. Playwright serializes a predicate into the page, so Node-side variables
//    are not visible inside it. Values are passed as the second argument.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { COLS, ROWS, BASE_FALL, SNAKE_SPEED_DELTA } from '../js/constants.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = 'http://duel.test/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
// Ticks of one snake step at the base fall speed.
const SNAKE_BASE_TICKS = 1 / BASE_FALL - SNAKE_SPEED_DELTA;

let failures = 0;
const DEBUG = process.env.DUEL_DEBUG === '1';

function check(cond, msg) {
  if (cond) console.log('  \u2713 ' + msg);
  else {
    console.log('  \u2717 FAIL: ' + msg);
    failures++;
  }
}

// Stage dump, only when DUEL_DEBUG=1.
function dump(label, value) {
  if (DEBUG) console.log('  [debug] ' + label + ': ' + JSON.stringify(value));
}

// Serve the repo over HTTP so ES modules resolve; no local server needed.
async function serve(page) {
  await page.route(BASE + '**', (route) => {
    const file = path.join(ROOT, decodeURIComponent(route.request().url().slice(BASE.length)));
    try {
      return route.fulfill({
        status: 200,
        contentType: TYPES[path.extname(file)] ?? 'application/octet-stream',
        body: readFileSync(file),
      });
    } catch {
      return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    }
  });
}

// Publish the live game object on the page so predicates can read it without
// an await. `game` is mutated in place, so the reference stays valid.
async function expose(page) {
  await page.evaluate(async () => {
    window.__game = (await import('/js/state.js')).game;
  });
}

// waitForFunction that reports instead of throwing. `arg` is handed to the
// predicate so it can use a Node-side value.
async function until(page, fn, arg, timeout = 10000) {
  try {
    await page.waitForFunction(fn, arg, { timeout });
    return true;
  } catch {
    return false;
  }
}

const stateIs = (page, state, timeout = 5000) =>
  until(page, (wanted) => window.__game.state === wanted, state, timeout);

// A view class is applied on the next rendered frame. `page.isVisible` reads
// the DOM at one instant and does not wait, so every visibility check goes
// through this waiter.
async function shown(page, selector, want, timeout = 3000) {
  const settled = await until(page, (probe) => {
    const el = document.querySelector(probe.sel);
    return Boolean(el) && el.checkVisibility() === probe.want;
  }, { sel: selector, want }, timeout);
  return settled && (await page.isVisible(selector)) === want;
}

// Read the live game state from the page.
async function snapshot(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const piece = g.pieces[0];
    return {
      tick: g.tick,
      state: g.state,
      role: g.role,
      snakeScore: g.snakeScore,
      tetrisScore: g.tetrisScore,
      head: g.snake[0],
      length: g.snake.length,
      landed: g.landedBlocks,
      moveAcc: g.pieceMoveAcc,
      piece: piece ? { col: piece.col, row: piece.row, shape: piece.shape.map((s) => s.join(',')) } : null,
    };
  });
}

// Nearest solid cell from the snake head, on the wrap-around board.
async function nearestSolid(page) {
  return page.evaluate(async () => {
    const g = window.__game;
    const { getCell } = await import('/js/grid.js');
    const { COLS, ROWS, SOLID } = await import('/js/constants.js');
    const head = g.snake[0];
    let best = null;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (getCell(r, c) !== SOLID) continue;
        const dr = Math.abs(head.r - r);
        const dc = Math.abs(head.c - c);
        const d = Math.min(dr, ROWS - dr) + Math.min(dc, COLS - dc);
        if (d === 0) continue;
        if (!best || d < best.d) best = { d, r, c };
      }
    }
    return best;
  });
}

// Wrap-aware key that moves the head one step toward the target cell.
function steerKey(head, target) {
  const dr = target.r - head.r;
  const dc = target.c - head.c;
  const vert = Math.min(Math.abs(dr), ROWS - Math.abs(dr));
  const horiz = Math.min(Math.abs(dc), COLS - Math.abs(dc));
  const down = dr > 0 && dr <= ROWS / 2;
  const right = dc > 0 && dc <= COLS / 2;
  if (vert === 0) return right ? 'ArrowRight' : 'ArrowLeft';
  if (horiz === 0) return down ? 'ArrowDown' : 'ArrowUp';
  return vert <= horiz ? (down ? 'ArrowDown' : 'ArrowUp') : (right ? 'ArrowRight' : 'ArrowLeft');
}

// Steer the snake into the nearest solid block until the game ends. Valid only
// while the player controls the snake.
async function steerIntoBlock(page, maxSteps = 80) {
  for (let i = 0; i < maxSteps; i++) {
    if (await stateIs(page, 'GAME_OVER', 200)) return true;
    const target = await nearestSolid(page);
    if (!target) return false;
    await page.keyboard.press(steerKey((await snapshot(page)).head, target));
    await page.waitForTimeout(120);
  }
  return stateIs(page, 'GAME_OVER', 20000);
}

// Fresh page sitting at the starting menu. All pages share one context so the
// high-score board written by one game is visible to the next page.
async function freshPage(context) {
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('  \u2717 page error: ' + err.message));
  await serve(page);
  await page.goto(BASE + 'snaketris.html');
  await expose(page);
  await stateIs(page, 'MENU', 10000);
  return page;
}

// Tap the exact centre of the field and check that the falling piece rotates.
// A rotation blocked by a wall or a block leaves the shape unchanged, so the
// tap is repeated until a piece can turn.
async function centreTapRotates(page) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const before = await snapshot(page);
    if (before.state !== 'PLAYING' || !before.piece) return false;
    await page.click('#game');
    const after = await snapshot(page);
    if (after.piece && after.piece.shape.join('|') !== before.piece.shape.join('|')) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

// Open the role sub-menu and start one game in the given role.
async function playRole(context, role) {
  const page = await freshPage(context);
  await page.click('#menu-item-play');
  await stateIs(page, 'SELECT_ROLE');
  await page.click('#role-item-' + role);
  const ok = await until(page, (wanted) => {
    const g = window.__game;
    return g.state === 'PLAYING' && g.role === wanted;
  }, role, 5000);
  if (!ok) console.log('  (state after the role click: ' + JSON.stringify(await snapshot(page)) + ')');
  return { page, ok };
}

const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== Menu and role screen ===');
const menu = await freshPage(context);
const menuItems = await menu.$$eval('#menu-items > li', (els) => els.map((e) => e.textContent));
check(menuItems.length === 3, 'main menu has three items: ' + menuItems.join(', '));
await menu.click('#menu-item-play');
await stateIs(menu, 'SELECT_ROLE');
const roleTexts = await menu.$$eval('#role-items > li', (els) => els.map((e) => e.textContent));
check(roleTexts.length === 2, 'role screen has two items: ' + roleTexts.join(' | '));
check(roleTexts[0].includes('\u{1F40D}'), 'the Snake item carries the snake marker');
check(roleTexts[1].includes('\u{1F3D7}'), 'the Tetris item carries the builder marker');
check(await shown(menu, '#role-view', true), 'the role screen is on screen in SELECT_ROLE');
check(await shown(menu, '#menu-title', false), 'the menu title is hidden on the role screen');
check(await shown(menu, '#menu-items', false), 'the menu items are hidden on the role screen');
check(await shown(menu, '#github-link', false), 'the GitHub link is hidden on the role screen');
check(await shown(menu, '#role-back', true), 'the role screen shows a Back control');
await menu.click('#role-back');
check(await stateIs(menu, 'MENU'), 'Back returns to the main menu');
check(await shown(menu, '#menu-items', true), 'the menu items are visible again after Back');
check(await shown(menu, '#role-view', false), 'the role screen is hidden after Back');
await menu.close();

console.log('=== Tetris role: piece control and cooldown ===');
const tetris = await playRole(context, 'tetris');
// The page that carries the judged Tetris game; the retry replaces it.
let tetrisPage = tetris.page;
dump('tetris start', await snapshot(tetrisPage));
check(tetris.ok, 'choosing Tetris starts a Tetris-role game');
check(await until(tetrisPage, () => window.__game.pieces.length > 0, undefined, 5000),
  'a piece is falling in Tetris role');

const before = await snapshot(tetrisPage);
check(before.snakeScore === 0 && before.tetrisScore === 0, 'both scores start at 0');
check(before.length === 3, 'the bot snake starts with three segments');

// Open the shift gate while a piece is still in the air, then press twice
// inside one interval, in the direction that keeps the piece on the board.
const gateOpen = await until(tetris.page, (ticks) => {
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
}

let played = await snapshot(tetrisPage);
check(await centreTapRotates(tetrisPage),
  'a tap in the centre of the field rotates the falling piece');
const bothScored = (page) => until(page, () => {
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
  const retry = await playRole(context, 'tetris');
  await bothScored(retry.page);
  played = await snapshot(retry.page);
  dump('tetris retry', played);
  tetrisPage = retry.page;
}
check(played.snakeScore > 0, 'the bot snake ate cells: Snake ' + played.snakeScore);
check(played.tetrisScore > 0, 'a piece landed and paid the Tetris side: Tetris ' + played.tetrisScore);
check((played.snakeScore - (played.length - 3)) % 4 === 0,
  'snake score minus growth is a multiple of the whole-piece bonus: ' + played.snakeScore + ' - ' + (played.length - 3));
const hud = await tetrisPage.evaluate(() => document.getElementById('score').textContent);
check(/Snake \d+  \u00b7  Tetris \d+/.test(hud), 'HUD shows both labelled scores: ' + hud);
// Only a finished game writes its score to the board.
check(await stateIs(tetrisPage, 'GAME_OVER', 60000), 'the Tetris-role game ended and recorded its score');
await tetris.page.close();
if (tetrisPage !== tetris.page) await tetrisPage.close();

console.log('=== Snake role: the bot drives the pieces ===');
const snake = await playRole(context, 'snake');
check(snake.ok, 'choosing Snake starts a Snake-role game');
check(await until(snake.page, () => window.__game.pieces.length > 0, undefined, 5000),
  'a piece is falling in Snake role');
const botPieceStart = await snapshot(snake.page);
check(botPieceStart.piece !== null, 'the bot leaves a piece in the air for the player to see');
check(await until(snake.page, () => window.__game.landedBlocks > 0, undefined, 60000),
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
await until(snake.page, () => document.querySelectorAll('#records-list > li').length > 0, undefined, 5000);
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

console.log('');
if (failures === 0) {
  console.log('Role-duel browser check passed.');
  process.exit(0);
}
console.log('Role-duel browser check FAILED: ' + failures + ' assertion(s) failed.');
process.exit(1);
