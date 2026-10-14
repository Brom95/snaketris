// The seeded deterministic source. A seed and a call count answer with one
// value, so a draw is a function of its address, never of hidden state: a
// peer can recompute any draw and a resync cannot shift the sequence.
// The engine owns the arithmetic only. Which value means what stays with the
// consumer.

const MIX_A = 0x21f0aaad;
const MIX_B = 0x35c230b3;
const GOLDEN = 0x9e3779b9;

export function nextValue(seed, callCount) {
  let z = (seed + Math.imul(callCount + 1, GOLDEN)) | 0;
  z = Math.imul(z ^ (z >>> 16), MIX_A);
  z = Math.imul(z ^ (z >>> 15), MIX_B);
  z = z ^ (z >>> 16);
  return z >>> 1;
}

// A draw inside [0, bound). The modulo is kept, not rejected: bound is a
// handful against a 31-bit value, so the bias is under one part in a hundred
// million and the source stays free of a rejection loop.
export function nextInRange(seed, callCount, bound) {
  if (!(bound > 0)) return 0;
  return nextValue(seed, callCount) % bound;
}
