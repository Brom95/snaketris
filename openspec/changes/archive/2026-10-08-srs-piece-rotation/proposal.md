# Proposal

## Why

`rotatePiece` in `js/pieces.js` pivots a piece on the corner of its own bounding box: it rotates the offsets, normalises them so the minimum row and column are 0, and moves the anchor by the same amount. The lowest occupied cell then moves up in 6 of the 14 non-trivial rotations, and the O piece shifts one cell sideways instead of staying in place. The player reads that jump as the fall stopping or reversing.

Measured deltas for one rotation (anchor row 5.37, anchor column 3):

```
piece  CW (lowest row, left col)   CCW (lowest row, left col)
I      +0  0                       -3  0
O      +0  -1                      -1  -1
T      +1  -1                      -1  0
S      +1  -1                      -1  0
Z      +1  -1                      -1  0
L      -1  -2                      -2  0
J      0   -3                      -3  -1
```

The engine itself does not pause the fall: the fall accumulator and the fall speed are untouched by a rotation. The defect is purely geometric.

## What Changes

- **BREAKING (mechanics):** piece rotation uses the Super Rotation System (SRS): four named rotation states per tetromino, and the standard SRS wall-kick tables.
- `js/constants.js`: `TETROMINOES` becomes one entry per piece, each entry holding four states. Add `SRS_KICKS`.
- `js/pieces.js`: `rotatePiece(p, cw)` tries the five kick offsets of the transition in SRS order and applies the first that fits. Add `setPieceState(p, state)`.
- `js/pieces.js` `spawnPiece`: store the piece type and its state on the piece object.
- `js/bot.js`: remove the local `rotatedShape` helper and use the state table; the bot reaches its target state through `setPieceState`.
- The help view in `snaketris.html` states that a blocked rotation is moved by a wall kick before it is rejected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `snaketris-game`: rotation uses SRS states and wall kicks; a rotation never interrupts the fall.

## Impact

- `js/constants.js`, `js/pieces.js`, `js/bot.js`.
- Tests: `tests/pieces.test.js`, `tests/bot.test.js`, `tests/constants.test.js`.
- `snaketris.html`: one help line.
- No change to the grid, the fall model, the shift throttle, or the scoring.
