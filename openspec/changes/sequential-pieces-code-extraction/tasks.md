# Tasks

## 1. Scaffold modules

- [ ] 1.1 Create `js/constants.js` (grid dimensions, `CELL`, palette, tetrominoes, `TICK`, `SPAWN_INTERVAL`, `BASE_FALL = 0.08`, `MAX_FALL = 0.9`, `SNAKE_SPEED_DELTA = 2`, `MIN_SNAKE_TICKS = 1`) and `js/grid.js` (`initGrid`, `getCell`, `setCell`), and verify `node --check js/*.js` passes for both
- [ ] 1.2 Create `js/state.js` (state enum, `snake`/`pieces`/`score`/`landedBlocks`/`dir`/`nextDir`, `resetGame`/`startGame`/`restart`/`gameOver`), and verify `node --check` passes and a headless import confirms `resetGame` yields a 4-segment snake, score 0, state IDLE

## 2. Sequential spawn and speed model

- [ ] 2.1 Create `js/pieces.js` with `currentFallSpeed()` (base 0.08, ×1.08 per 2 landed blocks, cap 0.9), `pieceTicksPerCell()` = 1/fallSpeed, and `pieceCells`/`findPieceAt`/`stepPiece`/`landPiece`, and verify `node --check` passes and a headless check confirms tier values (0.08 → 0.0864 → … → 0.9 cap)
- [ ] 2.2 Add the sequential gate: `spawnPiece()` returns early when `pieces.length !== 0`, and `update()` spawns only when `spawnAcc >= SPAWN_INTERVAL` and no piece is falling; remove the `MAX_PIECES` constant, and verify with a headless check that a second piece never spawns while the first is still falling, and that a fully consumed piece is followed by a new spawn
- [ ] 2.3 Create `js/snake.js` with `snakeTicksPerCell()` = `max(1, pieceTicksPerCell() − 2)` and use it in the snake accumulator (`snakeAcc += 1; if (snakeAcc >= snakeTicksPerCell()) { snakeAcc -= snakeTicksPerCell(); moveSnake(); }`), and verify with a headless check that the snake step interval is 10.5 ticks/cell at base speed, 1 tick/cell at the cap, and always strictly less than the piece's step interval

## 3. Remaining modules

- [ ] 3.1 Move snake movement (`moveSnake`: wrap, eating +1/cell, classic growth, self-collision and solid-contact death) into `js/snake.js`, and verify with headless checks for eating, growth, both death conditions, and the vacated-tail edge case
- [ ] 3.2 Move keyboard and pointer input (`keyToDir`, `setDirection`, `onKey`, pointerdown/move/up/cancel handlers, `fitCanvas`) into `js/input.js`, and verify with headless checks that the no-reverse rule, second-pointer ignore, pointercancel, and pointerup restart all behave as before
- [ ] 3.3 Move rendering (`drawGrid`, `drawCell`, `drawText`, `drawOverlay`, `render`) into `js/render.js`, and verify `node --check` passes and a headless import confirms `render()` does not throw against a stubbed canvas context

## 4. App wiring and HTML switch

- [ ] 4.1 Create `js/app.js` (`update` with sequential spawn gating, `frame` rAF loop, init: `resetGame` + `fitCanvas` + resize listener), importing all modules, and verify with a headless dynamic `import()` that the full game loads and runs 1000 ticks without throwing
- [ ] 4.2 Remove the inline `<script>` from `snaketris.html` and add `<script type="module" src="js/app.js">`, and verify the page loads the game (idle screen, tap/arrow start, steering, score) in a browser

## 5. Verification and deploy

- [ ] 5.1 Rebuild the Node headless harness for ES modules (stub `globalThis.document`/canvas, dynamic `import()` of `js/` modules) and re-run the full suite: steering, no-reverse, eating +1/cell, difficulty ramp, snake speed relationship, wrap-around, both death types, restart, sequential spawn, mobile fit, and keyboard on desktop — all checks pass
- [ ] 5.2 Update QWEN.md conventions (js/ ES-module layout instead of inline script; speed model: piece base 0.08 cells/tick, snake = piece − 2 ticks/cell, clamp ≥ 1), and verify the docs match the code
- [ ] 5.3 Push to main, confirm the GitHub Pages workflow goes green, and verify the site at https://Brom95.github.io/snaketris plays with sequential pieces, a slower piece start, and the snake moving faster than the pieces, on both mobile viewport and desktop keyboard
