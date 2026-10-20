# Design

## Context

`smooth-motion-rendering` (archived, `js/render.js` lines 66-197) draws each mover
between the cell it left and the cell it entered. The snake is drawn per **slot**:
segment `i` lerps from the cell it held one step ago to the cell it holds now
(`js/render.js` `paintSnake`, `travelCells`). That is right on a straight and wrong at a
turn, because a turn is not a straight move:

```
snake ran right, then turned up; A is the corner cell

one step ago   head at A, body left of A
now            head above A, A is body, body further left

drawn mid-interval
  head      half a cell ABOVE A     (lerped from A)
  segment   half a cell LEFT of A   (lerped from the cell left of A)
```

Nothing is drawn at `A`, and those two drawn squares sit a **diagonal** apart — 0.7 cells,
not 1. A landed Tetris block is exactly one cell, so the turn reads as a pivot inside a
block. `travelCells` also meets this geometry: a hop whose recorded ends differ on both
axes (a turn caught across two observations) is not adjacent and not a wrapped pair, so it
hits the fallback that returns the destination cell with no travel.

Facts about the rules that the drawing must keep to, each verified:

- `moveSnake` (`js/snake.js:38`) is `unshift` + `pop`: the body one step ago is the current
  body shifted one place **back along its own path**. `js/snake.test.js` pins this.
- `rotatePiece` (`js/pieces.js:139`) is all-or-nothing: it tries the anchor then five SRS
  kicks, and when none fits it leaves the piece untouched and returns `false`. A refused
  rotation therefore produces **no observed change** — the renderer has nothing to animate
  and needs no legality knowledge.
- `turnedShape`/`turnOffset` (`js/pieces.js:118`, `js/pieces.js:~96`) turn the shape's
  offsets about the centre of the piece's `PIECE_BOX[type]` box, not about a cell. The
  drawing uses the same centre so a swept cell ends exactly where the rules put it.
- `SHIFT_TRAVEL_TICKS = 7` (`js/render.js:75`) is the only slide duration today: 24 px in
  7 ticks ≈ 205 px/s, against a piece fall of ~58 px/s and a snake crawl of ~63 px/s
  (`BASE_FALL` 0.04 cells/tick, snake interval 23 ticks, `MAX_FALL` 0.9 cells/tick at
  `js/rules.js:62`/`63`).

## Decisions

### D1 — a snake's travel follows the path its own body drew

The drawn body is a chain of squares spaced `CELL` apart, laid along the **polyline of the
snake's travel**: from the head, back through the cells it holds now, extended by the cell
its tail left. Segment `i` sits at arclength `(i + 1 − phase) × CELL` measured along that
polyline. At `phase = 1` the chain is the cells the rules hold; at `phase = 0` it is the
body one step ago, which `moveSnake` guarantees is that same polyline shifted one place
back. On straights this produces the same positions the shipped per-slot lerp produces
today; at a corner the chain bends at the corner cell instead of cutting across it, because
arclength never shortcuts.

- **Rejected: the shipped per-slot chord.** It is the defect being fixed.
- **Rejected: chain pinned to cell centres** (only the head travels; the rest sit at
  current cell centres). Honest and dead-simple, but the body stops crawling — it snaps
  segment-by-segment, which is what the player liked about the old look and does not want
  to go back to: they praised the crawl's smoothness and named only the turn as wrong.
- **Wrap travel stays as archived:** a polyline edge that crosses a wrapped edge is drawn
  as the two edge copies (`js/render.js` `travelCells`, whose wrap direction was corrected
  while implementing to the modular short-way, `(to − from + SIZE) % SIZE === 1`).
- **Growth** needs no special case: the extended polyline grows with the body, so the new
  tail square slides in along the leg rather than materialising on top of its neighbour —
  the archived change's accepted "brief overlap at the tail" goes away.

Cost: one arclength walk of ≤ body-length steps per rendered frame per snake, in a paint
pass that already loops the body. Not measurable.

### D2 — a rotation is drawn as its cells walking a quarter turn

