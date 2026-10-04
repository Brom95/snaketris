# Design

## Context

The `controller` capability is implemented in `js/input.js`. The `pollController()` function polls gamepad state every frame (called from `app.js` after `update()`). D-pad steering for the PLAYING state reads from `buttons[DPAD_UP]`, `buttons[DPAD_DOWN]`, `buttons[DPAD_LEFT]`, `buttons[DPAD_RIGHT]` — but the constants were set to 11, 12, 13, 14 instead of the standard 12, 13, 14, 15.

Three defects were found, the first two only after verifying the index fix on a real pad (symptom reported by the player: only up/down responded, and wrongly; in the menu only up worked at all):

1. **Wrong D-pad indices.** The W3C Web Gamepad API standard mapping puts the D-pad at buttons 12 (up), 13 (down), 14 (left), 15 (right). Reading 11–14 means every direction reads the wrong button array entry, so the controller is effectively non-functional.
2. **Edge-detection contamination.** The old code OR-ed the left-stick direction into the D-pad's current and previous pressed state (`upNow = buttons[DPAD_UP].pressed || stick.r === -1`). Menu navigation is edge-only (unpressed→pressed), so a thumbstick resting past the deadzone — or returning to centre through a direction — marks the matching D-pad button as "already pressed" and swallows its edge. Those menu directions then never register.
3. **Slot-0-only read.** `pollController()` read `navigator.getGamepads()[0]`. Pads that report in a non-zero slot (common with multiple devices, or after a reconnect) contributed no input at all.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Fix D-pad button indices to match the W3C Web Gamepad API standard (buttons 12-15).
- Correct the `controller` spec requirement text to document the correct values.
- Keep button pressed-state and thumbstick direction tracked separately so a held stick can never suppress a D-pad edge.
- Read the first connected gamepad in any slot, not only slot 0.

**Non-Goals:**
- No new gamepad features (vibration, additional buttons, per-pad axis remapping, hot-reload of mappings).
- No change to the shared steering path (`setDirection`) or to keyboard/touch input.

## Decisions

1. **Keep constants in `js/input.js`** — the single source of truth for all gamepad button mappings. Change only the four `DPAD_*` values; no restructuring needed.
2. **Separate state channels for buttons and stick** — `upNow/downNow/leftNow/rightNow` read ONLY `buttons[DPAD_*].pressed`; the stick contributes its own `stickUpEdge`/`stickDownEdge` derived from `prevStickDir`. The two channels are combined only at the point of use (`upEdge || stickUpEdge`), never in the stored previous state. This is what makes edge detection correct for both inputs.
3. **Single-file change** — `pollController()` keeps its existing structure (per-frame poll, `prevButtons`/`prevStickDir` cleared on connect/disconnect and when no pad is present). No architectural changes required.
4. **First non-null pad wins** — scan `navigator.getGamepads()` for the first non-null entry. Multi-pad support (choosing a specific pad) is out of scope; the scan only removes the slot-0 assumption.

## Risks / Trade-offs

- **[Risk]** Some non-standard gamepads may report the D-pad at different indices, or as a hat switch on axes rather than buttons. → **Mitigation:** The W3C mapping (12-15) is implemented by Chrome, Firefox, Edge and Safari. `scripts/gamepad-diag.html` prints the live button/axis state so the actual mapping of a given pad can be read off before changing any constant. Do not change the constants again without that evidence.
- **[Trade-off]** The fix touches more than the four constants (state tracking + pad selection), so it needs a real-pad verification pass rather than a code read alone.

## Migration Plan

No migration needed. The fix is runtime code only; no data or config files affected. Rollback: revert the four constant values and the `pollController()` body.

## Open Questions

- Whether the player's pad reports the D-pad as buttons 12-15 at all, or as a hat switch on axes. `scripts/gamepad-diag.html` answers this; the answer decides whether a further mapping change is needed.
