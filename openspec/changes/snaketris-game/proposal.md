# Proposal

## Why

We want a single-page HTML game called **snaketris** — a Snake/Tetris hybrid where the player pilots a snake that eats falling Tetris pieces before they land; once a piece touches the bottom or stacks on others it stops being edible and becomes an obstacle. The opportunity is a tight, self-contained browser game with a clear risk/reward loop: eat to clear space and score, neglect turns pieces into hazards.

## What Changes

- Add a single-page HTML5 canvas game that runs in the browser with no external dependencies.
- Snake: classic growth (each eaten cell adds a segment), wrap-around at screen edges (no walls), self-collision is fatal.
- Pieces: classic 7 Tetris shapes spawn at the top and fall downward; while falling they are edible, once landed they become solid obstacles.
- Eating: cell-by-cell, +1 score per cell consumed.
- Ramp: every 2 landed blocks, fall speed ticks up (neglect accelerates the game).
- Score: running total; game over offers restart.

## Capabilities

### New Capabilities
- `snaketris-game`: The single-page HTML Snake/Tetris hybrid — snake movement with classic growth and wrap-around, falling Tetris pieces that are edible while falling and solid once landed, cell-by-cell eating with scoring, the landed-block difficulty ramp, and restart after game over. Each becomes `specs/snaketris-game/spec.md`.

### Modified Capabilities
<!-- none — greenfield project -->

## Impact

- New self-contained single-page HTML file; no backend, no external dependencies.
- Greenfield: no existing code, APIs, or specs affected.
