# Tasks

## 1. Cap constant, tier colours, overflow counter

- [x] 1.1 Add `MAX_SNAKE_LEN = 8` and the snake palette entries `snakeBody` `#9ca3af`, `tierBlue` `#2563eb`, `tierPurple` `#8b5cf6`, `tierGold` `#facc15` to `js/constants.js`, and verify a new assertion in `tests/constants.test.js` reads each value back
- [x] 1.2 Add `overflow: 0` to the `game` object in `js/state.js` and reset it in `resetGame()`, and verify `tests/state.test.js` asserts `game.overflow === 0` after `resetGame()` and after `startGame()`

## 2. Growth cap in both snake paths

- [x] 2.1 In `js/snake.js` `moveSnake()`, compute `grew = ate && game.snake.length < MAX_SNAKE_LEN`, use `grew` (not `ate`) for the tail-excluded collision slice, and increment `game.overflow` when `ate && !grew`, and verify a new `tests/snake.test.js` case that pre-fills the snake to 8 segments, eats one cell, and asserts the length stays 8 while `overflow` becomes 1
- [x] 2.2 In `js/snake.js` `consumePieceAtHead()`, push the tail copy only while `game.snake.length < MAX_SNAKE_LEN`, otherwise increment `game.overflow`, and verify a `tests/snake.test.js` case that drops a piece onto an 8-segment head and asserts length 8 plus `overflow` 1
- [x] 2.3 Rewrite the growth assertions in `tests/snake.test.js` and the score-vs-length invariant in `tests/app.test.js` to the capped form `eaten = (min(length, MAX_SNAKE_LEN) - 3) + overflow`, and verify `npm test` exits 0

## 3. Tier colour in the renderer

- [x] 3.1 Export `bodyColor(index)` from `js/render.js` implementing the derived tier from `game.overflow` (head green, grey until `overflow >= index`, then blue, purple, gold with `Math.min(2, ...)`), and verify a table-driven unit test over `overflow = 0..22` asserting the seven body colours at every step
- [x] 3.2 Replace the `i === 0 ? COLORS.snakeHead : COLORS.snake` branch in the snake paint loop with `bodyColor(i)`, and verify `scripts/verify-field-only.mjs` still reports painted cells equal to background + solid + falling + `game.snake.length`

## 4. Bot body reasoning at the cap

- [x] 4.1 Update the stale comment on `bodyCells()` in `js/bot.js` to say the tail is excluded because it vacates on the next step, and verify a unit test that an 8-segment snake gives `bodyCells()` segments 0..6, so the bot treats the tail cell as free

## 5. Help text and harness allow-list

- [x] 5.1 Add a Rules line to `snaketris.html` stating that the snake stops at 8 segments and that further eaten cells recolour the body blue, then purple, then gold, and verify `scripts/verify-views.mjs` passes and finds the new line
- [x] 5.2 Add `COLORS.snakeBody`, `COLORS.tierBlue`, `COLORS.tierPurple` and `COLORS.tierGold` to `FIELD_COLORS` in `scripts/verify-field-only.mjs`, and verify that script reports only allow-listed field colours are painted
- [x] 5.3 Update the score-vs-length invariant in `scripts/verify-role-duel.mjs` to the capped form, and verify `node scripts/verify-role-duel.mjs` exits 0

## 6. Integration check

- [x] 6.1 Run `npm test` and `npm run verify` and verify every harness exit code printed by `scripts/verify-all.mjs` is 0

## Workflow follow-up

- Sync the `snaketris-game` main spec with the delta after the implementation is reviewed.
- Archive the change once the review requirements are satisfied.
