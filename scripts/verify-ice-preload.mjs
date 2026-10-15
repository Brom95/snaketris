// scripts/verify-ice-preload.mjs
// Headless browser check for the ICE preloader: the page's own STUN attempt
// runs from the moment a network game page opens, the pairing step counts its
// seconds left down on screen, and nothing publishes while the attempt is still
// waiting.
//
// Run: node scripts/verify-ice-preload.mjs
//
// Two pages stand in for the two ways a network game page opens: one opened at
// a pairing link, whose address carries the secret, and one opened bare whose
// player walks the menu to the Network way. Both must run one attempt per page
// open, inside the same budget, and both must paint the wait while it runs. The
// attempt is a network round trip, so the check waits in wall time and never
// pauses the mechanism to make the wait shorter.

import { chromium } from '@playwright/test';
import path from 'node:path';
import { BASE, check, failureCount, report, freshPage, servePage, exposeGame, shown, waitFor } from './harness.mjs';
import { PAIRING } from '../js/constants.js';

const ROOT = path.resolve(import.meta.dirname, '..');

console.log('=== ICE preloader ===');

const browser = await chromium.launch();
const context = await browser.newContext();

// What one page open leaves behind: the attempt's state, its countdown, and
// what has published so far. Read together, they say whether the attempt started
// on its own and whether a publish raced past it.
async function attempt(page) {
  return await page.evaluate(async () => {
    const netplay = await import('/js/netplay.js');
    const offer = netplay.lobby.warm || netplay.lobby.offer;
    return {
      ice: netplay.lobby.ice,
      iceLeft: netplay.lobby.iceLeft,
      warm: netplay.lobby.warm.length,
      offer: netplay.lobby.offer.length,
      rebuilt: netplay.lobby.rebuilt,
      budget: netplay.ICE_GATHER_TIMEOUT_SECONDS,
      secret: netplay.lobby.secret.length,
      candidates: new Set(offer.match(/a=ice-candidate.*/g) || []).size,
    };
  });
}

// What one open may put into an offer: the shipped floor it starts from, and the
// cap on the entries it adds from the public list.
async function supply(page) {
  return await page.evaluate(async () => {
    const app = await import('/js/app.js');
    return { floor: app.ICE_SERVERS.length, limit: app.ICE_SUPPLY_LIMIT };
  });
}

// The attempt is wall time, not the game clock, so the check polls it from the
// driver side: the predicate inside page.waitForFunction cannot carry the
// module's live object out to a Node-side comparison.
async function awaitResolved(page, budgetMs) {
  const started = Date.now();
  while (Date.now() - started < budgetMs) {
    const state = await attempt(page);
    if (state.ice !== 'gathering') return state;
    await page.waitForTimeout(500);
  }
  return null;
}

async function iceLine(page) {
  return await page.evaluate(() => document.getElementById('pairing-ice').textContent);
}

// ---------- A page opened at a pairing link ----------

// The link comes from a page that published one real offer, so the url below is
// a url a device really opens.
const host = await freshPage(context, ROOT);
const link = await host.evaluate(
  async (url) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('snaketris-pair', { negotiated: true, negotiatedStreams: 2, id: 0 });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const netplay = await import('/js/netplay.js');
    netplay.publish(pc.localDescription.sdp, 20240601, url);
    return netplay.lobby.link;
  },
  BASE + 'snaketris.html',
);
await host.close();

// A pairing link is a page open of its own: the document loads with the
// fragment already on its address, so init adopts it. A second navigation
// inside one page would be a same-document jump and would never re-run init.
const guest = await context.newPage();
guest.on('pageerror', (error) => console.log('  page error: ' + error.message));
await servePage(guest, ROOT);
await guest.goto(link);
await exposeGame(guest);

// 1. the attempt started at open, before anything published: the page's address
//    carries the secret, so init adopts it and starts the wait straight away.
const opened = await attempt(guest);
check(opened.budget === 15, `the attempt keeps a 15-second budget (budget ${opened.budget})`);
check(opened.ice === 'gathering', `the attempt is already running when the page opens (state ${opened.ice})`);
check(opened.offer === 0, 'nothing has published while the attempt still runs');
check(opened.secret > 0, 'the page adopted the secret its address carries');

// 2. the preloader names the wait and counts it down on screen.
check(await shown(guest, '#pairing-ice', true), 'the preloader line is on screen while the attempt runs');
const first = await iceLine(guest);
check(first.includes('STUN') && first.includes(`${opened.budget}s`), `the preloader names the wait and starts it at the full budget (${first})`);

