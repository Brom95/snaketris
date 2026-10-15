// app.js — entry point. Wires every module, owns the game loop and the
// canvas. Called once on module load (deferred `<script type="module">`),
// so the DOM is parsed by the time it runs.
import { TICK, PLAYING } from './constants.js';
import { game, resetGame, countdownSystem } from './state.js';
import { loadBoard, recordsSystem } from './highscores.js';
import { createClock } from '../engine/js/clock.js';
import { createEngine } from '../engine/js/registry.js';
import { botSystem } from './bot.js';
import { snakeSystem } from './snake.js';
import { piecesSystem } from './pieces.js';
import { screenSystem, selectedBoardMinutes, enterPairing, drainIntents, gotoScreen } from './screens.js';
import {
  adopt, registerTransport, openLink, peerLink, duelOpen, guestPage, hostPage,
  publish, sendFrame, sendPreparationMirror, answerOffer, acceptAnswer, onPeerClose,
  peerClosed, peerLeft, inboundReport, reportPeerState, localSeat, openGuestStream,
  guestStreamReport, setIceFallback, setIceOpen, startIceAttempt, carriesRemoteAddress,
  lobby,
} from './netplay.js';
import { gameOver } from './state.js';
import { PEER_LEFT } from './rules.js';
import { initInput, fitCanvas, pollController, handleIntent } from './input.js';
import { initRender, render } from './render.js';
import { initUi, syncViews, interfaceBandHeight } from './ui.js';

// The shipped ICE floor every open starts with. An open that reaches the public
// list adds entries to it; an open that cannot reaches only this. An empty
// supply leaves only the `<uuid>.local` candidate, which reaches another
// connection inside the same browser instance and never another device. An open
// never writes into this list — the supply it chose is a local.
export const ICE_SERVERS = [
  { urls: ['stun:turn.cloudflare.com'] },
  { urls: ['stun:l369369369.cdn.cloudflare.net'] },
  { urls: ['stun:webrtcstun.eporoi.com'] },
  { urls: ['stun:st3043834177.stun.eporoi.com'] },
];

// STUN server list URL — hardcoded per project requirement.
// Use this URL to fetch a fresh list of online STUN servers whenever needed.
const STUN_SERVERS_URL = 'https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_hosts.txt';

// How long one open may wait for that list before it gives up: the pairing step
// already counts a longer wait, so a slow or unreachable source costs the open
// this bound and falls back to the shipped supply rather than stretching it.
export const STUN_FETCH_TIMEOUT_MS = 1200;

// How many entries the public list may contribute to one open: an offer carries
// a candidate block per server it can reach, and that blob travels in the
// pairing secret, so the cap keeps the link inside the fragment cap and the
// short code form reachable.
export const ICE_SUPPLY_LIMIT = 4;

// The supply this open resolved, chosen before its channel is built. The
// shipped list starts the open; an open that asked the public list replaces it
// for the channel it builds, and nothing ever writes into ICE_SERVERS.
let iceSupply = ICE_SERVERS;

async function fetchStunServers() {
  try {
    // The read gets a bound of its own: an open whose source is slow or
    // unreachable must not stretch the wait the pairing step already counts, so
    // the read gives up and the open falls back to the shipped supply.
    const response = await fetch(STUN_SERVERS_URL, { signal: AbortSignal.timeout(STUN_FETCH_TIMEOUT_MS) });
    if (!response.ok) return [];
    const text = await response.text();
    // The list names hosts, not URLs: most lines are a bare `host:port` the
    // source says answers now, and a peer connection needs a scheme, so the
    // entries this page can hand are those hosts under the stun scheme. A line
    // that already carries a scheme is taken as it is; one that carries neither
    // form is dropped rather than handed on as something the connection rejects.
    const entries = [];
    for (const line of text.split('\n')) {
      const host = line.trim();
      const entry = /^[A-Za-z0-9.-]+:\d+$/.test(host) ? `stun:${host}` : host;
      if (isIceUrl(entry)) entries.push(entry);
    }
    return entries;
  } catch (e) {
    return [];
  }
}

