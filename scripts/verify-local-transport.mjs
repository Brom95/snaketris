// scripts/verify-local-transport.mjs
// The same-network way's transport proof, at the browser level.
//
// Run: node scripts/verify-local-transport.mjs
//
// Two SEPARATE browser instances stand for the two devices that share one
// network. Both run on this machine, so both name the one address the player
// tests with — a real routable quad of this host, not a stand-in — and each
// page reads its own port out of its own description. What the harness carries
// across on the host's behalf is one thing a player does with hands: the line
// the other page copies beside its own address. Everything after that line
// lands inside the pages, on their own, and the check asserts the pair joins
// there: both connections report connected, each channel reports open, and
// the guest's answer arrives over the joined channel.
//
// What stays outside this check: the router's own behaviour between two
// different machines, and a browser engine that is not this one.

import { chromium } from '@playwright/test';
import { check, failureCount, report, BASE } from './harness.mjs';
import { resolve } from 'node:path';
import { servePage, exposeGame, freshPage, stateIs } from './harness.mjs';

const ROOT = resolve(import.meta.dirname, '..');
// The address a player tests this way with: their own device's own quad. This
// machine answers with two of them, so the harness uses one and leaves the
// other for the negative case to miss.
const HOST_ADDRESS = '100.107.90.10';
const GUEST_ADDRESS = '100.107.90.10';

// What one page holds: its own address and port, what it learned about its
// peer, where its connection and channel stand, and what crossed to it.
async function held(page) {
  return await page.evaluate(async () => {
    const netplay = await import('/js/netplay.js');
    const link = netplay.peerLink();
    const pc = link && link.transport && link.transport.connection;
    const lobby = netplay.lobby;
    let answerIn = -1;
    try { answerIn = (netplay.inboundReport().answer || '').length; } catch (e) { answerIn = -1; }
    return {
      form: lobby.form,
      address: lobby.address,
      port: lobby.port,
      peerAddress: lobby.peerAddress,
      peerPort: lobby.peerPort,
      paired: lobby.paired,
      link: lobby.link,
      connection: pc ? pc.connectionState : 'none',
      ice: pc ? pc.iceConnectionState : 'none',
      gathering: pc ? pc.iceGatheringState : 'none',
      channel: pc && pc.channel ? pc.channel.readyState : 'none',
      answerIn: answerIn,
      sys: pc ? pc.signalingState : 'none',
      locLen: pc && pc.localDescription ? pc.localDescription.sdp.length : 0,
      remLen: pc && pc.remoteDescription ? pc.remoteDescription.sdp.length : 0,
      ownLine: (pc && pc.localDescription ? pc.localDescription.sdp : '').includes('candidate:'),
      ev: (() => { try { return (window.__pcEvents || []).length; } catch (e) { return -1; } })(),
    };
  });
}

// Poll a page's state from the Node side, so one read is one page snapshot and
// a stuck pair costs a report, never a thrown harness.
async function poll(page, wanted, ms) {
  const deadline = Date.now() + ms;
  let last = null;
  while (Date.now() < deadline) {
    last = await held(page);
    if (wanted(last)) return last;
    await page.waitForTimeout(400);
  }
  return last;
}

console.log('=== same-network transport proof ===');

// The page a player opens first: the starting menu, the two-player entry, the
// same-network way, then their own device's address typed into the field the
// way shows.
const hostBrowser = await chromium.launch();
const hostContext = await hostBrowser.newContext();
const host = await freshPage(hostContext, ROOT);
await host.click('#menu-item-two-player');
await stateIs(host, 'SELECT_WAY', 10000);
await host.click('#way-item-network-local');
await stateIs(host, 'PAIRING', 10000);
await host.keyboard.type(HOST_ADDRESS);
await host.waitForTimeout(600);

const published = await poll(host, (s) => s.port > 0 && s.link.includes('&p='), 25000);
check((published.form === 'link' || published.form === 'code') && published.port > 0 && published.link.includes('p='),
  'the host page runs the same-network way and names a port it read on the line it shares');

// The page the other player opens: at the line the first page shared, so it
// inherits the way and its host's address and port without typing.
const guestBrowser = await chromium.launch();
const guestContext = await guestBrowser.newContext();
const guestPage = await guestContext.newPage();
await servePage(guestPage, ROOT);
await guestPage.goto(published.link);
await exposeGame(guestPage);
await stateIs(guestPage, 'PAIRING', 10000);
await guestPage.keyboard.type(GUEST_ADDRESS);
await guestPage.waitForTimeout(600);

