# Design

## Context

See proposal.md for motivation.

Current state that shapes the approach:

- The engine runs ordered systems: `createEngine([snakeSystem, piecesSystem])`. Each system has an `update(ctx)` and the tick order is snake-first.
- Steering has one entry point: `setDirection(d)` in `js/input.js`, which applies the `PLAYING` gate and the no-reverse rule. `AGENTS.md` requires the in-game steering branch to stay byte-for-byte stable.
- `js/grid.js` stores only `EMPTY` and `SOLID`. The snake body and the falling piece live in separate lists, so a landed piece cannot crush the snake head.
- `game.score` is a single number read by `state.js`, `ui.js`, `pieces.js`, `snake.js` and the tests.
- `stepPiece` tests the **next** position but `landPiece` writes the **current** one. A piece therefore rests one cell above the obstacle it hits. Once the stack reaches row 0, a piece lands entirely above the grid, writes nothing, and the game continues silently.
- `handleIntent` uses a hardcoded `(game.menuSelect + 2) % 3` for menu navigation.
- `resetSnake()` builds a four-segment snake.

## Goals / Non-Goals

**Goals:**
- One steering path for both a human and a bot.
- Deterministic bot behaviour that unit tests can assert without a browser.
- The role choice swaps which side the player controls without duplicating game mechanics.
- Both sides move the piece under the same throttle, so the duel is fair.
- A real end condition for the case where the stack reaches the top.

**Non-Goals:**
- Bot difficulty levels or tunable personalities.
- Drop, soft-drop, or hold controls for the piece.
- A kill mechanic where the player crushes the bot deliberately. Death emerges from placement.
- Multiple bots, or a bot that controls both sides at once.

## Decisions

### D1. The bot is one engine system with two policies
`js/bot.js` exports `chooseBotDir()` and `choosePieceMove()` (both pure) and one `botSystem`. The engine becomes `createEngine([botSystem, snakeSystem, piecesSystem])`.

`botSystem.update` branches on `game.role`: in Tetris role it calls `chooseBotDir()` and feeds the result to `setDirection()`; in Snake role it calls `choosePieceMove()` and applies the returned shift and rotation.

Why not call `moveSnake()` directly from the bot: that would duplicate the no-reverse rule, the wrap-around, and the death checks. Routing through `setDirection()` keeps one steering path, which is what the `controller` spec already guarantees for keyboard, touch, and gamepad.

Alternative considered: a `botDir` field read by `snakeSystem`. Rejected — it bypasses the no-reverse rule and splits steering into two paths.

### D2. `chooseBotDir()` is pure and deterministic
It reads `game.snake`, `game.dir`, `game.pieces`, and the grid, and returns a direction. No RNG, no state mutation.

Direction order is fixed: up, right, down, left. Ties break by that order. This makes the bot reproducible in tests.

Safety filter, in order:
1. reject the exact reverse of `game.dir`
2. reject a target cell that is `SOLID`
3. reject a target cell that is in `game.snake`, except the last segment (the tail vacates when the snake does not grow)

If no direction survives the filter, return `game.dir`. The bot then dies on the next step. That is the intended "trapped" outcome.

Target selection: the nearest cell of the falling piece that lies inside the grid, under torus distance `min(|dr|, ROWS-|dr|) + min(|dc|, COLS-|dc|)`. A piece above the grid has no in-grid cell, so the bot has no target and keeps its direction.

Chase range is unlimited: the bot reacts to any in-grid piece.

Tie-break after the goal: prefer a direction that leaves at least one safe direction on the next step. If none does, take any safe direction.

Alternative considered: a two-step lookahead search. Rejected — it adds state and no spec requirement asks for it. The one-step exit check is enough to avoid dead ends.

### D3. Role is a game field, chosen before `startGame()`
`game.role` is `'snake'` or `'tetris'`. `startGame()` is called only after the role is set. `resetGame()` restores the default role.

The role does not change mid-game. This keeps every role-dependent branch a simple read of one field.

### D4. Scores are per side, not per player
`game.score` becomes `game.snakeScore`, and `game.tetrisScore` is added.

Attribution:
- `eatPieceAt` → `snakeScore += 1`
- whole-piece consumption → `snakeScore += PIECE_BONUS` (4)
- `landPiece` → `tetrisScore += number of cells written`
- `clearFullRows` → `tetrisScore += 10`

The player's score is the score of the side they chose. The winner is the higher side score. This is a breaking change for Snake role: line clears no longer score for the player.

Alternative considered: one `score` field plus a role sign. Rejected — the game-over screen and the two record boards both need the two numbers separately.

### D5. Lateral throttle uses an accumulator, not a queue
```
game.pieceMoveAcc += 1        // every tick
on shift request:
  if (game.pieceMoveAcc >= snakeTicksPerCell()) { movePiece(dc); game.pieceMoveAcc = 0; }
```
A request inside the window is dropped. The same gate applies to the bot's shift.

Alternative considered: queue the requests so they execute later. Rejected — it adds hidden state and makes the "one cell per press" contract ambiguous.

Alternative considered: continuous movement while the key is held. Rejected because the user chose a per-press cooldown, and because the existing intent model is discrete.

The throttle reads `snakeTicksPerCell()`, so the difficulty ramp speeds up the player and the bot together. This is deliberate: the asymmetry stays vertical (snake 23 ticks/cell vs piece 25 ticks/cell) and lateral speed stays equal.

Rotation is not throttled, for the player and the bot alike.

