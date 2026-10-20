# Proposal

## Why

Every mover advances one whole 24 px cell in a single instant and stays still until
its next crossing: the snake steps every 23 ticks (~383 ms), a falling piece descends
one cell every 25 ticks (~417 ms at tier 0), and a requested shift snaps every
~23 ticks. The game reads as a snap-and-freeze rather than as movement, and the
freeze is longer than most players' reaction to it.

The page already separates simulation from painting — update() runs per tick and
paintCanvas runs once per rendered frame (js/app.js:173) — and the canvas cell
primitive already multiplies whatever coordinates it is handed (engine/js/canvas.js
drawCell), so smooth travel is a property of the painting, not of the rules. The
falling piece already carries a fractional row in state; only the drawing floors it.

## What Changes

- **Travel rendering:** movers are drawn between the cell they left and the cell
  they entered, on a phase that runs across the whole interval, instead of snapping
  at the crossing.
- **Piece fall** uses the fractional row the state already carries; the drawn piece
  is capped so it never shows a cell below the one its rules occupy.
- **Snake step** interpolates between the cell the segment left and the cell it
  entered, with the previous cell tracked in the render layer.
- **Piece shift** travels the same way as the snake step (it is an integer cell hop
  with no phase in state).
- **Wrap travel** draws the two edge copies of a wrapped hop instead of sliding a
  cell across the whole field.
- **Travel freezes** when the game stops the mover — a death, a blocked step, a
  paused or menu state — instead of oscillating.
- **Unchanged and explicit:** the rules, the state the rules read, the fall-speed
  ramp, the netplay frame format, the engine's documented surface, the 24 px grid
  the player is shown, and the canvas buffer size. Rotations, line-clear stack
  drops and eaten piece cells are not animated in this change.

No gameplay behaviour changes; no new dependency; no new file.

## Capabilities

### New Capabilities

- `motion-rendering`: how the canvas draws movers travelling between the cells the
  rules allow — the travel itself, the honesty of a drawn position against the rules,
  the phase source that works the same on a page that simulates and on a page that
  receives whole frames, wrap travel, and freezing when a mover stops.

### Modified Capabilities

- `piece-rendering`: gains a requirement that a falling piece is drawn travelling
  between its cells and is never drawn inside the cell below the one it occupies, so
  the smooth drawing cannot imply a piece that has already landed.

## Impact

- **Code:** `js/render.js` (the paint pass gains the travel model: previous cells per
  mover, phase, the fractional draw path, wrap copies) and `js/pieces.js` `paintPieces`
  / `pieceCells` (draw at the fractional row instead of flooring it). `js/app.js` may
  hand the render layer the frame's timestamp it already reads at js/app.js:165.
- **Untouched by design:** `js/rules.js`, `js/snake.js`, `js/pieces.js` rules
  (`stepPiece`, `movePiece`, `shapeFits`, `findPieceAt`, `landPiece`, `clearFullRows`),
  `js/grid.js`, `js/netframe.js`, and everything under `engine/`. The engine's
  documented clock surface and cell primitive stay as they are.
- **Tests:** `tests/render.test.js` counts paint calls and their parameters
  (strokeRect count, the inset x = 1, lineWidth values) rather than coordinates, so
  fractional draw coordinates are within its contract; new tests cover the travel.
  `npm test` and the browser harness (`scripts/verify-views.mjs`,
  `scripts/verify-hud.mjs`) must stay green.
- **Player-visible only:** nothing a player can act on changes; a still frame after
  the same number of ticks shows the same cells.
