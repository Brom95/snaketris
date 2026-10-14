// engine/tests/link.test.js — the peer link and the resync policy contract.
// The link receives a transport object from the consumer and never builds one,
// so a link with no transport reports no peer at all.
import test from 'node:test';
import assert from 'node:assert/strict';

const link = await import('../js/link.js');
const stream = await import('../js/stream.js');

test('a link with no transport reports no peer and holds nothing', async () => {
  const lonely = link.createLink(null);
  assert.equal(lonely.transport, null, 'the consumer supplied no transport');
  assert.equal(lonely.peer, null, 'no peer is reported');
  assert.equal(lonely.open, false, 'the link is not open');
  assert.equal(lonely.closed, false, 'the link has not closed');
  assert.deepEqual(lonely.counts(), {}, 'no stream is attached, so no count is reported');
});

test('the link holds the state a peer connection reports', async () => {
  const conn = link.createLink({ channel: {} });
  conn.report('signaling', 'stable');
  conn.report('iceConnection', 'connected');
  assert.deepEqual(
    conn.states,
    { signaling: 'stable', connection: 'new', iceConnection: 'connected' },
    'the record holds every reported value',
  );
  assert.equal(conn.open, true, 'a connected state opens the link');
  assert.equal(conn.peer, null, 'no identity is paired until pair runs');
  conn.pair('peer-42');
  assert.equal(conn.peer, 'peer-42', 'the paired identity is held');
});

test('the close event fires once and every handler sees the reason', async () => {
  const conn = link.createLink({ channel: {} });
  const seen = [];
  conn.onClose((reason) => seen.push(`first:${reason}`));
  conn.onClose((reason) => seen.push(`second:${reason}`));
  assert.equal(conn.close('peer left'), true, 'the first close fires');
  assert.deepEqual(seen, ['first:peer left', 'second:peer left'], 'handlers run in registration order');
  assert.equal(conn.closed, true);
  assert.equal(conn.closeReason, 'peer left', 'the reason is held');
  assert.equal(conn.open, false, 'a closed link is not open');
  assert.equal(conn.close('again'), false, 'a second close does nothing');
  assert.deepEqual(seen, ['first:peer left', 'second:peer left'], 'no handler runs twice');
});

test('the resync policy re-sends state and drops every buffered intent', async () => {
  const conn = link.createLink({ channel: {} });
  const hostSeen = [];
  const guestSeen = [];
  const host = stream.createCommandStream((intent, tick) => hostSeen.push(intent));
  const guest = stream.createCommandStream((intent, tick) => guestSeen.push(intent));
  conn.attachStream(host, 'host');
  conn.attachStream(guest, 'guest');
  host.queue('shift', 5);
  guest.queue('turn', 5);
  guest.queue('turn', 9);

  const snapshot = { tick: 5, board: [] };
  const sent = conn.resync(snapshot);
  assert.equal(sent.state === snapshot, true, 'the resync hands back the state the host re-sends');
  assert.equal(sent.dropped, 3, 'every buffered intent of both streams is counted');
  assert.equal(conn.resyncs, 1);
  assert.equal(conn.authoritative, true, 'one simulation stays authoritative');
  assert.deepEqual(hostSeen, [], 'no input is replayed');
  assert.deepEqual(guestSeen, [], 'no input is replayed');
  assert.deepEqual(
    conn.counts(),
    { host: { applied: 0, dropped: 1 }, guest: { applied: 0, dropped: 2 } },
    'both streams report their counts',
  );
});

test('a resynced stream applies nothing of its dropped buffer on a later tick', async () => {
  const conn = link.createLink({ channel: {} });
  const seen = [];
  const commands = stream.createCommandStream((intent, tick) => seen.push(intent));
  conn.attachStream(commands, 'only');
  commands.queue('shift', 5);
  conn.resync({ tick: 5 });
  for (let tick = 6; tick <= 9; tick += 1) commands.drain({ state: { play: { tick } } });
  assert.deepEqual(seen, [], 'the dropped buffer cannot apply twice');
  assert.equal(commands.applied, 0);
  assert.equal(commands.dropped, 1);
});

test('a link with no streams resyncs by re-sending state and dropping nothing', async () => {
  const conn = link.createLink({ channel: {} });
  const sent = conn.resync({ tick: 1 });
  assert.equal(sent.dropped, 0);
  assert.equal(conn.resyncs, 1);
  assert.deepEqual(conn.counts(), {});
});