### D6. Rotation normalises the bounding box, then checks
```
CW:   (dr, dc) -> ( dc, -dr)
CCW:  (dr, dc) -> (-dc,  dr)
then shift all offsets so min(dr) = 0 and min(dc) = 0
reject if any cell is out of bounds or overlaps SOLID
```
Every shape in `TETROMINOES` already has `min(dr) = 0`, so normalising `dr` never moves the piece down. Only `J` has `min(dc) = 1`, so normalising `dc` can move a piece left by one cell. The bounds check covers it.

Alternative considered: rotate about the piece centroid. Rejected — it needs rounding rules and does not fit the offset-array shape representation.

### D7. Top-out is detected in `landPiece`
`landPiece` counts the cells it writes. If the count is 0, it calls `gameOver()`.

This is the observable form of "the stack reached the top": because `stepPiece` lands the piece one cell short of the obstacle, a piece whose lowest cell is at row −1 has no cell inside the grid.

This also fixes a latent Snake-role stall: today such a piece writes nothing and the game keeps spawning pieces that do nothing.

### D8. Records keep one storage key and one board
`snaketris.highscores` entries become `{score, date, role}`. Entries without `role` are read as `'snake'`. The records view stays a single top-10 board sorted by score; each entry carries its role marker (🐍 for Snake, 🏗️ for Tetris). The same markers appear on the role sub-menu items.

Alternative considered: two boards, one per role. Rejected — it splits a ten-slot board into two five-slot boards and hides cross-role comparison.

### D8b. A piece landing on the snake body stays as it is
`landPiece` writes `SOLID` in every in-grid cell of the piece, including cells the snake body occupies. The snake does not die, and its body segments sit inside solid cells. This is kept unchanged: the snake's body is not an obstacle for the piece.

Consequence for the bot: `choosePieceMove()` simulates landings against `SOLID` only. It does not treat the snake body as an obstacle.

### D9. `SELECT_ROLE` is a new state
`MENU → SELECT_ROLE → PLAYING`. `SELECT_ROLE` renders the menu view with a second item list. The main menu keeps exactly three items, so the `start-menu` requirement "exactly three selectable items" stays true.

`handleIntent`'s hardcoded `% 3` becomes `% MENU_ITEMS.length`, and a `SELECT_ROLE` branch is added with its own item count.

### D10. The piece bot uses a one-ply greedy simulation
`choosePieceMove()` evaluates every legal rotation in every column:

```
for each rotation r in 0..3:
  for each column c in 0..COLS-1:
    if the rotated shape fits:
      drop it to the landing row
      score = 10 * rows that become full
            - 2 * empty cells below the piece in the affected columns
            - 1 * resulting maximum stack height
```

It picks the highest score. Ties break by rotation index, then by column. It then issues one action toward that target: shift one cell toward the target column, or rotate if the piece is already in the target column but not in the target rotation.

Cost: 40 drop simulations per decision, at most once per throttle interval (every 23 ticks at base speed). Negligible.

Alternative considered: "fill the emptiest row". Rejected — it ignores holes and produces stacks the player can trivially outplay.

### D11. The snake starts with three segments
`resetSnake()` currently builds four segments. It becomes three, in a straight line on the middle row. A shorter start gives the bot a fairer opening in Snake role and reduces the chance of an immediate self-collision on a 10-wide board.

## Balance reference

```
one piece              = 4 cells
fully eaten piece      = 4 + 4 bonus = 8 points
one landed piece       = 4 points
one cleared row        = 10 points
```

Snake role: the player scores by eating (8 per piece), the bot scores by landing (4 per piece) and clearing rows (10 per row).
Tetris role: the sides are swapped.

The bot needs roughly two landed pieces to match one fully eaten piece, and one cleared row to overtake. The closing rate over a full fall is about 2 cells, so the bot catches only pieces that come near it.

## Risks / Trade-offs

- [The bot eats a piece, so `landedBlocks` does not grow, so the speed ramp stalls] → This is a property of the balance, not a bug. It is stated in the spec so it is not mistaken for a defect. Difficulty tiers, if needed later, address it.
- [A deterministic bot is easy to exploit] → Accepted for this change. The safety-first filter prevents trivial self-kill; exploitation of the pursuit rule is a tuning problem for a later change.
- [The greedy piece bot is stronger than a beginner player] → Snake role becomes harder than it is today. The help view states that the bot plays the pieces. Balance is measured in task 9.3.
- [The bot dies almost immediately at high ramp] → The safety filter checks solids and its own body before pursuing, and the exit tie-break avoids dead ends. Tests cover a board with a wall and a trapped bot.
- [Top-out ends Snake-role games that previously ran on] → This is a fix, not a regression. It changes the end condition, so it is written as a spec requirement.
- [Two scores widen the HUD on narrow viewports] → The readout already follows the existing interface-band rules; only its text changes.
- [Rotation silently fails] → The piece is left unchanged. The help view states that a blocked rotation is ignored.
- [A piece can land on the snake body and make cells solid under it] → Accepted. The snake is not blocked by its own body for the piece, and no kill is granted. The state is visible on the board and is not a crash.

## Migration Plan

1. Rename `game.score` to `game.snakeScore` in `state.js`, `ui.js`, `pieces.js`, `snake.js`, `highscores.js` and the tests.
2. Add `game.role`, `game.tetrisScore`, `game.pieceMoveAcc`.
3. Add `SELECT_ROLE` to the state enum and the menu markup.
4. Add `js/bot.js` and register `botSystem` before `snakeSystem`.
5. Shorten the starting snake to three segments in `resetSnake()`.
6. Run the existing test suite, then add `tests/bot.test.js`.
7. No data migration is required: old high-score entries are read as Snake role.

## Open Questions

None. Both questions raised during exploration are resolved:
- The piece bot does not consider the snake's position when choosing a landing column (D8b).
- The records view keeps one shared board with a role marker on each entry (D8).
