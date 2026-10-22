// netplay.js — Network multiplayer layer
// Exports: lobby state, transport registration, WebRTC pairing functions
// Imports: engine/js/link, engine/js/stream, js/state, js/rules, js/netframe

// Network play: the lobby that lives above every per-match reset.
// One match resets js/state.js; the pairing between matches must survive that
// reset, so the lobby is module state, not a play or screen field. The engine
// owns the peer link and the command stream; this module owns the pairing
// secret, the share link, the short readable code and the match count.

import { PAIRING_CODE_LENGTH, PAIRING_FRAGMENT_CAP, PLAYING, GAME_OVER, PAIRING, PEER_LEFT, SELECT_DURATION, SELECT_ROLE, SELECT_CONTROL } from './rules.js';
import { PAIRING_CODE_ALPHABET } from './copy.js';
import { createLink } from '../engine/js/link.js';
import { createCommandStream } from '../engine/js/stream.js';
import { applyFrame, encodeFrame, encodeIntent, decodeIntent } from './netframe.js';
import { game } from './state.js';
import { lockControlModel, selectedIndex, gotoScreen } from './screens.js';

// The lobby survives every reset. `form` says which pairing form the step paints:
// the share link when the offer blob fits the fragment cap, the code when it does
// not. `secret` is what the second player must supply, in the form this page paints.
export const lobby = {
  offer: '',
  secret: '',
  link: '',
  href: '', // the url `publish` was handed, kept so a refresh can rebuild the line
  code: '',
  form: '',
  seed: 0,
  typed: '',
  joined: false,
  paired: false,
  matches: 0,
  side: '', // 'host' publishes an offer, 'guest' adopted one from a link fragment
  prepScreen: '', // the preparation step the host page sits on
  prepIndex: -1, // the marker the host page left there, mirrored onto this page
  closed: '', // the reason the peer link closed, once it did
  rebuilt: false, // this page already rebuilt its channel with an empty ICE list
  warm: '', // the offer SDP the page's own attempt produced, which the pairing step publishes instead of offering twice
  address: '', // the dotted-quad this page's own player typed as their device's address
  addressBad: false, // this page was handed a value that names no network address
  port: 0, // the DTLS port this page read from its own local description
  peerAddress: '', // the address the other page named, read from the link it opened
  peerPort: 0, // the port the other page named beside that address
  aimed: false, // this page already aimed its channel at the peer address it holds
  copy: '', // the last copy attempt: '' none, 'ok' the clipboard took it, 'denied' the browser refused
};

// Drop every SDP comment line. libwebrtc puts a machine-dependent payload behind
// each one, so the trimmed blob is what stays stable enough to travel in a link.
export function trimmedOffer(sdp) {
  return sdp.split('\r\n').filter((line) => !line.startsWith('#')).join('\r\n');
}

// The short readable code the second player types. Both pages derive it from the
// same offer blob, so neither page has to send it.
export function codeOf(blob, length = PAIRING_CODE_LENGTH) {
  // 32-bit multiply split into halves: h * 0x01000193 passes 2^53, so a plain
  // JS multiply rounds to a float and collapses every blob to one token.
  const mix = (h, factor) =>
    (((h & 0xffff) * factor) + (((h >>> 16) * factor) << 16)) >>> 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < blob.length; i++) {
    h ^= blob.charCodeAt(i);
    h = mix(h, 0x01000193);
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    h = (mix(h, 0x6c078965) + 1) >>> 0;
    out += PAIRING_CODE_ALPHABET[h % PAIRING_CODE_ALPHABET.length];
  }
  return out;
}

// A network address is four groups of numbers with dots between. A value that
// names a scheme (`http://…`) or a hostname is not an address, and the same-
// network flow says so rather than guessing at one. Each group is one byte.
function isDottedByteQuad(value) {
  const groups = value.split('.');
  if (groups.length !== 4) return false;
  return groups.every((group) => /^\d{1,3}$/.test(group) && Number(group) < 256);
}

// A host candidate whose address is in a private LAN range (192.168.x.x,
// 10.0.0.0/8, 172.16.0.0/12) is this page's own network address, so it can fill
// the pairing field without being typed. A link-local (169.254.x.x) or public
// address is not reachable on the LAN, so it is not detected.
export function isPrivateHostAddress(value) {
  if (!isDottedByteQuad(value)) return false;
  const groups = value.split('.').map((group) => Number(group));
  const [first, second] = groups;
  if (first === 10) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  return false;
}

