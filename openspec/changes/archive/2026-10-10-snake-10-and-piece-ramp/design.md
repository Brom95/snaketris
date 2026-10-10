# Design

## Context

The current difficulty ramp keys off `landedBlocks` (cells of landed pieces). The snake cap is a single constant. Line clears erase a row without shifting anything above it and subtract 10 from the block count. All four concerns live in two files: `js/pieces.js` (ramp + line clear) and `js/constants.js` (cap + tier width), with state in `js/state.js`.

## Goals / Non-Goals

**Goals:**
- Raise the snake cap to 10 and let the derived `TIER_WIDTH` follow.
- Introduce a `completedPieces` counter so the ramp keys off pieces, not cells.
- Add gravity on line clear: solid blocks above a cleared row shift down by one.
- Remove the speed rollback that clearing a line currently applies.

**Non-Goals:**
- Changing the 1.08 per-tier factor or the 0.9 cap.
- Changing the +10 line-clear score (stays).
- Shifting snake segments on line clear (they do not move).

## Decisions

### `completedPieces` counter

A new field `game.completedPieces: 0` in `state.js`, reset to 0 in `resetGame()`. Two increment points, mutually exclusive per piece lifecycle:

1. **Landed** — in `landPiece` (pieces.js): after the piece snaps to the grid as SOLID, increment by 1.
2. **Fully eaten** — in `eatPieceAt` (snake.js): when `p.shape.length === 0`, increment by 1.

A partially-eaten piece that later lands counts once (on landing), not twice. No other code path creates or removes a piece outside these two sites.

### Ramp formula

`currentFallSpeed()` changes from:
```js
Math.floor(game.landedBlocks / 5)
```
to:
```js
Math.floor(game.completedPieces / 3)
```
The ×1.08 factor and the `MAX_FALL` cap are unchanged. The function still reads `game.completedPieces` directly; no new module is introduced.

### Line clear with gravity

`clearFullRows()` is rewritten:

1. Scan rows bottom-up (highest row index first) so that when multiple rows clear, lower clears don't shift blocks into already-cleared rows.
2. For each full SOLID row: mark it for clearing.
3. After all full rows are identified, apply the clear: set every cell in a cleared row to EMPTY.
4. For each cleared row, scan above it (rows 0..row-1) and shift every SOLID cell down by one (in place, no wrap). Snake segments are not touched.
5. Award `LINE_CLEAR_POINTS` per cleared row.
6. The `landedBlocks -= 10` rollback line is removed entirely.

Multiple full rows in the same tick: scan bottom-up so that a clear at row N shifts blocks down into row N+1, and a subsequent clear at row M < N does not re-shift already-moved blocks (they are now SOLID again and would be shifted a second time). In practice this means: process from highest row index first, and after shifting, the shifted cells are no longer in their original row so a second scan of lower rows won't double-count them.

Actually — simpler: since we only shift SOLID cells (never EMPTY), and the cleared rows become EMPTY, a second clear at a lower row will correctly shift the now-EMPTY cells too... wait, no. We only shift SOLID cells. After row N clears to EMPTY and blocks above it shift down by one, those shifted blocks are still SOLID. If row M < N also clears, we shift blocks above row M down — which includes the blocks that just shifted from row N's clear. They get a second shift. That is correct: two rows cleared means everything above both of them drops by two total, not one.

So the algorithm is: for each cleared row (in any order), shift SOLID cells above it down by one. The order doesn't matter because we're shifting SOLID cells only, and after a shift those cells are still SOLID at their new position. A second clear at a lower row will correctly shift them again.

### Snake cap constant

`MAX_SNAKE_LEN` in `constants.js` changes from 8 to 10. `TIER_WIDTH = MAX_SNAKE_LEN - 1` follows automatically (7→9). No other code references the old value directly; all cap checks go through the constant.

## Risks / Trade-offs

- **Double-shift on multiple row clears** → Mitigation: the shift is "SOLID cells above this row move down by one" — after the first clear, the shifted blocks are still SOLID at their new position, so a second clear at a lower row shifts them again. This is the correct behaviour (two rows cleared = everything above both drops by two).
- **`completedPieces` vs `landedBlocks`** → Both counters remain in state; `landedBlocks` is still used for Tetris scoring (+1 per landed cell). The new counter is purely for the ramp. No migration needed — they coexist.
