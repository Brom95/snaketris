# Tasks

## 1. Snake bot landing-aware safety (js/bot.js)

- [ ] 1.1 In `chooseBotDir`, treat cells where a falling piece will come to rest as solid in the safety check (so the snake does not step into a cell that is empty now but will be SOLID after the piece lands), and verify with a test that the bot avoids a landing cell when a safe direction exists
- [ ] 1.2 Make "keep an exit" a primary criterion (a safe direction that leaves at least one exit on the next step) instead of only a tie-break, and verify with a test that the bot prefers a direction that keeps an exit

## 2. Tetris bot: snake-body score + immediate rotation (js/bot.js)

- [ ] 2.1 In `choosePieceMove`, include cells occupied by the snake body in the simulation's occupancy grid, so a landed block on a snake cell is penalized as if it were a solid overlap, and verify with a test that the bot does not drop a block on the snake when an alternative option exists
- [ ] 2.2 In `applyBotPieceMove`, apply the chosen rotation immediately (not only after reaching the target column) so the bot rotates pieces when the chosen rotation improves the score, and verify with a test that the bot rotates a piece that needs both a shift and a rotation

## 3. Render z-order (js/render.js)

- [ ] 3.1 In `render()`, draw falling pieces AFTER the snake (so they appear on top of the snake body), keeping SOLID blocks and the grid drawn before both, and verify by reading the draw order in `js/render.js` that pieces are drawn after the snake

## 4. Verify

- [ ] 4.1 Run `npm test` and confirm all unit checks pass, including the new landing-aware + snake-body-score + rotation tests
- [ ] 4.2 Run `npm run verify` and confirm every harness script exits 0
