# Proposal

## Why

The game has one role today: the player always drives the snake. The Tetris half of the title is only an obstacle. A player who wants to play the falling-piece half has no way to do it, and the current end condition is weak — once the stack reaches the top row, pieces land above the grid, write nothing, and the game keeps spawning them until the snake happens to die.

Adding a role choice makes both halves of the game playable and turns the falling piece into a contested resource: one side scores by landing it, the other side scores by eating it.

## What Changes

- The player chooses a role after "Play": **Snake** (🐍) or **Tetris** (🏗️). The same markers appear on the record entries.
- The side the player does not choose is driven by a deterministic bot. In Tetris role the bot steers the snake. In Snake role the bot steers the falling piece.
- The side that controls the piece has lateral shift and rotation. There is no drop control.
- The lateral shift is throttled to one cell per `snakeTicksPerCell()`, so the piece moves at the same speed as the snake. This applies to the player and to the bot alike.
- **BREAKING (gameplay):** scoring is split by side, not by player. `snakeScore` counts eaten cells plus the whole-piece bonus; `tetrisScore` counts landed cells plus line clears. In Snake role the player no longer receives the line-clear points.
- The game ends when the snake dies **or** when a piece lands with no cell inside the grid (top-out). Today a top-out is silent and the game continues.
- The game-over screen names the winning side and shows both scores.
- The snake starts with three segments instead of four, so the bot's opening is not crowded.
- The records view keeps one top-10 board; every entry shows the role it was recorded under. **BREAKING (storage):** high-score entries gain a `role` field; existing entries without one are read as `snake`.
- The help view documents the new controls.

## Capabilities

### New Capabilities
- `bot-opponent`: the deterministic bot that drives the side the player does not choose — the snake's steering policy and the falling piece's shift-and-rotate policy, including their safety rules and how they share the existing input and movement paths.

### Modified Capabilities
- `snaketris-game`: add role selection and piece control; replace the single score with side-based scoring; add the top-out end condition.
- `start-menu`: confirming "Play" opens a role sub-menu instead of starting the game directly.
- `hud`: the readout shows both side scores and the game-over message names the winning side.
- `highscores`: entries carry a role, and the records view shows the role marker on every entry.
- `controller`: the gamepad drives the role sub-menu and, in Tetris role, the piece's shift and rotation.
- `mobile-input`: touch gestures drive the piece's shift and rotation in Tetris role.

## Impact

- New module: `js/bot.js`.
- Touched modules: `js/constants.js`, `js/state.js`, `js/pieces.js`, `js/snake.js`, `js/input.js`, `js/devices.js`, `js/ui.js`, `js/highscores.js`, `js/render.js`, `snaketris.html`.
- Tests: new `tests/bot.test.js`; extended `tests/pieces.test.js`, `tests/input.test.js`, `tests/state.test.js`, `tests/highscores.test.js`.
- No new dependencies, no build step, no backend.
- `localStorage` key `snaketris.highscores` gains a field; old entries stay readable.
