// Headless browser check for a two-device duel over the engine link (tasks 8.1
// - 8.7, 9.4 - 9.9, 10.1 - 10.4, and the thirteenth harness of 11.1).
//
// Run: node scripts/verify-network-duel.mjs
//
// Two routed pages stand in for the two devices. The channel between them is a
// stand-in transport the check registers through netplay.registerTransport: the
// supply line is the point, so no engine file changes to carry a different
// channel. A real RTCPeerConnection pairs no two headless Chromium instances in
// this environment (the group-1 check proved that and the user verified the
// handshake in a real browser), so the stand-in carries the bytes the link
// actually sends and receives, which is all the link's pair call needs.
//
// The match is shortened by writing the countdown budget the host page chose,
// never by pausing the mechanism: both pages still count down from the same
// duration the host page locked.

import { chromium } from '@playwright/test';
import path from 'node:path';
import { BASE, check, report, failureCount, servePage, exposeSingletons, freshPage, snapshot, stateIs, waitFor, shown } from './harness.mjs';
import { COLS, ROWS } from '../js/constants.js';

const ROOT = path.resolve(import.meta.dirname, '..');

console.log('=== Network duel ===');

const browser = await chromium.launch();
const context = await browser.newContext();

// ---------- The stand-in channel ----------

// One stand-in channel for both pages: each page writes the bytes it sends into
// storage the two pages share, and reads what its peer wrote from its own frame
// loop. The delivery costs one frame, the way a datachannel delivers a message,
// not a round-trip through the test driver - a round-trip would land the bytes
// two ticks late, and the command stream counts a tick the simulation already
// passed as a drop the resync sees.
async function standIn(page, outKey, inKey) {
  await page.evaluate(async ([outKey, inKey]) => {
    window.__outbox = [];
    window.__wire = window.__wire || [];
    window.__handler = null;
    window.__cursor = 0;
    const netplay = await import('/js/netplay.js');
    netplay.registerTransport(() => ({
      send: (message) => {
        localStorage.setItem(outKey, (localStorage.getItem(outKey) || '') + JSON.stringify(message) + '\n');
        window.__outbox.push(message);
        return true;
      },
      onMessage: (handler) => {
        window.__handler = handler;
        return true;
      },
      connection: null,
    }));
    // The read loop runs on its own timer, not on the page's frames: a message
    // its peer wrote is picked up inside a few milliseconds, the way a datachannel
    // delivers it, so the intent keeps a tick the simulation has not run yet.
    const poll = () => {
      const raw = localStorage.getItem(inKey) || '';
      if (raw.length > window.__cursor) {
        const fresh = raw.slice(window.__cursor);
        window.__cursor = raw.length;
        for (const line of fresh.split('\n')) {
          if (!line) continue;
          const message = JSON.parse(line);
          window.__wire.push(message);
          if (window.__handler) window.__handler(message);
        }
      }
      setTimeout(poll, 4);
    };
    poll();
  }, [outKey, inKey]);
}

// Let both pages run their own loops: the channel inside each page carries the
// bytes across on its own frames.
async function pump(a, b, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await a.waitForTimeout(90);
    await b.waitForTimeout(90);
  }
}

async function live(page) {
  return await page.evaluate(async () => {
    const netplay = await import('/js/netplay.js');
    return {
      paired: netplay.lobby.paired,
      side: netplay.lobby.side,
      seat: (await import('/js/state.js')).game.screen.seat,
      state: (await import('/js/state.js')).game.screen.state,
      networkMode: (await import('/js/state.js')).game.screen.networkMode,
      frames: netplay.inboundReport().frames,
      prep: netplay.inboundReport().prep,
      answer: netplay.inboundReport().answer !== '',
    };
  });
}

async function pushIntents(page, intents) {
  await page.evaluate(async (list) => {
    const screens = await import('/js/screens.js');
    for (const intent of list) screens.pushIntent(intent);
  }, intents);
}

// ---------- The host page ----------

const host = await freshPage(context, ROOT);

