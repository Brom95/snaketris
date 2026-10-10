// Headless browser check for "Two Players" menu-item viewport gating (task 4.1).
// Drives the real page in Chromium: asserts the item is present on a wide
// viewport (> UI_STACK_MAX_WIDTH) and absent on a narrow one (≤ it).
//
// Run: node scripts/verify-two-player-gating.mjs

import { chromium } from '@playwright/test';
import path from 'node:path';
import { check, freshPage, report, waitFor } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== Two Players viewport gating ===');

// Wide viewport: item is shown.
let page = await freshPage(context, ROOT);
await page.setViewportSize({ width: 1024, height: 768 });
await page.waitForTimeout(200);
const wideVisible = await page.evaluate(
  () => document.getElementById('menu-item-two-player').style.display !== 'none'
);
check(wideVisible, 'the Two Players item is shown on a wide viewport (1024px)');
await page.close();

// Narrow viewport: item is hidden.
page = await freshPage(context, ROOT);
await page.setViewportSize({ width: 500, height: 768 });
await page.waitForTimeout(200);
const narrowVisible = await page.evaluate(
  () => document.getElementById('menu-item-two-player').style.display !== 'none'
);
check(!narrowVisible, 'the Two Players item is hidden on a narrow viewport (500px)');
await page.close();

console.log('');
report('verify-two-player-gating', 0);
await browser.close();
