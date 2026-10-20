# Design

## Context

The simulation and the painting are already separate: `js/app.js` runs 0..N `update()`
calls per frame and paints once (`engine-architecture` "Presentation runs once per
rendered frame"). The chop is not the frame rate, it is that each mover's position is
its cell, drawn at the cell boundary and held there until the next crossing:

| mover | rules | state carries | drawn today |
| --- | --- | --- | --- |
| piece fall | `stepPiece` (js/pieces.js:175) adds `currentFallSpeed()` to `p.row` un-floored | fractional `p.row` | `pieceCells` (js/pieces.js:21) floors it |
| snake step | `moveSnake` (js/snake.js:38) `unshift`/`pop` of `{r,c}` | integers only | `paintSnake` (js/render.js:86) draws those integers |
| piece shift | `movePiece` (js/pieces.js:93) `p.col += dc` | integer `p.col` | integer `p.col` |

Constraints found while reading, all verified:

- `drawCell(r, c)` (engine/js/canvas.js:6) computes `c * cell + 1`, so it already
  accepts fractional coordinates; the flooring lives in the game layer, not the engine.
- The frame that carries state to the other peer (`encodeFrame`, js/netframe.js:22)
  ships exactly 14 fields — `tick` first, `snake` cells, `pieces` (with fractional `row`),
  `cells` last. It does **not** ship `snakeAcc`, `pieceMoveAcc` or `completedPieces`.
- `game.play.snakeAcc` and `game.play.pieceMoveAcc` are therefore invisible to a page
  that only receives frames, and on such a page `snakeTicksPerCell()` reads that page's
  own `completedPieces` (0 after a reset) — a renderer that phases by those numbers
  animates at the wrong rate on the guest, silently.
- The clock's accumulator is private to `createClock` (engine/js/clock.js); exposing its
  residual would change `engine/js/clock.js`, `engine/docs/api.md` and the engine suite.
- `moveSnake` moves by `unshift({r,c})` then `pop()`, so every segment object shifts one
  index down the array on each step.
- Both axes wrap (`js/snake.js:44`), so a wrapped hop is not adjacent.
- On a killing step `moveSnake` returns before `unshift` (js/snake.js:46-59), so the
  mover's cells stop on their own.

## Goals / Non-Goals

**Goals:**
- One travel mechanism, applied where a mover has an interval to cross: piece fall,
  snake step, piece shift.
- A drawn position that never implies a cell the mover does not occupy on either side of
  its travel, with no bounce or overlap when the mover stops.
- Identical travel on a page that simulates and on a page that only receives frames.
- The rules, the state the rules read, the frame format, the engine's documented surface,
  the shown grid and the canvas buffer all unchanged.

**Non-Goals:**
- No animation for events that have no interval: rotation (and its SRS kicks), an eaten
  piece cell (`p.shape.splice`), a line-clear stack drop (`clearFullRows`, js/pieces.js:195).
- No new timing source, no engine change, no wire-format change.
- No re-cutting of the board: the grid array and the grid lines stay 20×10 at 24 px.
- No change to any mover's speed, ramp or landing test.

## Decisions

### D1 — Travel lives in the paint pass

The paint layer (`js/render.js`) computes drawn positions; the rules keep their cell
positions and are never told about them. `pieceCells` keeps its role as *the cells the
rules read for drawing* and gains a drawn-position sibling used only by `paintPieces`.

**Alternative considered:** fractional positions in state (`p.row` already has one, so
extend it to the snake). Rejected: every rule on the snake reads `s.r`/`s.c` as a cell
(self-collision js/snake.js:54, eating, `bodyColor` index, `eatPieceAt`), `stepPiece`
and `shapeFits` test `Math.floor(row + dr)`, and `encodeFrame` would ship a different
board. That is the finer-grid change the user rejected, arriving under another name.

### D2 — One mechanism: lerp from the cell the mover left to the cell it holds

For each mover, per rendered frame:

```
phase ∈ [0,1]  from the mover's own interval (see D4)
drawn  = lerp(prevCell, curCell, phase), clamped at 1
```

Both endpoints are cells the mover actually occupied, one after the other. So the drawn
rect always spans the gap between two legal cells and can never poke into a third:

- a piece never shows the row below its rule cell (see D3 for the arithmetic),
- a snake head never enters a wall or a block, because the wall cell is never an endpoint,
- a killing or blocked step needs no special case: the mover's own cells stop changing,
  `phase` clamps at 1 and the art sits at the cell the rules hold,
- a paused or menu state freezes the same way.

**Alternative considered:** draw at the raw state position (see D4) or predict the next
cell (`body[i] → body[i-1]`, head + `nextDir`). Prediction is tight but draws the head
*into* a wall on the death interval and needs a legality read to stop it; the lag
scheme needs neither. It lags at most one interval, which is what makes it safe.

### D3 — Why not simply draw the piece at `p.row`

`Math.floor(p.row) ≤ p.row`, so a piece drawn at its raw fractional row occupies
`[floor(p.row)+frac, floor(p.row)+frac+1)` — it sticks `frac` of a block into the row
*below* its rule cell. Approaching a stack, `stepPiece` refuses the crossing so `p.row`
stays at (for example) 5.96 for the whole interval while the rule cell is 5: the piece
would be drawn ~96 % inside the landed block below it, and it would do that for the
whole ~417 ms of the final approach, not for one frame. The painter order
(field → snake → pieces) draws it over the block, so it is visible. The lerp of D2
draws `[ruleRow-1+frac, ruleRow+frac)` instead — always inside the two rows the piece
actually moved through — at the price of lagging the rule cell by at most one row.

### D4 — Phase source per mover

| mover | phase | source | why |
| --- | --- | --- | --- |
| piece fall | `frac(p.row)` | state, ships in `pieces` | the rules already keep the fraction; free of charge |
| snake step | `(tick - movedTick) / intervalTicks` | `game.play.tick` (frame field 1) and an interval measured as the tick delta between two observed steps | needs no rule read, no wall clock, no engine surface; self-corrects when the tier changes the interval |
| piece shift | `(tick - movedTick) / SHIFT_TRAVEL_TICKS` | same tick counter; a render-layer constant (~7 ticks ≈ 117 ms) | shifts are player-paced, so a measured interval would stretch the slide to the mashing rate; a fixed travel answers the hand and holds |

`tick` is the only motion-related number the guest receives, which is exactly why
the phase is built from tick deltas rather than from `snakeAcc`/`pieceMoveAcc`
(see the Context list: those, and `completedPieces`, are not in the 14 fields).
At the frame a record is first created there is no interval to divide by, so `phase` is
0 and that frame draws the cells the rules hold; the next observed step measures the
interval from that record's own tick and crawls from there.

**Alternative considered:** ship the accumulators in the frame. `applyFrame`
(js/netframe.js:48) rejects a payload of length ≠ 14, so both peers would change
together; it is a format change to the wire that buys nothing over the tick route.

### D5 — From-cell mapping for the snake body

Because `moveSnake` does `unshift` then `pop`, the segment at index `i` after a step is
the object that was at index `i-1` before it, so the cell its **own slot** held at the
previous step is the cell one behind the cell it now holds:

```
from[i] = prevCells[i]      to = cells[i]      (stay put when prevCells has no slot i)
```

Each cell then crawls one cell per interval, so the drawn squares stay exactly one cell
apart through a hop and the frame at the crossing seats at the new cells with no jump.

The mapping first written in this draft — `from[i] = prevCells[max(i - 1, 0)]`, which
seats segment `i` at the cell the segment ahead of it left — was rejected while
implementing: that cell is the one segment `i` already holds, so only the head travels,
and for most of the interval the head is drawn on top of the segment behind it (two
squares in one cell). The per-slot mapping is what `tests/motion.test.js` now asserts
("the snake crawls one cell per interval instead of jumping it": head, body and spacing
checked at a mid-interval frame and at the crossing).

`prevCells` is a copy of the cells taken at the observed step, not every tick: at most
~2.6 copies per second of an array bounded by `MAX_SNAKE_LEN`. A snake that just grew has
no slot for its new tail index, and that index stays put at the cell it holds — the
segment ahead of it crawls through that cell for one interval, and inventing a cell beyond
the tail would draw where nothing is.

### D6 — Wrapped hops draw both edges

A hop whose `from` and `to` are not adjacent (Δ ≠ ±1 on the wrapped axis) is drawn as two
cells: one leaving at `from + phase` toward the edge it left, one entering at
`to - (1 - phase)` from the opposite edge. Each is fully drawn at a fractional row/column,
so the canvas clip cuts the part outside the buffer and the two reads as one cell crossing
an edge. No grid lookup, no per-axis table.

**Corrected while implementing:** a wrapped hop is one cell of travel, so its direction is
read modularly - `(to - from + SIZE) % SIZE === 1` means the step went up/left and `-1`
down/right - not from the sign of the raw difference. `|Δ| = SIZE - 1` is ambiguous: a
column-9 piece of state one hop right of column 0 carries Δ = -9 whether it stepped right
across the seam or left nine columns, and only the first is a hop. The raw-sign reading put
the two copies on the wrong pair of edges, which the honesty sweep caught as a drawn cell
the mover does not occupy on either side of its travel.

### D7 — Travel is computed in pixels, handed over as whole pixels

`drawCell` multiplies by `CELL`, so the render layer computes the drawn position in
pixels, rounds once there, and passes `px / CELL`. That keeps the `+1` inset and the
`cell - 2` size exact-integer (crisp edges, the art style unchanged) while the position
still moves in ~1 px steps. With a 23-tick interval a snake step is 24 px / 23 ticks ≈
1 px per tick, i.e. continuous at 60 paints/s.

**Alternative considered:** pass fractional cells straight to `drawCell` and accept
anti-aliased edges. Kept as a fallback if pixel snapping ever reads as judder; it is
one line either way.

### D8 — Records live in the render layer, matched by what the page saw

A module-level record in `js/render.js` per mover kind, holding `prevCells`, `movedTick`,
measured `intervalTicks`, and the markers used to notice that a piece's cells changed for a
reason that is not a shift (a rotation, an eaten cell) in which case the record restarts.

**Corrected while implementing:** mover *identity* cannot be the key. A guest page assigns
fresh containers on every frame it applies (`applyFrame` assigns rather than mutates, so a
frame it never received leaves the page untouched), so the snake array and every piece
object are new objects each frame and a Map keyed on them never matches: the guest painted
cell-aligned jumps while the host travelled, which the guest check caught. The scheme that
works on both pages is continuity: the snake is one mover so the page keeps one record and
keys nothing, and a falling piece is matched to the record whose cells it stood nearest to
a frame ago - same shape read as text, within the one column a shift and the fraction of a
fall a frame can carry - with the nearest match taken so two pieces of one type cannot
trade records. A frame rebuilds the map it hands the painters, which is sound because the
page observes its movers once a frame before any painter reads.

**Alternative considered:** a `prevCells` field on `game.play`. Rejected: the rules never
read it, it would have to be kept in step at every place the rules rewrite the snake or a
piece, and it would beg to be added to `encodeFrame`.

### D9 — The shown grid stays the coarse grid

`drawGrid` (js/render.js) keeps stroking at `c * CELL` / `r * CELL`. Only movers move
finely. This is the user's "show the user the old grid" clause, and it costs nothing:
the grid lines were never the thing that made motion choppy.

## Risks / Trade-offs

- [A crawling snake reads slower than a hopping one] → the crawl is exactly the rules'
  rate (24 px per 383 ms ≈ 63 px/s); if it reads as sluggish, `SHIFT_TRAVEL_TICKS`-style
  capping of the snake's travel to a shorter duration is a one-constant change that trades
  the pause back in. Do not fix it by moving the snake faster.
- [First hop of a mover draws cell-aligned] → the interval is unknown until observed twice.
  Bounded, self-correcting, and only at the start of a game or after an interval change.
- [Guest travel resolution] → bounded by frame arrival rather than by paint rate; `tick`
  arrives one field per frame today (60/s), so the glide matches the host in practice.
  Verify with a browser check (`scripts/verify-network-local.mjs`) rather than assume.
- [High fall speed] → at `MAX_FALL = 0.9` (js/rules.js:63) a piece descends ~54 cells/s, so
  the one-row lag is ~18 ms and the lag can only grow with speed, never tunnel a cell.
- [A piece entering from above] → settled while implementing: the *drawn* row is skipped
  only when the whole square is above the buffer, so a straddling cell paints its visible
  part. The canvas buffer is exactly the field (`BOARD_W` x `BOARD_H`, js/config.js), so
  the buffer's own clip cuts it and no page margin can be painted over; no extra clip code.
- [A snake that just grew] → the new tail index has no previous slot, so it stays put and
  the segment ahead of it crawls through it for one interval: two same-colour squares sit
  closer than one cell apart for part of that interval. Accepted: it needs the cell the
  tail now holds, never a cell outside the snake's travel, and growth happens only on an
  eaten piece.
- [`tests/render.test.js` counts paint calls and their parameters] → the existing non-wrap
  table must keep its counts; a wrapped hop legitimately changes them, so the new motion
  tests are separate cases, not edits to the old ones.
- [Two records per mover per frame] → one array copy per observed move and a handful of
  subtractions per frame; `paintCanvas` already loops the whole grid every frame.

## Open Questions

Both were carried as open while the change was planned; both are now settled here, and neither changed the design.

- **How long the crawl reads at the fastest tiers** — settled: the snake crawls the whole interval, with no separate cap. A cap would be a second arrival route to the same cell, the thing the pixel-snap decision keeps out of the model. At the worst measured speed (MAX_FALL = 0.9 cells per tick) the one-row lag is about 18 ms and it never tunnels a cell; at the speeds a player can actually track the crawl is what reads smoothly. If a tier ever reads wrong, the fix is one constant, not a redesign.
- **Whether `SHIFT_TRAVEL_TICKS` = 7 matches how fast a player shifts** — settled at 7 (~117 ms), and it stayed a single constant rather than measured. Measuring the player's own interval instead would stretch the slide to their mashing speed, which reads laggy. A mash of two shifts lands inside a third of a key repeat at a normal tap rate, so the slide covers the shift without waiting for the next one.