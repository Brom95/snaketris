# Proposal

## Why

The bot loses games it should not lose, and it misses moves that are obviously good under the
current rules. The cause is not the rules: it is the bot's decision model. Today the snake bot
chases the piece's *current* cells (the piece moves before the snake arrives), its survival check
looks only one step ahead, and it can oscillate between two directions. The Tetris bot scores the
board only against the snake's *current* body cells and never denies the snake free food. The user
chose the direction "smarter, but fair": the bot must not gain win-seeking moves (no aiming at the
snake, no self-suicide), only better play inside the current fairness rules.

## What Changes

- **Snake pursuit target becomes predictive.** The snake bot aims at the cell where the falling
  piece will come to rest (or where the head can intercept it on the way down), not at the cell it
  occupies now.
- **Survival check deepens from 1 step to a depth-3 reachability check.** The bot prefers a
  direction from which the head can still reach at least 3 further steps, instead of only "one
  safe direction on the next step".
- **NEW: anti-oscillation rule.** The bot keeps its current direction unless another direction
  strictly improves its goal value. This stops the ping-pong and corner-hugging behaviour.
- **Piece-placement simulation keeps the snake out of the stack model.** A cell the snake occupies
  is not a solid block: it never fills a row, never buries a hole and never raises the stack. The
  bot penalizes such a landing cell with a small additive penalty instead, so it still fills a gap
  the snake is sitting in while it avoids feeding the snake.
- **NEW: food-denial rule (score race).** Among placements of equal board value, the bot prefers
  the one the snake can reach least before the piece lands, so the snake eats fewer cells.
- **Fairness is unchanged and stays pinned:** the bot never lands a block on a snake cell and
  never steers the snake into danger to end the game. No requirement grants the bot a win-seeking
  move.

No new capability is introduced. This change modifies one capability: `bot-opponent`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bot-opponent`:
  - "Bot pursues the falling piece" — the target changes from the nearest current cell of the
    piece to the piece's predicted landing/intercept cell.
  - "Bot prefers directions that keep an exit" — the one-step exit check becomes a depth-3
    reachability check.
  - "Bot steers the falling piece by simulation" — the simulation reads only solid blocks and the
    simulated piece cells; the snake contributes a small additive penalty, never a solid cell.
  - NEW "Bot does not oscillate" — a direction change must strictly improve the goal value.
  - NEW "Bot denies the snake free food" — equal-value placements prefer the column the snake
    reaches least.

## Impact

- Code: `js/bot.js` only. Affected symbols: `chooseBotDir`, `nearestTargetCell`, `exitCount`,
  `occupancy`/`simulateScore`, `choosePieceMove`, plus new local helpers. No change to `js/snake.js`,
  `js/pieces.js`, `js/state.js`, `js/constants.js`, `js/input.js`, or the player's controls.
- Tests: `tests/bot.test.js` pins the current behaviour (nearest-cell chase, one-step exit, current
  body cells). Those pins must be updated with the delta, or they will fail.
- Game rules, scoring, speed model, and the fairness contract stay as they are.
- Note (drift, not a decision): the pinned spec states the placement score as
  `10/full row − 2/hole − 1/stack height`, while `js/bot.js` already adds a `+3` near-complete-row
  bonus and a `−1` snake-cell penalty. The delta keeps the code's richer formula as the source of
  truth and restates it, so the spec and the code agree after this change.
