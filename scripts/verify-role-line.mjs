// Headless browser check for the role line (task 4.2).
// Drives the real page in Chromium: enters SELECT_ROLE with two-player mode,
// sets P1/P2 roles, and asserts the role line shows "P1: X / P2: Y".
//
// Run: node scripts/verify-role-line.mjs

import { chromium } from '@playwright/test';
import path from 'node:path';
import { check, freshPage, report, waitFor, stateIs } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== Role line ===');
const page = await freshPage(context, ROOT);
await page.click('#menu-item-two-player');
check(await stateIs(page, 'SELECT_WAY'), 'clicking Two Players opens the way sub-menu');
await page.click('#way-item-local');
check(await stateIs(page, 'SELECT_DURATION'), 'confirming "Same computer" opens the duration sub-menu');
await page.click('#duration-item-1');
check(await stateIs(page, 'SELECT_ROLE'), 'confirming 1 minute opens the role screen');

// Set P1/P2 roles directly on the game object.
await page.evaluate(() => {
  window.__game.screen.p1Role = 'snake';
  window.__game.screen.p2Role = 'tetris';
});
await page.waitForTimeout(200);
const line = await page.evaluate(
  () => document.getElementById('role-line').textContent
);
check(line === 'P1: snake  /  P2: tetris', 'the role line shows "P1: snake / P2: tetris"');

console.log('');
report('verify-role-line', 0);
await browser.close();
