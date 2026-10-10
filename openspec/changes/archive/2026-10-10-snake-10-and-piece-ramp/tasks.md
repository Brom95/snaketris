# Tasks

## 1. State and constants

- [ ] 1.1 Add `completedPieces: 0` to the game object in `js/state.js` and reset it to 0 in `resetGame()`. Verify by running `node --test "tests/**/*.test.js"` — no test fails from the new field being absent at load time.
- [ ] 1.2 Change `MAX_SNAKE_LEN` from 8 to 10 in `js/constants.js`; `TIER_WIDTH` follows automatically. Run `node --test "tests/**/*.test.js"` and confirm the snake cap test passes with the new value (the existing cap tests reference 8 and must be updated to 10 as part of this task).

## 2. Ramp formula

- [ ] 2.1 In `js/pieces.js`, change `currentFallSpeed()` from `Math.floor(game.landedBlocks / 5)` to `Math.floor(game.completedPieces / 3)`. Run `node --test "tests/**/*.test.js"` and confirm the ramp test passes with the new divisor and counter.
- [ ] 2.2 In `js/pieces.js` `landPiece`, add `game.completedPieces += 1` after the piece snaps to the grid. In `js/snake.js` `eatPieceAt`, add `game.completedPieces += 1` when `p.shape.length === 0`. Run `node --test "tests/**/*.test.js"` and confirm the completed-piece counter increments in both paths (landed and fully eaten) and not for partial eats.

## 3. Line clear with gravity

- [ ] 3.1 Rewrite `clearFullRows()` in `js/pieces.js`: scan bottom-up for full SOLID rows, clear them to EMPTY, shift every SOLID cell above each cleared row down by one (snake segments untouched), award `LINE_CLEAR_POINTS` per cleared row. Remove the `landedBlocks -= 10` rollback line. Run `node --test "tests/**/*.test.js"` and confirm: (a) solid blocks above a cleared row drop by one, (b) snake segments do not move, (c) no landed-block count change on clear, (d) +10 score per cleared row still awarded.
- [ ] 3.2 Add a test case covering two full rows clearing in the same tick: verify solid blocks above both rows drop by two total (one per clear), snake segments stay put, and each row awards +10. Run `node --test "tests/**/*.test.js"` and confirm the new test passes.

## 4. Full suite green

- [ ] 4.1 Run `npm test` (full node test suite). All existing tests pass with the updated constants and ramp; no regression from the gravity rewrite or cap change.
- [ ] 4.2 Run `npm run verify` (all eight harness scripts). Every script exits 0.
