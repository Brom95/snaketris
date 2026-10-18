// verify-way-switch.mjs — measure the way choice re-opens, and the address field takes typing.
//
// What it proves on one real page, at the wide viewport:
//   1. Picking a way starts its open: the page publishes, its offer reaches.
//   2. Leaving the pairing step and picking the OTHER way re-decides on the same page:
//      the flow flips, what the first way published is taken back, and the channel
//      that open used is replaced (a fresh RTCPeerConnection identity appears).
//   3. The second way shows its own address field, and every digit the player types
//      lands in the field whole — not in lobby.typed — while the published link names
//      the way, carries the address, and has a code to show it under.
// The narrow half of the claim (the choice offered at all on a 360×640 viewport) is
// measured in verify-ice-preload.mjs; this file is the switch and the typing.
//
// Run: node scripts/verify-way-switch.mjs
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = 'http://duel.test/';

const { freshPage, exposeSingletons, check, report, failureCount, waitFor, stateIs, shown } =
  await import(import.meta.resolve('./harness.mjs'));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await freshPage(context, ROOT);
await exposeSingletons(page);

// Count the connections the page has used, keyed by identity, so the switch's fresh
// channel is measured by the object rather than by what the lobby says afterwards.
await page.evaluate(async () => {
  const mod = await import('/js/netplay.js');
  const peerLink = mod.peerLink;
  const names = new Map();
  const nameOf = (conn) => {
    if (!conn) return '';
    if (!names.has(conn)) names.set(conn, 'pc' + (names.size + 1));
    return names.get(conn);
  };
  window.__channels = [];
  const record = () => {
    const row = { flow: mod.lobby.flow, ice: mod.lobby.ice, pc: nameOf(peerLink()) };
    if (window.__channels.length && JSON.stringify(window.__channels.at(-1)) === JSON.stringify(row)) return;
    window.__channels.push(row);
  };
  record();
  const step = () => {
    record();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

// The recorder runs every frame; let it start before the page does anything else.
await page.evaluate(() => null);

// MENU → two-player → the way sub-menu → the global way.
await page.click('#menu-item-two-player');
await check(
  await waitFor(page, () => {
    const el = document.querySelector('#way-item-network-global');
    return Boolean(el) && el.checkVisibility();
  }, undefined, 15000),
  'the two-player entry offers the way sub-menu');
await page.click('#way-item-network-global');
await check(await stateIs(page, 'PAIRING', 15000), 'the global way reaches the pairing step');

// The candidate gather costs the whole 15-second attempt budget on this machine, so
// the open takes that long to publish — the wait is generous on its own account.
await check(
  await waitFor(page, () => window.__netplay.link !== '', undefined, 90000),
  'the first way published a link');
const first = await page.evaluate(() => ({
  flow: window.__netplay.flow,
  offer: window.__netplay.offer,
  warm: window.__netplay.warm,
  link: window.__netplay.link,
}));
await check(first.flow === 'global', 'the page runs under the way it picked first');
await check(first.offer !== '' && first.link !== '', 'that way published an offer');
const beforeIds = new Set(
  (await page.evaluate(() => window.__channels.map((row) => row.pc))).filter(Boolean)
);

// Back out of the pairing step, then pick the other way on the same page.
await page.keyboard.press('Escape');
await check(await stateIs(page, 'MENU', 5000), 'the pairing step backs out to the menu');
await page.click('#menu-item-two-player');
await check(
  await waitFor(page, () => window.__game.screen.state === 'SELECT_WAY', undefined, 15000),
  'returning to the two-player entry offers the way choice again');
await page.click('#way-item-network-local');
await check(await stateIs(page, 'PAIRING', 15000), 'the same-network way reaches the pairing step');
await check(
  await waitFor(page, () => window.__netplay.flow === 'local', undefined, 15000),
  'the page now runs under the way it picked second');
const switched = await page.evaluate(() => ({
  offer: window.__netplay.offer,
  warm: window.__netplay.warm,
  link: window.__netplay.link,
  rebuilt: window.__netplay.rebuilt,
}));
await check(
  switched.offer === '' && switched.warm === '' && switched.link === '' && !switched.rebuilt,
  'the switch takes back what the first way published'
);
const afterIds = new Set(
  (await page.evaluate(() => window.__channels.map((row) => row.pc))).filter(Boolean)
);
await check(
  afterIds.size > beforeIds.size && [...afterIds].some((id) => !beforeIds.has(id)),
  'the switch runs its open again on a fresh channel'
);

// The second way's own affordance, then what the player types into it.
await check(await shown(page, '#pairing-address', true), 'the same-network way shows its address field');
await page.evaluate(() => document.getElementById('pairing-address').focus());
await page.keyboard.type('100.107.90.10', { delay: 90 });
await check(
  await waitFor(page, () => window.__netplay.link !== '', undefined, 30000),
  'the page publishes its address-bearing link'
);
const typed = await page.evaluate(() => ({
  field: document.getElementById('pairing-address').value,
  address: window.__netplay.address,
  addressBad: window.__netplay.addressBad, // false once a whole dotted-quad is in the field
  typed: window.__netplay.typed,
  link: window.__netplay.link,
}));
await check(typed.field === '100.107.90.10', 'the field keeps every digit typed');
await check(typed.address === '100.107.90.10', 'the page reads the typed address');
await check(typed.addressBad === false, 'the address typed whole is accepted');
await check(typed.typed === '', 'the address digits are not spent on the short readable code');
await check(
  typed.link.includes('flow=local') && typed.link.includes('a=100.107.90.10'),
  'the published link names the way and carries the address'
);
const qr = await page.evaluate(() => {
  const el = document.getElementById('pairing-qr');
  if (!el || !el.checkVisibility() || !el.getContext) return { shown: false, lit: 0 };
  const face = el.getContext('2d');
  const pixels = face.getImageData(0, 0, el.width, el.height).data;
  let lit = 0;
  for (let at = 0; at < pixels.length; at += 4) {
    if (pixels[at + 3] > 0 && pixels[at] < 128) lit++;
  }
  return { shown: true, lit };
});
await check(qr.shown && qr.lit > 0, 'a code is painted under the address-bearing link');

await browser.close();
report('way re-pick and address typing report', failureCount());
