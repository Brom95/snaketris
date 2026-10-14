// Headless browser check for the pairing step itself (tasks 7.2 - 7.6).
// The step is the network lobby: it publishes the secret this page holds for
// the other device and paints the form that device can use. No play field and
// no match may exist here.
//
// Run: node scripts/verify-pairing-step.mjs
//
// The secret is published here through netplay.publish() with a real offer
// taken from a real RTCPeerConnection, so the byte length that decides the
// painted form is the length a real pairing would carry.

import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BASE, check, freshPage, report, shown, waitFor, servePage, exposeGame } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

console.log('=== Pairing step ===');

const browser = await chromium.launch();
const context = await browser.newContext();

// ---------- The secret this page publishes ----------

// One real offer, so the painted link carries the bytes a real offer carries.
// The page url is a supply: netplay.publish never reads `location`, so the
// harness hands it the url this page actually lives on.
async function publishOffer(page, pageUrl) {
  return await page.evaluate(
    async (url) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('snaketris-pair', { negotiated: true, negotiatedStreams: 2, id: 0 });
      const offer = await pc.createOffer();
      const sdp = offer.sdp;
      await pc.close();
      const netplay = await import('/js/netplay.js');
      netplay.publish(sdp, 20240601, url);
      return {
        form: netplay.lobby.form,
        link: netplay.lobby.link,
        code: netplay.lobby.code,
        secretLength: netplay.lobby.secret.length,
        blob: netplay.lobby.secret,
        publishedBlob: netplay.trimmedOffer(sdp) === netplay.lobby.secret,
      };
    },
    pageUrl,
  );
}

// ---------- 7.2: the share link and the QR ----------

let page = await freshPage(context, ROOT);
const published = await publishOffer(page, BASE + 'snaketris.html');
await page.evaluate(() => window.__game.screen.state = 'PAIRING');
await page.waitForTimeout(200);

check(published.form === 'link', `the published secret paints the link form (secret ${published.secretLength} bytes, under the fragment cap)`);

const linkShown = await shown(page, '#pairing-link', true);
check(linkShown, 'the share link is on screen in the pairing step');

const linkText = await page.evaluate(() => document.getElementById('pairing-link').textContent);
check(linkText.length > 0, 'the share link is page text, not an attribute or a hidden value');
check(linkText.startsWith(BASE) && linkText.includes('#'), 'the share link is this page URL plus the secret in the fragment');

// The fragment must be the trimmed offer blob: no SDP comment line survives.
// The fragment must be escapable: an SDP carries CRLF, spaces and `=`, so the
// bytes that travel in a link are the escaped form and `adopt` decodes them back.
const encoded = linkText.slice(linkText.indexOf('#') + 1);
const fragment = decodeURIComponent(encoded);
check(published.blob === fragment, `the painted link carries the offer blob in its fragment (${fragment.length} bytes, ${encoded.length} escaped)`);
check(published.publishedBlob, 'the secret is the offer with every SDP comment line dropped');
check(!encoded.includes('#'), 'the offer blob carries no SDP comment line (trimmed before it travels)');
check(fragment.includes('a=mid:0'), 'the offer blob is a real offer description (it carries the mid line)');
check(fragment.includes('a=group:BUNDLE'), 'the offer blob carries the bundle line a peer needs to answer');

const qrShown = await shown(page, '#pairing-qr', true);
check(qrShown, 'the QR of the same link is on screen beside it');
const qrBuffer = await page.evaluate(() => {
  const el = document.getElementById('pairing-qr');
  return { width: el.width, height: el.height };
});
check(qrBuffer.width > 0 && qrBuffer.width === qrBuffer.height, `the QR canvas buffer is square and painted (${qrBuffer.width}x${qrBuffer.height})`);

// ---------- 7.3: the copy names the step and the keys that advance it ----------

const copySource = await readFile(path.join(ROOT, 'js/copy.js'), 'utf8');
check(/export const PAIRING_TITLE/.test(copySource) && /export const PAIRING_HINTS/.test(copySource),
  'the pairing copy lives in js/copy.js');

const painted = await page.evaluate(async () => {
  const copy = await import('/js/constants.js');
  return {
    title: document.querySelector('#pairing-title').textContent,
    hints: document.querySelector('#pairing-hints').textContent,
    join: document.querySelector('#pairing-join').textContent,
    waiting: document.querySelector('#pairing-waiting').textContent,
    titleCopy: copy.PAIRING_TITLE,
    hintsCopy: copy.PAIRING_HINTS,
    joinCopy: copy.PAIRING_JOIN,
    waitingCopy: copy.PAIRING_WAITING,
  };
});
check(painted.title === painted.titleCopy, 'the painted title is the copy from js/copy.js');
check(painted.title.toLowerCase().includes('pair'),
  `the title names the pairing step and its action (${painted.title})`);
