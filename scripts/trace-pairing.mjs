// Headless read of the same-network handshake, stage by stage, in order.
//
// Run: node scripts/trace-pairing.mjs
//
// This is a diagnostic, not a gate: it prints what each page goes through, in
// the order it goes through it, with the fields a stalled pair is recognised
// by. A player who is told "pair" reads this table instead of guessing which
// hop did not run. Two routes are printed for the same pair of pages:
//
//   A — the route two real devices take: the host page publishes, the guest
//       opens that link. Nothing travels between the pages, because the
//       channel one page shares is the browser's own message bus, which joins
//       pages inside ONE browser and reaches no other device.
//   B — the same two pages with a channel stood in that really carries the
//       bytes (the way the duel harness does it): the announcement crosses,
//       the host page learns the guest address, both pages aim, and the pair
//       reaches its preparation.
//
// Printing both routes is what names the one thing a two-device pair lacks:
// the hop the bus cannot carry across devices.
//
// Route A asserts the one code claim this change makes: a page whose peer
// address and port came only from a link offers the candidate naming them,
// with no inbound report at all.

import { chromium } from '@playwright/test';
import path from 'node:path';
import { BASE, check, report, failureCount, exposeSingletons, freshPage, stateIs, waitFor } from './harness.mjs';
import { SELECT_WAY, PAIRING } from '../js/constants.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const HOST_ADDRESS = '100.107.90.10';
const GUEST_ADDRESS = '100.107.90.10';

const browser = await chromium.launch();
const context = await browser.newContext();

// The recorder every page gets before its modules load: it counts the
// candidates the page hands its own connection, and names each one. A
// candidate is the only thing that points a channel at a network address, so
// counting it is how the table says "this page aimed" rather than "this page
// hoped".
context.addInitScript(() => {
  window.__ice = [];
  const original = RTCPeerConnection.prototype.addIceCandidate;
  RTCPeerConnection.prototype.addIceCandidate = function (candidate) {
    window.__ice.push({
      address: candidate && candidate.sdpDescription ? candidate.sdpDescription : String(candidate),
    });
    return original.apply(this, [candidate]);
  };
});

// The stage vocabulary, most advanced last. A row is printed whenever a page's
// stage changes, so the table reads as the path one page walked.
async function installTrace(page, label) {
  await page.evaluate(async ([label]) => {
    const netplay = await import('/js/netplay.js');
    const lobby = window.__netplay;
    window.__rows = [];
    let previous = '';
    const tick = () => {
      const answer = netplay.inboundReport().answer !== '';
      const flags = [
        lobby.flow !== '',
        lobby.ice === 'gathering',
        lobby.ice !== '' && lobby.ice !== 'gathering',
        lobby.address !== '',
        lobby.link !== '',
        lobby.peerAddress !== '',
        lobby.aimed,
        answer,
        lobby.paired,
      ];
      const stage = flags.filter(Boolean).length;
      if (stage !== previous) {
        window.__rows.push({
          stage,
          ice: lobby.ice,
          address: lobby.address,
          addressBad: lobby.addressBad === true,
          port: lobby.port,
          peerAddress: lobby.peerAddress,
          peerPort: lobby.peerPort,
          link: lobby.link !== '',
          offer: lobby.offer !== '',
          paired: lobby.paired,
          aimed: lobby.aimed,
          candidates: window.__ice.length,
          answer,
          state: (await import('/js/state.js')).game.screen.state,
        });
        previous = stage;
      }
    };
    const loop = () => {
      tick();
      setTimeout(loop, 60);
    };
    tick();
    loop();
  }, [label]);
}

// A stand-in channel for both pages: each page writes what it sends into
// storage the two pages share, and reads what its peer wrote on its own timer.
// This is the duel harness's channel, kept here so the same pair can be read
// with, and without, the hop that a browser bus cannot carry across devices.
async function standIn(page, outKey, inKey) {
  await page.evaluate(async ([outKey, inKey]) => {
    const netplay = await import('/js/netplay.js');
    netplay.registerTransport(() => ({
      send: (message) => {
        localStorage.setItem(outKey, (localStorage.getItem(outKey) || '') + JSON.stringify(message) + '\n');
        return true;
      },
      onMessage: (handler) => {
        window.__handler = handler;
        return true;
      },
      connection: null,
    }));
    const poll = () => {
      const raw = localStorage.getItem(inKey) || '';
      if (raw.length > window.__cursor) {
        const fresh = raw.slice(window.__cursor);
        window.__cursor = raw.length;
        for (const line of fresh.split('\n')) {
          if (!line) continue;
          const message = JSON.parse(line);
          if (window.__handler) window.__handler(message);
        }
      }
      setTimeout(poll, 4);
    };
    window.__cursor = 0;
    poll();
  }, [outKey, inKey]);
}

async function pump(a, b, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await a.waitForTimeout(90);
    await b.waitForTimeout(90);
  }
}

// What a page holds at this moment — the same fields the table names.
async function hold(page) {
  return await page.evaluate(async () => {
    const netplay = await import('/js/netplay.js');
    const lobby = window.__netplay;
    return {
      flow: lobby.flow,
      ice: lobby.ice,
      address: lobby.address,
      port: lobby.port,
      peerAddress: lobby.peerAddress,
      peerPort: lobby.peerPort,
      link: lobby.link,
      offer: lobby.offer.length,
      aimed: lobby.aimed,
      paired: lobby.paired,
      candidates: (window.__ice || []).map((c) => c.address).filter((s) => s.startsWith('candidate:')),
      answer: netplay.inboundReport().answer !== '',
      state: (await import('/js/state.js')).game.screen.state,
    };
  });
}

