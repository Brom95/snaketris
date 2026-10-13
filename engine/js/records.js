// Report MECHANISM: persist a reported batch exactly once, then clear it.
// The consumer names where the report lives in the play half and supplies the
// writer for one entry. This module reads no field of its own, opens no storage,
// and never inspects an entry, so it names no board key and no entry shape.

import { state } from './state.js';

let reportField = null;
let entryWriter = null;

export function registerReport(options) {
  if (options.field) reportField = options.field;
  if (options.writer) entryWriter = options.writer;
}

// The batch is cleared BEFORE its entries are handed over. A writer that throws
// therefore cannot report the same batch again on a later tick, and the game
// keeps running.
function persistReport() {
  if (!reportField) return;
  const batch = state.play[reportField];
  if (!batch) return;
  state.play[reportField] = null;
  if (!entryWriter) return;
  for (const entry of batch) entryWriter(entry);
}

// The shell runs in both passes. The update pass picks up a report made during
// a tick; the endTick pass picks up one made by a system that reports on the
// closing edge. Clearing the batch makes the second pass a no-op.
export const recordsSystem = {
  name: 'records',
  update(ctx) {
    persistReport();
  },
  endTick(ctx) {
    persistReport();
  },
};
