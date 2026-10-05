# Proposal

## Why

The D-pad buttons on gamepads do not steer the snake because the code reads the wrong button indices (11-14) instead of the standard Gamepad API values (12-15). Players with a controller cannot navigate or play — the d-pad is completely non-functional. The existing `controller` spec also documents the wrong indices, so the requirement itself is incorrect.

## What Changes

- **Fix D-pad button indices** in `js/input.js`: change `DPAD_UP=11, DPAD_DOWN=12, DPAD_LEFT=13, DPAD_RIGHT=14` to `DPAD_UP=12, DPAD_DOWN=13, DPAD_LEFT=14, DPAD_RIGHT=15` per the standard Gamepad API (W3C Web Gamepad spec).
- **Correct the `controller` spec** requirement text to document the correct button indices (12-15) instead of (11-14).
- **Stop the left thumbstick from swallowing D-pad edges** in `pollController()`: the old code OR-ed the stick direction into the D-pad's current/previous pressed state, so a stick resting past the deadzone marked the matching D-pad button as "already pressed" and its unpressed→pressed edge never fired. Menu navigation is edge-only, which is why only some directions reacted. Button state and stick direction are now tracked separately and combined only at the point of use.
- **Read the first connected gamepad in any slot** instead of `getGamepads()[0]` only, so a pad reporting in a non-zero slot still drives the game.
- **Add `scripts/gamepad-diag.html`**, a standalone page printing live button/axis state, so a pad's actual mapping can be read off before changing any constant.

No new capabilities — this fixes bugs in the existing `controller` capability. The last two items bring the code into compliance with requirements the `controller` spec already states (menu navigation with D-pad *or* left stick; gamepad connection detection); they do not add requirements.

## Capabilities

### Modified Capabilities
- `controller`: fix "Controller steering" requirement — D-pad buttons are standard gamepad buttons 12, 13, 14, 15 (not 11, 12, 13, 14).

## Impact

- `js/input.js` — button index constants and the `pollController()` poll (steering branch, menu edge detection, pad selection).
- `openspec/specs/controller/spec.md` — corrected button indices in requirement text.
- `scripts/gamepad-diag.html` — new, not referenced by the game; a verification aid only.