// A candidate supply entry a peer connection can take: the stun and turn schemes
// only. A bare address — a host on the subnet, with or without a port — names no
// ICE endpoint of its own, so it is never offered as a candidate.
function isIceUrl(value) {
  return /^stuns?:[A-Za-z0-9.-]+(:\d+)?$/.test(value) || /^turn:[A-Za-z0-9.-]+(:\d+)?$/.test(value);
}

// The candidate supply for one open, chosen per open rather than written back
// into the page's constant. A link that names its own supply — the host endpoint
// on the subnet — is that supply, and contacts no public list at all. Otherwise
// the open reads the public list, which names the hosts online now, and adds a
// sample of it to the shipped floor; entries the list does not name are never
// offered, and a list this open cannot read leaves the floor alone. An attempt
// reports what its offer carries, so a supply that answers nothing is a page
// with no channel, never a silent pairing.
export async function iceSupplyForOpen() {
  const named = iceServersFromUrl([]);
  if (named.length > 0) return named;
  const fresh = await fetchStunServers();
  if (fresh.length === 0) return ICE_SERVERS.slice();
  return ICE_SERVERS.concat(pickIceServers(fresh, ICE_SUPPLY_LIMIT));
}

// A bounded sample of the public list for one open: the list names hundreds of
// hosts, and an offer carries a candidate block per server it can reach, so an
// open takes a few at random and a later open takes different ones.
function pickIceServers(urls, limit) {
  const picked = urls.slice(0, Math.min(limit, urls.length));
  for (let i = picked.length; i < urls.length; i += 1) {
    const replace = Math.floor(Math.random() * (i + 1));
    if (replace < picked.length) picked[replace] = urls[i];
  }
  return picked.map((url) => ({ urls: [url] }));
}

// The supply this open resolved, recorded so the channel this open builds reads
// it. The transport factory is registered once at page init, so choosing a
// supply never rebuilds the channel and never replaces a transport another
// page installed: the supply is data, and the channel is built after this runs.
function chooseIceSupply(supply) {
  iceSupply = supply;
}

// The transport supply: the consumer constructs the peer connection and the
// negotiated data channel, and hands the engine link an object with the three
// verbs it owns — send, onMessage, and the connection the offer/answer hop
// needs. The engine never names the channel class.
// A page with no channel object at all — a headless suite, which is exactly the
// run the contract says the engine must survive — supplies no transport, and the
// link reports no peer rather than failing.
// The ICE list a page gathers with. A page can name its own supply from its own
// address — `?ice=stun:...`, repeated — so two devices on one network that run
// one ICE server can point both pages at it. A value that names no scheme is an
// address, not a supply, and stays out of the list: a browser page has no other
// way to obtain an address to connect to, so STUN is what supplies addresses, and
// without one no peer, on any network, can be reached.
function iceServersFromUrl(fallback) {
  const href = typeof location === 'object' ? location.href : '';
  if (href === '') return fallback;
  const urls = new URL(href).searchParams.getAll('ice').filter(isIceUrl);
  if (urls.length === 0) return fallback;
  return urls.map((url) => ({ urls: [url] }));
}

function createTransport(iceServers) {
  if (typeof RTCPeerConnection !== 'function') return null;
  const pc = new RTCPeerConnection({ iceServers });
  const channel = pc.createDataChannel('snaketris-pair', { negotiated: true, negotiatedStreams: 2, id: 0 });
  // The ICE gathering the engine link holds: the candidates arrive as events,
  // so the consumer forwards them and the link keeps the list.
  pc.addEventListener('icecandidate', (event) => reportPeerState('iceCandidate', event.candidates));
  pc.addEventListener('iceconnectionstatechange', () => reportPeerState('connection', pc.connectionState));
  return {
    send: (message) => {
      try {
        channel.send(message);
        return true;
      } catch (e) {
        return false;
      }
    },
    onMessage: (handler) => channel.addEventListener('message', (event) => handler(event.data)),
    connection: pc,
  };
}

