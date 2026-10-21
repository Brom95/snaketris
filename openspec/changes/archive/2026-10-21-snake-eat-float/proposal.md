# Proposal

## Why

When the snake eats a falling-piece cell and grows, the growth does not read as coming from that bite: the eaten block is cut away at once while the +1 length lands far from where the bite happened (as a new head in the snake-step path, as a duplicated tail in the drop-on-the-head path). The player sees a jerk or no change, not a block becoming new tail length.

## What Changes

- When the snake grows by eating a piece cell, the system SHALL draw a separate floating segment that stands for the eaten block, starting at the eat point, travelling along the snake body to the tail, and merging there so the tail reads as one longer segment.
- The segment travels only as a paint overlay on the body cells the rules already occupy; it does not change which cells the rules hold, does not add anything to the exchanged match state, and the eaten cell is still cut from the piece at once.
- Several growth segments may fly at the same time (one per growth within a single segment's travel).
- At the length cap (10 segments) no segment flies: the cell is recorded as overflow and the tail stays the same length.
- The segment's flight time scales with the snake's current length, and it flies along the body to the tail (which moves), so it always reaches the tail.

## Capabilities

### Modified Capabilities

- motion-rendering: add a requirement that a growth segment shows the eaten block travelling from the eat point to the tail.

## Impact

- Render layer only: js/render.js (the motion painter and the snake-chain it already draws) and one flight-speed constant in js/config.js. No change to snake.js, pieces.js, rules.js, scoring, the length cap, the overflow tier system, or the network frames.
- Two-player: each page derives the segment from its own growth observation, so both pages show it identically and no new state travels between peers (motion-rendering's "travel carries no state" principle is preserved).
