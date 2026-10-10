# Proposal

## Why

The difficulty ramp is keyed to landed *blocks* (cells), so a single 4-cell piece that lands nudges the speed tier by less than one full step at base. The snake cap of 8 segments makes the rarity-tier colours finish early and leaves the gold tier mostly unreachable in a normal game. Line clears erase a row without shifting anything above it, which breaks the standard Tetris expectation that blocks drop after a clear. All three feel disconnected from the actual events a player experiences: pieces landing or being eaten, and lines clearing.

## What Changes

- **Snake length cap** increases from 8 to **10 segments**. Overflow-block colour tiers still apply past the cap.
- **New counter**: `completedPieces` — increments when a piece either lands on the grid OR is fully consumed by the snake. A partially eaten piece that later lands counts once (on landing), not twice.
- **Difficulty ramp trigger** changes from "every 5 landed blocks" to **"every 3 completed pieces"** (landed or fully eaten). The ×1.08 per-tier factor and the 0.9 cap stay.
- **Line clear gravity**: when a full row of SOLID cells is cleared, every solid block above that row shifts down by one cell. Snake segments are not shifted.
- **Speed rollback removed**: clearing a line no longer subtracts from `landedBlocks`. The +10 line-clear score stays.

## Capabilities

### Modified Capabilities

- `snaketris-game`: the snake length cap, the difficulty ramp trigger, and the line-clear behaviour all change within this capability.

## Impact

`js/constants.js` (MAX_SNAKE_LEN, new counter default), `js/state.js` (new `completedPieces` field + reset), `js/pieces.js` (`currentFallSpeed` divisor, `clearFullRows` gravity + removed rollback), `js/snake.js` (cap check at 10), spec scenarios in `openspec/specs/snaketris-game/`.