check(painted.hints === painted.hintsCopy, 'the painted hint line is the copy from js/copy.js');
check(painted.hints.includes('Enter') && painted.hints.includes('Space')
  && painted.hints.includes('Escape'),
  `the hint line lists the keys that advance the step (${painted.hints})`);
check(painted.join === painted.joinCopy, 'the pairing step item is named by the copy');
check(painted.waiting === painted.waitingCopy, 'the waiting line is the copy');

// The step shows no play field: its row declares none.
const fieldShown = await shown(page, '#game', false);
check(fieldShown, 'the pairing step shows no play field');

// The waiting line is on screen while no peer is paired.
const waitingShown = await shown(page, '#pairing-waiting', true);
check(waitingShown, 'the waiting line is on screen while no peer is paired');

// Nothing may be scheduled here: the lobby counts the matches pairing starts,
// and the engine advances its tick slot on every frame regardless of screen
// state, so the match count and the screen state are what prove no match runs.
const idle = await page.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return {
    matches: netplay.lobby.matches,
    paired: netplay.lobby.paired,
    state: window.__game.screen.state,
  };
});
check(idle.matches === 0 && !idle.paired, 'no match is scheduled in the pairing step (zero matches, no peer paired)');
check(idle.state === 'PAIRING', `the step stays on the pairing screen (state ${idle.state})`);

// ---------- 7.4: Back leaves the pairing step ----------

// The step's own Back control is the Escape key; confirming it must return the
// page to the starting menu without scheduling anything.
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

const back = await page.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return {
    state: window.__game.screen.state,
    matches: netplay.lobby.matches,
    paired: netplay.lobby.paired,
  };
});
check(back.state === 'MENU', `confirming Back shows the starting menu again (state ${back.state})`);
check(back.matches === 0 && !back.paired, 'confirming Back starts no match (zero matches, no peer paired)');
check(await shown(page, '#menu-view', true), 'the starting menu is on screen after Back');
check(await shown(page, '#pairing-view', false), 'the pairing step is gone after Back');
check(await shown(page, '#game', false), 'the play field stayed hidden across the whole pairing step');

// ---------- 7.4b: the same Back control is confirmable by pointer ----------

// A device with no keyboard reaches the pairing step by tapping, so Back must
// answer the pointer as it answers the key.
await page.evaluate(() => window.__game.screen.state = 'PAIRING');
await page.waitForTimeout(200);

const backBox = await page.evaluate(() => {
  const box = document.querySelector('#pairing-back').getBoundingClientRect();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
});
await page.mouse.click(backBox.x, backBox.y);
await page.waitForTimeout(200);

const tapped = await page.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return {
    state: window.__game.screen.state,
    matches: netplay.lobby.matches,
    paired: netplay.lobby.paired,
  };
});
check(tapped.state === 'MENU', `tapping the Back control shows the starting menu again (state ${tapped.state})`);
check(tapped.matches === 0 && !tapped.paired, 'tapping Back starts no match (zero matches, no peer paired)');
check(await shown(page, '#pairing-view', false), 'the pairing step is gone after tapping Back');

// ---------- 7.5: the fragment cap decides which form the step paints ----------

// The cap is a rule constant, not a number this check repeats.
const cap = await page.evaluate(async () => (await import('/js/constants.js')).PAIRING_FRAGMENT_CAP);
const realBlob = await page.evaluate(async () => (await import('/js/netplay.js')).lobby.offer);
check(realBlob.length <= cap,
  `the real offer fits the cap (${realBlob.length} of ${cap} bytes) and takes the link form`);

// No offer this browser can make crosses the cap: the offer description above
// is 458 bytes whatever the peer connection holds, so the oversized blob is a
// supply standing in for an offer that carries more lines — the case the cap
// exists to survive. The rule under test reads only the blob length, so the
// form it picks for a longer blob is the form a longer offer would get.
const oversized = `${realBlob}\r\na=${'x'.repeat(cap)}`;

// The step is on screen, so the painter runs on the new secret.
await page.evaluate(() => window.__game.screen.state = 'PAIRING');
await page.waitForTimeout(200);

