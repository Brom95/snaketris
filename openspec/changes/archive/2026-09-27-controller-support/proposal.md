# Proposal

## Why

The game currently supports keyboard and touch/pointer input, but players who use a game controller (Xbox, PlayStation, or a generic gamepad) have no way to play. Adding native controller support via the standard Web Gamepad API makes the game fully playable on a gamepad with no third-party dependencies, improving accessibility and supporting desktop/console-style play.

## What Changes

- Add a new **controller** input modality that coexists with the existing keyboard and touch input (no input is disabled when a controller is connected).
- Detect gamepad connection/disconnection (`gamepadconnected` / `gamepaddisconnected`) and poll the gamepad state each frame to read buttons and axes.
- Map the **D-pad** and the **left thumbstick** (up/down/left/right) to the same four directions used by keyboard and touch steering, routed through the existing shared `setDirection()` path (PLAYING gate + no-reverse rule).
- Map the **A button** to "confirm/accept" (start a game from the menu, return to the menu from game over — matching the existing R/Enter/Space behavior) and the **B button** to "back/cancel" (return to the menu from the Records or How-to-Play view).
- Mirror the existing keyboard menu behavior with controller buttons: D-pad/stick up-down moves the menu selection, A confirms the highlighted item, and B returns to the menu from sub-views.
- No changes to game mechanics, scoring, or any existing keyboard/touch behavior.

## Capabilities

### New Capabilities

- `controller`: Native gamepad support — connection detection, D-pad + left-stick steering, A/B confirm-and-back menu navigation, and controller-driven start/restart, coexisting with keyboard and touch input.

### Modified Capabilities

- (none — the existing keyboard and touch requirements remain fully in effect; controller input is an additional, non-conflicting modality captured entirely in the new `controller` capability.)

## Impact

- `js/input.js`: primary change — gamepad listener registration, per-frame polling, D-pad/stick direction mapping, A/B action mapping, and edge (press) detection.
- `js/app.js`: wire the controller polling into the existing `frame()` loop (read-only design decision; the loop already exists).
- `js/state.js`, `js/constants.js`, `js/render.js`: no changes (state, layout, and rendering are input-modality-agnostic and unchanged).
- No new dependencies (uses the standard, dependency-free Web Gamepad API).
- New capability spec `specs/controller/spec.md` added.
