// Engine: fixed-timestep clock + ordered systems registry.
// A system is a module that exposes { name, init, update }: init(ctx) runs
// once at load; update(ctx) runs once per tick, in declared order. The
// owning modules (snake, pieces, input-flow, render) are the systems; app.js
// registers them and stops owning game logic inline.

// Fixed-timestep clock: accumulates frame time and yields 0..N ticks to run.
// Mirrors the accumulator pattern that lived in app.update().
export function createClock(tick) {
  let acc = 0;
  return {
    // Advance by a frame's elapsed seconds; returns how many ticks this
    // frame must run (0..N).
    advance(dt) {
      acc += dt;
      const n = Math.floor(acc / tick);
      if (n > 0) acc -= n * tick;
      return n;
    },
  };
}

// Ordered systems registry. `systems` is an ordered array of { name, init,
// update }. init(ctx) runs once at load; update(ctx) runs once per tick, in
// declared order. The returned object exposes init(ctx) and update(ctx).
export function createEngine(systems) {
  return {
    init(ctx) {
      for (const s of systems) s.init?.(ctx);
    },
    update(ctx) {
      for (const s of systems) s.update?.(ctx);
    },
  };
}
