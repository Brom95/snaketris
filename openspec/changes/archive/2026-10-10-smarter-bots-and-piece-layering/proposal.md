# Proposal

## Why

The bot AI plays poorly: the snake bot collides too often (one-step lookahead chases a moving target and walks into a just-landed SOLID block), and the Tetris bot never rotates pieces, applies its chosen move too slowly (one action per tick), and drops blocks right where the snake is standing (the "sabotage" feel). In addition, falling Tetris pieces are rendered under the snake body, so they visually pass behind it instead of over it.

## What Changes

- **Snake bot landing-aware safety.** The snake bot now treats cells where a falling piece will land as solid, so it does not walk into a just-landed block. "Keep an exit" becomes a primary criterion, not just a tie-break.
- **Tetris bot accounts for the snake body.** The simulation's score now penalizes dropping blocks on top of the snake (so it does not drop blocks where the snake is standing). The bot applies its chosen rotation immediately instead of only after reaching the target column.
- **NEW: piece rendering z-order.** Falling Tetris pieces are rendered over the snake body, so they pass visually over it, not under it.

## Capabilities

### Modified Capabilities

- `bot-opponent`:
  - "Bot avoids moves that end the game" — refine to be landing-aware (treat cells where a falling piece will land as solid)
  - "Bot steers the falling piece by simulation" — the score accounts for the snake body (do not drop blocks on top of the snake)

### New Capabilities

- `piece-rendering`: falling pieces are rendered over the snake body (z-order)

## Impact

`js/bot.js` (chooseBotDir landing-aware, choosePieceMove occupancy + applyBotPieceMove), `js/render.js` (draw order). No changes to `js/pieces.js` shapeFits/landPiece (the falling piece still passes through the snake body; only the render layer and the bot's decisions change).
