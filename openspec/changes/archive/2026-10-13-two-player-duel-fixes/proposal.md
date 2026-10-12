# Proposal

## Why

The two-player duel has four defects the user reported after playing it. P2 never sees a role, the
preparation stages do not say which stage is active or what action is expected, both players' key
sets drive the same character during play, and the page goes blank after a two-player game ends.
The blank page is a state the screen table cannot resolve, so every view hides.

## What Changes

- **P2 role display**: P1's role pick already assigns P2 the remaining role, and the control screens
  now name each player's role on that player's own step. The role line stops printing the literal
  text `null` while no role is chosen yet.
- **Stage clarity**: every preparation stage states its name and the action it expects. The role
  screen names the picker and says the other player receives the remaining role. Each control step
  names the step number, the acting player, and the keys that advance it.
- **Per-player control during play**: in two-player mode each player's control model drives the
  character of that player's own role. The snake-role player steers the snake; the Tetris-role
  player shifts and rotates the piece. A keyboard key resolves to the player who locked that
  keyboard model.
- **Game over lands on a painted screen**: in two-player mode a finished game returns to the SHARED
  control step as a real screen id, so the screen table resolves it and the control view paints.
  **BREAKING** none: no page element id, visibility class, or score rule changes.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `two-player-local-mode`: the role assignment becomes visible on each player's own control step;
  each preparation stage names itself and its expected action; each player drives their own
  character through their own control model; a finished two-player game lands on a screen the
  screen table resolves.

## Impact

- `js/screens.js`: `applyGameOverScreen` writes a resolvable screen id; the control steps carry the
  acting player's role for display.
- `js/ui.js`: the per-player summary lines paint on every control step, not only the SHARED step;
  the stage title and hints line state the active stage.
- `js/devices.js`: `playingKeyIntent` and the gamepad path resolve the acting player and use that
  player's role instead of the single `game.play.role`.
- `js/input.js`: `handleIntent` accepts piece control when the Tetris side is human in two-player
  mode; `setDirection` stays byte-for-byte stable.
- Tests: `tests/screens.test.js`, `tests/ui.test.js`, `tests/input.test.js`, `tests/devices.test.js`
  (if present) gain checks for the four behaviors.
- Harness: `scripts/verify-*.mjs` page checks keep addressing the same element ids and classes.