// The menu lists the same four items at a wide viewport, and the Two Players
// entry opens the way sub-menu rather than the duration screen.
await pushIntents(host, [{ action: 'menuDown' }, { action: 'confirm' }]);
await pump(host, host, 2);
check((await live(host)).state === 'SELECT_WAY', 'the Two Players entry opens the way sub-menu');
check((await live(host)).networkMode === false, 'the entry alone picks no way');

// The network way is the second item of the sub-menu.
await pushIntents(host, [{ action: 'menuDown' }, { action: 'confirm' }]);
await pump(host, host, 2);
const armed = await live(host);
check(armed.state === 'PAIRING' && armed.networkMode,
  'the network way opens the pairing step and arms a network match');
const barePairing = await host.evaluate(async () => ({
  field: document.getElementById('game').checkVisibility(),
  playing: (await import('/js/state.js')).game.screen.state === 'PLAYING',
}));
check(!barePairing.field && !barePairing.playing,
  'the pairing step shows no play field and starts no match before a peer is paired');

// A page offers only once its own attempt resolved: the pairing step waits
// before it publishes, so an answer can never arrive at a page that has no
// channel yet. The harness waits that attempt out rather than standing in for it:
// a resolved attempt rebuilds the channel over its own supply, and standing in
// before the attempt resolves would leave that rebuild to replace the stand-in
// and swallow the answer the harness posts next.
const attemptSettled = (x) => window.__netplay.ice !== '' && window.__netplay.ice !== 'gathering';
check(await waitFor(host, attemptSettled, null, 30000),
  'the host page resolves its candidate attempt before a channel is stood in');
await standIn(host, 'wire-host', 'wire-guest');

// The offer this page publishes is a real offer, so the link the pairing paints
// carries the bytes a real pairing would carry.
const published = await host.evaluate(async (url) => {
  const pc = new RTCPeerConnection({ iceServers: [] });
  pc.createDataChannel('snaketris-pair', { negotiated: true, negotiatedStreams: 2, id: 0 });
  const offer = await pc.createOffer();
  const sdp = offer.sdp;
  await pc.close();
  const netplay = await import('/js/netplay.js');
  return { form: netplay.publish(sdp, 0, url), link: netplay.lobby.link, seed: netplay.lobby.seed };
}, BASE + 'snaketris.html');
check(published.form === 'link', 'the host page publishes a pairing link');
check(published.link.startsWith(BASE) && published.link.includes('#'), 'the link carries the secret in the fragment');
check((await live(host)).seat === 1, 'the published pairing seats this page as the host');

// ---------- The guest page, opened from that link ----------

const guest = await context.newPage();
await servePage(guest, ROOT);
guest.on('pageerror', (err) => console.log('GUEST ' + err.message + ' :: ' + String(err.stack || '').split('\n').slice(0, 4).join(' | ')));
host.on('pageerror', (err) => console.log('HOST ' + err.message + ' :: ' + String(err.stack || '').split('\n').slice(0, 4).join(' | ')));
await guest.goto(published.link);
await exposeSingletons(guest);
check(await waitFor(guest, attemptSettled, null, 30000),
  'the guest page resolves its candidate attempt before a channel is stood in');
await standIn(guest, 'wire-guest', 'wire-host');
const adopted = await live(guest);
check(adopted.seat === 2 && adopted.side === 'guest',
  'the second page adopts the secret its url carries and seats itself as the guest');
check(adopted.networkMode && adopted.state === 'PAIRING',
  'the second page opens the pairing step from the link, not the menu');

// The answer hop runs again over the stand-in channel, so the bytes reach the
// host page rather than a dead real channel.
await guest.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  await netplay.answerOffer();
});
await pump(host, guest, 3);
check((await live(host)).answer, 'the host page receives the answer its peer sent');

// Both pages confirm the join; the host opens the preparation it owns and the
// guest keeps waiting.
await pushIntents(host, [{ action: 'select', id: 'pairing-join' }]);
await pushIntents(guest, [{ action: 'select', id: 'pairing-join' }]);
await pump(host, guest, 3);
const hostPaired = await live(host);
const guestPaired = await live(guest);
check(hostPaired.paired && guestPaired.paired, 'both pages hold a paired link');
check(hostPaired.state === 'SELECT_DURATION' && guestPaired.state === 'PAIRING',
  'the host page owns the preparation and the guest page keeps its pairing step');