For each cell of the shape, take its offset from the box centre (the same centre
`turnOffset` uses) and draw that offset rotated by `90° × phase`, added to the piece's
`row`/`col` as fractional cells. No angle is stored in the state or the records — only the
phase, and the rotation is derived from it per frame. A rotation the rules also kicked
moves `p.row`/`p.col`, so the same offset walk carries the kick beside the turn with no
extra case.

- **Rejected: instant swap** (today). The player asked to watch the turn: "not
  instantaneous … several frames during which it can be observed".
- **Rejected: fade/blend between the two shapes.** Cheaper and nothing sweeps, but there
  is nothing to observe; it reads as a cross-dissolve, not a turn.
- **Rejected: storing an angle in the piece.** The rules keep shapes as cell offsets and
  must not be taught about angles; the renderer derives the angle from the phase.

### D3 — a rotation's phase comes from a render-layer duration, like the shift's

A rotation is discrete: the rules apply it whole on a key press, there is no accumulator to
read a fraction from. So the phase is `(tick − rotatedTick) / ROTATION_TRAVEL_TICKS`
clamped to 1, where `ROTATION_TRAVEL_TICKS` is a named constant next to
`SHIFT_TRAVEL_TICKS` at `js/render.js:75`. Chosen **4 ticks ≈ 67 ms** — three to four
rendered frames at 60 Hz, six to eight at 120 Hz, fast enough that the turn never gets in
the way of the next input and slow enough to read as a turn rather than a snap. It is one
constant; the number is tuned in the browser, not argued here.

### D4 — the continuity matcher keeps a piece's record through a rotation

The archived matcher (`js/render.js`, records matched by `shapeKey` plus position) restarts
a record when the shape string changes, because `applyFrame` hands fresh piece objects and
identity keying fails on a guest page. A rotation changes exactly that string, so today it
drops the record: the piece would snap. The matcher is extended to accept a candidate whose
shape is a quarter turn of the record's shape within the kick envelope (the turned offsets
of the record's before-shape, compared against the candidate's cells, allowing the ≤ 2
columns and ≤ 2 rows an SRS kick can carry, nearest taken). A refused rotation changes
nothing at all, so it matches the record unchanged and draws nothing new — the honesty the
spec asks for comes from the observation, not from a legality test.

### D5 — a turn and a column slide compose instead of competing

A piece can be mid-slide and turn within that window. The record keeps both travels: the
swept offset rotated by the turn's phase, plus the column travel at its own phase. This is
the shape the existing mash test in `tests/motion.test.js` already pins for two shifts in
succession, extended with a turn.

### D6 — the shift slide gets a slower constant

`SHIFT_TRAVEL_TICKS` goes from 7 to **12 ticks** (≈ 200 ms, 2 px/tick ≈ 120 px/s). The
slide stops finishing before the hand does and still outruns the crawl, which is what a
player-paced move should. Kept a constant rather than measured from the player's own
interval: measuring would stretch the slide to mashing speed and make rapid shifts lag.
Revisiting the number is a one-constant edit.

## Risks

- **A sweep can overlap the stack inside the piece's own box** for the few frames of a
  turn: the quarter-turn path passes through cells of the piece's `PIECE_BOX` that neither
  the before nor the after shape fills, and one of those can hold a landed block. The
  overlap is bounded by the piece's box and lasts ~4 frames; clipping it away would need
  the drawing to read the board, which the archived spec forbids ("the drawing shall not
  consult the board"). Accepting it keeps that rule.
- **The first painted frame of a turn** can be cell-aligned when the shape change is first
  observed, the same warm-up the archived change accepts.
- **The chain model changes how a turn looks at high speed** — at `MAX_FALL` 0.9 cells/tick
  the snake crawl is unchanged, so this is not a new risk; the fall cap stays as archived.

## Open Questions

- The player also floated positioning — the snake and pieces sitting inside a finer grid of
  drawn cells while the rules keep the coarse one. This change does not take it: it needs
  its own decision about which side of the board is finer, and it is out of scope here.
- `ROTATION_TRAVEL_TICKS = 4` and `SHIFT_TRAVEL_TICKS = 12` are stated numbers, not tested
  ones; both are tuned by watching the live page (`scripts/verify-motion-travel.mjs` samples
  the canvas and can assert a rotation caught mid-sweep).
