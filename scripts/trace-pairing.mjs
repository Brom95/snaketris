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
async function installTrace(page) {
  await page.evaluate(async () => {
    const netplay = await import('/js/netplay.js');
    const stateModule = await import('/js/state.js');
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
          state: stateModule.game.screen.state,
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
  });
}

// A stand-in channel that keeps each page's REAL connection and carries only
// the bytes: what a page sends is written to storage the two pages share, and
// read back by its peer on a short timer, the way the duel's channel carries
// a message in a few milliseconds. The connection stays the page's own so
// pointing, offering and answering still run — only the hop between the pages
// is stood in, which is exactly the hop a browser bus cannot carry.
async function standIn(page, outKey, inKey) {
  await page.evaluate(async ([outKey, inKey]) => {
    const netplay = await import('/js/netplay.js');
    const current = netplay.peerLink();
    const carried = current && current.transport ? current.transport.connection : null;
    netplay.registerTransport(() => ({
      send: (message) => {
        localStorage.setItem(outKey, (localStorage.getItem(outKey) || '') + JSON.stringify(message) + '\n');
        return true;
      },
      onMessage: (handler) => {
        window.__handler = handler;
        return true;
      },
      connection: carried,
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

async function pump(a, b, rounds = 10) {
  for (let i = 0; i < rounds; i++) {
    await a.waitForTimeout(90);
    await b.waitForTimeout(90);
  }
}

// What a page holds at this moment — the same fields the table names, plus the
// rows its own recorder collected.
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
      state: netplay.lobby === undefined ? '' : (await import('/js/state.js')).game.screen.state,
      rows: window.__rows,
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
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    console.log('    last stage ' + last.stage + ': ' + (last.paired ? 'paired' : last.aimed ? 'aimed' : last.answer ? 'holds an answer' : last['peerAddress'] ? 'holds a peer address' : 'stopped at stage ' + last.stage));
  }
}

// ---------- The host page: the way pick, then the address it types ----------

const host = await freshPage(context, ROOT);
await exposeSingletons(host);
await installTrace(host);
await stateIs(host, SELECT_WAY);

await host.click('#menu-item-two-player');
await stateIs(host, SELECT_WAY);
await host.click('#way-item-network-local');
await stateIs(host, PAIRING);
await host.evaluate(() => document.getElementById('pairing-address').focus());
await host.keyboard.type(HOST_ADDRESS, { delay: 40 });

// The attempt runs its full budget here: the named servers resolve for no headless
// page, and this route prints what the page does AFTER the attempt has settled,
// which is when a local-flow page is allowed to publish at all.
const attemptSettled = () => window.__netplay.ice !== '' && window.__netplay.ice !== 'gathering';
check(await waitFor(host, attemptSettled, 'the host page runs its candidate attempt to an end', null, 30000), 'the host page runs its candidate attempt to an end');

// ---------- The guest page: opened at the link the host published ----------

await waitFor(host, () => window.__netplay.link.includes('flow=local'), null, 20000);
const published = await hold(host);
console.log('  the link the host published: ' + published.link.split('#')[0]);

const guest = await context.newPage();
await guest.route(BASE + '**', (route) => {
  const requested = route.request().url().slice(BASE.length).split('#')[0].split('?')[0];
  const file = path.join(ROOT, requested);
  try {
    return route.fulfill({
      status: 200,
      contentType: requested.endsWith('.html') ? 'text/html' : 'text/javascript',
      body: (await import('node:fs')).readFileSync(file),
    });
  } catch {
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
  }
});
await guest.goto(published.link);
await exposeSingletons(guest);
await installTrace(guest);

// The guest pays the same attempt as any page at an open; the countdown budget
// is written down so the read finishes in seconds rather than a page's minutes.
await guest.evaluate(() => { window.__netplay.iceLeft = 1; });

// ---------- Route A: the route two real devices take ----------

await guest.evaluate(() => document.getElementById('pairing-address').focus());
await guest.keyboard.type(GUEST_ADDRESS, { delay: 40 });
check(
  await waitFor(guest, () => window.__netplay.ice !== 'gathering' && window.__netplay.ice !== '', null, 30000),
  'the guest page runs its own attempt to an end',
);
await guest.waitForTimeout(2500);

const hostA = await hold(host);
const guestA = await hold(guest);

console.log('');
console.log('Route A — two devices, one link, nothing between the pages');
console.log('  host: publishes the address it typed; guest: holds that address');
printRows('host', hostA.rows || []);
printRows('guest', guestA.rows || []);

check(guestA.peerAddress === HOST_ADDRESS, 'the guest holds the host address its link named');
check(guestA.peerPort > 0, 'the guest holds the host port its link named');
check(guestA.candidates.some((s) => s.includes(HOST_ADDRESS)),
  'the guest offers the candidate naming the address only its link carried');
check(guestA.answer === false, 'the guest never received a channel report');
check(hostA.peerAddress === '' && hostA.peerPort === 0,
  'the host holds nothing about the guest: a link goes one way only');
check(hostA.aimed === false, 'the host never aimed, so it waits on an announcement that never comes');

// ---------- Route B: the same pair with the hop stood in ----------

// Both pages have run their attempts by now, so standing the bytes-carrying
// channel in cannot replace a mid-rebuild the attempt is about to make: the
// duel learned that standing in first leaves the attempt's own rebuild to
// swallow the next message.
await standIn(host, 'wire-host', 'wire-guest');
await standIn(guest, 'wire-guest', 'wire-host');
await pump(host, guest, 20);

const hostB = await hold(host);
const guestB = await hold(guest);

console.log('');
console.log('Route B — the same pages with the hop the bus cannot carry stood in');
printRows('host', hostB.rows || []);
printRows('guest', guestB.rows || []);

check(hostB.peerAddress === GUEST_ADDRESS, 'with the hop stood in, the host reads the guest address');
check(hostB.aimed && hostB.candidates.some((s) => s.includes(GUEST_ADDRESS)), 'the host aims its channel at the address the stood-in hop carried');
check(hostB.paired && guestB.paired, 'the pair completes once the hop that cannot travel is stood in');

report('trace-pairing', failureCount());
await browser.close();
