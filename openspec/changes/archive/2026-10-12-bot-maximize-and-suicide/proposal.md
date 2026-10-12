# Proposal

## Why

The snake side dominates games it should not, and the Tetris side scores too little. Three
intertwined problems share one root cause: the two sides do not each maximize their OWN score
over the minute, and the game has no rule that punishes a side that kills itself.

- The Tetris side earns only 1 point per landed cell, so its score trails the snake's eaten-cell
  count by a wide margin.
- The Tetris bot places blocks to build rows but never avoids the snake. It happily drops a block
  on a cell the snake can reach before the piece lands, so the snake eats that block and the Tetris
  side loses the very points it just scored.
- A side that kills itself (the snake hits a solid block or its own body; the Tetris stack tops out)
  currently just ends the game and the winner is read off the raw scores. The user wants a suicide
  to hand the win to the opponent outright.

The snake bot already maximizes its own score (it pursues the piece to eat cells and refuses moves
that end the game), so it needs no new behaviour. The new work is on the Tetris side and on the
win rule.

## What Changes

- **Tetris landing scoring becomes +3 per landed cell** (was +1). The +10 per cleared row and the
  +4 whole-piece snake bonus stay as they are.
- **NEW: the Tetris bot avoids being eaten.** In Snake role, the piece-placement simulation adds a
  bounded, additive penalty for landing cells the snake can reach before the piece lands, so the bot
  prefers placements the snake cannot intercept. It never overrides the primary board score
  (row completion, holes, height).
- **FIXED: the placement model no longer treats the snake as solid blocks.** The snake body and the
  head's next-step cell were part of the occupancy grid, so a row whose only gap held a snake cell
  read as already full (never clearable), holes and stack height were measured against a phantom
  stack, and the bot stacked pieces on top of filled cells instead of filling real gaps. The
  occupancy grid now holds solid blocks and the simulated piece only; the snake keeps a small
  additive penalty.
- **NEW: suicide gives the opponent an automatic win, symmetrically.** If the snake dies (touches a
  solid block or its own body), the Tetris side wins regardless of scores. If the stack tops out
  (a piece lands with no cell inside the playfield), the Snake side wins regardless of scores. The
  game records why it ended so the game-over screen can report the automatic winner.

No new capability is introduced. This change modifies two capabilities: `snaketris-game` and
`bot-opponent`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `snaketris-game`:
  - "Two scores, one per side" — the Tetris score increases by 3 for each cell that lands as a
    solid block (was 1).
  - "Winner is the higher side score" — a suicide overrides the score comparison.
  - NEW "Suicide gives the opponent an automatic win" — snake death hands the win to Tetris; a
    top-out hands the win to Snake.
- `bot-opponent`:
  - "Bot steers the falling piece by simulation" — the simulation adds a bounded snake-reachability
    penalty so the bot avoids being eaten.

## Impact

- Code: `js/pieces.js` (`landPiece` already scores +3 per cell; the top-out call now names its
  cause), `js/snake.js` (`moveSnake` names its death cause), `js/state.js` (`gameOver(reason)`
  records the cause on `game.gameOverReason`), `js/ui.js` (`statusText` reports the automatic
  winner), `js/bot.js` (`simulateScore` gains the reachability penalty; `choosePieceMove` passes the
  piece row).
- Tests: `tests/pieces.test.js` pins the old +1 landing score and must move to +3; `tests/bot.test.js`
  gains a decisive avoid-being-eaten test and keeps its existing placement pins green; `benchmark.mjs`
  applies the same symmetric suicide rule when it reports a winner.
- The snake bot's own-score behaviour (pursue the piece, refuse losing moves) is already specified
  and implemented; no requirement changes for it.
- Fairness stays pinned: the bot never lands a block on a snake cell and never steers the snake into
  danger to end the game. The reachability penalty only discourages placements the snake can eat; it
  does not create a win-seeking move.
