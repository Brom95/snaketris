# Tasks

## 1. Paint-layer motion records and the travel primitive

- [x] 1.1 In `js/render.js`, add the module-level motion record per mover — the snake array identity and each falling piece object — holding `prevCells`, `movedTick`, measured `intervalTicks`, and the shape/row markers, plus a reset path for a new game; verify with a new `tests/motion.test.js` (driven off `tests/helpers/game.js` and `tests/helpers/dom-stub.js`) that a record exists per mover and that a frame with no observed move draws the same cells as today.
- [x] 1.2 Add the travel helper that lerps a mover's cell position across its interval in **pixels**, rounds once there, and hands `px / CELL` to `drawCell`, so the `+1` inset and `cell - 2` size stay integers (design D7); verify in `tests/motion.test.js` that a mid-interval frame passes a coordinate whose pixel product is an integer and that the existing `tests/render.test.js` counts for a non-moving frame still pass.

## 2. Piece fall travels on the fraction state already carries

- [x] 2.1 In `js/pieces.js`, add a drawn-position sibling of `pieceCells` used only by `paintPieces`, drawing at `floor(p.row) + drCell - 1 + frac(p.row)` (design D2/D3) so the drawn cell stays inside the two rows the piece moved through; leave `pieceCells` as the cells the rules read; verify with `tests/motion.test.js` cases at `frac` 0, 0.5 and 0.96 that no drawn row exceeds the row below the piece's rule cell, and that `tests/pieces.test.js` still passes unchanged.
- [x] 2.2 Keep a piece entering from above clipped to the field: a cell fully above the field paints nothing and a straddling cell paints its visible part, without touching the field's top margin (design Risk); verify with a `tests/motion.test.js` case on a piece spawned at `row = -5` and a `scripts/verify-field-only.mjs` run showing the margin clean.
- [x] 2.3 Confirm the landing frame reads level with the row the piece occupies rather than sunk into the block below it (spec scenario "The landing frame still reads as the landed cell"); verify with a `tests/motion.test.js` case one row above a `SOLID` cell and by running `scripts/verify-hud.mjs` for an unbroken field read.

## 3. Snake step travels from the cell it left

- [x] 3.1 Measure the snake's interval as the `game.play.tick` delta between two observed steps and phase by `(tick - movedTick) / intervalTicks`, clamped to [0,1] (design D4); phase stays 0 until the interval has been observed twice; verify with `tests/motion.test.js` that a mid-interval frame draws each segment between cells and that the frame at the crossing draws the new cells with no jump.
- [x] 3.2 Map the from-cell per slot as `prevCells[i]`, one cell behind the cell the slot now holds; the `max(i - 1, 0)` mapping design D5 held at plan time was rejected while implementing (it seats the head on top of the segment behind it for most of a hop), and design.md now carries the correction. Verify with a `tests/motion.test.js` case on a straight three-segment snake that head, body and spacing are what one-cell crawl paints at a mid-interval phase and at the crossing.
- [x] 3.3 Confirm growth and death need no special case: the new tail takes the cell of the segment ahead, and on a killing step the mover's cells stop so the clamp seats the art at the cells the rules hold (spec scenario "A dying snake freezes rather than bouncing"); verify with `tests/motion.test.js` cases on a grown snake and on `gameOverReason = 'snake-death'`.

## 4. Requested shifts travel on a fixed duration

- [x] 4.1 Add a render-layer `SHIFT_TRAVEL_TICKS` constant (~7 ticks) and phase a piece's column change by `(tick - movedTick) / SHIFT_TRAVEL_TICKS` (design D4), so a shift answered at any mashing rate slides the same distance; verify with `tests/motion.test.js` for shifts requested one tick apart and one interval apart.
- [x] 4.2 Reset the piece's record — do not lerp — when its shape changes (a rotation, an eaten cell) and confirm a refused shift stays put with no partial slide (spec scenario "A shift blocked by the stack stays put"); verify with `tests/motion.test.js` cases for `requestPieceShift` returning false and for `rotatePiece` keeping the rotation instant.

## 5. Wrapped hops draw both edges

- [x] 5.1 Detect a non-adjacent hop and draw the leaving cell at `from + phase` and the entering cell at `to - (1 - phase)` so the canvas clip cuts each (design D6); verify with `tests/motion.test.js` for a right→left and a bottom→top hop, asserting nothing is drawn travelling through the middle of the field and that the mid-hop frame draws exactly two cells for that segment.
- [x] 5.2 Leave `drawGrid` (js/render.js) stroking at `c * CELL` / `r * CELL` and the canvas buffer at 240×480 untouched, so movers travel finer than the shown grid (spec requirement "The grid the player is shown stays the coarse grid"); verify by running `scripts/verify-page-layout.mjs` and `tests/render.test.js` unchanged.

