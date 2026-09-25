# Proposal

## Why
The game currently spawns up to 8 tetrominoes concurrently, and all game code lives in a single ~540-line inline `<script>` in `snaketris.html` — hard to read, hard to extend, and only verifiable end-to-end. The player wants: (1) sequential piece spawning — a new tetromino falls only after the previous one has landed (or been fully eaten); (2) a speed relationship between snake and pieces: the snake is 2 ticks-per-cell faster than the piece fall speed, pieces start slower than before, and as the ramp speeds the pieces up the snake speeds up too but is always slightly faster; (3) the code extracted out of the HTML into a `js/` directory of ES modules, with no build step.

## What Changes
- **Sequential spawn**: at most one falling piece on the board at any time. A new piece spawns only when no piece is falling (the previous piece has landed and become solid, or the snake has fully consumed it). The `MAX_PIECES = 8` cap is removed.
- **Speed model**: piece base fall speed becomes 0.08 cells/tick (was 0.12); the existing ramp (×1.08 per 2 landed blocks, cap 0.9 cells/tick) is kept. The snake's step interval becomes `max(1, 1/fallSpeed − 2)` ticks/cell, derived from the current fall-speed tier — the snake always passes a cell in strictly fewer ticks than a falling piece.
- **Module extraction**: the inline `<script>` is split into `js/*.js` ES modules (`constants.js`, `grid.js`, `state.js`, `pieces.js`, `snake.js`, `input.js`, `render.js`, `app.js`) loaded via a single `<script type="module" src="js/app.js">`. Vanilla JS only, no build step, no dependencies.
- **Convention change**: QWEN.md's "one self-contained HTML file, inline script" convention is updated to "snaketris.html + js/ ES modules".
- **Playtest fixes**: the `J` tetromino definition was disconnected and is corrected to a valid 4-cell shape (mirror of `L`); the tick now runs snake-first (snake steps, then pieces fall) and the snake consumes every falling cell that overlaps it (head or body), so a piece approached from below is eaten through its cells instead of one at a time.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `snaketris-game`: falling tetrominoes (sequential spawn), landed-block difficulty ramp (new base speed 0.08), and an added requirement tying snake speed to piece fall speed.

## Impact
- `snaketris.html`: inline `<script>` removed, replaced by a module entry point.
- New `js/` directory: `constants.js`, `grid.js`, `state.js`, `pieces.js`, `snake.js`, `input.js`, `render.js`, `app.js`.
- `openspec/specs/snaketris-game/spec.md`: delta for sequential spawn, base speed, snake speed.
- `QWEN.md`: convention update (module layout, speed model).
- Headless verification harness (currently `new Function` over the inline script) is rebuilt to import the ES modules.