// The ordered systems: the bot decides first (its direction is applied before
// the snake steps), then the snake steps, then the pieces fall and eat, then
// the countdown (which declares only endTick, so its place fixes the closing
// order and not the update order), then the records owner persists a result
// the core reported, and last the screen system drains the navigation intents
// the devices produced. The records step runs before navigation so a same-tick
// restart cannot drop a reported result. The registry holds no painting step:
// canvas painting and page painting run once per rendered frame in frame(),
// not once per tick.
// The guest page's control actions travel to the host page as messages; the
// command stream the host page holds aligns each one on the tick the engine
// reports, and this system drains it before the snake steps and the pieces fall
// — the same place a local key acts on the current tick.
const guestIntentSystem = {
  name: 'guest-intents',
  update(ctx) {
    const stream = guestStreamReport();
    if (stream) stream.drain(ctx);
  },
};

export const systems = [guestIntentSystem, botSystem, snakeSystem, piecesSystem, countdownSystem, recordsSystem, screenSystem];
const engine = createEngine(systems);

// The context handed to each system's phase call. The engine reads the state
// root through it: ctx.state.play.tick is the tick slot it owns, ctx.state.screen
// is the navigation half it resets.
const ctx = { state: game };

// Fixed-timestep clock: accumulates frame time and yields 0..N ticks to run.
// Mirrors the accumulator pattern that lived in app.update().
const clock = createClock(TICK);

let last = performance.now();
let lastBand = -1;

// The band the interface takes from the field changes with the shown view
// (the hidden field and the overlaid readout claim none), so the field is
// re-fitted on the frame rather than only on resize. The band rarely moves,
// so the fit is skipped while it is unchanged.
function fitField(force = false) {
  const band = interfaceBandHeight();
  if (!force && band === lastBand) return;
  lastBand = band;
  fitCanvas(band);
}

// One fixed-timestep tick. The guest page runs no simulation: the host page
// owns the mechanism and sends the frames, so this page only drains the input
// its own devices produced.
export function update() {
  if (guestPage()) {
    drainIntents();
    return;
  }
  engine.update(ctx);
  engine.endTick(ctx);
  networkDuties();
}

// The network duties run in the same fixed-timestep step as the simulation: the
// host page carries the offer/answer hop, publishes the preparation it chose and
// sends the frame its simulation just produced. The guest page receives through
// the channel, so it has nothing to publish.
function networkDuties() {
  if (!game.screen.networkMode) return;
  // The ICE attempt runs once per page open, before anything publishes: the
  // address a peer connects to comes from the servers, and an offer published
  // while the attempt is still waiting carries no address at all. The pairing
  // step counts the wait down while it runs.
  startIceAttempt();
  // The wait only precedes pairing: while it runs the page publishes nothing and
  // builds no channel, so the offer it hands over already carries the supply
  // this open chose. A page whose peer is already paired keeps pumping — the
  // link it holds was built after that open resolved, so a later wait costs the
  // match nothing.
  if (lobby.ice === 'gathering' && !duelOpen()) return;
  openLink();
  // The seat cannot gate the publish: the seat is a consequence of publishing
  // (`publish` names the host seat 1, `adopt` names the guest seat 2), so a gate
  // on it would leave the first offer unpublished forever and a bare page would
  // sit on the pairing step with nothing to open. What separates the two pages
  // is which one adopted a fragment: the guest answers an offer, it never
  // publishes one.
  if (guestPage()) return;
  if (!lobby.offer) {
    publishOffer();
    return;
  }
  if (inboundReport().answer !== '' && !duelOpen()) acceptAnswer();
  // A frame only travels while the duel holds a peer: once the peer leaves, the
  // match ends on the close, and a frame after that would restart the game the
  // pages already returned to their pairing step.
  if (duelOpen() && (game.screen.state === PLAYING || game.play.gameOverReason)) sendFrame();
  sendPreparationMirror();
}