const fallback = await page.evaluate(
  async ({ blob, url }) => {
    const netplay = await import('/js/netplay.js');
    const copy = await import('/js/constants.js');
    const form = netplay.publish(blob, 20240601, url);
    return {
      form,
      code: netplay.lobby.code,
      secretIsCode: netplay.lobby.secret === netplay.lobby.code,
      link: netplay.lobby.link,
      codeLength: netplay.lobby.code.length,
      codeInAlphabet: [...netplay.lobby.code].every((c) => copy.PAIRING_CODE_ALPHABET.includes(c)),
      blobLength: blob.length,
      overCap: blob.length > copy.PAIRING_FRAGMENT_CAP,
    };
  },
  { blob: oversized, url: BASE + 'snaketris.html' },
);

check(fallback.overCap, `the supplied blob exceeds the cap (${fallback.blobLength} of ${cap} bytes)`);
check(fallback.form === 'code',
  `the over-cap blob falls back to the short pairing token (form ${fallback.form})`);
check(fallback.secretIsCode, 'the short token is the secret this page holds for the other device');
check(fallback.codeLength === 6 && fallback.codeInAlphabet,
  `the painted token is short and readable (${fallback.code}, every letter in the pairing alphabet)`);
check(fallback.link === '', 'the code form offers no link, so nothing oversized is painted');

check(await shown(page, '#pairing-link', false), 'the code form shows no share link');
check(await shown(page, '#pairing-qr', false), 'the code form paints no QR');

console.log(`forms painted: link form at ${realBlob.length} bytes, code form at ${fallback.blobLength} bytes`);

await page.close();

// ---------- 7.6: the short readable code, and a second page that types it ----------

// A page opened from a pairing link adopts the secret its fragment carries at
// load, so it needs no menu walk; the helper opens one at an arbitrary url.
async function openAt(url) {
  const p = await context.newPage();
  p.on('pageerror', (err) => console.log('  \u2717 page error: ' + err.message));
  await servePage(p, ROOT);
  await p.goto(url);
  await exposeGame(p);
  return p;
}

// The host page: a real offer, published, so the code it paints is the code the
// second page derives from the same blob.
page = await freshPage(context, ROOT);
const host = await publishOffer(page, BASE + 'snaketris.html');
await page.evaluate(() => window.__game.screen.state = 'PAIRING');
await page.waitForTimeout(200);

const hostLine = await page.evaluate(() => document.getElementById('pairing-code').textContent);
check(hostLine.includes(host.code), `the pairing step paints the short readable code beside the link and the QR (${hostLine})`);
check(await shown(page, '#pairing-code', true), 'the code line is on screen in the pairing step');
check(await shown(page, '#pairing-link', true) && await shown(page, '#pairing-qr', true),
  'the link and the QR stay on screen beside the code');
check(host.form === 'link' && host.secretLength > 0, 'the host holds the secret the link carries');
const shareUrl = host.link;
await page.close();

// The second page opened that link: its own page url carries the blob, so it
// adopts the secret at load and lands on the pairing step.
const second = await openAt(shareUrl);
const adopted = await second.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return {
    state: window.__game.screen.state,
    form: netplay.lobby.form,
    secret: netplay.lobby.secret.length,
    code: netplay.lobby.code,
    paired: netplay.lobby.paired,
    matches: netplay.lobby.matches,
  };
});
check(adopted.state === 'PAIRING', 'the second page opened a pairing link and lands on the pairing step');
check(adopted.form === 'link' && adopted.secret > 0, 'the second page adopted the secret its link fragment carries');
check(adopted.code === host.code, `the second page derives the same short code (${adopted.code})`);
check(!adopted.paired && adopted.matches === 0, 'the second page starts unpaired with no match scheduled');
check(await shown(second, '#pairing-code', true), 'the second page shows the code line on its own page');

// The second player types the code on their own page, one character per key.
for (const ch of host.code) await second.keyboard.press(ch);
await second.waitForTimeout(200);
const joined = await second.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return { paired: netplay.lobby.paired, matches: netplay.lobby.matches, typed: netplay.lobby.typed };
});
check(joined.typed === host.code, `the typed run is the code the page typed (${joined.typed})`);
check(joined.paired, 'typing the code on the second page reaches the paired state');
check(joined.matches === 1, `typing the code schedules one match (${joined.matches})`);
check(await waitFor(second, () => window.__game.screen.state === 'PAIRING', null, 500), 'the second page stays on the pairing step');
await second.close();