// The address this page's own player typed. An empty value is no address yet,
// and the step keeps waiting; a value that is not an address is reported.
export function noteAddress(text) {
  const typed = text.trim();
  if (typed === '') {
    lobby.address = '';
    lobby.addressBad = false;
    return;
  }
  if (!isDottedByteQuad(typed)) {
    lobby.addressBad = true;
    return;
  }
  lobby.addressBad = false;
  lobby.address = typed;
}

/**
 * Extract DTLS port from SDP.
 * @param {string} sdp - The page's own SDP string.
 * @returns {number} The port number, or 0 if not found.
 * 
 * Scans for 'a=candidate:' lines first. If none found,
 * falls back to parsing the 'm=' line (format: m=<media> <port> ...).
 */
export function noteOwnPort(sdp) {
  // The candidate line is `a=candidate:<id> <proto> <family> <priority>
  // <address> <port> `: the port is the sixth field, and the address in
  // front of it is libwebrtc's own name, not a value to show. A line that
  // names port 0 names no socket at all — a placeholder, not this page's
  // address — so it is skipped, and the search keeps looking. Descriptions
  // are split on either line ending, since an answer and an offer are not
  // guaranteed to carry the same one.
  for (const line of sdp.split(/\r?\n/)) {
    if (!line.startsWith('a=candidate:')) continue;
    const fields = line.split(' ');
    if (fields.length > 5 && /^\d+$/.test(fields[5]) && Number(fields[5]) > 0) {
      lobby.port = Number(fields[5]);
      return;
    }
  }
  // Fallback for ANSWER SDPs which may have no a=candidate lines: parse the
  // m= line. Format: `m=<media> <port> <proto> <fmt> ...`
  for (const line of sdp.split(/\r?\n/)) {
    if (line.startsWith('m=')) {
      const fields = line.split(' ');
      if (fields.length > 1 && /^\d+$/.test(fields[1]) && Number(fields[1]) > 0) {
        lobby.port = Number(fields[1]);
        return;
      }
    }
  }
}

// The address and port the other page named, read back from the link or the
// return link this page was given.
// The channel carries "address:port" beside the answer a page produced, so
// neither page is asked to type what the other one painted. Reading it here is
// the whole return trip: the candidate is offered as soon as both halves are
// known, and only once this page holds a remote description to bind it to.
export /**
 * Parse a peer's 'address:port' announcement and attempt to pair.
 * @param {string} text - The peer's address and port (e.g. '192.168.1.10:3478').
 * @returns {boolean} True if peer address/port was validated and candidate was added, false otherwise.
 * 
 * Validates the address part using isDottedByteQuad, sets lobby.peerAddress/peerPort,
 * then opens a link and attempts to craft/add a peer ICE candidate.
 */
function learnPeerAnnouncement(text) {
  const parts = text.split(':');
  if (parts.length < 2 || !isDottedByteQuad(parts[0])) return false;
  lobby.peerAddress = parts[0];
  lobby.peerPort = Number(parts[1]);
  const link = openLink();
  const peerConnection = link.transport && link.transport.connection;
  if (!peerConnection) return false;
  if (peerConnection.localDescription) noteOwnPort(peerConnection.localDescription.sdp);
  return craftPeerCandidate(peerConnection);
}

export function notePeerAddress(url) {
  const match = /[?&]a=([0-9.]+)/.exec(url);
  if (match !== null && isDottedByteQuad(match[1])) lobby.peerAddress = match[1];
  const port = /[?&]p=(\d+)/.exec(url);
  if (port !== null) lobby.peerPort = Number(port[1]);
}

// The line this page shows its own player: the typed address with the port the
// page read beside it, so the other player can carry one value in one click.
function addressLine() {
  if (lobby.address === '') return '';
  return lobby.port === 0 ? lobby.address : lobby.address + ':' + lobby.port;
}