## 6. Integration across both pages and the untouched rules

- [x] 6.1 Honesty sweep: assert over a whole interval that no drawn cell of a snake beside a wall or of a piece above a stack ever names a cell the mover does not occupy on either side of its travel (spec requirement "A drawn position never implies a position the rules forbid"); verify in `tests/motion.test.js`.

      Verified: a real game driven through `app.update()` and painted at an uneven cadence

      (one frame on some ticks, two on the next) over 240 ticks, checking every filled cell

      against the cells the rules hold on that frame - the cells each mover left as well as

      the ones it reached, as the requirement words it. The sweep caught the raw-sign wrap

      direction (fixed: read it modularly) and drove the guest matching fix in 6.4.
- [x] 6.2 Rule-unchanged check: run `npm test` and confirm `tests/snake.test.js`, `tests/pieces.test.js` and `tests/grid.test.js` pass with no rule file touched, and confirm nothing under `engine/` or `engine/docs/` changed (`git status` clean for those paths).

      Verified: 310 tests pass in 0.7 s; `git status` names only `js/render.js`, `js/pieces.js`,

      the two new test/verify files and the OpenSpec artifacts - `engine/` and `engine/docs/`

      are untouched.
- [x] 6.3 Wire-unchanged check: run `tests/netplay.test.js` and confirm `encodeFrame` still returns 14 fields and `applyFrame` still accepts them (spec requirement "Travel carries no information the rules carry"); verify no phase field is added.

      Verified: `tests/netplay.test.js` 7/7 in 52 ms, plus the frame test in `tests/motion.test.js`,

      which parses the payload to 14 fields and re-encodes after an apply still at 14, so travel

      added nothing to the wire.
- [ ] 6.4 Confirm the guest half: a page driven only by whole frames travels like the page that ran the ticks — **half done**: the fast replay in `tests/motion.test.js` feeds one page through the real `encodeFrame` payloads and every painted cell matches the host page's at every one of 120 ticks; the live two-device watch is the user's, since no headless run reaches an ICE connection (see the D8 correction and design.md Open Questions).

      Substance verified by a fast check, the live pair only partly:

      - `tests/motion.test.js` runs a host page for 120 ticks, ships each frame through
        `encodeFrame` and replays the frames into a page that never runs a tick, asserting
        both pages painted the same travel of the same mover over the same cells. This is
        the check that caught identity-keyed records - a guest page assigns fresh
        containers every frame, so the key must be continuity (design D8 corrected) - and
        the fix that followed.
      - `scripts/verify-network-local.mjs` passes on the live page in 21 s but does not
        itself assert travel.
      - `scripts/verify-local-transport.mjs` runs past 90 s and stops at the ICE handshake,
        a failure that reproduces on a pristine copy of `HEAD`, so it is a simulation in
        the user-verified-later group rather than a regression step.

      Left open: the two live pages have not been watched travelling side by side.
- [x] 6.5 Full-page regression check: run `scripts/verify-all.mjs` and the two-player gating harness `scripts/verify-two-player-gating.mjs`, plus `npm test`, and report the outcome of the repo's quality gate `quality_delta` before declaring DONE.

      Run per script rather than as `scripts/verify-all.mjs`, which is a ~37 min batch and
      therefore a simulation, not a regression step: 19 scripts in 0.7 s to 5 min each,
      timed, with `npm test` at 0.7 s (310 tests, 0 fail) and `verify-two-player-gating`
      green in 7 s. Green: 16 of 19, including `verify-motion-travel.mjs` (9 s) and
      `verify-pairing-scroll.mjs`, which reports 0 FAIL and "passed" and then stays alive
      past its report while a live peer connection is open - a pass whose runtime is the
      problem, not the verdict. Red, both pre-existing: `verify-menu-geometry.mjs` fails a
      SyntaxError over exports `js/netplay.js` does not have at `HEAD`, and
      `verify-local-transport.mjs` stops at the WebRTC ICE handshake in a run that
      reproduces on a pristine copy of `HEAD`; `verify-webrtc-pairing.mjs` is the same ICE
      group. Quality gate: 19 flags, 14 of them new symbols in the two new files, 2 minor
      churn, 3 gating - the two test-scaffolding clones of a paint helper and the self-
      churn of `paintSnake` - and no dead or duplicated shipped code, no new API surface,
      which the removal of the now-unused `pieceCells` cleared.

## Workflow follow-up

- Sync the `motion-rendering` and `piece-rendering` deltas into the main specs and archive the change once the review requirements are met (`openspec sync` then `openspec archive`).
- Resolve the two Open Questions in `design.md` (snake crawl at the fastest tiers, `SHIFT_TRAVEL_TICKS` value) against the browser checks in 6.4 before archiving.
