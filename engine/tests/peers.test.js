// engine/tests/peers.test.js — two peers, one simulation, no browser at all.
// Two intent streams feed one engine simulation. No document, window,
// localStorage or channel object exists in this run, and it finishes anyway.
import test from 'node:test';
import assert from 'node:assert/strict';

const registry = await import('../js/registry.js');
const stream = await import('../js/stream.js');
const link = await import('../js/link.js');

test('two intent streams feed one simulation that finishes with no DOM and no channel object', async () => {
  assert.strictEqual(globalThis.document, undefined, 'no document');
  assert.strictEqual(globalThis.window, undefined, 'no window');
  assert.strictEqual(globalThis.localStorage, undefined, 'no storage');
  assert.strictEqual(globalThis.RTCPeerConnection, undefined, 'no channel object');

  const applied = { host: [], guest: [] };
  const conn = link.createLink(null);
  const host = stream.createCommandStream((intent, tick) => applied.host.push(`${intent}@${tick}`));
  const guest = stream.createCommandStream((intent, tick) => applied.guest.push(`${intent}@${tick}`));
  conn.attachStream(host, 'host');
  conn.attachStream(guest, 'guest');

  const ctx = { state: { play: { tick: 0 }, screen: {} } };
  let reached = -1;
  const engine = registry.createEngine([
    { name: 'host-stream', update(ctx) { host.drain(ctx); } },
    { name: 'guest-stream', update(ctx) { guest.drain(ctx); } },
    { name: 'finisher', update(ctx) { reached = ctx.state.play.tick; } },
  ]);
  engine.init(ctx);

  // A peer sends an intent ahead of the simulation, so every tag is a future tick.
  host.queue('shift', 3);
  host.queue('shift', 3);
  host.queue('shift', 9);
  guest.queue('turn', 3);
  guest.queue('turn', 2);
  guest.queue('turn', 4);
  guest.queue('turn', 12);

  for (let frame = 0; frame < 5; frame += 1) engine.update(ctx);
  const sent = conn.resync({ tick: 5, board: [] });
  for (let frame = 0; frame < 5; frame += 1) engine.update(ctx);

  assert.equal(reached, 10, 'the simulation ran to its last tick');
  assert.equal(ctx.state.play.tick, 10, 'the engine advanced the tick slot once per update');
  assert.deepEqual(applied.host, ['shift@3', 'shift@3'], 'the host stream applied its two due intents only');
  assert.deepEqual(applied.guest, ['turn@2', 'turn@3', 'turn@4'], 'the guest stream applied its three due intents only');
  assert.equal(sent.dropped, 2, 'the resync dropped the two intents still buffered');
  assert.deepEqual(
    conn.counts(),
    { host: { applied: 2, dropped: 1 }, guest: { applied: 3, dropped: 1 } },
    'both streams report their counts',
  );
});

test('the two-peer run drives one simulation with no peer paired and no transport', async () => {
  const conn = link.createLink(null);
  const commands = stream.createCommandStream(() => {});
  conn.attachStream(commands, 'only');
  const ctx = { state: { play: { tick: 0 }, screen: {} } };
  const engine = registry.createEngine([{ name: 'stream', update(ctx) { commands.drain(ctx); } }]);
  engine.init(ctx);
  commands.queue('shift', 2);
  engine.update(ctx);
  engine.update(ctx);
  assert.equal(ctx.state.play.tick, 2, 'the simulation advanced');
  assert.equal(commands.applied, 1);
  assert.equal(conn.peer, null, 'no peer is paired');
  assert.equal(conn.open, false, 'no transport means no open link');
});
