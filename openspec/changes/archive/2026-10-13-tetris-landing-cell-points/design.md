# Design

## Context

See `proposal.md` - Why for motivation. The current state: the per-landed-cell value is the bare literal `3` inside `landPiece` in `js/pieces.js`, while the sibling scoring values (`PIECE_BONUS`, `LINE_CLEAR_POINTS`) are named exports in `js/constants.js`. Two other places restate the number: `benchmark.mjs` re-derives cleared rows from `tetrisScore` and `landedBlocks` with a hard-coded multiplier, and the help list in `snaketris.html` states a third value (`+1`). The engine is a fixed-timestep loop; scoring is pure arithmetic on `game.play.tetrisScore`, so no timing or ordering work is involved.

## Goals / Non-Goals

**Goals:**
- One authoritative source for the landing-cell value, read by every consumer.
- The awarded value, the spec text, and the on-screen help text agree.
- Existing tests keep asserting real arithmetic rather than a copied literal.

**Non-Goals:**
- Changing the cleared-row value, the snake-side values, the winner rule, or the difficulty ramp.
- Rescaling the difficulty ramp or the countdown to compensate for the lower Tetris score. The match can end with smaller totals; that is accepted behaviour, not a rebalancing target.
- Touching the high-score storage format. Entries store the player's side score as an integer; the value change does not alter the key or the shape.

## Decisions

**Name the constant `LANDING_CELL_POINTS` in `js/constants.js`, next to `PIECE_BONUS` and `LINE_CLEAR_POINTS`, instead of editing the literal in place.**
The project already keeps scoring values in `constants.js` and asserts them in `tests/constants.test.js`. A bare `3` → `2` swap would leave the same magic number in `benchmark.mjs` and would keep the drift the proposal describes. Alternative considered: a shared helper function — rejected, one arithmetic site does not earn an abstraction.

**Import it into `js/pieces.js` through the existing single import statement.**
`js/pieces.js` already imports `LINE_CLEAR_POINTS` from `./constants.js`, so the edge is one-way and adds no cycle.

**Update `benchmark.mjs` to import `LANDING_CELL_POINTS` and use it in the row-derivation expression.**
That file computes `rowsCleared = (tetrisScore - 3 * landedBlocks) / LINE_CLEAR_POINTS`. Leaving the `3` there makes the benchmark report a wrong row count once the awarded value changes. Alternative considered: delete the derivation — rejected, the benchmark's row count is a reported figure other harness output depends on.

**Retarget the two `tests/pieces.test.js` expectations to the new arithmetic rather than deleting them.**
`+12` becomes `+8` (4 landed cells × 2) and `6` becomes `4` (2 cells × 2). The assertions still prove the multiplier is applied per cell.

**Rewrite the help line in `snaketris.html` to state the awarded value.**
The line currently reads `+1 per landed block` while the code awarded `3`. Fixing it to `+2` closes the drift the proposal names. The help view is player-facing copy, so it follows the spec, not the other way round.

## Risks / Trade-offs

- [Lower Tetris totals change win rates] → The winner rule is a comparison, so it stays correct. A Snake-role player may win more often. Accepted: the ramp and the countdown are unchanged, and no spec requirement promises a balance target.
- [High-score entries recorded under the old value stay in the list] → No spec requires re-scoring old entries. They remain as historical numbers.
- [`benchmark.mjs` derivation divides by `LINE_CLEAR_POINTS`] → If a future change makes the two multipliers share a value, the derivation stays valid because both operands are named constants.
