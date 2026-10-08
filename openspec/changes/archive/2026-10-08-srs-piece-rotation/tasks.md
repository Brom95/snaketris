# Tasks

## 1. Rotation table

- [x] 1.1 In `js/constants.js`, replace the flat `TETROMINOES` array with one entry per piece holding four states in SRS order. Keep state 0 equal to the current spawn shape.
  Verify: `TETROMINOES.I.length === 4` and `TETROMINOES.O[0]` equals `TETROMINOES.O[3]`.
- [x] 1.2 Add `SRS_KICKS` to `js/constants.js`: the eight JLSTZ transitions and the eight I transitions, each as five `(dc, dr)` pairs in SRS order.
  Verify: every key `0->1`, `1->0`, `1->2`, `2->1`, `2->3`, `3->2`, `3->0`, `0->3` has five entries.

## 2. Rotation code

- [x] 2.1 In `js/pieces.js` `spawnPiece`, store `type` and `state` on the new piece and copy the state-0 offsets into `shape`.
  Verify: a spawned piece has `state === 0` and a `shape` that is a copy, not a reference to the table.
- [x] 2.2 Rewrite `rotatePiece(p, cw)` in `js/pieces.js`: compute the target state, select the I table for the I piece and the JLSTZ table otherwise, try the five kick offsets in order, and apply the first that `shapeFits`.
  Verify: a rotation blocked at offset 0 succeeds at a later offset when one fits.
- [x] 2.3 Add `setPieceState(p, state)` in `js/pieces.js` that walks single-step transitions and uses the kick table.
  Verify: `setPieceState(p, 2)` from state 0 reaches state 2 in open space.
- [x] 2.4 In `js/bot.js`, delete `rotatedShape`, use `TETROMINOES[p.type][state]` in `choosePieceMove`, and call `setPieceState` in `applyBotPieceMove`.
  Verify: `node --test "tests/**/*.test.js"` passes with the bot tests updated.

## 3. Tests and help text

- [x] 3.1 Update `tests/pieces.test.js`: the O rotation is a no-op; four clockwise rotations return to state 0; a wall-blocked rotation succeeds through a kick; a fully blocked rotation leaves the piece unchanged.
- [x] 3.2 Update `tests/bot.test.js` rotation expectations to state indices.
- [x] 3.3 Update the help line in `snaketris.html` and the matching assertion in `tests/constants.test.js` to say that a blocked rotation is moved by a wall kick before it is rejected.
- [x] 3.4 Run `node --test "tests/**/*.test.js"` and `node scripts/verify-role-duel.mjs`.
  Verify: both exit 0.
