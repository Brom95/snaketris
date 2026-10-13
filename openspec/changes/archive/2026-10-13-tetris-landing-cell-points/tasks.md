# Tasks

## 1. Scoring constant

- [x] 1.1 Export `LANDING_CELL_POINTS = 2` in `js/constants.js` beside `PIECE_BONUS` and `LINE_CLEAR_POINTS`, and assert it in `tests/constants.test.js` so `npm test` proves the value is pinned.
- [x] 1.2 Import `LANDING_CELL_POINTS` in `js/pieces.js` and replace the bare `+= 3` in `landPiece` with `+= LANDING_CELL_POINTS`; verify `npm test` still passes with the landing assertions retargeted in 2.1.

## 2. Landing-score tests

- [x] 2.1 Retarget the two Tetris-score expectations in `tests/pieces.test.js` that encode the old multiplier (the 4-cell landing case and the 2-cell landing case) to the new per-cell value; verify `npm test` reports every check passing with exit 0.
- [x] 2.2 Confirm the line-clear expectations in `tests/pieces.test.js` (the `+10` and `+20` cases) still pass untouched, proving the row value did not move.

## 3. Benchmark derivation

- [x] 3.1 Import `LANDING_CELL_POINTS` in `benchmark.mjs` and replace the hard-coded `3 *` in the `rowsCleared` derivation with it; verify the benchmark still reports a non-negative integer row count for a played game.

## 4. Player-facing copy

- [x] 4.1 Update the help list item in `snaketris.html` so the landed-block value matches the awarded score; verify the rendered help view states the same number the code awards.

## 5. Integration checks

- [x] 5.1 Run `npm run verify` and confirm the harness line reports no failed scripts; confirm the role-duel harness still asserts both side scores are positive.
- [x] 5.2 Run the ripwire `quality_delta` self-check and confirm it reports nothing worse than the git HEAD baseline.

## Workflow follow-up

- Sync the delta into `openspec/specs/snaketris-game/spec.md` and archive the change once the checks pass.
- Commit and push the change in the project's established commit-message style.
