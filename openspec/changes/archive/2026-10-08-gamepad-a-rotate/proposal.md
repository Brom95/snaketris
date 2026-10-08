# Proposal

## Why

`BUTTON_A` is declared in `js/devices.js` and never used while a game is in progress. In Tetris role the only gamepad rotation is the D-pad up/down edge. The player asked for A to rotate the piece.

`pollController` returns one intent per frame, and `pieceSteerIntent` tests the sideways shift before the rotation. A held D-pad direction therefore swallows an A press in the same frame.

## What Changes

- In Tetris role, the A button (standard gamepad button 0) rotates the falling piece one quarter turn clockwise.
- The A edge is checked before the held shift in `pieceSteerIntent`, so a rotation is not lost while a direction is held.
- In Snake role, the A button has no effect while a game is in progress.
- The help view lists A as the Tetris-role rotation button.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `controller`: the Tetris-role piece control gains the A rotation; the A button is documented as unused while the player controls the snake.

## Impact

- `js/devices.js`: one line in `pieceSteerIntent`.
- `snaketris.html`: one help line.
- Tests: `tests/devices.test.js`, `tests/constants.test.js`.
- No change to `handleIntent`, the shift throttle, or the one-intent-per-frame contract.
