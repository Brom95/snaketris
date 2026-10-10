// Headless browser check for P2 keyboard constraint (task 3.2).
// Drives the real page in Chromium: enters SELECT_ROLE with two-player mode,
// P1 confirms WASD, then asserts P2 cannot reuse WASD but can use arrows.
//
// Run: node scripts/verify-p2-constraint.mjs

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

// P1 confirms WASD.
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p1Model === 'wasd', undefined, 3000),
  'P1 confirms WASD');

// P2 cannot reuse WASD (pressing W again does not change P2's model).
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p2Model === null || window.__game.p2Model !== 'wasd', undefined, 3000),
  'P2 cannot reuse P1\'s WASD model');

// P2 can use arrows.
await page.keyboard.press('ArrowUp');
check(await waitFor(page, () => window.__game.p2Model === 'arrows', undefined, 3000),
  'P2 confirms Arrows');

console.log('');
report('verify-p2-constraint', 0);
await browser.close();
