// Engine clock: a fixed-timestep accumulator.
// It turns wall-clock frame time into 0..N whole ticks, so a hidden tab
// advances only the time the player actually watched.

// Fixed-timestep clock: accumulates frame time and yields 0..N ticks to run.
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