function printRows(label, rows) {
  console.log('  ' + label + ' — ' + rows.length + ' stage rows:');
  rows.forEach((row, i) => {
    console.log(
      '    ' + (i + 1) +
        ' ice=' + (row.ice || '-') +
        ' addr=' + (row.address || '-') +
        ' port=' + row.port +
        ' peer=' + (row.peerAddress || '-') + ':' + row.peerPort +
        ' link=' + (row.link ? 'yes' : 'no') +
        ' offer=' + (row.offer ? 'yes' : 'no') +
        ' aimed=' + (row.aimed ? 'yes' : 'no') +
        ' cand=' + row.candidates +
        ' answer=' + (row.answer ? 'yes' : 'no') +
        ' paired=' + (row.paired ? 'yes' : 'no') +
        ' state=' + row.state
    );
  });
}

// ---------- The host page: the way pick, then the address it types ----------

const host = await freshPage(context, ROOT);
await exposeSingletons(host);
await installTrace(host, 'host');
await stateIs(host, SELECT_WAY);

await host.click('#menu-item-two-player');
await stateIs(host, SELECT_WAY);
await host.click('#way-item-network-local');
await stateIs(host, PAIRING);
await host.keyboard.type(HOST_ADDRESS);

// The same attempt the page runs from the moment it opens, printed rather than
// skipped: a player who watches "no candidates" before typing is watching this.
const attemptSettled = () => window.__netplay.ice !== '' && window.__netplay.ice !== 'gathering';
check(await waitFor(host, attemptSettled, null, 30000), 'the host page runs its candidate attempt to an end');

// ---------- The guest page: opened at the link the host published ----------

await waitFor(host, () => window.__netplay.link.includes('flow=local'), null, 20000);
const published = await hold(host);

const guest = await context.newPage();
await guest.route(BASE + '**', (route) => {
  const requested = route.request().url().slice(BASE.length).split('#')[0].split('?')[0];
  const file = path.join(ROOT, requested);
  try {
    return route.fulfill({
      status: 200,
      contentType: requested.endsWith('.html') ? 'text/html' : 'text/javascript',
      body: await import('node:fs').then((fs) => fs.readFileSync(file)),
    });
  } catch {
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
  }
});
await guest.goto(published.link);
await exposeSingletons(guest);
await installTrace(guest, 'guest');

// ---------- Route A: the route two real devices take ----------

// Nothing is stood in: the only channel each page owns is its own, and a page
// opened at a link shares no bus with the page that published it. The waits are
// generous on purpose — the point is that these fields stay empty.
await guest.keyboard.type(GUEST_ADDRESS);
await guest.waitForTimeout(6000);

const hostA = await hold(host);
const guestA = await hold(guest);

console.log('');
console.log('Route A — two devices, one link, nothing between the pages');
console.log('  host: publishes the address it typed; guest: holds that address');
printRows('host', hostA.rows || []);
printRows('guest', guestA.rows || []);

check(guestA.peerAddress === HOST_ADDRESS, 'the guest holds the host address its link named');
check(guestA.peerPort > 0, 'the guest holds the host port its link named');
check(guestA.candidates.length > 0 && guestA.candidates[0].includes(HOST_ADDRESS),
  'the guest offers the candidate naming the address only its link carried');
check(guestA.answer === false, 'the guest never received a channel report');
check(hostA.peerAddress === '' && hostA.peerPort === 0,
  'the host holds nothing about the guest: a link goes one way only');
check(hostA.aimed === false, 'the host never aimed, so it waits on an announcement that never comes');

// ---------- Route B: the same pair with the hop stood in ----------

// The channel a working pair really has: the bytes cross, so the guest's
// announcement reaches the host page, which then holds the guest address, aims,
// and the pair completes. Standing the channel in is the only thing this pair
// lacks, and it is the one hop a browser bus cannot carry across devices.
await standIn(host, 'wire-host', 'wire-guest');
await standIn(guest, 'wire-guest', 'wire-host');
await pump(host, guest, 10);

const hostB = await hold(host);
const guestB = await hold(guest);

console.log('');
console.log('Route B — the same pages with the hop the bus cannot carry stood in');
printRows('host', hostB.rows || []);
printRows('guest', guestB.rows || []);

console.log('');
console.log('  host last row: ice ' + hostB.ice + ' aimed ' + hostB.aimed + ' paired ' + hostB.paired + ' candidates ' + hostB.candidates.length);
console.log('  guest last row: ice ' + guestB.ice + ' aimed ' + guestB.aimed + ' paired ' + guestB.paired + ' candidates ' + guestB.candidates.length);
console.log('  the stage route A stopped at: the host waits for an announcement no device sends');
console.log('  the stage route B reached: both pages aimed and paired');

check(hostB.peerAddress === GUEST_ADDRESS, 'with the hop stood in, the host reads the guest address');
check(hostB.aimed && hostB.candidates.length > 0, 'the host aims its channel once it holds an address');
check(hostB.paired && guestB.paired, 'the pair completes once the hop that cannot travel is stood in');

const hostStages = hostA.rows.length;
const guestStages = guestA.rows.length;
console.log('  host walked ' + hostStages + ' stages, guest walked ' + guestStages + ' stages');

report('trace-pairing', 0);
await browser.close();
