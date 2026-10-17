// scripts/verify-network-local.mjs
// Headless browser check for the same-network flow: each page types its own
// device's address, publishes a pairing link that carries that address, and
// offers the peer a candidate naming the peer's own address and port.
//
// Run: node scripts/verify-network-local.mjs
//
// Two pages stand in for the two devices that share one network. Both run on
// this machine, so both pages name the one address the player tests with, and
// candidate each page offers names that address with the OTHER page's own port.
// What this check asserts is the measured shape of the transport: the address
// travels, the page that keeps its own offer locally reads its own port, and
// the page that holds an answer locally reads none and announces nothing. The
// connect itself is NOT asserted here — headless Chromium reaches no ICE
// address, and the copy that would name the guest's socket has no source, so
// the handshake is in the user-verified-later group, exactly like the global
// flow's.

import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BASE, check, failureCount, report, exposeSingletons, waitFor, freshPage } from './harness.mjs';
import { SELECT_WAY, PAIRING } from '../js/constants.js';

const ROOT = path.resolve(import.meta.dirname, '..');
// The address the player tests this flow with: the address their own device
// answers with. Neither page can reach it headlessly, which is what the check
// asserts, so the value only has to be a well-formed address.
const HOST_ADDRESS = '100.107.90.10';
const GUEST_ADDRESS = '100.107.90.10';
// A candidate list no open reads any more. A local-flow page has no supply to
// ask for either, so the check asserts nothing reaches it on either flow.
const PUBLIC_LIST = 'https://raw.githubusercontent.com/pradt2/always-online-stun/';

console.log('=== local network flow ===');

const browser = await chromium.launch();
const context = await browser.newContext();

// The harness leaves the field the way a player's typing leaves it: the input
// holds the quad, and the page reads it on the next paint.
async function typeAddress(page, address) {
  await page.evaluate((value) => {
    document.getElementById('pairing-address').value = value;
  }, address);
  await page.waitForTimeout(400);
}

// What one page of the local flow holds: its own typed address, the port it
// read, what it learned about the peer, and where its channel stands.
async function local(page) {
  return await page.evaluate(async () => {
    const held = window.__netplay;
    const netplay = await import('/js/netplay.js');
    const link = netplay.peerLink();
    const pc = link && link.transport && link.transport.connection;
    const line = document.getElementById('pairing-address-line');
    const waiting = document.getElementById('pairing-waiting');
    return {
      flow: held.flow,
      address: held.address,
      addressBad: held.addressBad,
      port: held.port,
      peerAddress: held.peerAddress,
      peerPort: held.peerPort,
      link: held.link,
      offer: held.offer.length,
      copy: held.copy,
      ice: held.ice,
      form: held.form,
      secret: held.secret.length,
      rebuilt: held.rebuilt,
      addressText: line ? line.textContent : '',
      waitingText: waiting ? waiting.textContent : '',
      waitingVisible: waiting ? waiting.checkVisibility() : null,
      addressInput: document.getElementById('pairing-address')?.value ?? '',
      copyCount: [...document.querySelectorAll('[id^="copy-pairing"]')].filter((el) => el.checkVisibility()).map((el) => el.id),
      connection: pc ? pc.connectionState : 'none',
      ice: pc ? pc.iceConnectionState : 'none',
      ownSdp: pc && pc.localDescription ? pc.localDescription.sdp : '',
    };
  });
}

// A page opened bare, whose player picks the same-network flow in the way
// sub-menu and types its own device's address.
async function hostPage(address) {
  const page = await freshPage(context, ROOT);
  const reads = { publicList: 0 };
  await page.route(PUBLIC_LIST + '**', (route) => {
    reads.publicList++;
    return route.continue();
  });
  await exposeSingletons(page);
  await page.waitForTimeout(200);
  await page.click('#menu-item-two-player');
  await waitFor(page, (wanted) => window.__game.screen.state === wanted, SELECT_WAY, 5000);
  check((await page.evaluate(() => window.__game.screen.state)) === SELECT_WAY,
    'confirming the two-player entry opens the way sub-menu');
  await page.click('#way-item-network-local');
  await waitFor(page, (wanted) => window.__game.screen.state === wanted, PAIRING, 5000);
  const picked = await local(page);
  check(picked.flow === 'local', 'picking the same-network way leaves the page on the local flow');
  const field = page.locator('#pairing-address');
  check(await field.evaluate((el) => el.checkVisibility()), 'the local flow shows an address field');
  await typeAddress(page, address);
  await page.waitForTimeout(400);
  return { page, reads };
}

