# Tasks

## 1. Device mapping

- [x] 1.1 In `js/devices.js` `pieceSteerIntent`, return `{ action: 'pieceRotate', cw: true }` for `s.aEdge` before the held-shift block.
  Verify: an A press with no direction held returns a clockwise rotation intent.

## 2. Help text

- [x] 2.1 In `snaketris.html`, add "A — rotate clockwise" to the Tetris-role help line.
  Verify: the help view lists A as a rotation control.

## 3. Tests

- [x] 3.1 In `tests/devices.test.js`, add cases: A alone rotates clockwise; A with a held D-pad direction returns the rotation in that frame and the shift in the next; A in Snake role returns no intent.
- [x] 3.2 Update the help-string assertion in `tests/constants.test.js`.
- [x] 3.3 Run `node --test "tests/**/*.test.js"` and `node scripts/verify-role-duel.mjs`.
  Verify: both exit 0.
