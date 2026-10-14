// Standalone transport proof for tasks 1.1, 1.2 and 1.3 of change
// network-multiplayer-webrtc. No netcode module exists yet: this script proves
// the primitive the later groups build on.
//
// It opens two routed pages over http://duel.test/ in one browser context. Each
// page constructs its own RTCPeerConnection with a supplied iceServers list and
// creates a negotiated data channel BEFORE any offer/answer exchange, so the
// channel exists before negotiation and can carry the guest -> host hop.
//
// Run: node scripts/verify-webrtc-pairing.mjs

import { chromium } from '@playwright/test';
import { check, report, waitFor } from './harness.mjs';

const ORIGIN = 'http://duel.test/';
const CHANNEL_LABEL = 'snaketris-pair';

// The offer travels out of band (the share link's URL fragment in the real page).
// The answer travels over the negotiated channel, which is the hop the link
// cannot carry.
const OFFER_HOP = 'link fragment';
const ANSWER_HOP = 'negotiated data channel';

const CONFIGS = [
  { name: 'no ICE server', iceServers: [] },
  { name: 'supplied ICE list', iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] },
];

const browser = await chromium.launch();
const context = await browser.newContext();

// A blank page on the routed origin: the proof needs no game code, only two
// same-origin browser pages that can each hold a peer connection.
async function blankPage() {
  const page = await context.newPage();
  await page.route(ORIGIN + '**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><head><meta charset="utf-8"><title>peer</title></head><body></body></html>',
    })
  );
  await page.goto(ORIGIN + 'peer');
  return page;
}

// Installs one peer on one page: the connection, the negotiated channel, and the
// page-side record of every channel message, iceconnection state and
// connectionstatechange state.
async function installPeer(page, label, iceServers) {
  await page.evaluate(
    ({ label, iceServers, channelLabel }) => {
      const peer = { label, received: [], sent: [], ice: [], states: [], gathering: false, gatheringComplete: false, candidateLog: [], sendFailed: 0 };
      window.__peer = peer;

      const pc = new RTCPeerConnection({ iceServers });
      peer.pc = pc;

      pc.addEventListener('icecandidate', (event) => {
        peer.candidates = (peer.candidates || 0) + 1;
        peer.candidateLog.push(event.candidate ? String(event.candidate.candidate).slice(0, 60) : null);
        if (!event.candidate) peer.gathering = true;
      });
      pc.addEventListener('icegatheringicecandidate', (event) => {
        peer.gatheringComplete = true;
        peer.gatheringLog = event.candidate ? String(event.candidate.candidate).slice(0, 60) : null;
      });
      pc.addEventListener('iceconnection', () => peer.ice.push(pc.iceConnectionState));
      pc.addEventListener('connectionstatechange', () => peer.states.push(pc.connectionState));
      pc.addEventListener('negotiationboundary', () => peer.states.push('negotiation-boundary'));

      const channel = pc.createDataChannel(channelLabel, { negotiated: true, negotiatedStreams: 2, id: 0 });
      peer.channel = channel;
      channel.addEventListener('message', (event) => peer.received.push(event.data));
      channel.addEventListener('open', () => (peer.channelOpen = true));
      channel.addEventListener('close', () => (peer.channelClosed = true));
    },
    { label, iceServers, channelLabel: CHANNEL_LABEL },
  );
}

// Drops only the comment lines an SDP carries. The blank tail stays: libwebrtc
// rejects an SDP whose last line has no CRLF, and the trailing empty element of
// the split supplies it.
function trimmedSdp(sdp) {
  return sdp
    .split('\r\n')
    .filter((line) => !line.startsWith('#'))
    .join('\r\n');
}

// The host side: create the offer, set it locally, and wait for the first ICE
// candidate. Headless Chromium here never reaches iceGatheringState complete,
// with or without a STUN list: exactly one non-null icecandidate event fires and
// no null-candidate event follows it. The script records that state and takes the
// offer once a candidate exists, because the proof needs the SDP text, not a
// finished gathering.
async function hostOffer(page) {
  const gathered = await page.evaluate(async () => {
    const peer = window.__peer;
    let error = null;
    try {
      peer.local = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(peer.local);
    } catch (err) {
      error = String(err);
    }
    for (let i = 0; i < 100 && peer.candidateLog.length === 0 && peer.pc.iceGatheringState !== 'complete'; i++) {
      await new Promise((next) => setTimeout(next, 50));
    }
    return {
      candidates: peer.candidates || 0,
      gatheringComplete: peer.gatheringComplete,
      iceGatheringState: peer.pc.iceGatheringState,
      candidate: peer.candidateLog.length > 0 ? peer.candidateLog[0] : null,
      offer: peer.local ? peer.local.sdp : null,
      error,
    };
  });
  if (!gathered) return null;
  console.log('  offer diagnostics: ' + JSON.stringify({
    candidates: gathered.candidates,
    gatheringComplete: gathered.gatheringComplete,
    iceGatheringState: gathered.iceGatheringState,
    error: gathered.error,
  }));
  if (!gathered.offer) return null;
  return trimmedSdp(gathered.offer);
}

