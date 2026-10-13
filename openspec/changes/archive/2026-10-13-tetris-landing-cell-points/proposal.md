# Proposal

## Why

The Tetris side awards 3 points per landed cell, but the player-facing help view and the project notes both still describe 1 point per landed block. Three different numbers describe one rule across the code, the spec, and the help text, and the value is a bare literal in the landing routine. Restating it as one named constant and one agreed value removes the drift.

## What Changes

- **BREAKING** The Tetris side awards 2 points per cell that lands as a solid block, replacing the current 3.
- The landing-cell value moves from a bare literal in `js/pieces.js` into a named constant in `js/constants.js`, next to the existing `PIECE_BONUS` and `LINE_CLEAR_POINTS` constants.
- The in-game help view states the new value so the on-screen rules match the awarded score.
- The cleared-row value (10 points) and every snake-side value (1 per consumed cell, 4 whole-piece bonus) stay unchanged.

## Capabilities

### New Capabilities

None. This change modifies an existing requirement only.

### Modified Capabilities

- `snaketris-game`: the "Two scores, one per side" requirement changes the per-landed-cell Tetris value from 3 to 2.

## Impact

- Code: `js/constants.js` gains the landing-cell constant; `js/pieces.js` `landPiece` reads it instead of a literal.
- Benchmarks: `benchmark.mjs` re-derives the landed-cell value from `landedBlocks` with a hard-coded multiplier and must read the constant.
- Tests: `tests/constants.test.js` asserts the new constant; `tests/pieces.test.js` retargets two Tetris-score expectations that encode the old multiplier.
- UI copy: `snaketris.html` help list states the new value.
- Unaffected: `js/engine.js`, `js/bot.js`, `js/ui.js`, the high-score store, the countdown, and the winner rule. Score magnitude changes; the comparison rule does not.
