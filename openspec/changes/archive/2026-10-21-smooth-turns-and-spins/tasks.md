# Tasks

## 1. The snake travels along its own path instead of across a corner

- [x] 1.1 In `js/render.js`, replace the per-slot chord in the snake painter with the
  arclength chain of design D1: a helper that walks the polyline of the snake's travel —
  the cells the body holds now, extended by the cell its tail left — and returns the cell at
  a given arclength, so segment `i` is drawn at `(i + 1 − phase) × CELL`. Keep the pixel
  snapping of D7 from the archived change (compute in pixels, round once, hand `px / CELL` to
  `drawCell`). Verify in `tests/motion.test.js` that on a straight run the drawn cells match
  what the shipped painter produces today, and that mid-turn the chain keeps a drawn square at
  the corner cell and keeps neighbours one `CELL` apart.
- [x] 1.2 Keep wrapped legs of that polyline drawn as the two edge copies rather than slid
  across the field (the archived `travelCells` wrap direction stays the modular short-way).
  Verify with the existing horizontal- and vertical-wrap cases in `tests/motion.test.js` plus
  a new case where the turn itself sits at a wrapped edge.
- [x] 1.3 Retire the diagonal-hop fallback in `travelCells` — a turn is no longer a hop whose
  ends differ on both axes. Verify by the honesty sweep in `tests/motion.test.js`: over the
  240-tick game with turns, no painted snake cell lies outside the cells the rules hold on
  either side of its travel.
- [x] 1.4 Confirm growth now draws the new tail square sliding in along the leg rather than
  materialising on its neighbour, replacing the archived change's accepted tail overlap.
  Verify in `tests/motion.test.js` that a growing snake mid-step keeps its one-`CELL` spacing.

## 2. A rotation is drawn walking a quarter turn

- [x] 2.1 Extend the continuity matcher per design D4 so a quarter turn keeps the piece's
  record instead of restarting it: compare the record's before-shape turned about the box
  centre against the candidate's cells within the kick envelope (≤ 2 columns, ≤ 2 rows,
  nearest taken). Verify in `tests/motion.test.js` that a rotated piece keeps one record
  carrying its start cells, and that a refused rotation leaves the record unchanged and paints
  nothing new.
- [x] 2.2 Add `ROTATION_TRAVEL_TICKS = 4` beside `SHIFT_TRAVEL_TICKS` at `js/render.js:75`
  and the phase of design D3/D5, then draw each cell at its box-centre offset rotated by
  `90° × phase` (design D2), keeping the pixel snap. Verify in `tests/motion.test.js` that a
  rotated piece is caught mid-sweep between its two shapes and that at the end of the interval
  the drawn cells equal the cells the rules hold.
- [x] 2.3 Confirm a turn the rules kicked draws the kick beside the sweep (design D5) and that
  a turn taken while the piece is still sliding composes rather than dropping either travel.
  Verify in `tests/motion.test.js` with the existing shift-mash case extended by a turn.
- [x] 2.4 Keep the coarse grid unbroken while a piece sweeps: the grid lines stay under the
  piece and the frame stays intact. Verify with `scripts/verify-field-only.mjs` green and the
  grid-line counts asserted in `scripts/verify-motion-travel.mjs`.

## 3. The slide stops outrunning the hand

- [x] 3.1 Retune `SHIFT_TRAVEL_TICKS` from 7 to 12 per design D6. Verify in
  `tests/motion.test.js` that a shift paints intermediate columns at the ticks inside the new
  window (today it would already be seated) and that the mash case still seats the piece at its
  rules' columns once the window runs out.

## 4. Both pages turn alike, and nothing else moved

- [x] 4.1 Bring the guest consistency test in `tests/motion.test.js` up to the new travel: a
  page driven only by whole frames (`encodeFrame` payloads replayed through `applyFrame`) must
  paint the same mid-turn snake chain and the same caught-mid-sweep rotation as the page that
  ran the ticks. Keep the frame at its 14 fields.
- [x] 4.2 Extend `scripts/verify-motion-travel.mjs` with the two live-page reads this change
  is about: a snake caught mid-turn keeps a drawn square at the corner cell, and a piece is
  caught mid-sweep in a handful of frames rather than in none. Keep the run under a minute.
- [x] 4.3 Regression sweep: `npm test` (both trees) green, `tests/netplay.test.js` and
  `tests/render.test.js` unchanged in their own counts, and the fast verify scripts
  (`verify-field-only`, `verify-hud`, `verify-views`, `verify-two-player-gating`) green. Note
  that `verify-all.mjs` is a ~37-minute simulation and is not a single regression step.
- [x] 4.4 Quality gate: `quality_baseline` pinned at HEAD before this change, then
  `quality_delta` before declaring DONE, with the dead-code flag from the archived change's
  `pieceCells` removal confirmed cleared.