// The countdown follows the attempt, not the page clock: real seconds of wait
// leave fewer seconds on screen, and never more.
await guest.waitForTimeout(2200);
const mid = await attempt(guest);
const second = await iceLine(guest);
check(mid.ice === 'gathering', 'the attempt is still running after two seconds of real wait');
check(mid.iceLeft < opened.budget && mid.iceLeft > 0, `the countdown counts down as the attempt runs (${opened.budget}s -> ${mid.iceLeft}s)`);
check(second.includes(`${mid.iceLeft}s`), `the painted line carries the seconds left (${second})`);
check(mid.offer === 0, 'still nothing published while the countdown runs');

// 3. the attempt finishes inside its own budget, and the preloader goes away
//    once it does.
const done = await awaitResolved(guest, 25000);
check(done !== null, 'the attempt resolves inside its budget');
check(done.ice === 'remote' || done.ice === 'local' || done.ice === 'none', `the attempt reports what the offer carries (state ${done.ice})`);
check(done.iceLeft >= 0 && done.iceLeft <= done.budget, `the countdown stayed inside its budget (${done.iceLeft} of ${done.budget})`);
check(await shown(guest, '#pairing-ice', false), 'the preloader line is gone once the attempt resolved');

// 4. the attempt ran once per page open: the step asks for it every frame, and
//    a second ask must not restart the wait.
await guest.waitForTimeout(600);
const again = await attempt(guest);
check(again.ice === done.ice && again.iceLeft === done.iceLeft, 'asking again starts no second attempt (the state and the countdown stay put)');

// 5. what the attempt found decides what the step says.
const warn = await guest.evaluate(() => document.getElementById('pairing-warn').textContent);
if (done.ice === 'remote') {
  check(done.warm > 0, 'the attempt kept the offer it produced, so the step publishes it without offering twice');
  check(await shown(guest, '#pairing-warn', false), 'a resolved ICE address leaves the step without a warning');
} else {
  check(done.rebuilt, 'a page whose servers gave it no address rebuilds its channel with no ICE servers');
  check(await shown(guest, '#pairing-warn', true), 'the step says what the offer reaches');
  check(warn.includes('?ice='), `a no-address offer names the route that carries a supply (${warn})`);
  check(!warn.includes('unavailable'), 'a page on a network is not told network play is unavailable');
}

// 6. the copy decides the report even when this run resolves an address: the
//    line for an offer that carries no address names the route that carries a
//    supply, and the dead-end line belongs only to a browser that cannot open a
//    channel at all.
const copy = await guest.evaluate(async () => {
  const words = await import('/js/copy.js');
  return { local: words.PAIRING_WARN_LOCAL, none: words.PAIRING_WARN_NONE };
});
check(copy.local.includes('?ice='), `the no-address line names the candidate-supply route (${copy.local})`);
check(!copy.none.includes('?ice='), `the dead-end line stays the browser that cannot open a channel (${copy.none})`);

// 7. an offer carries a candidate block per address the open could reach, and
//    an open adds at most its cap of fetched entries to the shipped floor.
const room = await supply(guest);
check(done.candidates <= room.floor + room.limit, `the offer carries ${done.candidates} candidate addresses, within the ${room.floor} shipped plus up to ${room.limit} fetched the open may add`);
check(done.ice !== 'remote' || done.candidates > 0, 'an offer that reached an address carries the candidates it reached');

await guest.close();

// ---------- A bare page whose player walks the menu to Network ----------

// The narrow stacked layout opens the pairing step straight from the entry, so
// the walk is one click and the attempt starts on the first frame of the step.
const bare = await freshPage(context, ROOT);
await bare.setViewportSize({ width: 500, height: 768 });
await bare.waitForTimeout(200);
await bare.click('#menu-item-two-player');
await waitFor(bare, (wanted) => window.__game.screen.state === wanted, PAIRING, 5000);

const walked = await attempt(bare);
check(walked.ice === 'gathering', `a bare page that reaches the network step starts its own attempt (state ${walked.ice})`);
check(walked.offer === 0, 'the bare page publishes nothing while its attempt waits');
check(await shown(bare, '#pairing-ice', true), 'the bare page paints the preloader too');

const bareResolved = await awaitResolved(bare, 25000);
check(bareResolved !== null, 'the bare page attempt resolves inside its budget');
// The publish happens on the frame after the attempt resolved, so the offer is
// read once that frame has run.
await bare.waitForTimeout(300);
const bareDone = await attempt(bare);
check(bareDone.offer > 0, `the bare page publishes once its attempt resolved (${bareDone.offer} bytes of offer)`);
check(bareDone.ice === done.ice, `both ways of opening report the same ICE result (link page ${done.ice}, menu page ${bareDone.ice})`);

await bare.close();

report('ICE preloader', failureCount());

await browser.close();
