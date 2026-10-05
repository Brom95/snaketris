# Tasks

## 1. Speed model changes

- [x] 1.1 Change `BASE_FALL` from 0.08 to 0.04 in `js/constants.js`; verify `currentFallSpeed()` returns 0.04 at 0 landed blocks (25 ticks/cell)
- [x] 1.2 Change the ramp divisor from `/2` to `/5` in `currentFallSpeed()` in `js/pieces.js`; verify `currentFallSpeed()` returns `min(0.9, 0.04 * Math.pow(1.08, floor(n/5)))` for n landed blocks

## 2. Line clear mechanic

- [x] 2.1 Add a `clearFullRows()` function in `js/pieces.js` that scans every row: if all COLS cells are SOLID, set them to EMPTY, add 10 to score per cleared row, subtract 10 from `landedBlocks` per cleared row (clamp to ≥0); verify the function clears a full row and updates score + landedBlocks
- [x] 2.2 Call `clearFullRows()` from `landPiece(p)` after the grid mutation; verify that a piece landing completes the row only when the last cell is placed

## 3. Verification

- [x] 3.1 Update `.qwen/tmp/snaketris-es-test.mjs` for new speed values (BASE_FALL 0.04, snake 23 ticks/cell at base) and line clear checks; verify all checks pass
- [x] 3.2 Run the headless Node harness and confirm all checks pass; if any check fails, fix before proceeding