// A click on a copy affordance puts the named value on the clipboard. A browser
// that refuses (an insecure page, or no gesture yet) says so and the value stays
// selectable by hand.
export async function copyValue(field) {
  const value = field === 'link' ? lobby.link
    : field === 'code' ? lobby.code
    : field === 'address' ? addressLine() : '';
  if (value === '' || typeof navigator !== 'object' || !navigator.clipboard) {
    lobby.copy = value === '' ? '' : 'denied';
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    lobby.copy = 'ok';
    return true;
  } catch (e) {
    lobby.copy = 'denied';
    return false;
  }
}
// Whether this page asks its own player for an address: its one network way does,
// on every layout and for every page that runs it. The keyboard reads this to decide
// which keys belong to the address field and which spell the short readable code.
export function addressFieldOnPage() {
  // One network way runs here, so a page on it is the page the duty runs for.
  return true;
}

// The host publishes its offer before the peer link exists, so the share link can
// carry the secret the second page needs to answer. The page url is a supply: this
// module never reads `location`.
// The line a peer opens is one function of what this page knows now: its own address
// and the port it read beside that address, plus the secret it published. The
// publish and a later refresh both build it here, so a value that arrives after the first
// publish (the port, which lands once ICE gathered) still reaches the line.
function pageLink(secret, pageUrl) {
  if (secret === '') return '';
  // The link names only what a peer needs to join: this page's own address and
  // the port it read out of its own description. A page that opened a link
  // carries the values it opened with, so they are taken back before this
  // page's own are written — a link that repeated the page it opened would point
  // both halves of a pair at one device.
  const base = pageUrl.split('?')[0];
  const parts = [];
  if (lobby.address !== '') parts.push('a=' + lobby.address);
  if (lobby.port !== 0) parts.push('p=' + lobby.port);
  const query = parts.length === 0 ? '' : (base.includes('?') ? '&' : '?') + parts.join('&');
  return base + query + '#' + encodeURIComponent(secret);
}

export function publish(offerSdp, seed, pageUrl) {
  // A same-network page publishes nothing while it waits for its own address:
  // the link it hands over is the only way that address reaches the other page,
  // so a value typed after publishing could never travel.
  if (lobby.address === '') return;
  const blob = trimmedOffer(offerSdp);
  lobby.offer = blob;
  lobby.seed = seed === 0 ? seedOf(blob) : seed;
  lobby.code = codeOf(blob, PAIRING_CODE_LENGTH);
  if (lobby.side !== 'guest') lobby.side = 'host';
  game.screen.seat = 1;
  // The secret rides beside the link, not inside it: the whole fragment IS
  // the secret, and a line tagged onto the blob would reach setRemoteDescription.
  // The line adds the two values the other page cannot read on its own: this
  // page's address and the port it read beside it, whichever of them this page
  // knows by the moment the line is built.
  if (blob.length <= PAIRING_FRAGMENT_CAP) {
    lobby.form = 'link';
    lobby.secret = blob;
    // The fragment must be escapable: an SDP carries CRLF, spaces and `=`, so
    // the bytes that travel in a link are the escaped form and `adopt` decodes
    // them back. The secret itself stays unescaped.
    lobby.href = pageUrl;
    lobby.link = pageLink(blob, pageUrl);
  } else {
    lobby.form = 'code';
    lobby.secret = lobby.code;
    lobby.link = '';
  }
  return lobby.form;
}

// The second page adopts the secret its page url carries. A page with no fragment
// carries no secret and adopts nothing.
export function adopt(fragment) {
  if (!fragment) return false;
  const blob = decodeURIComponent(fragment);
  if (blob.length === 0) return false;
  lobby.secret = blob;
  lobby.code = codeOf(blob, PAIRING_CODE_LENGTH);
  lobby.seed = seedOf(blob);
  lobby.form = 'link';
  lobby.side = 'guest';
  game.screen.seat = 2;
  return true;
}

// The step's Pair action. A page with no secret pairs nobody, so the pairing
// secret gates it before any match can start. Pairing counts one scheduled
// match once: a page that pairs twice (its peer confirming the same join) does
// not schedule a second match behind the first.
export function attemptPair() {
  if (!lobby.secret) return false;
  if (!lobby.joined) {
    lobby.joined = true;
    lobby.matches += 1;
  }
  lobby.paired = true;
  return true;
}


