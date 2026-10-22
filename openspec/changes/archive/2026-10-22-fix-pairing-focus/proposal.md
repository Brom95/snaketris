# Proposal

## Why

The pairing-step fix shipped in the auto-detect change (commit `5c36e03`) added a
focus flag to the pairing step, but the flag logic is inverted: the clearing
branch runs while the step stays entered, so the address field is re-focused on
every other paint frame. The focus therefore never leaves the field on the host
page, and on a phone the repeated focus keeps re-opening the virtual keyboard,
which covers the Pair control and makes it unpressable.

## What Changes

- The pairing step focuses the address field once when the step is entered, and
  holds no focus on later frames of the same step.
- The focus flag resets only when the step is left, not on steady frames.

## Capabilities

### Modified Capabilities

- network-play: the requirement that the pairing step keeps its confirm control
  reachable while the address field is focused now also states that the address
  field is focused when the step is entered and is not re-focused on later frames
  of the same step.

## Impact

- js/ui.js: the pairing focus flag logic in `paintPairing`.
- tests: unit and network-local verification for the pairing focus.
- No new dependencies, no change to the game model or to network frames.
