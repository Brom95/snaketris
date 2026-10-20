# Proposal

## Why

The travel that `smooth-motion-rendering` shipped made a snake bend read wrong. Every
segment is drawn along a straight line from the cell it held one step ago to the cell it
holds now — including at a bend. Worked out in cells: a snake that ran right and then
turned up has, at mid-interval, its head half a cell **above** the corner cell and the
segment behind it half a cell **left** of that corner cell, so the drawn body has no cell
at the corner at all and its two neighbours sit a diagonal (0.7 cells) apart instead of one
cell. The bend therefore happens half a cell short of the pivot, and since a landed Tetris
block is exactly one cell, the snake reads as pivoting **inside a block** rather than at the
corner the rules pivot at. The same chord is why a hop whose recorded ends differ on both
axes falls back to no travel at all (`travelCells` in `js/render.js` steps both axes
independently for a diagonal pair).

Two related reads are abrupt for other reasons:

- **A rotation is instant**, by the archived spec's own requirement
  "Events with no interval stay instant". The hand's turn therefore reads as a swap of
  which cells are filled, with nothing to watch.
- **A requested shift slides at ~205 px/s** (`SHIFT_TRAVEL_TICKS = 7` at
  `js/render.js:75`, i.e. 24 px in 7 ticks) against a piece fall of ~58 px/s and a snake
  crawl of ~63 px/s. The mechanism is right; the constant is small, so the slide finishes
  long before the hand does.

## What Changes

- **A snake's travel follows its own path:** a segment slides along the legs of the
  travel the body actually drew — the leg it is on, around the corner, down the next leg —
  never along a chord across it. On straight runs nothing changes; at a bend the drawn
  body keeps a cell at the corner and keeps its one-cell spacing.
- **A rotation becomes travel:** the piece's cells are drawn walking around the pivot the
  rotation turns about, over a fixed few frames named in the render layer, so a turn can
  be watched rather than caught.
- **The shift slide is retuned** to a slower constant so it stops outrunning the hand.
- **Unchanged and explicit:** the rules, the state the rules read, the fall-speed ramp,
  the 14 fields of the frame the peers exchange, the engine's surface, the coarse grid the
  player is shown and the canvas buffer size. An eaten piece cell and a line-clear stack
  drop stay instant.

No gameplay behaviour changes; no new dependency; no new file.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `motion-rendering`: "Movers travel between their cells" now covers a rotation as well as a
  fall, a step and a shift. "A drawn position never implies a position the rules forbid" gains
  the honesty a bend and a sweep keep — a turn is drawn where the rules turn, on the path the
  body drew, and a rotation sweeps only inside the box its two shapes share. The requirement
  that kept interval-less changes instant is replaced by one that no longer counts a rotation:
  an eaten piece cell and a line-clear drop stay instant, a rotation does not. Two requirements
  are added — that replacement, and a rotation drawn walking around the pivot the rules turn
  about, which has to read the same on a page that only receives whole states of the match.

## Impact

- **Code:** `js/render.js` only — the travel model (`travelCells` and the snake painter)
  gains a path-following step and a rotation phase, and the continuity matcher has to keep
  a piece's record through a shape change, which today restarts it. The piece painter in
  `js/pieces.js` stays as the archived change left it.
- **Untouched by design:** the rules (`moveSnake`, `stepPiece`, `movePiece`,
  `rotatePiece`, `shapeFits`, `findPieceAt`, `landPiece`, `clearFullRows`),
  `js/grid.js`, `js/netframe.js`, `js/app.js`, and everything under `engine/`.
- **Tests:** `tests/motion.test.js` carries the travel assertions today (26 cases); the
  new cases go there — a bend that keeps the corner cell, a rotation caught mid-turn on a
  page that ran the ticks and on a page replaying whole frames, a refused rotation, the
  retuned slide. `tests/render.test.js` counts paint calls rather than coordinates, so it
  stays green; a rotation now paints the same number of cells as before, but at new
  coordinates. `scripts/verify-motion-travel.mjs` samples the live page and gains the two
  reads this change is about.
- **Player-visible only:** nothing a player can act on changes; a still frame after the
  same number of ticks shows the same cells.
