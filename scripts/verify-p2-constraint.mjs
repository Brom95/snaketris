// Headless browser check for P2 keyboard constraint (task 3.2).
// Drives the real page in Chromium: enters SELECT_ROLE with two-player mode,
// selects a role to reach SELECT_CONTROL, then P1 locks WASD with one key press,
// asserts P2 cannot reuse WASD (one key press) but can use arrows (one key press).
// Each layout key locks the model immediately; there is no Enter-confirm step.

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

// P1 locks WASD with one key press; no Enter-confirm.
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p1Model === 'wasd', undefined, 3000),
  'P1 locks WASD in one key press');

// P2 cannot reuse WASD (pressing W again is rejected in one step).
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p2Model === null || window.__game.p2Model !== 'wasd', undefined, 3000),
  'P2 cannot reuse P1\'s WASD model');

// P2 locks arrows with one key press; no Enter-confirm.
await page.keyboard.press('ArrowUp');
check(await waitFor(page, () => window.__game.p2Model === 'arrows', undefined, 3000),
  'P2 locks Arrows in one key press');

console.log('');
report('verify-p2-constraint', 0);
await browser.close();
