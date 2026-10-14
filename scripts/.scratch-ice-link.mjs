// scripts/.scratch-ice-link.mjs — what does a page opened at a pairing link see?
import { chromium } from '@playwright/test';
import path from 'node:path';
import { BASE, check, freshPage, exposeGame, servePage } from './harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const context = await browser.newContext();

const host = await freshPage(context, ROOT);
const published = await host.evaluate(
  async (url) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('snaketris-pair', { negotiated: true, negotiatedStreams: 2, id: 0 });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const netplay = await import('/js/netplay.js');
    const form = netplay.publish(pc.localDescription.sdp, 20240601, url);
    return { form, link: netplay.lobby.link, code: netplay.lobby.code, secret: netplay.lobby.secret.length, url };
  },
  BASE + 'snaketris.html',
);
console.log('host publish:', JSON.stringify(published));

const guest = await context.newPage();
guest.on('pageerror', (err) => console.log('  page error: ' + err.message));
await servePage(guest, ROOT);
await guest.goto(published.link);
await exposeGame(guest);
const seen = await guest.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  let adoptResult = null;
  let adoptError = null;
  try {
    adoptResult = netplay.adopt(location.hash.slice(1));
  } catch (error) {
    adoptError = String(error);
  }
  return {
    href: location.href,
    hashLength: location.hash.length,
    secret: netplay.lobby.secret.length,
    form: netplay.lobby.form,
    ice: netplay.lobby.ice,
    state: window.__game.screen.state,
    adoptResult,
    adoptError,
  };
});
console.log('guest sees:', JSON.stringify(seen));
await browser.close();
