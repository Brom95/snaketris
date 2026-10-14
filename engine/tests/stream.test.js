// engine/tests/stream.test.js — the tick-aligned command stream contract.
// An intent carries the tick it applies on, so a stream applies it on that
// tick and on no other tick. An intent whose tick already passed is dropped
// and counted, never applied.
import test from 'node:test';
import assert from 'node:assert/strict';

const stream = await import('../js/stream.js');

// A context shaped like the engine's own: the tick slot is the engine's.
function atTick(tick) {
  return { state: { play: { tick }, screen: {} } };
}

test('an intent tagged tick 40 buffered at tick 38 is applied on tick 40 and on no other tick', async () => {
  const seen = [];
  const commands = stream.createCommandStream((intent, tick) => seen.push({ intent, tick }));
  commands.queue('go', 40);
  for (let tick = 38; tick <= 41; tick += 1) commands.drain(atTick(tick));
  assert.deepEqual(seen, [{ intent: 'go', tick: 40 }], 'applied once, on the tagged tick only');
  assert.equal(commands.applied, 1);
  assert.equal(commands.dropped, 0);
  assert.deepEqual(commands.buffered, [], 'the stream holds nothing after its tick passed');
});

test('an intent tagged tick 40 arriving at tick 45 is not applied and the drop count increases', async () => {
  const seen = [];
  const commands = stream.createCommandStream((intent, tick) => seen.push({ intent, tick }));
  commands.drain(atTick(45));
  const accepted = commands.queue('go', 40);
  assert.strictEqual(accepted, false, 'a tag behind the current tick is refused');
  assert.deepEqual(seen, [], 'the intent was never applied');
  assert.equal(commands.dropped, 1, 'the drop is counted');
  assert.equal(commands.applied, 0);
});

test('a buffered intent overtaken by the tick is dropped and counted', async () => {
  const seen = [];
  const commands = stream.createCommandStream((intent, tick) => seen.push({ intent, tick }));
  commands.queue('go', 40);
  commands.drain(atTick(45));
  assert.deepEqual(seen, []);
  assert.equal(commands.dropped, 1);
  assert.deepEqual(commands.buffered, []);
});

test('the stream applies nothing when it holds nothing', async () => {
  const commands = stream.createCommandStream(() => {});
  assert.equal(commands.drain(atTick(1)), 0);
  assert.equal(commands.applied, 0);
  assert.equal(commands.dropped, 0);
});

test('the stream applies several intents tagged one tick in queue order', async () => {
  const seen = [];
  const commands = stream.createCommandStream((intent, tick) => seen.push(intent));
  commands.queue('left', 40);
  commands.queue('turn', 40);
  commands.queue('right', 41);
  assert.equal(commands.drain(atTick(40)), 2);
  assert.deepEqual(seen, ['left', 'turn'], 'queue order is kept');
  assert.deepEqual(commands.buffered, [{ tick: 41, intent: 'right' }]);
  assert.equal(commands.applied, 2);
});

test('two streams are independent instances, so each peer owns one', async () => {
  const firstSeen = [];
  const secondSeen = [];
  const a = stream.createCommandStream((intent, tick) => firstSeen.push(intent));
  const b = stream.createCommandStream((intent, tick) => secondSeen.push(intent));
  a.queue('left', 3);
  b.queue('turn', 3);
  a.drain(atTick(3));
  assert.deepEqual(firstSeen, ['left']);
  assert.deepEqual(secondSeen, [], 'the other stream applied nothing of its own');
  assert.equal(b.applied, 0);
  assert.equal(b.dropped, 0);
});

test('a stream with no play container keeps its own tick and never throws', async () => {
  const commands = stream.createCommandStream(() => {});
  commands.queue('go', 2);
  commands.drain({});
  commands.drain({ state: {} });
  commands.drain({ state: { play: null } });
  assert.equal(commands.applied, 0);
  assert.equal(commands.dropped, 0);
});
