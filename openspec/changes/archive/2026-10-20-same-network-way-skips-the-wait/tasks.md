# Tasks — same-network-way-skips-the-wait

> Superseded before it shipped: `one-network-way-no-wait` retires the candidate attempt and
> the wait entirely, so the gate this change moved no longer exists — the page's own work now
> runs unconditionally above the seat branch instead of above a kept gate. The change is kept
> in the archive with its tasks closed against the newer shape, not against its own gate.

## 1. The move

- [x] 1.1 `js/app.js` `networkDuties` ran the same-network block above the candidate-wait return, with the gate doubled for the other way. (Applied; later replaced by the one-way shape, where the wait is retired rather than doubled.)
- [x] 1.2 The block's own order stayed as it is: read the port, rebuild the line, announce, aim. (Held in the shipped shape too.)

## 2. The proof

- [x] 2.1 `scripts/verify-local-transport.mjs` ran with the move in place: two separate Chromium instances, each typing its own address, the host carrying the opened page's line into its own field, both pages reach `connected` with a message crossing both ways. (Measured under the newer shape instead: see task 3.2 of `one-network-way-no-wait` for the recorded two-instance outcome.)
- [x] 2.3 A page whose peer values never arrive stays unjoined. (Measured under the newer shape.)

## 3. The gates

- [x] 3.1 `npm test` and `npm run verify` pass with the move in place. (Passing is recorded for the shipped one-way shape, which subsumes this one.)
