// Headless browser check for the "Two Players" viewport gate (task 4.1, moved
// onto one way by tasks 9.1 and 9.2).
//
// Drives the real page in Chromium. The entry itself is offered at every
// viewport width, because each peer of a network match plays on its own device;
// the wide-viewport rule that once hid the whole entry now gates the "Same
// computer" way only. A wide viewport lists the four menu items and shows the
// way sub-menu; the narrow stacked layout lists the same four items and opens
// the way sub-menu too, because choosing which network flow to run under belongs
// to the phone player - only the shared-page way, which needs two pads on one
// device, is hidden there.
//
// Run: node scripts/verify-two-player-gating.mjs

import { chromium } from '@playwright/test';
import path from 'node:path';
import { check, freshPage, report, waitFor, shown, exposeSingletons } from './harness.mjs';
import { MENU_ITEMS, MENU, SELECT_WAY, PAIRING } from '../js/constants.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const context = await browser.newContext();

console.log('=== Two Players viewport gating ===');

// The four menu items, in page order, and the one the arrow cursor highlights.
async function menuListing(page) {
  return await page.evaluate(() => {
    const items = [...document.querySelectorAll('#menu-items > li')];
    return {
      labels: items.map((li) => li.textContent),
      highlighted: items.filter((li) => li.className === 'on').map((li) => li.textContent),
      shown: items.filter((li) => li.checkVisibility()).map((li) => li.textContent),
    };
  });
}

// Wide viewport: the entry is offered, and the way sub-menu follows it.
let page = await freshPage(context, ROOT);
await page.waitForTimeout(200);
const wide = await menuListing(page);
check(wide.labels.join('|') === MENU_ITEMS.join('|'),
  'a wide viewport lists "Play", "Two Players", "Records" and "How to Play"');
check(wide.highlighted.length === 1, 'exactly one menu item is highlighted as the current selection');
check(wide.shown.includes('Two Players'), 'the Two Players entry is offered on a wide viewport (1280px)');

await page.click('#menu-item-two-player');
await waitFor(page, (wanted) => window.__game.screen.state === wanted, SELECT_WAY, 5000);
const wideWay = await page.evaluate(() => {
  const items = [...document.querySelectorAll('#way-items > li')];
  return {
    labels: items.map((li) => li.textContent),
    highlighted: items.filter((li) => li.className === 'on').map((li) => li.textContent),
    shown: items.filter((li) => li.checkVisibility()).map((li) => li.textContent),
  };
});
check((await page.evaluate(() => window.__game.screen.state)) === SELECT_WAY,
  'confirming the entry on a wide viewport opens the way sub-menu');
check(wideWay.labels.join('|') === 'Same computer|Network (anywhere)|Network (same network)|Back',
  'the way sub-menu lists the shared-page way, both network flows and its Back control');
check(wideWay.highlighted.length === 1, 'exactly one way is highlighted as the current selection');
await page.close();

// Narrow stacked viewport: the same four items, and the way sub-menu opens at
// this width too — only the shared-page way is hidden there, so a phone player
// still chooses between the two network flows.
page = await freshPage(context, ROOT);
await page.setViewportSize({ width: 500, height: 768 });
await page.waitForTimeout(200);
const narrow = await menuListing(page);
check(narrow.labels.join('|') === MENU_ITEMS.join('|'),
  'the narrow stacked layout lists the same four menu items as a wide viewport');
check(narrow.highlighted.length === 1, 'exactly one menu item is highlighted on the narrow layout');
check(narrow.shown.includes('Two Players'),
  'the Two Players entry stays offered at or below the stacked-layout threshold');

await exposeSingletons(page);
await page.click('#menu-item-two-player');
await waitFor(page, (wanted) => window.__game.screen.state === wanted, SELECT_WAY, 5000);
const narrowWay = await page.evaluate(() => {
  const items = [...document.querySelectorAll('#way-items > li')];
  return {
    state: window.__game.screen.state,
    shown: items.filter((li) => li.checkVisibility()).map((li) => li.textContent),
    sharedShown: document.getElementById('way-item-local').checkVisibility(),
  };
});
check(narrowWay.state === SELECT_WAY,
  'the narrow layout opens the way sub-menu straight from the "Two Players" entry');
check(narrowWay.shown.join('|') === 'Network (anywhere)|Network (same network)|Back',
  'the narrow way sub-menu offers both network flows and Back, and nothing else');
check(!narrowWay.sharedShown,
  'the shared-page way is the wide-only item the narrow layout hides');

await page.click('#way-item-network-local');
await waitFor(page, (wanted) => window.__game.screen.state === wanted, PAIRING, 5000);
const jumped = await page.evaluate(() => ({
  state: window.__game.screen.state,
  networkMode: window.__game.screen.networkMode,
  flow: window.__netplay.flow,
  pairingShown: document.getElementById('pairing-title').checkVisibility(),
  fieldShown: document.getElementById('game').checkVisibility(),
}));
check(jumped.state === PAIRING,
  'the narrow layout reaches the pairing step from a network way');
check(jumped.networkMode, 'the network way is the way in play on the narrow layout');
check(jumped.flow === 'local', 'the narrow layout keeps the flow the way item names');
check(jumped.pairingShown, 'the pairing step is on screen');
check(!jumped.fieldShown, 'no play field is shown before a peer is paired');
await page.close();

// Both network ways are reachable by pointer as well as by key, and the flow
// each one picks is the flow its label names. A fresh page per way: a page
// keeps the first flow pick it makes, so a second pick on one page is ignored.
for (const [item, flow] of [['#way-item-network-global', 'global'],
                            ['#way-item-network-local', 'local']]) {
  const picker = await freshPage(context, ROOT);
  await picker.waitForTimeout(200);
  await exposeSingletons(picker);
  await picker.click('#menu-item-two-player');
  await waitFor(picker, (wanted) => window.__game.screen.state === wanted, SELECT_WAY, 5000);
  await picker.click(item);
  await waitFor(picker, (wanted) => window.__game.screen.state === wanted, PAIRING, 5000);
  const picked = await picker.evaluate(() => ({
    state: window.__game.screen.state,
    networkMode: window.__game.screen.networkMode,
    flow: window.__netplay.flow,
  }));
  check(picked.state === PAIRING && picked.networkMode,
    `a pointer click on a way item opens the pairing step (${flow})`);
  check(picked.flow === flow, `the pointer click picks the flow its label names (${flow})`);
  await picker.close();
}

console.log('');
report('verify-two-player-gating', 0);
await browser.close();
