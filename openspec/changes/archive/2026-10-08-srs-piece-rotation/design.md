# Design

## Rotation states

Each tetromino gets four states. The offsets are relative to the top-left corner of the piece's bounding box: a 3×3 box for T, S, Z, L, J, a 4×4 box for I, and a 2×2 box for O. State 0 is the spawn state, and it is the shape the current `TETROMINOES` table already uses.

```js
export const TETROMINOES = {
  I: [
    [[1,0],[1,1],[1,2],[1,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,1],[1,1],[2,1],[3,1]],
  ],
  O: [
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0],[1,1]],
  ],
  T: [
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[1,2],[2,1]],
    [[0,1],[1,0],[1,1],[2,1]],
  ],
  // S, Z, L, J follow the same four-state pattern.
};
```

The piece object gains `type` (the key above) and `state` (0..3). `shape` stays a copy of the current state's offsets, because `consumePieceAtHead` splices a falling piece's shape in place and the shared table must stay intact.

## Wall kicks

`SRS_KICKS` is keyed by the transition `fromState + '->' + toState`. Each entry is five `(dc, dr)` pairs in SRS order. The published tables use `(x, y)` with y pointing up, so the grid offset is `(dc, dr) = (x, -y)`.

```js
export const SRS_KICKS = {
  '0->1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1->0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1->2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2->1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3->2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3->0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  'I:0->1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  // the remaining I transitions follow the same conversion
};
```

`rotatePiece(p, cw)` computes the target state, picks the I table for the I piece and the JLSTZ table otherwise, and tries each offset with `shapeFits`. The first offset that fits is applied. If none fits, the piece is unchanged and the function returns `false`.

`setPieceState(p, state)` moves a piece to a named state by walking the shortest single-step path (0→2 uses 0→1 then 1→2). Each step uses the kick table. If a step is blocked, the function stops and returns `false`, leaving the piece at the state it reached.

## Why SRS does not promise "the piece never moves up"

SRS fixes the anchor to the centre of the bounding box, so a rotation no longer drags the piece sideways or lifts it by two rows. It does not guarantee that the lowest occupied row stays put: T from state 3 to state 0 raises the lowest cell by one row. The spec therefore promises SRS states, kicks, an O no-op, and an uninterrupted fall, not "the piece never moves up".

A rotation can never place a cell below `ROWS` or inside a solid block, because `shapeFits` rejects both. A rotation therefore cannot cause an instant landing.

## Bot

`choosePieceMove` scans the four states of the piece's own type instead of re-deriving rotated offsets. `applyBotPieceMove` calls `setPieceState(p, target.state)` when the piece is already in the target column. The local `rotatedShape` helper is deleted.

## Verification

- Unit tests in `tests/pieces.test.js`: the O rotation is a no-op; four clockwise rotations return to state 0; a rotation blocked by a wall succeeds through a kick; a rotation with every kick blocked leaves the piece unchanged.
- Unit tests in `tests/bot.test.js`: the bot's target state is a state index, not a rotation count.
- `scripts/verify-role-duel.mjs`: after a rotation, the piece's row increases on the next tick at the same speed as before the rotation.