// ---------- The peer link and the traffic that moves over it ----------
// The engine owns the link, the streams and the resync policy; this module owns
// the secret, the messages that travel, and which page is the host. The
// transport object is a consumer supply: `registerTransport` hands over a
// factory that returns one, and the lobby calls it the first time a page needs
// a link. A headless check registers its own factory here, which is the whole
// point of the supply line: no engine file changes to carry a different channel.
let transportFactory = null;
let pairLinkInstance = null;
// The command stream the guest's control actions run through on the host page.
let guestStream = null;

function bindLink(pairLink) {
  if (pairLink.transport && pairLink.transport.onMessage) pairLink.transport.onMessage((message) => receive(message));
  // The lobby records the close, tells its peer, and stops counting the pair.
  pairLink.onClose((reason) => {
    lobby.closed = reason;
    lobby.paired = false;
    post('C', reason);
  });
  for (const handler of closeHandlers) pairLink.onClose(handler);
  return pairLink;
}

  // Tell the peer that this link closed: the other page has no closer of its
  // own, so it learns the close from the message rather than from its channel
  // never answering. The lobby clears the pair here so a closed link never
  // leaves a match pretending to still run.

export function registerTransport(factory) {
  transportFactory = factory;
  if (pairLinkInstance) pairLinkInstance = bindLink(createLink(factory()));
  return pairLinkInstance;
}

// The page-level fallback the answering side uses when its servers gave it no
// address: the game layer supplies it, because rebuilding the channel with a
// different ICE list is the page's decision, not the link's.
let iceFallback = null;

// The page's own ICE attempt, kept so a publish or an answer can wait for the
// attempt that is already running instead of starting a second one.
let iceRunning = null;
// The way the page's running (or last finished) attempt ran under, and whether
// that attempt has finished. The way a page runs under names the candidate
// supply before the attempt reads it, so these two say when a finished attempt
// belongs to a way the page left and a fresh open is owed.
let iceFlow = '';
let iceDone = false;
// The connection this page already aimed at a peer address, so one channel is
// aimed once and only a rebuilt one is aimed again.
let aimedPc = null;

export function setIceFallback(factory) {
  iceFallback = factory;
}

// The page installs the step one open takes before its offer exists: it chooses
// the candidate supply and rebuilds the channel with it. The lobby never names
// an ICE list, so the supply stays the page's and this module only asks.
let iceOpen = async () => {};
export function setIceOpen(step) {
  iceOpen = step;
}

export function openLink() {
  if (!pairLinkInstance && transportFactory) pairLinkInstance = bindLink(createLink(transportFactory()));
  return pairLinkInstance;
}

export function peerLink() {
  return pairLinkInstance;
}

// The same-network flow announces this page's own address and port over the
// channel it already shares with the peer. The channel opens only once that
// peer's connection does, so the announcement is not a one-shot: the page
// repeats it every tick and the copy that lands after the channel opens is
// what carries the port the peer's candidate needs.
export function announceOwn() {
  if (lobby.address === '' || lobby.port === 0) return false;
  return post('a', lobby.address + ':' + lobby.port);
}

export function refreshLink() {
  // The port a page reads out of its own description lands later than the publish
  // that built the line: ICE writes the candidate line only as it gathers, and the
  // publish happens once, so a link that names only the address says no port to
  // join on and nothing writes the line again. Rebuilding from the secret the page
  // already holds changes nothing about the pair — a page that opened at an older
  // line keeps its own secret — and the refreshed line is what the next page opens
  // at. The url is the one `publish` was handed, kept on the page so this module
  // still never reads `location` itself.
  if (lobby.secret === '' || lobby.link === '' || lobby.href === '') return false;
  const next = pageLink(lobby.secret, lobby.href);
  if (next === '' || next === lobby.link) return false;
  lobby.link = next;
  return true;
}

// The transport carries bytes one way; the game reads its two verbs and never
// names the channel class behind them.
export function post(kind, payload) {
  const transport = pairLinkInstance && pairLinkInstance.transport;
  if (!transport) return false;
  return transport.send(kind + payload);
}

export function peerMessage(handler) {
  const transport = pairLinkInstance && pairLinkInstance.transport;
  if (!transport) return false;
  return transport.onMessage((message) => receive(message));
}

const inbound = { answer: '', addr: '', frames: 0, intents: 0, prep: 0, closed: '' };

