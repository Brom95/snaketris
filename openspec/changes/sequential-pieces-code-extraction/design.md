# Design

## Context
Current state (see proposal.md for motivation): all game code is one inline `<script>` in `snaketris.html`; up to 8 pieces fall concurrently (`MAX_PIECES = 8`); the snake steps on a fixed `SNAKE_STEP = 8` ticks; piece base fall speed is 0.12 cells/tick with a ×1.08 per-2-blocks ramp capped at 0.9. The loop is a fixed-timestep `update()` (TICK = 1/60) decoupled from `render()` via `requestAnimationFrame`. Vanilla JS, no build step, no dependencies.

## Goals / Non-Goals

**Goals:**
- Sequential spawning: at most one falling piece at a time; spawn only when no piece is falling.
- Speed model: piece base 0.08 cells/tick; snake step interval `max(1, 1/fallSpeed − 2)` ticks/cell, derived from the current tier; snake always strictly faster than the piece.
- Extract all game code into `js/*.js` ES modules with a single entry point; keep vanilla JS, no build step, "open the HTML directly" workflow intact.
- Preserve every existing mechanic (wrap, eating, growth, both death conditions, keyboard + pointer input, mobile canvas fit) and keep the headless verification suite green.

**Non-Goals:**
- No bundler, no test framework in the repo (headless Node harness stays in `.qwen/tmp/`).
- No rendering/visual changes, no new game mechanics beyond the two requested ones, no persistence or sound.

## Decisions

**D1. Module layout and dependency graph.**
- `js/constants.js` — grid dimensions, palette, tetrominoes, timing constants (`BASE_FALL = 0.08`, `MAX_FALL = 0.9`, `SNAKE_SPEED_DELTA = 2`, `MIN_SNAKE_TICKS = 1`, `TICK`, `SNAKE_STEP` removed, `SPAWN_INTERVAL`, `CELL`).
- `js/grid.js` — `initGrid`, `getCell`, `setCell` (owns the grid array).
- `js/state.js` — state enum, mutable state (`snake`, `pieces`, `score`, `landedBlocks`, `dir`, `nextDir`), `resetGame`/`startGame`/`restart`/`gameOver`.
- `js/pieces.js` — `currentFallSpeed()`, `pieceTicksPerCell()`, `spawnPiece` (sequential-gated), `stepPiece`, `landPiece`, `pieceCells`, `findPieceAt`.
- `js/snake.js` — `snakeTicksPerCell()`, `moveSnake`.
- `js/input.js` — `keyToDir`, `setDirection`, `onKey`, pointer handlers, `fitCanvas`.
- `js/render.js` — `drawGrid`, `drawCell`, `drawText`, `drawOverlay`, `render`.
- `js/app.js` — `update` (loop body), `frame` (rAF), init, module wiring.

Rationale: one-way imports only (`app` → everything; `snake`/`pieces` → `state` + `grid`; `input` → `state` + `constants`; `render` → `constants` + DOM). No cycles.
Alternative considered: classic `<script>` files sharing a global namespace — rejected (global pollution, brittle ordering, weaker isolation for the headless harness).

**D2. Speed model.**
`fallSpeed(tier) = min(MAX_FALL, BASE_FALL × 1.08^tier)`, `tier = floor(landedBlocks / 2)`. `pieceTicksPerCell() = 1 / fallSpeed`. `snakeTicksPerCell() = max(MIN_SNAKE_TICKS, pieceTicksPerCell() − SNAKE_SPEED_DELTA)`. The existing `snakeAcc` accumulator advances by 1 per tick and triggers `moveSnake()` when it reaches the (possibly fractional) interval. Rationale: the accumulator already exists in the loop; a variable interval is a one-line change, and fractional intervals (10.5 ticks/cell at base) work naturally.
Alternative considered: fixed `SNAKE_STEP` — cannot express "2 ticks/cell faster at every speed".

**D3. Sequential spawn.**
`spawnPiece()` returns early when `pieces.length !== 0`; the `update()` loop spawns only when `spawnAcc >= SPAWN_INTERVAL` **and** the board has no falling piece, then resets `spawnAcc`. `MAX_PIECES` removed — the gate guarantees ≤ 1. Rationale: matches "a new piece falls only after the old one has landed (or been eaten)" and prevents stall when a piece is fully consumed.
Alternative considered: spawn only after a piece lands, never after full consumption — rejected (would stall the game whenever the snake eats a piece before it lands).

**D4. Module entry.**
`<script type="module" src="js/app.js">` — a single module tag. Module scripts are deferred and execute after DOM parsing, so `document.getElementById('game')` at module-evaluation time in `render.js`/`input.js` is safe. No bundler.
Alternative considered: classic scripts in order with globals — rejected (see D1).

**D5. State ownership.**
`state.js` owns all mutable game state; `snake.js` and `pieces.js` import it and mutate via exported accessors. No module imports `state.js` in reverse, so there are no cycles.

## Risks / Trade-offs
- [ES modules from `file://` are unsupported in some older browsers] → primary target is the GitHub Pages site (HTTPS); for local dev, `python -m http.server` works. Verified during the apply phase.
- [Clamp at high speeds: when `1/fallSpeed − 2 < 1`, the gap between piece and snake intervals is less than 2 ticks/cell] → documented in the spec; the snake remains strictly faster at all speeds, which is the core requirement.
- [Headless harness must be rebuilt for ES modules] → the test script will stub `globalThis.document`/`canvas` and use dynamic `import()` of the `js/` modules; the full 92-check suite is re-run in task 5.1.
- [A single module-import failure breaks the whole game] → module set is minimal (8 files), the graph is one-directional, and task 4.2 verifies the page loads and plays in a browser before the push.

## Migration Plan
1. Scaffold `constants.js`/`grid.js`/`state.js`; verify with `node --check` and isolated headless imports.
2. Add `pieces.js` with the speed model and sequential gate; add `snake.js` with the derived step interval.
3. Add `input.js` and `render.js`.
4. Add `app.js` (loop + wiring); switch `snaketris.html` from the inline script to the module tag; verify in a browser.
5. Rebuild the headless harness against the modules; re-run the full verification suite.
6. Update QWEN.md conventions; push to main; verify the Pages deploy and the live site.
Rollback: revert the commit — the previous inline-script version remains in git history.

## Open Questions
- None. (Speed unit settled: 2 ticks/cell; base speed 0.08 cells/tick; spawn when no piece is falling; ES modules.)
