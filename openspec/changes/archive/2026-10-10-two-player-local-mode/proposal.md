# Proposal

## Why

The game currently supports one human and one bot on a single grid. A local two-player mode lets two humans share the one 10x20 grid: each player picks a role (P1 chooses, P2 gets the other) and confirms a control model (WASD/Arrows/Gamepad), with no bot driving either side.

## What Changes

- Add a "Two Players" item to the starting menu that appears only when the viewport is wide (desktop) and is hidden when narrow (mobile touch).
- Two-player setup flow: P1 picks a role on the role screen; P2 automatically gets the other role. A line "P1: X / P2: Y" is shown above the control-model selection.
- Each player confirms a control model (WASD, Arrows, or Gamepad) by pressing that model's key. The two keyboard models are exclusive (no two players pick the same WASD/Arrows); gamepad is shareable (two pads).
- Two connected gamepads: first = P1, second = P2, each with its own edge-detection state.
- In two-player mode the bot is not run because both sides are human, on the one shared grid.
- Both sides' scores are recorded as two entries for a finished two-player game.

## Capabilities

### New Capabilities

- `two-player-local-mode`: the local two-player mode - one shared grid, P1 picks a role (P2 auto-gets the other), each player confirms a control model by pressing that model's key, and the bot is not run because both sides are human.

### Modified Capabilities

- `controller`: support two connected gamepads routed to their players by connection order, each with its own edge-detection state, plus control-model confirmation via the pressed key.
- `start-menu`: a "Two Players" menu item that appears when the viewport is wide (desktop) and is hidden when narrow (mobile touch).
- `highscores`: in two-player mode, record both sides' scores as two entries for a finished game.

## Impact

Affected modules: js/state.js (two roles, no bot), js/input.js + js/devices.js (per-pad state and routing, control-model confirmation), js/ui.js (menu item + 2P setup views), js/highscores.js (both-sides recording). The single 10x20 grid is shared by both players; there is no second board.