// The guest follows the match the host simulates: it shows the field while a
// frame says a match is running, and the result once a frame says it ended.
// The inbound counters the game and its tests read back: they say how many
// answers, frames, intents, preparations and close messages this page has seen,
// so a test can assert the other page's traffic arrived rather than only that
// the match ran. The counters are never reset by a match reset, because they
// describe the pairing, which survives the reset.

function followSimulation() {
  if (game.screen.state === PAIRING) gotoScreen(PLAYING);
  else if (game.screen.state === PLAYING && game.play.gameOverReason) gotoScreen(GAME_OVER);
}

export function inboundReport() {
  return inbound;
}

// Named handlers for each inbound message kind. Each takes the raw payload
// string and does one thing: updates the inbound counter, calls the pairing
// path, applies a frame, queues an intent, mirrors preparation, ends a peer
// link, or locks a control model. Keeping them separate lets the dispatch below
// be a table rather than a chain of branches.
function handleAnswer(payload) {
  inbound.answer = payload;
}

// The same-network flow's peer address travels beside the answer, over the
// channel the pairing already uses: a page learns the other page's address
// and port from the channel, never from a list of public candidates.
function handlePeerAnnouncement(payload) {
  inbound.addr = payload;
  learnPeerAnnouncement(payload);
}

// A frame paints only while this page still holds a peer: once the peer
// leaves, the pages sit on their pairing step and a late frame would start
// a match nobody is simulating any more.
function handleFrame(payload) {
  inbound.frames += 1;
  if (duelOpen() && applyFrame(payload)) followSimulation();
}

function handleIntent(payload) {
  inbound.intents += 1;
  const sent = decodeIntent(payload);
  if (sent && guestStream) guestStream.queue(sent.intent, sent.tick);
}

function handlePreparation(payload) {
  inbound.prep += 1;
  mirrorPreparation(payload);
}

function handlePeerClosed(payload) {
  inbound.closed = payload;
  peerClosed(payload);
}

function handleControlModel(payload) {
  lockControlModel(2, payload);
}

const messageHandlers = {
  A: handleAnswer,
  a: handlePeerAnnouncement,
  F: handleFrame,
  I: handleIntent,
  P: handlePreparation,
  C: handlePeerClosed,
  M: handleControlModel,
};

function receive(message) {
  if (typeof message !== 'string' || message.length < 2) return;
  const handler = messageHandlers[message[0]];
  if (!handler) return;
  handler(message.slice(1));
}

// The seed the pairing carries: both pages hold the same blob, so hashing it
// gives both pages the same starting seed without either one reading a clock.
export function seedOf(blob) {
  let h = 2166136261;
  for (let i = 0; i < blob.length; i++) {
    h = (h * 16777619 + blob.charCodeAt(i)) & 0x7fffffff;
  }
  return h === 0 ? 1 : h;
}

// The engine owns the alignment; the consumer supplies what an intent means, so
// a guest's control action runs through the same steering path the host's own
// intents take.
export function openGuestStream(apply) {
  const link = openLink();
  guestStream = createCommandStream(apply);
  if (link) link.attachStream(guestStream, 'guest');
  return guestStream;
}

export function guestStreamReport() {
  return guestStream;
}

// Which page this one is: the page that published an offer runs the simulation,
// the page that adopted one from a link fragment paints the frames it receives.
export function hostPage() {
  return lobby.side === 'host';
}

export function guestPage() {
  return lobby.side === 'guest';
}

export function duelOpen() {
  const link = pairLinkInstance;
  return lobby.paired && link !== null && link.open;
}

// Which seat this page drives: the host page is seat 1, the guest page seat 2,
// and a page in no duel is seat 0. A page accepts only the input of its own
// seat, so a key that belongs to the other peer's model does nothing here.
export function localSeat() {
  if (lobby.side === 'host') return 1;
  if (lobby.side === 'guest') return 2;
  return 0;
}

// A peer confirms one control model on its own device. The guest's model
// travels to the host, which locks that seat so a later input resolves to the
// player who confirmed the model that produced it.
export function confirmModel(model) {
  if (lobby.side !== 'guest') return false;
  game.screen.p2Model = model;
  return post('M', model);
}

// The guest's control action travels to the host. It names the tick after the
// tick of the frame this page last painted: the host applies it on the next
// tick it runs, and a tick that already passed is a drop the stream counts.
export function sendIntent(intent) {
  return post('I', encodeIntent(intent, game.play.tick + 1));
}

