# Tasks

## 1. Tetris landing scoring (+3 per landed cell)

- [x] 1.1 Record the +3-per-landed-cell rule in the `snaketris-game` spec delta ("Two scores, one
  per side"); verify the code in `js/pieces.js` `landPiece` already adds 3 per solid cell
- [x] 1.2 Update `tests/pieces.test.js` landing expectations from +1/cell to +3/cell (full landing
  4 cells → +12; partial landing 2 cells → +6); verify `node --test tests/pieces.test.js` passes

## 2. Symmetric suicide auto-win (state.js, snake.js, pieces.js, ui.js)

- [x] 2.1 Add `gameOverReason` to the `game` object in `js/state.js`, clear it in `resetGame`, and
  change `gameOver()` to `gameOver(reason)` that records the cause; verify existing no-argument
  callers still compile and behave
- [x] 2.2 Pass `'snake-death'` at both death branches in `js/snake.js` `moveSnake` (solid hit,
  self-collision); pass `'top-out'` at the top-out branch in `js/pieces.js` `landPiece`; verify the
  recorded reason matches the cause
- [x] 2.3 Make `js/ui.js` `statusText` report the automatic winner: `snake-death` → Tetris wins,
  `top-out` → Snake wins, otherwise the score comparison; verify with a unit test that a snake
  suicide reports a Tetris win even when the snake score is higher
- [x] 2.4 Apply the same symmetric rule in `benchmark.mjs` when it reports a winner (diedSide
  'snake' → Tetris, 'tetris' → Snake); verify the benchmark still runs to completion

## 3. Tetris bot avoids being eaten (bot.js)

- [x] 3.1 Change `simulateScore(cells)` to `simulateScore(cells, row)` and pass the piece row from
  `choosePieceMove`; add a bounded snake-reachability penalty (landing cells the snake can reach
  before the piece lands cost 1 each, ≤ 4, additive, never overriding the board score); verify the
  existing placement tests stay green
- [x] 3.2 Add a decisive `tests/bot.test.js` test: two equal-value placements where the centre
  column is snake-reachable and a clean column is not; assert the bot avoids the reachable column
  (fails without the penalty, passes with it); verify `node --test tests/bot.test.js` passes

## 4. Integration and quality

- [x] 4.1 Run `npm test` and confirm only the intended checks changed; leave the pre-existing
  engine-order test untouched
- [ ] 4.2 Run `npm run verify` (all harness scripts) and confirm every exit code is 0
- [ ] 4.3 Run ripwire `quality_delta` against the pinned baseline before declaring done

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied
  (`openspec archive <change> --yes`).
