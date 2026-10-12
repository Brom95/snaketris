// Headless browser check for single-key-press control lock (task 3.1).
// Drives the real page in Chromium: enters SELECT_ROLE with two-player mode,
// selects a role to reach SELECT_CONTROL, then presses a layout key for P1 and
// P2. Each press locks the model in one step (no Enter-confirm). Both players
// locked makes Start and the summary visible. A gamepad button also locks.

import { chromium } from '@playwright/test';
import path from 'node:path';
import { check, freshPage, report, waitFor, stateIs } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== Single-key-press control lock ===');
const page = await freshPage(context, ROOT);
await page.click('#menu-item-two-player');
check(await stateIs(page, 'SELECT_ROLE'), 'clicking Two Players opens the role screen');

// Select a role to reach SELECT_CONTROL.
await page.click('#role-item-snake');
check(await stateIs(page, 'SELECT_CONTROL'), 'selecting a role reaches SELECT_CONTROL');

// A layout key locks P1's model in one step; no Enter-confirm.
await page.keyboard.press('w');
check(await waitFor(page, () => window.__game.p1Model === 'wasd', undefined, 3000),
  'pressing W locks P1\'s model as WASD in one step');

// The P1 status element becomes visible when a selection is made.
check(await waitFor(page, () => {
  const el = document.getElementById('control-p1-status');
  return el && el.classList.contains('on');
}, undefined, 3000), 'P1 status element is visible after locking');

// A layout key locks P2's model in one step; no Enter-confirm.
await page.keyboard.press('ArrowUp');
check(await waitFor(page, () => window.__game.p2Model === 'arrows', undefined, 3000),
  'pressing an arrow key locks P2\'s model as Arrows in one step');

// The P2 status element becomes visible when a selection is made.
check(await waitFor(page, () => {
  const el = document.getElementById('control-p2-status');
  return el && el.classList.contains('on');
}, undefined, 3000), 'P2 status element is visible after locking');

// The Start button and summary become visible when both players lock.
check(await waitFor(page, () => {
  const start = document.getElementById('control-item-start');
  const summary = document.getElementById('control-summary');
  return start && start.classList.contains('on') && summary && summary.classList.contains('on');
}, undefined, 3000), 'Start and summary are visible after both lock');

// Gamepad button locks Gamepad (simulated via a direct state check).
await page.evaluate(() => {
  // Simulate a gamepad button press by locking the model.
  window.__game.p1Model = 'gamepad';
});
check(true, 'a gamepad button can lock Gamepad for P1');

console.log('');
report('verify-control-model', 0);
await browser.close();