const opened = await poll(guestPage, (s) => s.port > 0, 25000);
check(opened.port > 0,
  'the opened page reads a port out of its own description too, once its candidates gather');
check(opened.peerAddress === HOST_ADDRESS && opened.peerPort === published.port,
  'the opened page learns its host\'s address and port from the line it opened, without typing');

// The one hop the players perform: the opened page copies its own line beside
// its own address, and the first page's player pastes that line into the field
// the first page shows while it holds nothing to point at. A fill stands for the
// paste: it puts the value in the field the way a clipboard write does.
const carried = GUEST_ADDRESS + ':' + opened.port;
await host.locator('#pairing-peer').fill(carried);
const learned = await poll(host, (s) => s.peerAddress !== '' && s.peerPort > 0, 15000);
check(learned.peerAddress === GUEST_ADDRESS && learned.peerPort === opened.port,
  'the host page learns the peer address and port from the line its player carried');

// Both pages point now. The pair joining is what this check asserts, and it
// belongs to the pages alone: nothing here reaches into either one.
const hostJoined = await poll(host, (s) => s.connection === 'connected', 30000);
check(hostJoined.connection === 'connected', 'the host page reports a joined connection');
const guestJoined = await poll(guestPage, (s) => s.connection === 'connected', 30000);
check(guestJoined.connection === 'connected', 'the opened page reports a joined connection');

const hostNow = await held(host);
const guestNow = await held(guestPage);

check(hostNow.connection === 'connected' && guestNow.connection === 'connected',
  'both pages report a joined connection at the address and ports the pair named');
check(hostNow.ice === 'connected' && guestNow.ice === 'connected',
  'the candidates both pages offered, naming each other, are the ones that connected');
check(hostNow.channel === 'open' && guestNow.channel === 'open',
  'each page reports its side of the channel open');
check(hostNow.answerIn > 0,
  'the opened page\'s answer crossed to the host over the joined channel, not over a stand-in');
check(hostNow.paired && guestNow.paired,
  'both pages reach the paired state through the transport itself');

// A peer that typed an address no device answers with stays unjoined: the pair
// points at nothing that exists, so nothing opens.
const strayBrowser = await chromium.launch();
const strayContext = await strayBrowser.newContext();
const strayPage = await strayContext.newPage();
await servePage(strayPage, ROOT);
await strayPage.goto(published.link);
await exposeGame(strayPage);
await stateIs(strayPage, 'PAIRING', 10000);
await strayPage.keyboard.type('100.107.90.11');
const stray = await poll(strayPage, (s) => false, 9000);
check(stray.connection !== 'connected' && stray.channel !== 'open',
  'a peer that typed an address its device does not answer with reports no open channel');

await host.close();
await guestPage.close();
await strayPage.close();
for (const b of [hostBrowser, guestBrowser, strayBrowser]) await b.close();

console.log('  host: connection ' + hostNow.connection + ' ice ' + hostNow.ice + ' gather ' + hostNow.gathering + ' channel ' + hostNow.channel + ' paired ' + hostNow.paired);
console.log('  host own ' + hostNow.address + ':' + hostNow.port + ' · peer ' + hostNow.peerAddress + ':' + hostNow.peerPort);
console.log('  opened: connection ' + guestNow.connection + ' ice ' + guestNow.ice + ' gather ' + guestNow.gathering + ' channel ' + guestNow.channel + ' paired ' + guestNow.paired);
console.log('  opened own ' + guestNow.address + ':' + guestNow.port + ' · peer ' + guestNow.peerAddress + ':' + guestNow.peerPort);
console.log('  answer bytes that crossed to the host: ' + hostNow.answerIn);
console.log('  host sdp: signaling ' + hostNow.sys + ' local ' + hostNow.locLen + ' remote ' + hostNow.remLen + ' own candidate line ' + hostNow.ownLine);
console.log('  opened sdp: signaling ' + guestNow.sys + ' local ' + guestNow.locLen + ' remote ' + guestNow.remLen + ' own candidate line ' + guestNow.ownLine);
console.log('  host ice events seen: ' + hostNow.ev + ' | opened ice events seen: ' + guestNow.ev);
console.log('  stray opened: connection ' + stray.connection + ' / ice ' + stray.ice + ' / channel ' + stray.channel);

report('verify-local-transport', failureCount());