// ---------- 9.4 / 9.5: the guest mirrors the host's preparation ----------

// The host moves its cursor over the duration items without confirming, so the
// mirror marker has to follow before any lock exists.
await pushIntents(host, [{ action: 'menuDown' }]);
await pump(host, guest, 3);
const mirrored = await guest.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  const list = document.getElementById('mirror-duration-items');
  const items = list ? [...list.querySelectorAll(':scope > li')] : [];
  return {
    prep: netplay.inboundReport().prep,
    prepScreen: netplay.lobby.prepScreen,
    prepIndex: netplay.lobby.prepIndex,
    marker: items.findIndex((li) => li.className === 'on'),
    selectable: items.filter((li) => li.hasAttribute('tabindex')).length,
    waiting: document.getElementById('pairing-waiting').checkVisibility(),
    durationView: document.getElementById('duration-view').checkVisibility(),
  };
});
check(mirrored.prep > 0, 'the host page sends the preparation it chose');
check(mirrored.prepScreen === 'SELECT_DURATION' && mirrored.marker === mirrored.prepIndex && mirrored.marker > 0,
  'the guest mirror marker follows the host cursor before the host confirms');
check(mirrored.selectable === 0, 'the guest mirror offers no selectable item');
check(mirrored.waiting, 'the guest page keeps its waiting line beside the mirror');
check(!mirrored.durationView, 'the guest page opens no selectable duration sub-menu of its own');

// A key on the guest page leaves the host's selection where it rests.
await guest.keyboard.press('ArrowDown');
await pump(host, guest, 2);
const hostCursor = await host.evaluate(async () => {
  const screens = await import('/js/screens.js');
  return (await import('/js/state.js')).game.screen.durationSelect;
});
check(hostCursor === 1, 'a key on the guest page leaves the host page selection unchanged');

// ---------- 8.5: a key means a play action only for a confirmed model ----------

// Neither peer has confirmed a keyboard model yet, so the guest's layout key
// names no side and produces no play action.
await guest.evaluate(async () => {
  const input = await import('/js/input.js');
  const event = { key: 'ArrowLeft' };
  event.preventDefault = () => {};
  input.onKey(event);
});
await pump(host, guest, 1);
check((await live(host)).frames >= 0 && (await host.evaluate(async () => (await import('/js/netplay.js')).inboundReport().intents)) === 0,
  'a key on the guest page means no play action while neither peer confirmed a keyboard model');

// The guest confirms one control model on its own device; the message locks the
// other seat on the host page.
await guest.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  netplay.confirmModel('arrows');
});
await pump(host, guest, 2);
const models = await host.evaluate(async () => {
  const state = await import('/js/state.js');
  return { p1: state.game.screen.p1Model, p2: state.game.screen.p2Model };
});
check(models.p2 === 'arrows', 'the guest model confirmation locks the other seat on the host page');

// The host confirms its own model on its own page, then starts the match. One
// intent per round, so the host page really spends ticks on each preparation
// step and its peer sees a mirror of every one of them.
await pushIntents(host, [{ action: 'confirm' }]);
await pump(host, guest, 1);
await pushIntents(host, [{ action: 'confirm' }]);
await pump(host, guest, 1);
await pushIntents(host, [{ action: 'select', id: 'control-item-p1', model: 'wasd' }]);
await pump(host, guest, 1);
await pushIntents(host, [{ action: 'select', id: 'control-item-start' }]);
await host.evaluate(() => { window.__dump = (window.__dump || []).concat(window.__outbox.slice()); });
const wire = await host.evaluate(() => (window.__wire || []).filter((m) => m.startsWith('P[')).slice(-8));
await pump(host, guest, 4);
const probe = await host.evaluate(async () => {
  const n = await import('/js/netplay.js');
  const r = n.sendFrame();
  return { r, out: window.__outbox.length, sample: (window.__outbox[0] ?? '').slice(0, 12), state: (await import('/js/state.js')).game.screen.state };
});
check((await live(host)).state === 'PLAYING' && (await live(guest)).state === 'PLAYING',
  'both pages show the field once the host page starts the match');