// The preparation the host page chose travels as a mirror: the guest page paints
// it and selects nothing of its own. The mirror carries the models and roles too,
// so the guest resolves its own keys against the same seats the host does.
export function sendPreparationMirror() {
  if (lobby.side !== 'host') return false;
  const screen = game.screen.state;
  if (screen !== SELECT_DURATION && screen !== SELECT_ROLE && screen !== SELECT_CONTROL) return false;
  return post('P', JSON.stringify([
    screen,
    selectedIndex(screen),
    game.screen.p1Model,
    game.screen.p2Model,
    game.screen.p1Role,
    game.screen.p2Role,
    game.screen.gameControlStep,
  ]));
}

function mirrorPreparation(payload) {
  let mirror;
  try {
    mirror = JSON.parse(payload);
  } catch (e) {
    return;
  }
  if (!Array.isArray(mirror) || mirror.length !== 7) return;
  const [screen, index, p1Model, p2Model, p1Role, p2Role, step] = mirror;
  lobby.prepScreen = screen;
  lobby.prepIndex = index;
  game.screen.p1Model = p1Model;
  game.screen.p2Model = p2Model;
  game.screen.p1Role = p1Role;
  game.screen.p2Role = p2Role;
  game.screen.gameControlStep = step;
  // The guest stays on its pairing step through the host's preparation: it
  // paints read-only mirrors there. It follows the page back only when the
  // match it was watching has ended.
  if (game.screen.state === GAME_OVER || game.screen.state === PLAYING) gotoScreen(PAIRING);
}

// The host hands the frame its simulation just produced to its peer.
export function sendFrame() {
  return post('F', encodeFrame());
}

async function sleep(ms) {
  await new Promise((done) => setTimeout(done, ms));
}

// Whether an SDP carries an address a peer outside this browser could reach:
// an ICE candidate line names a numeric address, the placeholder `0.0.0.0` names
// none, and libwebrtc's own `<uuid>.local` line names a connection inside this
// browser instance, which no other device resolves.
export function carriesRemoteAddress(sdp) {
  for (const line of sdp.split('\r\n')) {
    if (!line.startsWith('IN IP4 ')) continue;
    const address = line.slice(7).trim();
    if (address === '0.0.0.0') continue;
    if (/^\d+(\.\d+)*$/.test(address)) return true;
  }
  return false;
}

export async function answerOffer() {
  const link = openLink();
  if (!link || !lobby.secret) return false;
  const peerConnection = link.transport && link.transport.connection;
  if (!peerConnection) {
    post('A', lobby.secret);
    if (!link.open) link.pair({ side: 'host', secret: lobby.secret });
    lobby.paired = true;
    return true;
  }
  try {
    await peerConnection.setRemoteDescription({ type: 'offer', sdp: lobby.secret });
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    const sdp = peerConnection.localDescription.sdp;
    // The page reads the port it named in its own answer, then hands the peer a
    // candidate at the address and port it holds: the pair joins on devices a
    // player named rather than on a list of public candidates.
    noteOwnPort(sdp);
    craftPeerCandidate(peerConnection);
    post('A', sdp);
    if (!link.open) link.pair({ side: 'host', secret: lobby.secret });
    lobby.paired = true;
    return true;
  } catch (e) {
    return false;
  }
}

// The host reads the answer its peer sent and completes the negotiation, then
// opens the link on the peer it now holds.
export async function acceptAnswer() {
  const link = openLink();
  if (!link || inbound.answer === '') return false;
  const peerConnection = link.transport && link.transport.connection;
  if (peerConnection) {
    try {
      await peerConnection.setRemoteDescription({ type: 'answer', sdp: inbound.answer });
    } catch (e) {
      return false;
    }
    // The same-network flow: the channel carried the other page's address and
    // port beside its answer, so this page points its candidate at that device
    // rather than at a public list it never reads.
    if (inbound.addr !== '') learnPeerAnnouncement(inbound.addr);
    link.report('connection', peerConnection.connectionState);
  }
  if (!link.open) link.pair({ side: 'guest', secret: lobby.secret });
  lobby.paired = true;
  return true;
}

