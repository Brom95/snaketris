# Proposal

## Why

The game starts too fast and ramps difficulty too aggressively: pieces fall at 0.08 cells/tick (12.5 ticks/cell) and the snake is correspondingly quick, while the difficulty ramp ticks up every 2 landed blocks — a short tail that quickly caps out. The player wants a slower start and a gentler ramp. In addition, landed Tetris pieces currently just accumulate as obstacles with no clearing mechanic; the player wants classic line-clearing: when a row fills completely it clears and awards points.

## What Changes

- **Base fall speed 0.08 → 0.04 cells/tick.** Pieces now take 25 ticks/cell; the snake (derived) takes 23 ticks/cell at base. Both slower start.
- **Ramp threshold 2 → 5 landed blocks.** The ×1.08 step now ticks up every 5 landed blocks instead of 2 (cap 0.9 unchanged).
- **Snake step-interval scenarios updated** for the new base (formula `max(1, 1/fallSpeed − 2)` is unchanged; only the numeric scenarios move).
- **NEW: line clear.** When a row is full (all COLS cells SOLID), that row clears and the snake gets +10 score. The ramp counter (`landedBlocks`) is reduced by 10 per cleared row so clearing does not keep accelerating the game forever. Every full row in the same tick clears independently (+10 each).

## Capabilities

### Modified Capabilities

- `snaketris-game`:
  - "Landed-block difficulty ramp" — base 0.08 → 0.04, threshold 2 → 5 landed blocks
  - "Snake speed tied to piece fall speed" — scenario numbers updated for the new base
  - NEW requirement: line clear (full row → clear +10 score, −10 landedBlocks)

## Impact

`js/constants.js` (BASE_FALL), `js/pieces.js` (currentFallSpeed tier divisor, landPiece clear hook), and spec scenarios. No render/input/state changes — snake speed is derived from fallSpeed.
