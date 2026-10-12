# Design

## Scoring: +3 per landed Tetris cell

`js/pieces.js` `landPiece` already adds 3 to `game.tetrisScore` for every cell it writes as SOLID.
The spec currently states +1 per landed cell; the delta restates it as +3 so the spec matches the
code. The +10 per cleared row (`clearFullRows`) and the +4 whole-piece snake bonus stay unchanged.
`tests/pieces.test.js` pins the old value and must move to the new one.

## Win rule: symmetric suicide auto-win

The game must know WHY it ended. Today `gameOver()` takes no cause. Plan:
- `js/state.js`: add `gameOverReason: null` to the `game` object; `resetGame` clears it;
  `gameOver(reason)` sets `game.gameOverReason = reason`.
- `js/snake.js` `moveSnake`: pass `'snake-death'` at both death branches (solid hit, self-collision).
- `js/pieces.js` `landPiece`: pass `'top-out'` at the top-out branch.
- `js/ui.js` `statusText`: when `game.gameOverReason === 'snake-death'` the winner is Tetris
  regardless of scores; when `'top-out'` the winner is Snake regardless of scores; otherwise the
  score comparison. `statusText` is only shown in single-player GAME_OVER, so the two-player path is
  untouched.
- `benchmark.mjs`: apply the same rule when it reports a winner (diedSide 'snake' → Tetris wins;
  'tetris' → Snake wins).

Existing callers that invoke `gameOver()` with no argument (tests, harness) keep working because the
new `reason` parameter is optional; `gameOverReason` stays null and the score comparison applies.

## Bot: avoid being eaten (bounded, additive)

`js/bot.js` `simulateScore(cells)` becomes `simulateScore(cells, row)`; `choosePieceMove` passes the
piece's current `row`. The penalty:
- head = `game.snake[0]`; when there is no head the penalty is 0 (empty-snake tests unaffected).
- The snake travels `reach = (fallTicks / snakeInterval)` cells before the piece lands, where
  `fallTicks = (landRow - floor(row)) / currentFallSpeed()` and `landRow` is the deepest landing cell.
- For each landing cell, torus distance from the head ≤ reach adds 1 to the penalty (bounded by the
  piece's cell count, ≤ 4).
- The penalty is subtracted from the board score, additive and small, so it never overrides a row
  completion (+10) or the near-complete-row bonus (+3). It only breaks ties and near-ties, which is
  exactly "among equal placements prefer the one the snake cannot eat".