// The same-network flow's candidate: the peer's address is the dotted-quad its
// player typed, and the port is the one that page read from its own gathered
// description. The candidate is bound to the media line of the description this
// page already holds, so the handshake stays on that one section.
export /**
 * Hand-craft a peer ICE candidate and add it to the peer connection.
 * @param {RTCPeerConnection} pc - The peer connection to add the candidate to.
 * @returns {boolean} True if candidate was added successfully, false otherwise.
 * 
 * Derives sdpMid and sdpMLineIndex from the first 'm=' line of the SDP.
 * Returns false if no peer address/port is held or if pc is invalid.
 */
  // The priority 2113937151 is the standard value for a host candidate: a
  // peer that receives it treats this device's address and port as the
  // preferred route, which is what the same-network join needs. The '9' and
  // '1' are the candidate id and the udp priority field, neither of which the
  // peer reads for a host candidate it is about to use directly.
function craftPeerCandidate(pc) {
  // Either description names the media line a candidate binds to. A page that
  // only ever made its own offer still names its line, so pointing at a network
  // address is not waiting for an answer that no other device can carry here.
  if (!pc || (!pc.localDescription && !pc.remoteDescription)) return false;
  if (lobby.peerAddress === '' || lobby.peerPort === 0) return false;
  const held = pc.localDescription || pc.remoteDescription;
  const sdp = held && held.sdp ? held.sdp : '';
  const lines = sdp.split('\n');
  let mid = '0';
  let index = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('m=')) continue;
    const fields = lines[i].trim().split(' ');
    mid = fields[0].slice(2);
    const numbered = Number(fields[1]);
    index = Number.isFinite(numbered) ? numbered : i;
    break;
  }
  try {
    pc.addIceCandidate({
      sdpMid: mid,
      sdpMLineIndex: index,
      sdpDescription: 'candidate:9 1 udp 2113937151 ' + lobby.peerAddress + ' ' + lobby.peerPort + ' typ host',
    });
  } catch (error) {
    return false;
  }
  return true;
}

// The pointing step, run every tick of the same-network way. A page that holds a
// peer address — from a link its peer published, or from an announcement — aims
// its own channel at that address whether or not the channel ever carried a
// report, because a link is the only route a second device has. One connection
// is aimed once, so a rebuilt channel is what makes a page aim again.
export function pointAtPeer() {
  if (lobby.peerAddress === '' || lobby.peerPort === 0) return false;
  const link = openLink();
  const pc = link.transport && link.transport.connection;
  if (!pc || pc === aimedPc) return false;
  aimedPc = pc;
  // The description grows its candidate line as ICE gathers, so the port is read
  // again here: an announcement that named no port still leaves one to read.
  if (pc.localDescription) noteOwnPort(pc.localDescription.sdp);
  lobby.aimed = true;
  return craftPeerCandidate(pc);
}

// The state a peer connection reports, held by the engine link. The consumer
// forwards the events its channel raises; the link keeps the list.
export function reportPeerState(name, value) {
  const link = pairLinkInstance;
  if (!link) return false;
  link.states[name] = value;
  return true;
}

// The state a peer connection reports, held by the engine link.
export function peerState(name) {
  const link = pairLinkInstance;
  return link ? link.states[name] : '';
}

// The close event: the game registers what a closed link does to the match. A
// handler registered before the link exists is attached when the link opens.
const closeHandlers = [];

export function onPeerClose(handler) {
  if (pairLinkInstance) return pairLinkInstance.onClose(handler);
  closeHandlers.push(handler);
  return true;
}

// The consumer reports that its channel closed, and the link fires once.
export function peerClosed(reason) {
  const link = openLink();
  if (!link) return false;
  return link.close(reason === undefined ? 'peer-left' : reason);
}

// The reason the peer link closed, once it did: the match ends with the peer
// leaving rather than with a crash or the countdown.
export function peerLeft() {
  return lobby.closed;
}

// The second page types the short readable code on its own page. Each character
// appends; a full match pairs the two pages and schedules one match, exactly as
// confirming the step's Pair item does. A wrong run restarts the run.
export function typeChar(ch) {
  if (!lobby.code) return false;
  lobby.typed += ch;
  if (lobby.typed.length > lobby.code.length) lobby.typed = '';
  if (lobby.typed !== lobby.code) return false;
  return attemptPair();
}