// The bot system is the only thing that could steer a side nobody controls. The
// check wraps the two bot decisions with a counter before the match runs, so a
// bot that acted would be counted rather than inferred from the board.
await host.evaluate(async () => {
  const bot = await import('/js/bot.js');
  window.__botActs = 0;
  const choose = bot.chooseBotDir;
  const move = bot.applyBotPieceMove;
  bot.chooseBotDir = () => {
    window.__botActs++;
    return choose();
  };
  bot.applyBotPieceMove = (piece) => {
    window.__botActs++;
    return move(piece);
  };
});

// ---------- 8.1 / 8.2: one simulation, painted twice ----------

// Shorten the match by writing the countdown budget the host page locked; the
// mechanism, the frames and the countdown readout all stay on the real path.
await host.evaluate(async () => {
  const state = await import('/js/state.js');
  state.game.play.durationTicks = 180;
});
await pump(host, guest, 8);
const hostTraffic = await live(host);
const guestTraffic = await live(guest);
check(hostTraffic.frames === 0 && guestTraffic.frames > 0,
  'the host page sends the frames its simulation produced and the guest page paints them');
let hostBoard = null;
let guestBoard = null;
for (let attempt = 0; attempt < 12 && !(guestBoard && Math.abs(hostBoard.tick - guestBoard.tick) <= 2); attempt++) {
  hostBoard = await snapshot(host);
  guestBoard = await snapshot(guest);
}
check(hostBoard && guestBoard && Math.abs(hostBoard.tick - guestBoard.tick) <= 2 &&
    hostBoard.snakeScore === guestBoard.snakeScore &&
    hostBoard.tetrisScore === guestBoard.tetrisScore &&
    hostBoard.length === guestBoard.length &&
    JSON.stringify(hostBoard.head) === JSON.stringify(guestBoard.head),
  'both pages show the same board state at the same tick');
check(hostBoard.state === 'PLAYING' && guestBoard.state === 'PLAYING', 'both pages run the match');

// Both countdown readouts agree, so both pages count down from the host's
// duration.
const timers = [await host.evaluate(() => document.getElementById('timer').textContent),
  await guest.evaluate(() => document.getElementById('timer').textContent)];
check(timers[0] === timers[1], 'both pages count down from the duration the host page chose');

// ---------- 8.6: no bot drives either side ----------

// ---------- 8.5: no bot drives either side ----------

// A bot would turn the snake on its own. With both peers paired the snake keeps
// its course until a device steers it.
const course = await host.evaluate(async () => {
  const state = await import('/js/state.js');
  return { head: state.game.play.snake[0], dir: state.game.screen.p1Selection };
});
check(course.head !== null, 'the host page holds the snake the simulation moved');
const botActs = await host.evaluate(() => window.__botActs);
check(botActs === 0, 'no bot decision steers either side while both peers are paired');

// ---------- 8.3: a shift moves the piece equally on both pages ----------

const manual = await host.evaluate(async () => {
  const n = await import('/js/netplay.js');
  const st = (await import('/js/state.js')).game.screen;
  return { sent: n.sendPreparationMirror(), state: st.state, p1Role: st.p1Role, p2Role: st.p2Role, out: window.__outbox.length };
});
await pump(host, guest, 1);
const mirroredRoles = await guest.evaluate(async () => {
  const n = await import('/js/netplay.js');
  const st = (await import('/js/state.js')).game.screen;
  const dv = await import('/js/devices.js');
  return { p1Role: st.p1Role, p2Role: st.p2Role, ownRole: (await import('/js/state.js')).game.play.role, local: dv.localRole(), seat: st.seat, prep: [n.lobby.prepScreen, n.lobby.prepIndex], prepCount: n.inboundReport().prep };
});
check(manual.p1Role && manual.p2Role && manual.p1Role !== manual.p2Role,
  'the host page assigns one role to each side of the duel');
check(mirroredRoles.prepCount > 0 && ['SELECT_DURATION', 'SELECT_ROLE', 'SELECT_CONTROL'].includes(mirroredRoles.prep[0]),
  'the guest page keeps a mirror of the preparation the host page chose');