// The host publishes its offer: the consumer constructs the peer connection,
// creates the negotiated channel, and asks for the offer. The seed is a supply
// the pairing derives from the blob, so no clock is read here.
async function publishOffer() {
  const link = peerLink();
  const pc = link && link.transport && link.transport.connection;
  if (!pc) {
    lobby.ice = 'none';
    return;
  }
  const href = typeof location === 'object' ? location.href : '';
  try {
    // The page's own attempt already produced an offer and waited its servers
    // out, so publishing that SDP is what carries the address they resolved. A
    // page whose attempt rebuilt the channel holds no warmed offer and offers
    // again over the rebuilt one.
    let blob = lobby.warm;
    if (blob === '') {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      blob = pc.localDescription.sdp;
    }
    if (carriesRemoteAddress(blob)) {
      lobby.ice = 'remote';
      publish(blob, 0, href);
      return;
    }
    if (lobby.rebuilt) {
      // Second pass over the rebuilt channel: an empty ICE list leaves libwebrtc
      // the `<uuid>.local` candidate, which reaches another connection inside
      // the same browser instance — the one-network form the step warns about.
      publish(blob, 0, href);
      return;
    }
    // The attempt found no address, so no remote peer exists to carry: rebuild
    // the channel with an empty ICE list and publish on the next tick.
    lobby.ice = 'local';
    lobby.rebuilt = true;
    lobby.warm = '';
    try {
      pc.close();
    } catch (e) {
      // A connection the channel already closed closes nothing.
    }
    registerTransport(() => createTransport([]));
  } catch (e) {
    // An offer the connection cannot produce leaves the pairing step on the
    // code form; nothing else changes.
    lobby.ice = 'none';
  }
}

// rAF callback: advance the clock, run that many ticks, then render.
export function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const n = clock.advance(dt);
  for (let i = 0; i < n; i++) update();
  pollController();
  render();
  syncViews(game.screen.state === 'RECORDS' ? loadBoard(selectedBoardMinutes()) : null);
  fitField();
}

// A page opened from a pairing link carries the secret in its fragment. The
// page url is a supply: js/netplay.js never reads `location`, so this entry
// point reads the fragment and hands it over. A page with no fragment, and a
// headless suite with no `location` at all, adopt nothing and stay on the menu.
export function openPairingLink() {
  const fragment = typeof location === 'object' ? location.hash.slice(1) : '';
  if (!adopt(fragment)) return false;
  enterPairing();
  return true;
}

// Full setup: create/size the canvas, register input + render, seed state,
// start the loop. The engine canvas owner sizes the buffer when the element
// is attached, so the entry point names no board numbers.
export function init() {
  const canvas = document.getElementById('game');
  initRender(canvas);
  initInput(canvas);
  initUi();
  resetGame();
  // The transport is the page's: the consumer constructs the peer connection and
  // the negotiated datachannel, and hands the engine link an object with the two
  // verbs it owns. The engine never names the channel class. The supply is read
  // when the channel is built, which happens after the open below has resolved
  // it, so one registration covers every open.
  registerTransport(() => createTransport(iceServersFromUrl(iceSupply)));
  // The same supply, with no servers: the attempt rebuilds the channel with it
  // when its own servers give the page no address, which leaves the
  // same-browser candidate the pairing step warns about.
  setIceFallback(() => createTransport([]));
  // The page owns the candidate supply, so it installs the step one open takes
  // before its link exists: resolve the entries that answer, and record them so
  // the channel this open builds reads them. The lobby never names the list, so
  // this stays the page's and the lobby only asks.
  setIceOpen(async () => chooseIceSupply(await iceSupplyForOpen()));
  // A closed peer link ends the match with the peer leaving and returns both
  // pages to the pairing step. The records layer writes nothing for that end
  // reason, so an abandoned match never claims a leaderboard entry.
  onPeerClose((reason) => {
    if (game.screen.state === 'PLAYING') gameOver(PEER_LEFT);
    gotoScreen('PAIRING');
  });
  // The host page applies the control actions its peer sends through the same
  // steering path its own keys take, naming the role that player drives.
  openGuestStream((intent) => handleIntent(intent, game.screen.p2Role));
  // A page opened for a network game — one whose address carries the secret —
  // starts its ICE attempt at open, before the pairing step is even reached, so
  // the step can count the wait down from the first frame it paints. The open is
  // not awaited: init must reach its first paint while the attempt still runs,
  // or the countdown it shows would never be on screen. The link is built later
  // than this open, so it already reads the supply this open resolved.
  if (openPairingLink()) startIceAttempt();
  if (guestPage()) answerOffer();
  syncViews(null);
  fitField(true);
  window.addEventListener('resize', () => fitField(true));
  requestAnimationFrame(frame);
}

init();
