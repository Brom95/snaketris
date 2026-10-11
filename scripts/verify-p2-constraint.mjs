// Headless browser check for P2 keyboard constraint (task 3.2).
// Drives the real page in Chromium: enters SELECT_ROLE with two-player mode,
// selects a role to reach SELECT_CONTROL, P1 selects WASD then confirms,
// then asserts P2 cannot reuse WASD but can use arrows.

import { chromium } from '@playwright/test';
import path from 'node:path';
import { check, freshPage, report, waitFor, stateIs } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== P2 keyboard constraint ===');
const page = await freshPage(context, ROOT);
await page.click('#menu-item-two-player');
check(await stateIs(page, 'SELECT_ROLE'), 'clicking Two Players opens the role screen');

// Select a role to reach SELECT_CONTROL.
await page.click('#role-item-snake');
check(await stateIs(page, 'SELECT_CONTROL'), 'selecting a role reaches SELECT_CONTROL');

// P1 selects WASD then confirms.
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p1Selection === 'wasd', undefined, 3000),
  'P1 selects WASD');

await page.keyboard.press('Enter');
check(await waitFor(page, () => window.__game.p1Model === 'wasd', undefined, 3000),
  'P1 confirms WASD');

// P2 cannot reuse WASD (pressing W again does not set P2's selection).
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p2Selection === null || window.__game.p2Selection !== 'wasd', undefined, 3000),
  'P2 cannot reuse P1\'s WASD model');

// P2 can use arrows.
await page.keyboard.press('ArrowUp');
check(await waitFor(page, () => window.__game.p2Selection === 'arrows', undefined, 3000),
  'P2 selects Arrows');

await page.keyboard.press('Enter');
check(await waitFor(page, () => window.__game.p2Model === 'arrows', undefined, 3000),
  'P2 confirms Arrows');

console.log('');
report('verify-p2-constraint', 0);
await browser.close();