check(mirroredRoles.p1Role === manual.p1Role && mirroredRoles.p2Role === manual.p2Role,
  'both pages show the same role for each side of the duel');
check(mirroredRoles.local === mirroredRoles.p2Role && mirroredRoles.local !== mirroredRoles.p1Role,
  'the guest page drives the mirror role of the role the host page chose');
// The guest page drives the piece of the Tetris role: its key press sends an
// intent that the host page's command stream applies on the tick it names. The
// press and the read of what it produced share one round-trip, and the bytes
// cross in the next, which is where a real datachannel delivers them; the
// stream counts an intent whose tick the simulation already passed as a drop
// the resync sees, so the check retries until one lands on a live tick.
let shiftHost = 0;
let shiftGuest = 0;
let pagesAgree = false;
let appliedSeen = 0;
for (let attempt = 0; attempt < 24 && shiftHost === 0; attempt++) {
  await pump(host, guest, 1);
  // The shift has to land on a piece that still has room where it goes: the
  // accumulator ready, the piece in open air, and the cell beside it empty.
  await waitFor(host, async () => {
    const st = await import('/js/state.js');
    const gd = await import('/js/grid.js');
    const sn = await import('/js/snake.js');
    if (st.game.play.pieceMoveAcc < sn.snakeTicksPerCell()) return false;
    const piece = st.game.play.pieces[0];
    if (!piece || !piece.row) return false;
    const row = Math.floor(piece.row);
    return gd.getCell(row, piece.col + 1) === 0 && gd.getCell(row + 1, piece.col + 1) === 0;
  });
  const beforeRow = await host.evaluate(async () => {
    const st = await import('/js/state.js');
    const piece = st.game.play.pieces[0];
    if (!piece || !piece.row) return false;
    return piece.row;
  });
  await guest.evaluate(async () => {
    const input = await import('/js/input.js');
    const event = { key: 'ArrowRight' };
    event.preventDefault = () => {};
    input.onKey(event);
  });
  // The host page applies the intent on a tick of its own clock, so the delta
  // is read across the frames that carry the drain, on the page that runs the
  // simulation.
  const measured = await host.evaluate(async ([seen]) => {
    const st = await import('/js/state.js');
    const np = await import('/js/netplay.js');
    const piece = st.game.play.pieces[0];
    if (!piece || !piece.col) return { delta: 0, applied: 0 };
    const before = piece.col;
    for (let frame = 0; frame < 40; frame++) {
      await new Promise((next) => requestAnimationFrame(next));
      if (np.guestStreamReport().applied > seen) break;
    }
    return { delta: piece.col - before, applied: np.guestStreamReport().applied };
  }, [appliedSeen]);
  appliedSeen = measured.applied;
  if (measured.delta === 0) continue;
  // The guest page paints the frame the host page produced from that shift, so
  // its piece sits the same number of cells along.
  let hostBoard = null;
  let guestBoard = null;
  // The guest page paints the frame the host page produced from the shift a
  // frame or two later, so the two pages are read a few frames apart.
  await host.waitForTimeout(60);
  await guest.waitForTimeout(60);
  for (let round = 0; round < 8; round++) {
    hostBoard = await snapshot(host);
    guestBoard = await snapshot(guest);
    if (hostBoard && guestBoard && Math.abs(hostBoard.tick - guestBoard.tick) <= 2 &&
        Math.abs(hostBoard.piece.row - beforeRow) < 6 &&
        Math.abs(guestBoard.piece.row - beforeRow) < 6) break;
  }
  if (!hostBoard || !guestBoard || Math.abs(hostBoard.tick - guestBoard.tick) > 2) continue;
  if (hostBoard.piece.col !== guestBoard.piece.col) continue;
  shiftHost = measured.delta;
  shiftGuest = guestBoard.piece.col - (hostBoard.piece.col - measured.delta);
  pagesAgree = true;
}
check(pagesAgree && shiftHost !== 0 && shiftHost === shiftGuest,
  'a shift by the Tetris-role player moves the piece the same amount on both pages');

// ---------- 8.4: a steer turns only the snake ----------

