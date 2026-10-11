# Tasks

## 1. State model: selection fields + split functions

- [x] 1.1 Add `p1Selection` and `p2Selection` fields to the `game` object in `js/state.js`, initialize them in `resetGame()`. Verify by running `npm test` — existing tests still pass.
- [x] 1.2 Replace `confirmControlModel(player, model)` with `selectControlModel(player, model)` (sets selection, handles conflict for P2) and `confirmControlModel(player)` (locks selection into model). Verify by running `npm test`.

## 2. Input routing: select vs confirm in onKey()

- [x] 2.1 Restructure the SELECT_CONTROL branch of `onKey()` in `js/input.js`: layout keys (WASD/arrows) call `selectControlModel`, Space/Enter call `confirmControlModel`. Both-confirmed falls through to navigation. Verify by running `npm test`.
- [x] 2.2 Add `selectP1Model` / `selectP2Model` intent actions in `handleIntent` and wire them from the gamepad poll path. Verify by running `npm test`.

## 3. Back navigation target

- [x] 3.1 Change the Back item in SELECT_CONTROL from `toMenu()` to a new transition that sets `game.state = SELECT_ROLE`. Add a unit test asserting Back from SELECT_CONTROL lands on SELECT_ROLE. Verify by running `npm test`.

## 4. UI text update

- [x] 4.1 Update the control-view items in `snaketris.html`: P1/P2 text changes from "press W/A/S/D or arrows to confirm" to "select a layout (WASD / Arrows / Gamepad)". Verify by running `npm run verify` (harness scripts) and checking the rendered text.

## 5. Unit tests for select/confirm flow

- [x] 5.1 Add unit tests covering: selection sets the correct field, replacement works (different layout replaces previous), confirm locks the model, conflict error on same keyboard layout, Start hidden until both confirmed. Verify by running `npm test`.
