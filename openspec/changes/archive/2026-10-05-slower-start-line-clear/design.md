# Design

## Context

See proposal.md for motivation. The current speed model lives in `js/pieces.js` (`currentFallSpeed()` = `min(MAX_FALL, BASE_FALL * Math.pow(1.08, floor(landedBlocks/2)))`) and the snake step interval is derived from it in `js/snake.js` (`snakeTicksPerCell()`). The line-clear mechanic does not exist today; landed pieces just accumulate as SOLID cells.

## Goals / Non-Goals

**Goals:**
- Slow the base fall speed (0.08 → 0.04) and the snake's derived step interval accordingly.
- Relax the difficulty ramp threshold from 2 to 5 landed blocks.
- Add a line-clear mechanic: when a row is full of SOLID cells, clear it, award +10 score, and subtract 10 from `landedBlocks`.

**Non-Goals:**
- No changes to the render pipeline, input handling, or state machine.
- No changes to tetromino definitions, grid dimensions, or wrap-around collision model.
- No persistence or high-score changes.

## Decisions

### Base fall speed: 0.08 → 0.04

`js/constants.js`: `BASE_FALL = 0.04`. The snake's step interval is derived (`max(1, 1/fallSpeed − 2)`), so no separate constant change is needed — the same formula now yields 23 ticks/cell at base instead of 12 ticks/cell.

### Ramp threshold: /2 → /5

`js/pieces.js`: `currentFallSpeed()` changes from `Math.pow(1.08, floor(landedBlocks/2))` to `Math.pow(1.08, floor(landedBlocks/5))`. The cap (0.9) and the SNAKE_SPEED_DELTA (2) are unchanged.

### Line clear after landing

After `landPiece(p)` mutates the grid (and increments `landedBlocks`), scan every row: if all COLS cells in a row are SOLID, set them to EMPTY, add 10 to score per cleared row, and subtract 10 from `landedBlocks` per cleared row. The clear is automatic — it does not require the snake to consume the blocks.

**Alternatives considered:**
- Clearing on the fly (during landing) instead of after: rejected because a piece's cells land one at a time; a row may not be full until the last cell lands, so the check must run after all cells are placed.
- Awarding score per cell instead of per row: rejected because the user confirmed +10 per cleared row (a row of 10 blocks = 10 points total).

## Risks / Trade-offs

- **Longer tail before cap:** With base 0.04 and ramp every 5 blocks, reaching the 0.9 cap takes ~44 tiers instead of ~22. The snake stays strictly faster throughout because `max(1, ...)` floors at 1 tick/cell. No new collision risk — the wrap-around model is unchanged.
- **landedBlocks floor:** If multiple full rows clear in one tick, `landedBlocks` could theoretically go below zero if we subtract per-row without a floor. Mitigation: clamp to `max(0, landedBlocks − clearedRows * 10)`. In practice this only matters at the very start of the game when few blocks have landed.
- **Score inflation:** +10 per cleared row is a meaningful chunk of score; combined with cell-by-cell eating (+1 per cell), the total score will grow faster than before. Acceptable — the user confirmed the value.