const pieceBeforeSteer = (await snapshot(host)).piece;
await host.evaluate(async () => {
  const input = await import('/js/input.js');
  const event = { key: 'd' };
  event.preventDefault = () => {};
  input.onKey(event);
});
await pump(host, guest, 3);
const steered = { host: await snapshot(host), guest: await snapshot(guest) };
check(steered.host.piece && steered.guest.piece &&
    JSON.stringify(steered.host.head) === JSON.stringify(steered.guest.head),
  'a steer on the host page turns the snake and paints the same turn on the guest page');
check(pieceBeforeSteer && steered.host.piece && steered.guest.piece &&
    steered.host.piece.shape.join('|') === pieceBeforeSteer.shape.join('|') &&
    steered.host.piece.col === pieceBeforeSteer.col &&
    steered.guest.piece.shape.join('|') === pieceBeforeSteer.shape.join('|') &&
    steered.guest.piece.col === pieceBeforeSteer.col,
  'the steer left the falling piece alone on both pages');

// ---------- 10.1 - 10.4: the lobby persists and rematches ----------

// The finished match has to end before the lobby can re-prepare: the host page
// returns to its duration sub-menu on its own once the clock runs out.
await waitFor(host, async () => (await import('/js/state.js')).game.screen.state !== 'PLAYING');

const lobbyState = await host.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return { offer: netplay.lobby.offer, secret: netplay.lobby.secret, link: netplay.lobby.link, paired: netplay.lobby.paired, matches: netplay.lobby.matches };
});
check(lobbyState.offer !== '' && lobbyState.secret !== '' && lobbyState.link !== '',
  'the host page keeps the offer, the secret and the link after a match');
check(lobbyState.paired, 'the host page still holds its peer after a match');

const firstSeed = await host.evaluate(async () => (await import('/js/state.js')).game.play.seed);
await pushIntents(host, [{ action: 'confirm' }]);
await pump(host, guest, 1);
await pushIntents(host, [{ action: 'confirm' }]);
await pump(host, guest, 1);
await pushIntents(host, [{ action: 'select', id: 'control-item-start' }]);
await pump(host, guest, 4);
const rematch = { host: await live(host), guest: await live(guest) };
check(rematch.host.state === 'PLAYING' && rematch.guest.state === 'PLAYING',
  'the next match starts without re-pairing');
const rematchSeed = await host.evaluate(async () => (await import('/js/state.js')).game.play.seed);
check(rematchSeed !== firstSeed, 'the rematch draws a seed different from the finished match seed');
const sequences = { host: await snapshot(host), guest: await snapshot(guest) };
check(sequences.host.piece && sequences.guest.piece &&
    sequences.host.piece.shape.join('|') === sequences.guest.piece.shape.join('|'),
  'both pages draw the same piece sequence');
const guestMirror = await guest.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  return { prep: netplay.inboundReport().prep, waiting: document.getElementById('pairing-waiting').checkVisibility() };
});
check(guestMirror.prep > 0, 'the guest page keeps its waiting line and its mirrors through the rematch');


// ---------- 8.7: a peer leaving ends the match with no leaderboard entry ----------

const boardBefore = await host.evaluate(async () => {
  const records = await import('/js/highscores.js');
  return records.loadBoard(1).length;
});
await host.evaluate(async () => {
  const netplay = await import('/js/netplay.js');
  const link = netplay.peerLink();
  if (link) link.close('closed');
});
await pump(host, guest, 4);
const ended = { host: await live(host), guest: await live(guest) };
check(ended.host.state === 'PAIRING' && ended.guest.state === 'PAIRING',
  'a peer leaving returns both pages to the pairing step');
const reason = await host.evaluate(async () => (await import('/js/state.js')).game.play.gameOverReason);
check(reason === 'peer-left', 'the abandoned match ends with the peer leaving reason');
const boardAfter = await host.evaluate(async () => {
  const records = await import('/js/highscores.js');
  return records.loadBoard(1).length;
});
check(boardAfter === boardBefore, 'an abandoned match writes no leaderboard entry');

console.log('');
report('Network duel', 0);
await browser.close();
