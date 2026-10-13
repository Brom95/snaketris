// engine/tests/engine.test.js — the engine contract, driven headless.
// No document, window or localStorage exists here: the engine touches none of
// them, and this suite proves it.
import test from 'node:test';
import assert from 'node:assert/strict';

const clock = await import('../js/clock.js');
const registry = await import('../js/registry.js');
const grid = await import('../js/grid.js');
const skeleton = await import('../js/state.js');

// ---------- The clock ----------
test('the clock yields whole ticks and keeps the remainder', async () => {
  const c = clock.createClock(0.1);
  assert.equal(c.advance(0.25), 2);
  assert.equal(c.advance(0.04), 0);
  assert.equal(c.advance(0.06), 1);
});

test('a hidden tab advances nothing', async () => {
  const c = clock.createClock(1 / 60);
  assert.equal(c.advance(0), 0);
});

// ---------- The registry ----------
test('init runs once per system in declared order', async () => {
  const seen = [];
  const engine = registry.createEngine([
    { name: 'a', init(ctx) { seen.push('a:init'); }, update(ctx) { seen.push('a'); } },
    { name: 'b', init(ctx) { seen.push('b:init'); }, update(ctx) { seen.push('b'); } },
  ]);
  engine.init({});
  engine.update({});
  assert.deepEqual(seen, ['a:init', 'b:init', 'a', 'b']);
});

test('a system may omit a phase and the registry skips it', async () => {
  const seen = [];
  const engine = registry.createEngine([
    { name: 'only-update', update(ctx) { seen.push('u'); } },
    { name: 'only-endTick', endTick(ctx) { seen.push('e'); } },
    { name: 'bare' },
  ]);
  engine.update({});
  engine.endTick({});
  assert.deepEqual(seen, ['u', 'e']);
});

test('endTick runs after every update, in declared order', async () => {
  const seen = [];
  const engine = registry.createEngine([
    { name: 'first', update(ctx) { seen.push('first:update'); }, endTick(ctx) { seen.push('first:end'); } },
    { name: 'second', update(ctx) { seen.push('second:update'); }, endTick(ctx) { seen.push('second:end'); } },
  ]);
  engine.update({});
  engine.endTick({});
  assert.deepEqual(seen, ['first:update', 'second:update', 'first:end', 'second:end']);
});

test('the engine advances the tick slot exactly once per update', async () => {
  const ctx = { state: { play: { tick: 0 }, screen: {} } };
  const engine = registry.createEngine([{ name: 'reader', update(ctx) { seen.push(ctx.state.play.tick); } }]);
  const seen = [];
  engine.update(ctx);
  engine.update(ctx);
  assert.deepEqual(seen, [1, 2]);
  assert.equal(ctx.state.play.tick, 2);
});

test('the engine tolerates a context with no play container', async () => {
  const engine = registry.createEngine([{ name: 'noop' }]);
  engine.update({});
  engine.update({ state: {} });
  engine.update({ state: { play: null } });
});

// ---------- The state skeleton ----------
test('the skeleton declares two containers and nothing else', async () => {
  assert.deepEqual(Object.keys(skeleton.state), ['play', 'screen']);
});

test('resetState refills both containers from the registered tables', async () => {
  skeleton.configureState({
    play: [['score', 0], ['dir', { r: 0, c: 1 }], ['items', []]],
    screen: [['where', 'MENU']],
    afterReset: () => { touched.push('hook'); },
  });
  const touched = [];
  skeleton.resetState();
  assert.deepEqual(Object.keys(skeleton.state.play).sort(), ['dir', 'items', 'score']);
  assert.deepEqual(Object.keys(skeleton.state.screen), ['where']);
  assert.deepEqual(touched, ['hook']);
});

test('a mutable initial is cloned per reset, so resets never share one object', async () => {
  skeleton.configureState({ play: [['dir', { r: 0, c: 1 }], ['row', []]], screen: [] });
  skeleton.resetState();
  const first = skeleton.state.play.dir;
  first.r = 9;
  skeleton.state.play.row.push(1);
  skeleton.resetState();
  assert.equal(skeleton.state.play.dir.r, 0);
  assert.deepEqual(skeleton.state.play.row, []);
});

test('the reset hook runs after the gameplay container is refilled', async () => {
  const order = [];
  skeleton.configureState({
    play: [['a', 1]],
    screen: [],
    afterReset: () => { order.push('hook'); skeleton.state.play.a = 2; },
  });
  skeleton.resetPlay();
  assert.deepEqual(order, ['hook']);
  assert.equal(skeleton.state.play.a, 2);
});

test('the root is one binding: a consumer mutates in place', async () => {
  skeleton.resetScreen();
  assert.equal(Object.keys(skeleton.state.screen).length, 0);
});

// ---------- The grid ----------
test('the grid builds rows x cols from parameters and fills the empty value', async () => {
  const g = grid.createGrid({ cols: 3, rows: 2, empty: 7 });
  g.init();
  assert.equal(g.getGrid().length, 2);
  assert.deepEqual(g.getGrid()[0], [7, 7, 7]);
  g.setCell(1, 2, 4);
  assert.equal(g.getCell(1, 2), 4);
  g.init();
  assert.equal(g.getCell(1, 2), 7);
});

test('two grids are independent instances', async () => {
  const a = grid.createGrid({ cols: 1, rows: 1, empty: 0 });
  const b = grid.createGrid({ cols: 2, rows: 1, empty: 0 });
  a.init();
  b.init();
  a.setCell(0, 0, 5);
  assert.equal(b.getCell(0, 0), 0);
});