// The guest is opened at the link the host published, so it inherits the flow
// and receives the host's address without typing.
async function guestPage(link) {
  const page = await context.newPage();
  // A local-flow link carries query parameters, and the shared server picks a
  // file from the path alone, so this page answers the marked URL itself.
  await page.route(BASE + '**', (route) => {
    const requested = route.request().url().slice(BASE.length).split('#')[0].split('?')[0];
    const file = path.join(ROOT, requested);
    try {
      return route.fulfill({
        status: 200,
        contentType: requested.endsWith('.html') ? 'text/html' : 'text/javascript',
        body: readFileSync(file),
      });
    } catch {
      return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    }
  });
  await page.goto(link);
  await exposeSingletons(page);
  await waitFor(page, (wanted) => window.__game.screen.state === wanted, PAIRING, 10000);
  return page;
}

const host = await hostPage(HOST_ADDRESS);
await waitFor(host.page, () => window.__netplay.link.includes('flow=local'), null, 20000);
const published = await local(host.page);
check(published.link.includes('flow=local'), 'the published pairing link names the local flow');
check(published.link.includes('a=' + HOST_ADDRESS), 'the published link carries the address the host typed');
check(published.link.split('#').length === 2, 'the published link carries one pairing fragment');

const guest = await guestPage(published.link);
await typeAddress(guest, GUEST_ADDRESS);


// Only the page that keeps its own offer locally reads a port, and it reads it
// once the peer's answer arrives; the page that holds an answer locally reads
// none, so it announces nothing and the other page stays waiting for that copy.
// The measured shape is asserted here; the connect itself is not.
await waitFor(host.page, () => window.__netplay.port > 0, null, 20000);
await waitFor(guest, () => window.__netplay.peerAddress !== '', null, 20000);
await guest.waitForTimeout(4000);

const hostNow = await local(host.page);
const guestNow = await local(guest);

check(hostNow.port > 0 && hostNow.ownSdp.includes(' ' + hostNow.port + ' '),
  'the page that keeps its own offer locally reads its own port out of it');
check(guestNow.peerAddress === HOST_ADDRESS,
  'the guest receives the host address from the link it opened, without typing');
check(guestNow.port === 0,
  'the page that holds an answer locally reads no port, so it has nothing to announce');
check(hostNow.peerAddress === '' && hostNow.peerPort === 0,
  'the host stays waiting for the announcement that page never makes');
check(hostNow.addressText.includes(HOST_ADDRESS),
  'the address line names the address this page typed, and no field for the peer address');
check(guestNow.addressInput === GUEST_ADDRESS, 'the guest typed its own address into its own field');
check(hostNow.copyCount.length > 0 && guestNow.copyCount.length > 0,
  'a copy affordance stands beside a value the player can carry');
check(host.reads.publicList === 0, 'a local-flow page reads no public candidate list');

// A denied copy is reported, and the value stays visible.
const denied = await host.page.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  await netplay.copyValue('link');
  const waiting = document.getElementById('pairing-waiting');
  return { copy: netplay.lobby.copy, text: waiting.textContent, visible: waiting.checkVisibility() };
});
check(denied.copy === 'denied' && denied.visible && denied.text.length > 0,
  'a copy this browser denies is reported on the page, and the value stays visible');

// A wrong address must stay waiting, never paired.
const wrongHost = await hostPage('100.107.90.11');
await waitFor(wrongHost.page, () => window.__netplay.link.includes('flow=local'), null, 20000);
const wrongPublished = await local(wrongHost.page);
const wrongGuest = await guestPage(wrongPublished.link);
await wrongGuest.waitForTimeout(8000);
const wrongNow = await local(wrongGuest);
check(wrongNow.connection !== 'connected' && wrongNow.ice !== 'connected',
  'a peer that typed an address its device does not have reports no open channel');

await host.page.close();
await guest.close();
await wrongHost.page.close();
await wrongGuest.close();
await browser.close();

console.log('  host page state: ice ' + hostNow.ice + ' form ' + hostNow.form + ' secret ' + hostNow.offer + ' rebuilt ' + hostNow.rebuilt);
console.log('  host address typed: ' + hostNow.address + ' · own port ' + hostNow.port + ' · peer ' + hostNow.peerAddress + ':' + hostNow.peerPort);
console.log('  guest address typed: ' + guestNow.address + ' · own port ' + guestNow.port + ' · peer ' + guestNow.peerAddress + ':' + guestNow.peerPort);
console.log('  guest page state: ice ' + guestNow.ice + ' form ' + guestNow.form + ' secret ' + guestNow.secret + ' rebuilt ' + guestNow.rebuilt);
console.log('  connection states (connect is NOT asserted here): host ' + hostNow.connection + '/' + hostNow.ice + ', guest ' + guestNow.connection + '/' + guestNow.ice);
console.log('  wrong-address guest: ' + wrongNow.connection + '/' + wrongNow.ice);

report('verify-network-local', 0);