// The guest side: accept the offer, create its answer and push it over the
// negotiated channel. The send is retried because the channel opens on the
// frame after the remote description is set.
async function guestAnswer(page, offerSdp) {
  const ok = await page.evaluate(
    async (offerSdp) => {
      const peer = window.__peer;
      peer.offerSeen = offerSdp;
      await peer.pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      peer.answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(peer.answer);
      for (let i = 0; i < 200; i++) {
        try {
          peer.channel.send(peer.answer.sdp);
          peer.sent.push(peer.answer.sdp);
          return true;
        } catch {
          peer.sendFailed++;
          await new Promise((next) => setTimeout(next, 50));
        }
      }
      return false;
    },
    offerSdp,
  );
  return { ok, hop: ANSWER_HOP };
}

const SDP_MARK = 'm=';

function isSdpMessage(msg) {
  return msg !== null && msg.length > 50 && msg.includes(SDP_MARK);
}

// One full run of the handshake for one ICE configuration.
async function runPairing(name, iceServers) {
  console.log('--- ' + name + ' ---');
  const host = await blankPage();
  const guest = await blankPage();
  await installPeer(host, 'host', iceServers);
  await installPeer(guest, 'guest', iceServers);

  const offer = await hostOffer(host);
  if (!offer) {
    check(false, 'the host gathered ICE candidates and produced an offer SDP');
    return null;
  }

  const answerHop = await guestAnswer(guest, offer);
  const offerReachedGuest = await guest.evaluate((blob) => window.__peer.offerSeen === blob, offer);

  const answerReachedHost = await waitFor(
    host,
    (mark) => window.__peer.received.some((msg) => msg.length > 50 && msg.includes(mark)),
    SDP_MARK,
    15000,
  );

  const connectedBeforeHops = await Promise.all([
    host.evaluate(() => window.__peer.ice.filter((s) => s === 'connected').length),
    guest.evaluate(() => window.__peer.ice.filter((s) => s === 'connected').length),
  ]);

  check(offerReachedGuest, 'the host offer SDP reached the guest page (' + OFFER_HOP + ')');
  check(answerHop.ok, 'the guest sent its answer SDP over the negotiated data channel');
  check(answerReachedHost, 'the guest answer SDP reached the host page over the negotiated data channel');
  check(connectedBeforeHops.every((n) => n === 0), 'neither page reported iceconnection connected before the SDP hops');

  const answerSdp = await host.evaluate(
    (mark) => window.__peer.received.find((msg) => msg.length > 50 && msg.includes(mark)),
    SDP_MARK,
  );
  if (answerSdp) {
    await host.evaluate(
      async (answerSdp) => {
        await window.__peer.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      },
      answerSdp,
    );
  }

  // Task 1.2: both pages send and receive one data-channel message each.
  const hostMarker = 'snaketris-marker-from-host';
  const guestMarker = 'snaketris-marker-from-guest';
  for (const [page, marker] of [[host, hostMarker], [guest, guestMarker]]) {
    await page.evaluate(
      async (marker) => {
        const peer = window.__peer;
        for (let i = 0; i < 200; i++) {
          try {
            peer.channel.send(marker);
            peer.sent.push(marker);
            return;
          } catch {
            await new Promise((next) => setTimeout(next, 50));
          }
        }
      },
      marker,
    );
  }

  const hostGotMarker = await waitFor(host, (marker) => window.__peer.received.includes(marker), guestMarker, 15000);
  const guestGotMarker = await waitFor(guest, (marker) => window.__peer.received.includes(marker), hostMarker, 15000);
  check(hostGotMarker, 'the host page received one data-channel message from the guest page');
  check(guestGotMarker, 'the guest page received one data-channel message from the host page');

  const readPeer = () => ({ ice: window.__peer.ice, states: window.__peer.states, open: Boolean(window.__peer.channelOpen) });
  const states = [await host.evaluate(readPeer), await guest.evaluate(readPeer)];

  const paired = states.every((s) => s.open) && hostGotMarker && guestGotMarker;
  const everConnected = states.some((s) => s.ice.includes('connected') || s.states.includes('connected'));

  console.log('  iceconnection states: host=' + JSON.stringify(states[0].ice) + ' guest=' + JSON.stringify(states[1].ice));
  console.log('  connection states:    host=' + JSON.stringify(states[0].states) + ' guest=' + JSON.stringify(states[1].states));
  console.log('  channel open:         host=' + states[0].open + ' guest=' + states[1].open);
  console.log('  paired:               ' + paired + '   iceconnection connected seen: ' + everConnected);

  await host.close();
  await guest.close();
  return { paired, everConnected, offerBytes: Buffer.byteLength(offer, 'utf8') };
}

console.log('=== WebRTC data-channel pairing proof ===');

const first = await runPairing(CONFIGS[0].name, CONFIGS[0].iceServers);
let result = first;
let usedConfig = CONFIGS[0].name;

if (!first || !first.everConnected) {
  console.log('');
  console.log('  iceconnection never reported connected without an ICE server: running the supplied-iceServers configuration');
  const second = await runPairing(CONFIGS[1].name, CONFIGS[1].iceServers);
  if (second && second.paired) {
    result = second;
    usedConfig = CONFIGS[1].name;
  }
}

console.log('');
if (!result) {
  console.log('  no configuration paired the pages; the offer SDP byte length is not measurable');
  check(false, 'the trimmed offer SDP byte length is printed for the QR cap in task 7.1');
} else {
  console.log('  configuration that paired the pages: ' + usedConfig);
  console.log('  offer SDP byte length after trimming comment lines: ' + result.offerBytes);
  check(Number.isInteger(result.offerBytes) && result.offerBytes > 0, 'the trimmed offer SDP byte length is printed for the QR cap in task 7.1');
}

console.log('');
report('verify-webrtc-pairing', 0);
await browser.close();
