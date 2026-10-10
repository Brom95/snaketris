# Tasks

## 1. State and mode foundation

- [ ] 1.1 Add p1Role/p2Role and a two-player mode flag to js/state.js, with P1 picking a role and P2 auto-getting the other; verify by running `node --test "tests/**/*.test.js"` with a new unit test asserting P2 is assigned the remaining role when P1 selects one.
- [ ] 1.2 Make botSystem a no-op in two-player mode (both sides human); verify by a unit test asserting no bot direction is applied to the snake or the falling piece in two-player mode.

## 2. Per-pad gamepad routing

- [ ] 2.1 Track per-pad prevButtons/prevStickDir keyed by pad id and route connected pads to P1/P2 by connection order in js/devices.js; verify by a unit test (deterministic RNG seed) asserting the first pad is P1 and the second is P2 with separate edge-detection state.
- [ ] 2.2 Clear a pad's edge-detection state on disconnect so it contributes no input; verify by a unit test asserting a disconnected pad yields no direction.

## 3. Control-model confirmation

- [ ] 3.1 Map physical keys to models and confirm each player's model by pressing that model's key in js/input.js; verify by a harness script asserting a WASD key confirms WASD, an arrow key confirms Arrows, and a gamepad button confirms Gamepad.
- [ ] 3.2 Constrain P2's keyboard options by P1's choice (no two players pick the same WASD/Arrows) and keep gamepad shareable; verify by a harness script asserting P2 cannot reuse P1's keyboard model and both can use gamepad when two pads are connected.

## 4. Menu item gating and 2P setup views

- [ ] 4.1 Add the "Two Players" menu item shown when window.innerWidth exceeds UI_STACK_MAX_WIDTH (760) and hidden at or below it; verify by a harness script (freshPage) asserting the item is present on a wide viewport and absent on a narrow one.
- [ ] 4.2 Render the role line "P1: X / P2: Y" above the model selection in js/ui.js; verify by a harness script snapshot showing the line for a chosen P1/P2 pair.

## 5. Both-sides recording

- [ ] 5.1 Call recordScore twice at game over (once per side) reusing loadBoard/saveBoard and the top-10 sort; verify by a unit test asserting two entries are added and only the top 10 are retained.

## 6. Integration verification

- [ ] 6.1 Run `npm run verify` (all eight harness scripts) and `npm test` (120 checks); verify both exit 0 with no new failures.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result by re-running `npm run verify` and `npm test`.
