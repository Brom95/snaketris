## 1. The way menu

- [x] 1.1 `js/screens.js` offers the same-network pair and Back in the network section, and no anywhere-network item.
- [x] 1.2 `snaketris.html` declares no markup for a second network item, and its stacked layout hides nothing new.
- [x] 1.3 `pickFlow` and the flow name retire, and the link the page hands over names the peer's address and port alone.

## 2. The wait

- [x] 2.1 `js/netplay.js` runs no candidate attempt: `startIceAttempt`, `openIceAttempt` and `iceAttempt` are gone, and `lobby.ice` and `lobby.iceLeft` with them.
- [x] 2.2 `js/app.js` configures no ICE server and opens no candidate list.
- [x] 2.3 `js/ui.js` paints no countdown line and no warning line, and `js/copy.js` carries no copy for them.

## 3. The page's own work

- [x] 3.1 `js/app.js` runs the port-read, the line rebuild, the announce and the aim above the guest branch, so an opened page aims and reads.
- [x] 3.2 `scripts/verify-local-transport.mjs` and `scripts/verify-pairing-scroll.mjs`: measured on two separate Chromium instances (logs read after this pass) — record what headless Chromium reaches.

## 4. The gates

- [x] 4.1 Unit tree green at 240 of 240: the five flow-marker and way-choice tests in `tests/netplay.test.js` were replaced by assertions that the link names its address and port once and that no `flow=` marker rides it; `tests/screens.test.js` asserts three way items and that no item or label names the anywhere way; `tests/devices.test.js` drops the `lobby.flow` lines; `tests/app.test.js` drops the two shipped-supply tests.
- [x] 4.2 `scripts/verify-ice-preload.mjs` (the candidate attempt's countdown and its publish gate) and `scripts/verify-way-switch.mjs` (picking the OTHER way re-decides) are retired with the shapes they asserted and taken out of `scripts/verify-all.mjs`; `scripts/verify-pairing-scroll.mjs` joins the suite for the scroll line; the harnesses that read `lobby.flow` now print no flow.
- [x] 4.3 `npm test` and `npm run verify` pass with the change in place: unit tree 240 of 240, verify suite 16 of 16.
