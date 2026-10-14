// The tick-aligned command stream. A peer sends an intent ahead of the
// simulation, so the intent carries the tick it applies on and the stream
// applies it on that tick only. An intent whose tick already passed cannot be
// applied any more: the stream counts the drop, so a resync can see the gap.
// The engine owns the alignment only. What an intent means stays with the
// apply function the consumer supplies.

export function createCommandStream(apply) {
  const stream = {
    buffered: [],
    applied: 0,
    dropped: 0,
    tick: 0,

    // Tag an intent with the tick it applies on. A tag behind the current tick
    // is a drop: the tick it names is gone, so no later drain can honour it.
    queue(intent, tick) {
      if (tick < stream.tick) {
        stream.dropped += 1;
        return false;
      }
      stream.buffered.push({ tick, intent });
      return true;
    },

    // Apply every buffered intent tagged the current tick, and nothing else.
    // The tick comes from the engine's own slot, so a stream cannot drift onto
    // a tick of its own.
    drain(ctx) {
      const play = ctx.state?.play;
      stream.tick = play?.tick ?? stream.tick;
      const due = [];
      const kept = [];
      for (const entry of stream.buffered) {
        if (entry.tick === stream.tick) due.push(entry);
        else if (entry.tick < stream.tick) stream.dropped += 1;
        else kept.push(entry);
      }
      stream.buffered = kept;
      for (const entry of due) {
        stream.applied += 1;
        apply(entry.intent, stream.tick);
      }
      return due.length;
    },

    // Drop every buffered intent and count them: a resync re-sends state, so
    // a buffered intent would apply twice.
    dropAll() {
      const count = stream.buffered.length;
      stream.dropped += count;
      stream.buffered = [];
      return count;
    },
  };
  return stream;
}
